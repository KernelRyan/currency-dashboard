"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { BaseCurrency, RatesResponse } from "./api/rates/route";
import Converter from "./Converter";

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
      <p className="text-sm text-zinc-500 mt-1">
        Exchange rates for 1 {snapshot.base}
      </p>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-900">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              Live
            </span>
            {snapshot.date && (
              <span>Rates for {formatDate(snapshot.date)}</span>
            )}
            {lastRefreshed !== null && (
              <span aria-live="polite">
                Updated {formatElapsed(now - lastRefreshed)}
              </span>
            )}
            {isSwitching && <span>Loading {base} rates…</span>}
            {statusError && (
              <span className="text-amber-600" role="status">
                {statusError}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <label htmlFor={baseSelectId} className="text-sm text-zinc-500 mr-2">
              Base:
            </label>
            <select
              id={baseSelectId}
              value={base}
              onChange={handleBaseChange}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              {Object.entries(BASE_OPTIONS).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Converter
            baseCurrency={snapshot.base}
            rates={snapshot.rates}
            currencies={currencies}
          />
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {FEATURED_CURRENCIES.map((code) => {
            const rate =
              code === snapshot.base ? 1 : snapshot.rates[code];

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
    </>
  );
}
