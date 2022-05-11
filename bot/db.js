import mariadb from 'mariadb'

import {DB} from './env.js'

class OilPriceData{
    _db;

    constructor(){
        
    }

    async createConnection(){
        this._db = await mariadb.createConnection({
            user: DB.USER,
            password: DB.PASSWORD,
            host: DB.HOST,
            port: DB.PORT,
        });
    }

    async getStations(){
        await this.createConnection();
        let flags = await this._db.query("SELECT fl_id id, fl_label label FROM oilprice.flags ORDER BY 2");
        return flags;
    }

    async setPreferences(id){
        //get preferences
        await this.createConnection();
        let currentPreferences = await this._db.query("SELECT us_preferences WHERE us_id = ?",[id]);
        console.log(currentPreferences)
    }
}

export{
    OilPriceData
}