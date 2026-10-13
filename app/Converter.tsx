"use client";

import { useId, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowRightLeft } from "lucide-react";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "ZAR";

type ConverterProps = {
  baseCurrency: string;
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

function rateFor(
  code: string,
  base: string,
  rates: Record<string, number>,
): number | undefined {
  return code === base ? 1 : rates[code];
}

function convert(
  amount: number,
  from: string,
  to: string,
  base: string,
  rates: Record<string, number>,
): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;

  const fromRate = rateFor(from, base, rates);
  const toRate = rateFor(to, base, rates);
  if (fromRate === undefined || toRate === undefined || fromRate === 0) {
    return null;
  }

  if (from === base) return amount * toRate;
  if (to === base) return amount / fromRate;
  return (amount / fromRate) * toRate;
}

const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 transition-colors hover:border-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30";

const labelClass =
  "block text-xs text-zinc-500 uppercase tracking-wider mb-1.5";

export default function Converter({
  baseCurrency,
  rates,
  currencies,
}: ConverterProps) {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>(DEFAULT_FROM);
  const [toCurrency, setToCurrency] = useState<string>(DEFAULT_TO);

  const id = useId();
  const amountId = `${id}-amount`;
  const fromId = `${id}-from`;
  const toId = `${id}-to`;

  const options = useMemo(() => {
    const codes = new Set<string>([
      baseCurrency,
      fromCurrency,
      toCurrency,
      ...Object.keys(rates),
      ...Object.keys(currencies),
    ]);
    return [...codes]
      .sort((a, b) => a.localeCompare(b))
      .map((code) => ({
        code,
        label: currencies[code] ? `${code} — ${currencies[code]}` : code,
      }));
  }, [baseCurrency, fromCurrency, toCurrency, rates, currencies]);

  const result = convert(
    amount,
    fromCurrency,
    toCurrency,
    baseCurrency,
    rates,
  );

  function swap(): void {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
      <h2 className="flex items-center gap-2 text-sm font-medium tracking-tight text-zinc-100">
        <ArrowRightLeft className="size-4 text-emerald-400" aria-hidden="true" />
        Convert
      </h2>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] gap-3 items-end">
        <div>
          <label htmlFor={amountId} className={labelClass}>
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
            className={`${fieldClass} font-mono tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor={fromId} className={labelClass}>
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
          className="inline-flex h-10 w-full md:w-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40"
        >
          <ArrowLeftRight className="size-4" aria-hidden="true" />
        </button>

        <div>
          <label htmlFor={toId} className={labelClass}>
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
        className="mt-6 flex flex-wrap items-baseline gap-x-3 border-t border-zinc-800/80 pt-5 text-zinc-500"
        aria-live="polite"
      >
        <span className="font-mono font-medium text-zinc-100">
          {Number.isFinite(amount) ? amountFormatter.format(amount) : "—"}{" "}
          {fromCurrency}
        </span>
        <span>=</span>
        <span className="font-mono text-3xl font-semibold text-emerald-400 tabular-nums">
          {result === null ? "—" : resultFormatter.format(result)}
        </span>
        <span className="font-mono font-medium text-zinc-100">
          {toCurrency}
        </span>
      </p>
    </div>
  );
}
