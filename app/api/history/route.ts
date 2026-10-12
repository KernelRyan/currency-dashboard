import type { NextRequest } from "next/server";
import { getTimeSeries, type RatePoint } from "@/lib/frankfurter";

const HISTORY_DAYS = 30;
const CURRENCY_CODE = /^[A-Z]{3}$/;

export type HistoryResponse = {
  base: string;
  symbol: string;
  data: RatePoint[];
};

export type HistoryErrorResponse = {
  error: string;
};

function readCode(request: NextRequest, name: string): string {
  return request.nextUrl.searchParams.get(name)?.trim().toUpperCase() ?? "";
}

export async function GET(request: NextRequest): Promise<Response> {
  const base = readCode(request, "base");
  const symbol = readCode(request, "symbol");

  if (!CURRENCY_CODE.test(base) || !CURRENCY_CODE.test(symbol)) {
    return Response.json(
      {
        error: "`base` and `symbol` must be 3-letter currency codes",
      } satisfies HistoryErrorResponse,
      { status: 400 },
    );
  }

  if (base === symbol) {
    return Response.json(
      { error: "`base` and `symbol` must differ" } satisfies HistoryErrorResponse,
      { status: 400 },
    );
  }

  try {
    const data = await getTimeSeries(base, symbol, HISTORY_DAYS);

    return Response.json({ base, symbol, data } satisfies HistoryResponse);
  } catch (err) {
    console.error(`GET /api/history?base=${base}&symbol=${symbol} failed:`, err);

    return Response.json(
      { error: "Failed to fetch rate history" } satisfies HistoryErrorResponse,
      { status: 500 },
    );
  }
}
