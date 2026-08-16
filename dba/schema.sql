--DB STRUCTURE FOR STORING PRICES FROM OPEN DATA
CREATE TABLE IF NOT EXISTS "prices"( -- time series of fuel prices per station, ingested from MISE open data CSV
    "pr_st_id" int NOT NULL, -- FK to stations.st_id
    "pr_fuel" varchar(100) NOT NULL, -- fuel type label (e.g. Benzina, Gasolio, GPL)
    "pr_price" float NOT NULL, -- price in euro
    "pr_is_self" smallint NOT NULL, -- 1 = self-service price, 0 = served price
    "pr_ts_cattura" timestamp NOT NULL, -- timestamp the price was captured/published by MISE
    UNIQUE ("pr_st_id", "pr_fuel", "pr_is_self", "pr_ts_cattura")
);

CREATE TABLE IF NOT EXISTS "stations"( -- static station registry, ingested from MISE open data CSV
    "st_id" int NOT NULL PRIMARY KEY, -- MISE station id (idImpianto)
    "st_company" varchar(500), -- owning company name
    "st_flag" varchar(50), -- brand shown to users (e.g. Eni, Q8)
    "st_type" varchar(500), -- station type (e.g. stradale, autostradale)
    "st_name" varchar(500), -- station name
    "st_address" varchar(1000) NOT NULL, -- street address
    "st_municipality" varchar(1000) NOT NULL, -- municipality (comune)
    "st_province" varchar(2), -- province code (2 letters)
    "st_lat" double precision, -- latitude
    "st_log" double precision -- longitude
);

--USERS DATA
CREATE TABLE IF NOT EXISTS "users"( -- Telegram bot users
    "us_id" bigint NOT NULL, -- Telegram chat/user id
    "us_ts" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, -- first seen timestamp
    "us_preferences" jsonb -- user preferences (e.g. unit, favorite fuel), free-form JSON
);

CREATE TABLE IF NOT EXISTS "flags"( -- brand/flag label lookup
    "stl_id" int GENERATED ALWAYS AS IDENTITY, -- surrogate PK
    "stl_label" varchar(512) NOT NULL, -- brand/flag display label
    PRIMARY KEY ("stl_id")
);
