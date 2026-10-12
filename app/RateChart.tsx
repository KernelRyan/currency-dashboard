"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RatePoint } from "@/lib/frankfurter";
import type { HistoryResponse } from "./api/history/route";

const CHART_HEIGHT = 320;
const INDIGO_600 = "#4f46e5";
const ZINC_200 = "#e4e4e7";
const ZINC_400 = "#a1a1aa";
const ZINC_500 = "#71717a";

type RateChartProps = {
  baseCurrency: string;
  symbol: string | null;
};

type HistoryResult =
  | { key: string; status: "success"; data: RatePoint[] }
  | { key: string; status: "error" };

function isRatePoint(value: unknown): value is RatePoint {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.date === "string" && typeof v.rate === "number";
}

function isHistoryResponse(value: unknown): value is HistoryResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.data) && v.data.every(isRatePoint);
}

const tickDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.abs(rate) < 10 ? 4 : 2,
  }).format(rate);
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 mt-6">
      <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChartMessage({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-zinc-400"
      style={{ height: CHART_HEIGHT }}
    >
      {children}
    </div>
  );
}

export default function RateChart({ baseCurrency, symbol }: RateChartProps) {
  const [result, setResult] = useState<HistoryResult | null>(null);

  const isSameCurrency = symbol !== null && symbol === baseCurrency;
  const requestKey = symbol && !isSameCurrency ? `${baseCurrency}:${symbol}` : null;

  useEffect(() => {
    if (!symbol || symbol === baseCurrency) return;

    const key = `${baseCurrency}:${symbol}`;
    const controller = new AbortController();

    async function load(sym: string): Promise<void> {
      try {
        const params = new URLSearchParams({ base: baseCurrency, symbol: sym });
        const res = await fetch(`/api/history?${params.toString()}`, {
          signal: controller.signal,
        });
        const body: unknown = await res.json();

        if (!res.ok || !isHistoryResponse(body)) {
          throw new Error(`Unexpected response from /api/history (${res.status})`);
        }

        setResult({ key, status: "success", data: body.data });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn(`Failed to load ${key} history:`, err);
        setResult({ key, status: "error" });
      }
    }

    void load(symbol);
    return () => controller.abort();
  }, [baseCurrency, symbol]);

  if (symbol === null) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-6 py-12 text-center">
        <p className="text-sm text-zinc-400">
          Click a currency to see its 30-day trend
        </p>
      </div>
    );
  }

  const title = `${baseCurrency} → ${symbol} — last 30 days`;

  if (isSameCurrency) {
    return (
      <ChartCard title={title}>
        <ChartMessage>
          {symbol} is the base currency, so its rate is always 1.
        </ChartMessage>
      </ChartCard>
    );
  }

  const current = result?.key === requestKey ? result : null;

  if (current === null) {
    return (
      <ChartCard title={title}>
        <div
          className="animate-pulse rounded-lg bg-zinc-100"
          style={{ height: CHART_HEIGHT }}
          aria-busy="true"
          aria-label="Loading chart"
        />
      </ChartCard>
    );
  }

  if (current.status === "error") {
    return (
      <ChartCard title={title}>
        <ChartMessage>
          Couldn&apos;t load the rate history. Try again in a moment.
        </ChartMessage>
      </ChartCard>
    );
  }

  if (current.data.length === 0) {
    return (
      <ChartCard title={title}>
        <ChartMessage>No rate data for this period.</ChartMessage>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart
          data={current.data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke={ZINC_400}
            strokeOpacity={0.35}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              tickDateFormatter.format(parseIsoDate(value))
            }
            tick={{ fontSize: 12, fill: ZINC_500 }}
            tickLine={false}
            axisLine={{ stroke: ZINC_200 }}
            minTickGap={24}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => formatRate(value)}
            tick={{ fontSize: 12, fill: ZINC_500 }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? formatRate(value) : String(value),
              `1 ${baseCurrency} in ${symbol}`,
            ]}
            labelFormatter={(label) =>
              typeof label === "string"
                ? tooltipDateFormatter.format(parseIsoDate(label))
                : label
            }
            contentStyle={{
              borderRadius: 8,
              borderColor: ZINC_200,
              fontSize: 12,
            }}
            labelStyle={{ color: "#18181b", fontWeight: 500 }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke={INDIGO_600}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
