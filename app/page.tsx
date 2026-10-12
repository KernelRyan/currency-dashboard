import { LineChart } from "lucide-react";
import { getCurrencies, getLatestRates } from "@/lib/frankfurter";

const BASE_CURRENCY = "USD";

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
  "NGN",
  "KES",
] as const;

// Frankfurter only covers ECB reference currencies, so some codes have no name entry.
const FALLBACK_NAMES: Record<string, string> = {
  NGN: "Nigerian Naira",
  KES: "Kenyan Shilling",
};

function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: rate < 10 ? 4 : 2,
  }).format(rate);
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export default async function Home() {
  const [ratesResult, currenciesResult] = await Promise.allSettled([
    getLatestRates(BASE_CURRENCY),
    getCurrencies(),
  ]);

  const latest = ratesResult.status === "fulfilled" ? ratesResult.value : null;
  const currencies =
    currenciesResult.status === "fulfilled" ? currenciesResult.value : {};

  return (
    <div className="flex-1 bg-zinc-50 text-zinc-950">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-center gap-2">
          <LineChart className="size-6 text-indigo-600" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Currency Dashboard
          </h1>
        </header>

        {latest ? (
          <>
            <p className="mb-6 text-sm text-zinc-500">
              Exchange rates for 1 {latest.base}
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {FEATURED_CURRENCIES.map((code) => {
                const rate = latest.rates[code];
                const name = currencies[code] ?? FALLBACK_NAMES[code] ?? code;

                return (
                  <li
                    key={code}
                    className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold tracking-wide">
                      {code}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {name}
                    </p>
                    {rate !== undefined ? (
                      <p className="mt-4 text-2xl font-semibold tabular-nums text-indigo-600">
                        {formatRate(rate)}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-zinc-400">
                        Rate not available
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <footer className="mt-10 text-xs text-zinc-500">
              Last updated {formatDate(latest.date)} · Data from{" "}
              <a
                href="https://www.frankfurter.app/"
                className="underline underline-offset-2 hover:text-zinc-950"
                target="_blank"
                rel="noopener noreferrer"
              >
                Frankfurter
              </a>
            </footer>
          </>
        ) : (
          <div
            role="alert"
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <p className="font-medium">Couldn&apos;t load exchange rates.</p>
            <p className="mt-1 text-sm text-zinc-500">
              The Frankfurter API may be temporarily unavailable. Please try
              again in a few minutes.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
