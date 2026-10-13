"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { RatePoint } from "@/lib/frankfurter";
import type { HistoryResponse } from "./api/history/route";

const CHART_HEIGHT = 320;
const EMERALD_400 = "#34d399";
const ZINC_800 = "#27272a";
const ZINC_500 = "#71717a";
const ZINC_950 = "#09090b";

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

const cardClass =
  "mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={cardClass}>
      <h2 className="text-sm font-medium tracking-tight text-zinc-100">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChartMessage({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-zinc-500"
      style={{ height: CHART_HEIGHT }}
    >
      {children}
    </div>
  );
}

function RateTooltip({
  active,
  payload,
  label,
  baseCurrency,
  symbol,
}: TooltipContentProps & {
  baseCurrency: string;
  symbol: string;
}) {
  const value = payload?.[0]?.value;
  if (!active || typeof value !== "number" || typeof label !== "string") {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 shadow-xl shadow-black/40">
      <p className="text-zinc-500">
        {tooltipDateFormatter.format(parseIsoDate(label))}
      </p>
      <p className="mt-1">
        <span className="font-mono text-sm font-semibold text-emerald-400">
          {formatRate(value)}
        </span>{" "}
        <span className="text-zinc-400">
          {symbol} per {baseCurrency}
        </span>
      </p>
    </div>
  );
}

export default function RateChart({ baseCurrency, symbol }: RateChartProps) {
  const [result, setResult] = useState<HistoryResult | null>(null);
  const gradientId = `rate-fill-${useId()}`;

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
      <div className={cardClass}>
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
          <p className="text-sm text-zinc-500">
            Click a currency to see its 30-day trend
          </p>
        </div>
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
          className="animate-pulse rounded-xl bg-zinc-800/40"
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

  const axisTick = { fontSize: 11, fill: ZINC_500 };

  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart
          data={current.data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMERALD_400} stopOpacity={0.3} />
              <stop offset="100%" stopColor={EMERALD_400} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={ZINC_800}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              tickDateFormatter.format(parseIsoDate(value))
            }
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: ZINC_800 }}
            minTickGap={24}
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value: number) => formatRate(value)}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: ZINC_500, strokeDasharray: "3 3" }}
            content={(props: TooltipContentProps) => (
              <RateTooltip
                {...props}
                baseCurrency={baseCurrency}
                symbol={symbol}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke={EMERALD_400}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: EMERALD_400, stroke: ZINC_950, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
