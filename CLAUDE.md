# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

OilPriceItaly: a Telegram bot that returns the 5 closest fuel stations (with prices and a map) given a user's location. Source data is Italy's MISE open data CSVs for stations and prices, ingested into a shared SQLite database.

## Structure

Two independent npm packages at repo root, sharing one SQLite DB file (path from `DB_PATH` env var), plus a `dba/` folder with the schema:

- `bot/` — the Telegraf Telegram bot. Sources in `bot/src/`: `oilPriceItaly.ts` (entrypoint), `Prices.ts` (DB query logic). Reads from the DB only.
- `serverless/` — data ingestion. Sources in `serverless/src/`: `update.ts` is a base `Update` class (creates tables if missing, fetches a MISE CSV over HTTP); `updateStations.ts` and `updatePrices.ts` extend it to parse the pipe-delimited CSV export and `REPLACE INTO` the DB. Meant to run on a schedule (cron), not as a long-lived process.
- `dba/schema.sql` — DB schema reference (not auto-applied by any code; tables are also created idempotently by `Update`'s constructor).

Each package builds independently (`tsc`, `rootDir: src` → `outDir: dist`, output stays flat in `dist/`) and has its own `tsconfig.json`, `package.json`, and `.env`.

Relative imports between local files are written with a `.ts` extension (e.g. `import Prices from './Prices.ts'`) — both tsconfigs set `rewriteRelativeImportExtensions: true` (TS 5.7+), which rewrites these to `.js` in the compiled output while keeping `tsx`/editor navigation pointing at real source files.

## Commands

Run from within `bot/` or `serverless/` (no root package.json / workspace setup):

```bash
npm install
npm run build          # tsc -> dist/
```

Bot (`bot/`):
```bash
npm run dev              # tsx watch src/oilPriceItaly.ts TEST  (uses TELEGRAM_KEY_DEV)
npm start                # node dist/oilPriceItaly.js            (uses TELEGRAM_KEY, prod)
```
Config via `.env` (see `bot/.env.example`: `TELEGRAM_KEY`, `TELEGRAM_KEY_DEV`, `GEOAPIFY_TOKEN`, `DB_PATH`), loaded with `dotenv`.

Serverless (`serverless/`):
```bash
npm run dev:prices      # tsx src/updatePrices.ts
npm run dev:stations    # tsx src/updateStations.ts
npm run start:prices    # node dist/updatePrices.js
npm run start:stations  # node dist/updateStations.js
```
Config via `.env` (see `serverless/.env.example`, just `DB_PATH`), loaded with `dotenv`.

There is no test runner configured in either package.

## Data model (`dba/schema.sql`)

- `stations`: static station registry (`idStation` PK, brand/`flag`, address, lat/`log` as strings).
- `prices`: time series of fuel prices per station (`idStation`, `fuel`, `price`, `isSelf`, `tsCattura`), uniqued on `(idStation, fuel, isSelf, tsCattura)` so re-running the updater is idempotent.
- `users` / `flags`: present in `dba/schema.sql` but not currently read/written by any code.

`Prices.getPriceFromCloserStations` computes distance with an equirectangular approximation (inline SQL, no PostGIS/spatial index) and joins the closest N stations' latest price per fuel/isSelf combo.

## Docker

`bot/Dockerfile` builds both packages into one image: it copies `bot/src` and `serverless/src` (as `/data/update/src`) separately, runs `npm install --force && npm run build` for each, then seeds the DB once at build time (`updatePrices.js` / `updateStations.js`) and crons the same two scripts daily at 8:10 alongside the long-running bot process. `bot/docker-compose.yml` builds with context `..` (repo root) and `dockerfile: bot/Dockerfile` — run `docker compose -f bot/docker-compose.yml up` from repo root.
