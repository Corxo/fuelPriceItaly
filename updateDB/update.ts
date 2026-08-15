import sqlite3 from 'sqlite3';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const DB_PATH = process.env.DB_PATH as string;

export type TableName = 'stations' | 'prices';

export default class Update {
    table: TableName;
    db: sqlite3.Database;
    url: string;

    constructor(type: TableName) {
        this.table = type;

        switch (type) {
            case 'stations':
                this.url = "https://www.mise.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv";
                break;
            case 'prices':
                this.url = "https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv";
                break;
        }

        this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE);
        this.db.run(this._getCreateTable());
    }

    _getCreateTable(): string {
        switch (this.table) {
            case 'stations':
                return `CREATE TABLE IF NOT EXISTS stations(
                    idStation int NOT NULL PRIMARY KEY,
                    company varchar(500),
                    flag varchar(50),
                    'type' varchar(500),
                    name varchar(500),
                    address varchar(1000) NOT NULL,
                    municipality varchar(1000) NOT NULL,
                    province varchar(2),
                    lat varchar(100),
                    log varchar(100));`
            case 'prices':
                return `CREATE TABLE IF NOT EXISTS 'prices'(
                    idStation int NOT NULL,
                    fuel varchar(100) NOT NULL,
                    price float NOT NULL,
                    isSelf int(1) NOT NULL,
                    tsCattura DATETIME NOT NULL,
                    UNIQUE(idStation, fuel, isSelf, tsCattura)
                );`
        }
    }

    cleanTable(): void {
        this.db.run(`DELETE from ${this.table}`);
    }

    async getFile(): Promise<string> {
        try {
            let res = await axios<string>({
                url: this.url,
                responseType: 'text'
            })
            return res.data;
        } catch (err) {
            console.error(err)
            return '';
        }
    }
}
