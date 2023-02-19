import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";

/*

This file contain various script to create the dafult tables and prepare the enviroment  

*/

const DB = new sqlite3.Database(DB_PATH, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE);

function createTables() {

    //STATIONS
    DB.run(`CREATE TABLE IF NOT EXISTS stations(
        idStation int NOT NULL PRIMARY KEY,
        company varchar(500),
        flag varchar(50),
        'type' varchar(500),
        name varchar(500),
        address varchar(1000) NOT NULL,
        municipality varchar(1000) NOT NULL,
        province varchar(2),
        lat varchar(100),
        log varchar(100));`);

    //PRICES
    DB.run(`CREATE TABLE IF NOT EXISTS 'prices'(
        idStation int NOT NULL,
        fuel varchar(100) NOT NULL,
        price float NOT NULL,
        isSelf int(1) NOT NULL,
        tsCattura DATETIME NOT NULL,
        UNIQUE(idStation, fuel, isSelf, tsCattura)
    );`)

    //USERS
    DB.run(`CREATE TABLE IF NOT EXISTS users(
        id BIGINT NOT NULL PRIMARY KEY,
        us_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        showMap TINYINT(1) NOT NULL DEFAULT 0,
        preferences JSON
    );`);
}



createTables();


