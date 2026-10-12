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
