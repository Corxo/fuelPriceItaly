# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

OilPriceItaly: a Telegram bot that returns the 5 closest fuel stations (with prices and a map) given a user's location. Source data is Italy's MISE open data CSVs for stations and prices, ingested into a shared SQLite database.

Repo is mid-refactor (branch `ts`, commit "convertion to TS"): the old `bot/` and `updateDB/` directories were moved to `src/bot/` and `src/serverless/` respectively. Git status still shows the old paths as deleted — this is expected, not something to restore.

## Structure

Two independent npm packages sharing one SQLite DB file (path from `DB_PATH` env var):

- `src/bot/` — the Telegraf Telegram bot (`oilPriceItaly.ts` is the entrypoint, `Prices.ts` holds the DB query logic). Reads from the DB only.
- `src/serverless/` — data ingestion. `update.ts` is a base `Update` class (creates tables if missing, fetches a MISE CSV over HTTP); `updateStations.ts` and `updatePrices.ts` extend it to parse the pipe-delimited CSV export and `REPLACE INTO` the DB. Meant to run on a schedule (cron), not as a long-lived process.

Each package builds independently (`tsc` to `dist/`) and has its own `tsconfig.json`, `package.json`, and env config.

## Commands

Run from within `src/bot/` or `src/serverless/` (no root package.json / workspace setup):

```bash
npm install
npm run build          # tsc -> dist/
```

Bot (`src/bot/`):
```bash
npm run dev             # tsx watch oilPriceItaly.ts TEST  (uses TELEGRAM_KEY_DEV)
npm start                # node dist/oilPriceItaly.js       (uses TELEGRAM_KEY, prod)
```
Bot config via `.env` (see `src/bot/.env.example`: `TELEGRAM_KEY`, `TELEGRAM_KEY_DEV`, `GEOAPIFY_TOKEN`, `DB_PATH`), loaded with `dotenv`, same pattern as `src/serverless/`.

Serverless (`src/serverless/`):
```bash
npm run dev:prices      # tsx updatePrices.ts
npm run dev:stations    # tsx updateStations.ts
npm run start:prices    # node dist/updatePrices.js
npm run start:stations  # node dist/updateStations.js
```
Config via `.env` (see `src/serverless/.env.example`, just `DB_PATH`), loaded with `dotenv`.

There is no test runner configured in either package.

## Data model (`schema.sql`)

- `stations`: static station registry (`idStation` PK, brand/`flag`, address, lat/`log` as strings).
- `prices`: time series of fuel prices per station (`idStation`, `fuel`, `price`, `isSelf`, `tsCattura`), uniqued on `(idStation, fuel, isSelf, tsCattura)` so re-running the updater is idempotent.
- `users` / `flags`: present in `schema.sql` but not currently read/written by any code in `src/`.

`Prices.getPriceFromCloserStations` computes distance with an equirectangular approximation (inline SQL, no PostGIS/spatial index) and joins the closest N stations' latest price per fuel/isSelf combo.

## Known deployment mismatch

The Dockerfile at `src/bot/Dockerfile` still references the pre-refactor paths (`bot/...`, `updateDB/...`) relative to a build context expecting the old top-level `bot/` and `updateDB/` dirs, and `docker-compose.yml`'s build context/dockerfile path likewise predates the move to `src/`. These need updating together if you touch the Docker build — don't fix one without the other.
