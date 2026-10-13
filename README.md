# Currency Dashboard

**🔗 Live demo:** https://currency-dashboard-wheat.vercel.app

A live currency dashboard with real-time exchange rates, a multi-currency converter, and 30-day historical charts. Built with Next.js 16 and TypeScript.

## Features

- **Live exchange rates** for 14 currencies vs. a selectable base
- **Auto-refresh** every 30 seconds with a pulsing "Live" indicator and timestamp
- **Currency converter** with swap button and live recalculation
- **Dynamic base currency** selector (USD, EUR, GBP, JPY, ZAR) with URL persistence (`?base=ZAR`)
- **30-day line chart** — click any currency card to see its rate history, powered by Recharts
- **Server-side caching** — rates cached for 1 hour, chart data cached for 1 hour
- **Graceful fallbacks** — handles API errors and unsupported currencies cleanly

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** lucide-react
- **API:** [Frankfurter](https://www.frankfurter.app/) — free, no API key required
- **Deployment:** Vercel

## Architecture

    Browser
       │
       ├── Server Component (app/page.tsx)
       │       │
       │       └── getLatestRates() → cached 1h
       │              │
       │              └── Frankfurter API
       │
       └── Client Component (app/LiveRates.tsx)
               │
               ├── Polls /api/rates every 30s (no cache)
               ├── Renders Converter (client-side math using fetched rates)
               └── Renders RateChart (fetches /api/history on click)

### Data Flow

1. **Initial page load** — the Server Component fetches rates and currencies from Frankfurter (cached 1 hour) and passes them to `LiveRates`
2. **Client polling** — `LiveRates` polls `/api/rates` every 30 seconds to keep rates fresh. The API route fetches from Frankfurter without caching
3. **Base currency change** — updates the URL (`?base=ZAR`), refetches rates with the new base, and the polling interval resets to use the new base
4. **Chart** — when a user clicks a currency card, `RateChart` fetches `/api/history?base=X&symbol=Y` which queries Frankfurter for 30 days of data

## Project Structure

    app/
      page.tsx                    Homepage (Server Component)
      layout.tsx                  Root layout + ambient glow
      LiveRates.tsx               Live grid (Client Component)
      Converter.tsx               Currency converter
      RateChart.tsx               30-day chart
      loading.tsx                 Skeleton loader
      api/
        rates/route.ts            Returns latest rates (no cache)
        history/route.ts          Returns 30-day time series

    lib/
      frankfurter.ts              API helpers with caching

## Getting Started

1. Clone the repo:

       git clone https://github.com/KernelRyan/currency-dashboard.git
       cd currency-dashboard

2. Install dependencies:

       npm install

3. Start the dev server:

       npm run dev

4. Open http://localhost:3000

**No API keys or environment variables needed** — Frankfurter is a free public API.

## API Reference

This project uses [Frankfurter](https://www.frankfurter.app/docs/):

- `GET /latest?from=USD` — latest rates
- `GET /currencies` — list of supported currencies
- `GET /{start}..?from=USD&to=ZAR` — time series for a specific pair

## License

MIT