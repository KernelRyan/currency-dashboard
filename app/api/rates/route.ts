import {
  getCurrenciesFresh,
  getLatestRatesFresh,
  type Currencies,
} from "@/lib/frankfurter";

const BASE_CURRENCY = "USD";

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

export async function GET(): Promise<Response> {
  try {
    const [latest, currencies] = await Promise.all([
      getLatestRatesFresh(BASE_CURRENCY),
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
    console.error("GET /api/rates failed:", err);

    return Response.json(
      { error: "Failed to fetch exchange rates" } satisfies RatesErrorResponse,
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
