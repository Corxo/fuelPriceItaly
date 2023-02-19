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

        this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE);
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