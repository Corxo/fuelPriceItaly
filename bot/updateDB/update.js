import sqlite3 from 'sqlite3';
import { DB_PATH } from '../env.js';
import get from 'axios';


export default class Update{
    table;
    db;
    url;

    constructor(type){
        this.table = type;
        if(type != 'stations' && type != 'prices'){
            console.error(`Type ${type} not handled`)
        }

        switch(type){
            case 'stations':
                this.url = "https://www.mise.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv";
                break;
            case 'prices':
                this.url = "https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv"
        }

        this.db = new sqlite3.Database(DB_PATH);
    }

    _getCreateTable(){
        switch(this.table){
            case 'stations':
                return `CREATE TABLE stations(
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
                    tsCattura timestamp NOT NULL
                );`
        }
    }

    cleanTable(){
        this.db.run(`DELETE from ${this.table}`);
    }

    async getFile() {
        try {
            let res = await get({
                url: this.url,
                responseType: 'text'
            })
            return res.data;
        } catch (err) {
            console.error(err)
        }
    }
}