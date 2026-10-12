"use client";

import { useId, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowRightLeft } from "lucide-react";

const BASE_CURRENCY = "USD";

type ConverterProps = {
  rates: Record<string, number>;
  currencies: Record<string, string>;
};

const resultFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function rateFor(code: string, rates: Record<string, number>): number | undefined {
  return code === BASE_CURRENCY ? 1 : rates[code];
}

function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;

  const fromRate = rateFor(from, rates);
  const toRate = rateFor(to, rates);
  if (fromRate === undefined || toRate === undefined || fromRate === 0) {
    return null;
  }

  if (from === BASE_CURRENCY) return amount * toRate;
  if (to === BASE_CURRENCY) return amount / fromRate;
  return (amount / fromRate) * toRate;
}

const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20";

export default function Converter({ rates, currencies }: ConverterProps) {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>(BASE_CURRENCY);
  const [toCurrency, setToCurrency] = useState<string>("ZAR");

  const id = useId();
  const amountId = `${id}-amount`;
  const fromId = `${id}-from`;
  const toId = `${id}-to`;

  const options = useMemo(() => {
    const codes = new Set<string>([
      BASE_CURRENCY,
      ...Object.keys(rates),
      ...Object.keys(currencies),
    ]);
    return [...codes]
      .sort((a, b) => a.localeCompare(b))
      .map((code) => ({
        code,
        label: currencies[code] ? `${code} — ${currencies[code]}` : code,
      }));
  }, [rates, currencies]);

  const result = convert(amount, fromCurrency, toCurrency, rates);

  function swap(): void {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <ArrowRightLeft className="size-4 text-indigo-600" aria-hidden="true" />
        Convert
      </h2>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] gap-3 items-end">
        <div>
          <label htmlFor={amountId} className="block text-xs text-zinc-500 mb-1">
            Amount
          </label>
          <input
            id={amountId}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={Number.isNaN(amount) ? "" : amount}
            onChange={(e) => setAmount(e.target.valueAsNumber)}
            className={`${fieldClass} tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor={fromId} className="block text-xs text-zinc-500 mb-1">
            From
          </label>
          <select
            id={fromId}
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className={fieldClass}
          >
            {options.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap currencies"
          title="Swap currencies"
          className="inline-flex h-10 w-full md:w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeftRight className="size-4" aria-hidden="true" />
        </button>

        <div>
          <label htmlFor={toId} className="block text-xs text-zinc-500 mb-1">
            To
          </label>
          <select
            id={toId}
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className={fieldClass}
          >
            {options.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        className="mt-6 flex flex-wrap items-baseline gap-x-2 text-zinc-500"
        aria-live="polite"
      >
        <span className="font-semibold text-zinc-900">
          {Number.isFinite(amount) ? amountFormatter.format(amount) : "—"}{" "}
          {fromCurrency}
        </span>
        <span>=</span>
        <span className="text-2xl font-bold text-indigo-600 tabular-nums">
          {result === null ? "—" : resultFormatter.format(result)}
        </span>
        <span className="font-semibold text-zinc-900">{toCurrency}</span>
      </p>
    </div>
  );
}
