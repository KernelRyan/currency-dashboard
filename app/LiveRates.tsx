"use client";

import { useEffect, useState } from "react";
import type { RatesResponse } from "./api/rates/route";
import Converter from "./Converter";

const POLL_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = 1_000;

const FEATURED_CURRENCIES = [
  "ZAR",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
  "BRL",
  "SEK",
  "NOK",
  "MXN",
  "NZD",
] as const;

type LiveRatesProps = {
  initialRates: Record<string, number>;
  initialDate: string;
  currencies: Record<string, string>;
};

function isRatesResponse(value: unknown): value is RatesResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    typeof v.rates === "object" &&
    v.rates !== null
  );
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: rate < 10 ? 4 : 2,
  }).format(rate);
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? "second" : "seconds"} ago`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
}

export default function LiveRates({
  initialRates,
  initialDate,
  currencies,
}: LiveRatesProps) {
  const [rates, setRates] = useState<Record<string, number>>(initialRates);
  const [date, setDate] = useState<string>(initialDate);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(() =>
    initialDate ? Date.now() : null,
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [refreshFailed, setRefreshFailed] = useState<boolean>(!initialDate);

  useEffect(() => {
    let controller: AbortController | null = null;

    async function poll(): Promise<void> {
      if (document.visibilityState === "hidden") return;

      controller?.abort();
      controller = new AbortController();

      try {
        const res = await fetch("/api/rates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = await res.json();

        if (!res.ok || !isRatesResponse(data)) {
          throw new Error(`Unexpected response from /api/rates (${res.status})`);
        }

        setRates(data.rates);
        setDate(data.date);
        setLastRefreshed(Date.now());
        setRefreshFailed(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("Failed to refresh rates:", err);
        setRefreshFailed(true);
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      controller?.abort();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mt-8">
      <Converter rates={rates} currencies={currencies} />

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-900">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          Live
        </span>
        {date && <span>Rates for {formatDate(date)}</span>}
        {lastRefreshed !== null && (
          <span aria-live="polite">
            Updated {formatElapsed(now - lastRefreshed)}
          </span>
        )}
        {refreshFailed && (
          <span className="text-amber-600">
            {lastRefreshed !== null
              ? "Couldn't refresh, showing last data"
              : "Couldn't load rates, retrying every 30 seconds"}
          </span>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {FEATURED_CURRENCIES.map((code) => {
          const rate = rates[code];

          return (
            <li
              key={code}
              className="rounded-xl border border-zinc-200 bg-white p-6 hover:shadow-sm transition-shadow"
            >
              <p className="text-sm font-medium text-zinc-500">{code}</p>
              <p className="text-xs text-zinc-400 mt-1 truncate">
                {currencies[code] ?? code}
              </p>
              {rate !== undefined ? (
                <p className="text-2xl font-semibold text-indigo-600 mt-3 tabular-nums">
                  {formatRate(rate)}
                </p>
              ) : (
                <p
                  className="text-2xl font-semibold text-zinc-300 mt-3"
                  title="Rate not available"
                >
                  —
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
