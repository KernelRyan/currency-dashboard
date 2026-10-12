import type { NextRequest } from "next/server";
import {
  getCurrenciesFresh,
  getLatestRatesFresh,
  type Currencies,
} from "@/lib/frankfurter";

export const BASE_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "ZAR"] as const;
export type BaseCurrency = (typeof BASE_CURRENCIES)[number];
export const DEFAULT_BASE: BaseCurrency = "USD";

export function parseBaseCurrency(
  value: string | null | undefined,
): BaseCurrency {
  const code = value?.trim().toUpperCase();
  return BASE_CURRENCIES.find((c) => c === code) ?? DEFAULT_BASE;
}

export type RatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
  currencies: Currencies;
};

export type RatesErrorResponse = {
  error: string;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest): Promise<Response> {
  const base = parseBaseCurrency(request.nextUrl.searchParams.get("base"));

  try {
    const [latest, currencies] = await Promise.all([
      getLatestRatesFresh(base),
      getCurrenciesFresh(),
    ]);

    return Response.json(
      {
        base: latest.base,
        date: latest.date,
        rates: latest.rates,
        currencies,
      } satisfies RatesResponse,
      { headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    console.error(`GET /api/rates?base=${base} failed:`, err);

    return Response.json(
      { error: "Failed to fetch exchange rates" } satisfies RatesErrorResponse,
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
