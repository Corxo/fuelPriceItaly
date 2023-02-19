import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";

class User{

    db = new sqlite3.Database(DB_PATH);
    userId;

    constructor(userId){
        this.userId = userId;
    }

    addUser(){
        let defaultPrefences = {
            flag: ""
        };

        defaultPrefences = JSON.stringify(defaultPrefences);

        let query = `INSERT IGNORE INTO users (id, preferences) VALUES (${this.userId},'${defaultPrefences}')`;

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
        this.userId = userId;
    }

    showStationsMap(){
        return new Promise((res,rej)=>{
            this.db.run(`SELECT showMap FROM users WHERE id = ${this.userId}`,(err, row)=>{
                if(err)
                    rej(err);
                if(row.length == 0)
                    res(false);
                if(row[0]['showMap'] == 1)
                    res(true);
            })
        })
    }
}

export {
    User, Preferences
}