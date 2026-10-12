import { LineChart } from "lucide-react";
import { getCurrencies, getLatestRates } from "@/lib/frankfurter";
import LiveRates from "./LiveRates";

const BASE_CURRENCY = "USD";

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
    <div className="flex-1 bg-zinc-50">
      <main className="max-w-5xl mx-auto px-6 py-12 bg-zinc-50 min-h-screen">
        <header className="flex items-center gap-2">
          <LineChart className="size-6 text-indigo-600" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-zinc-900">
            Currency Dashboard
          </h1>
        </header>
        <p className="text-sm text-zinc-500 mt-1">
          Exchange rates for 1 {BASE_CURRENCY}
        </p>

        <LiveRates
          initialRates={latest?.rates ?? {}}
          initialDate={latest?.date ?? ""}
          currencies={currencies}
        />

        <footer className="text-xs text-zinc-500 mt-8 text-center">
          {latest && <>Last updated {formatDate(latest.date)} · </>}
          Data from{" "}
          <a
            href="https://www.frankfurter.app/"
            className="underline underline-offset-2 hover:text-zinc-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            Frankfurter
          </a>
        </footer>
      </main>
    </div>
  );
}
