const BASE_URL = "https://api.frankfurter.app";
const REVALIDATE_SECONDS = 3600;

export type LatestRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type Currencies = Record<string, string>;

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(
      `Frankfurter request failed: ${res.status} ${res.statusText} (${path})`,
    );
  }

  return (await res.json()) as T;
}

export async function getLatestRates(base: string): Promise<LatestRates> {
  const data = await request<LatestRates>(
    `/latest?base=${encodeURIComponent(base.toUpperCase())}`,
  );

  return { base: data.base, date: data.date, rates: data.rates };
}

export async function getCurrencies(): Promise<Currencies> {
  return request<Currencies>("/currencies");
}
