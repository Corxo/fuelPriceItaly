// Description: This script is used to update the database with the latest data from the MISE website.

import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import axios from 'axios';

export default class Update {
    table: string =  'prices';
    db!: sqlite3.Database;
    url!: string;

    process = dotenv.config();

    constructor(type: string) {
        this.table = type;
        if (type !== 'stations' && type !== 'prices') {
            console.error(`Type ${type} not handled`);
        }

        switch (type) {
            case 'stations':
                this.url = "https://www.mise.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv";
                break;
            case 'prices':
                this.url = "https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv";
        }

        if (this.process.parsed) {
            this.db = new sqlite3.Database(this.process.parsed.DB_PATH, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE);
            this.db.run(this.getCreateTable(this.table) as string, (err: Error | null) => {
                if (err)
                    throw new Error(err.message);
            });
        }
    }

    private getCreateTable(table: string): string | void {
        switch (table) {
            case 'stations':
                return `CREATE TABLE IF NOT EXISTS stations(
                    idStation int NOT NULL PRIMARY KEY,
                    company varchar(500),
                    flag varchar(50),
                    type varchar(500),
                    name varchar(500),
                    address varchar(1000) NOT NULL,
                    municipality varchar(1000) NOT NULL,
                    province varchar(2),
                    lat varchar(100),
                    log varchar(100));`;
            default:
            case 'prices':
                return `CREATE TABLE IF NOT EXISTS prices(
                    idStation int NOT NULL,
                    fuel varchar(100) NOT NULL,
                    price float NOT NULL,
                    isSelf int(1) NOT NULL,
                    tsCattura DATETIME NOT NULL,
                    UNIQUE(idStation, fuel, isSelf, tsCattura)
                );`;
        }
    }

    cleanTable(): void {
        this.db.run(`DELETE from ${this.table}`);
    }

    async getFile(): Promise<string | undefined> {
        try {
            const res = await axios.get(this.url,{
                responseType: 'text'
            });
            return res.data;
        } catch (err) {
            console.error(err);
            throw new Error("Error while fetching the file");
        }
        return ''
    }
}