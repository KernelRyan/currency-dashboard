const BASE_URL = "https://api.frankfurter.app";
const REVALIDATE_SECONDS = 3600;

const CACHED: RequestInit = { next: { revalidate: REVALIDATE_SECONDS } };
const FRESH: RequestInit = { cache: "no-store" };

export type LatestRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type Currencies = Record<string, string>;

export type RatePoint = {
  date: string;
  rate: number;
};

type TimeSeriesResponse = {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(
      `Frankfurter request failed: ${res.status} ${res.statusText} (${path})`,
    );
  }

  return (await res.json()) as T;
}

async function fetchLatestRates(
  base: string,
  init: RequestInit,
): Promise<LatestRates> {
  const data = await request<LatestRates>(
    `/latest?base=${encodeURIComponent(base.toUpperCase())}`,
    init,
  );

  return { base: data.base, date: data.date, rates: data.rates };
}

export async function getLatestRates(base: string): Promise<LatestRates> {
  return fetchLatestRates(base, CACHED);
}

export async function getLatestRatesFresh(base: string): Promise<LatestRates> {
  return fetchLatestRates(base, FRESH);
}

export async function getCurrencies(): Promise<Currencies> {
  return request<Currencies>("/currencies", CACHED);
}

export async function getCurrenciesFresh(): Promise<Currencies> {
  return request<Currencies>("/currencies", FRESH);
}

function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function getTimeSeries(
  base: string,
  symbol: string,
  days: number,
): Promise<RatePoint[]> {
  const from = base.toUpperCase();
  const to = symbol.toUpperCase();
  const startDate = isoDateDaysAgo(days);

  const data = await request<TimeSeriesResponse>(
    `/${startDate}..?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    CACHED,
  );

  return Object.entries(data.rates)
    .flatMap(([date, dayRates]) => {
      const rate = dayRates[to];
      return typeof rate === "number" ? [{ date, rate }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
