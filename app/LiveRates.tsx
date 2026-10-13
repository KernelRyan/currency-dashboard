"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { BaseCurrency, RatesResponse } from "./api/rates/route";
import Converter from "./Converter";
import RateChart from "./RateChart";

const POLL_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = 1_000;

const BASE_OPTIONS: Record<BaseCurrency, string> = {
  USD: "United States Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  ZAR: "South African Rand",
};

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
  initialBase: BaseCurrency;
  initialRates: Record<string, number>;
  initialDate: string;
  currencies: Record<string, string>;
};

type RatesSnapshot = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

function isBaseCurrency(value: string): value is BaseCurrency {
  return Object.hasOwn(BASE_OPTIONS, value);
}

function isRatesResponse(value: unknown): value is RatesResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.base === "string" &&
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
  initialBase,
  initialRates,
  initialDate,
  currencies,
}: LiveRatesProps) {
  const router = useRouter();
  const baseSelectId = useId();

  // `base` is what the user picked; `snapshot.base` is what the displayed rates
  // are actually keyed against. They differ while a switch is loading or failed.
  const [base, setBase] = useState<BaseCurrency>(initialBase);
  const [snapshot, setSnapshot] = useState<RatesSnapshot>({
    base: initialBase,
    date: initialDate,
    rates: initialRates,
  });
  const loadedBaseRef = useRef<string>(initialBase);

  const [lastRefreshed, setLastRefreshed] = useState<number | null>(() =>
    initialDate ? Date.now() : null,
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [refreshFailed, setRefreshFailed] = useState<boolean>(!initialDate);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const res = await fetch(`/api/rates?base=${encodeURIComponent(base)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = await res.json();

        if (!res.ok || !isRatesResponse(data)) {
          throw new Error(`Unexpected response from /api/rates (${res.status})`);
        }

        loadedBaseRef.current = data.base;
        setSnapshot({ base: data.base, date: data.date, rates: data.rates });
        setLastRefreshed(Date.now());
        setRefreshFailed(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.warn(`Failed to load ${base} rates:`, err);
        setRefreshFailed(true);
      }
    }

    if (loadedBaseRef.current !== base) void load();

    const id = setInterval(() => {
      if (document.visibilityState !== "hidden") void load();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [base]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  function handleBaseChange(e: ChangeEvent<HTMLSelectElement>): void {
    const next = e.target.value;
    if (!isBaseCurrency(next) || next === base) return;

    setBase(next);
    setRefreshFailed(false);
    router.replace(`?base=${next}`, { scroll: false });
  }

  const isSwitching = snapshot.base !== base && !refreshFailed;

  let statusError: string | null = null;
  if (refreshFailed) {
    if (snapshot.base !== base) {
      statusError = `Couldn't load ${base} rates, showing ${snapshot.base}`;
    } else if (lastRefreshed !== null) {
      statusError = "Couldn't refresh, showing last data";
    } else {
      statusError = "Couldn't load rates, retrying every 30 seconds";
    }
  }

  return (
    <>
      <p className="text-sm text-zinc-400 mt-1.5">
        Exchange rates for 1{" "}
        <span className="font-mono text-zinc-100">{snapshot.base}</span>
      </p>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-widest text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_var(--color-emerald-400)]" />
            Live
          </span>
          {snapshot.date && (
            <span>Rates for {formatDate(snapshot.date)}</span>
          )}
          {lastRefreshed !== null && (
            <span aria-live="polite" className="font-mono">
              Updated {formatElapsed(now - lastRefreshed)}
            </span>
          )}
          {isSwitching && (
            <span className="text-zinc-400">Loading {base} rates…</span>
          )}
          {statusError && (
            <span className="text-amber-400/90" role="status">
              {statusError}
            </span>
          )}
        </div>

        <div className="mt-4">
          <Converter
            baseCurrency={snapshot.base}
            rates={snapshot.rates}
            currencies={currencies}
          />
        </div>

        <div className="mt-4 flex flex-col items-stretch gap-1.5 py-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <label
            htmlFor={baseSelectId}
            className="text-xs uppercase tracking-wider text-zinc-500 sm:text-sm sm:normal-case sm:tracking-normal"
          >
            Base:
          </label>
          <select
            id={baseSelectId}
            value={base}
            onChange={handleBaseChange}
            className="w-full cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition-colors hover:border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 sm:w-auto"
          >
            {Object.entries(BASE_OPTIONS).map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {FEATURED_CURRENCIES.map((code) => {
            const rate =
              code === snapshot.base ? 1 : snapshot.rates[code];
            const isSelected = code === selectedSymbol;

            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => setSelectedSymbol(code)}
                  aria-pressed={isSelected}
                  className={`block h-full w-full cursor-pointer rounded-2xl border p-5 text-left backdrop-blur transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
                    isSelected
                      ? "border-zinc-700 bg-zinc-900/80 ring-1 ring-emerald-500/50 shadow-[0_0_32px_-12px_var(--color-emerald-500)]"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80 hover:ring-1 hover:ring-white/5"
                  }`}
                >
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {code}
                  </span>
                  <span className="block text-xs text-zinc-500 mt-0.5 truncate">
                    {currencies[code] ?? code}
                  </span>
                  {rate !== undefined ? (
                    <span className="block font-mono text-2xl font-semibold text-emerald-400 mt-3 tabular-nums">
                      {formatRate(rate)}
                    </span>
                  ) : (
                    <span
                      className="block font-mono text-2xl font-semibold text-zinc-700 mt-3"
                      title="Rate not available"
                    >
                      —
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <RateChart baseCurrency={snapshot.base} symbol={selectedSymbol} />
      </section>
    </>
  );
}
