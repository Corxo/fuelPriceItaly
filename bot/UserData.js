import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";
import * as crypto from 'crypto'

class User{

    db = new sqlite3.Database(DB_PATH);
    userId;

    constructor(userId){
        this.userId = crypto.createHash('md5').update(userId.toString()).digest('hex');
    }

    addUser(){
        let defaultPrefences = {
            flag: ""
        };

        defaultPrefences = JSON.stringify(defaultPrefences);

        let query = `INSERT OR IGNORE INTO users (id, preferences) VALUES ('${this.userId}','${defaultPrefences}')`;

        this.db.run(query);

        return true;
    }

    deleteUser(){
        this.db.run(`DELETE FROM users WHERE id = ${this.userId}`);
        return true;
    }

}

class Preferences{
    
    db = new sqlite3.Database(DB_PATH);
    userId;

    constructor(userId){
        this.userId = crypto.createHash('md5').update(userId.toString()).digest('hex');
    }

    showStationsMap(){
        return new Promise((res,rej)=>{
            this.db.all(`SELECT showMap FROM users WHERE id = '${this.userId}'`,(err, row)=>{
                if(err)
                    rej(err);
                if(row.length == 0)
                    res(false);
                
                row[0]['showMap'] == 1 ? res(true) : res(false);
            })
        })
    }

    handlePreferences(pref, data){
        switch(pref){
            case 'setFlag':
            case 'resetFlag':
                this._setFlag(data ?? "");
                break;
        }
    }

    _setFlag(flag){
        let query = `UPDATE users SET preferences = JSON_SET(preferences, '$.flag', '${flag}') WHERE id = '${this.userId}'`
    }
}

export {
    User, Preferences
}