import { LineChart } from "lucide-react";
import { getCurrencies, getLatestRates } from "@/lib/frankfurter";
import { parseBaseCurrency } from "./api/rates/route";
import LiveRates from "./LiveRates";

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const { base: rawBase } = await searchParams;
  const base = parseBaseCurrency(typeof rawBase === "string" ? rawBase : null);

  const [ratesResult, currenciesResult] = await Promise.allSettled([
    getLatestRates(base),
    getCurrencies(),
  ]);

  const latest = ratesResult.status === "fulfilled" ? ratesResult.value : null;
  const currencies =
    currenciesResult.status === "fulfilled" ? currenciesResult.value : {};

  return (
    <div className="flex-1">
      <main className="max-w-5xl mx-auto px-6 py-12 min-h-screen">
        <header className="flex items-center gap-3">
          <LineChart className="size-7 text-emerald-400" aria-hidden="true" />
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            Currency Dashboard
          </h1>
        </header>

        <LiveRates
          initialBase={base}
          initialRates={latest?.rates ?? {}}
          initialDate={latest?.date ?? ""}
          currencies={currencies}
        />

        <footer className="text-xs text-zinc-500 mt-10 text-center">
          {latest && <>Last updated {formatDate(latest.date)} · </>}
          Data from{" "}
          <a
            href="https://www.frankfurter.app/"
            className="underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-emerald-400 hover:decoration-emerald-400/50"
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
