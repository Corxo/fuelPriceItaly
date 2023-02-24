import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";
import * as crypto from 'crypto'
import Prices from "./Prices.js";
import {Markup} from 'telegraf';

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
    botInstance;
    userId;

    constructor(userId, botInstance){
        this.userId = crypto.createHash('md5').update(userId.toString()).digest('hex');
        this.botInstance = botInstance
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

    /**
     * This function generate and send the message containing the options about a specific preference
     * @param {String} preferences 
     */
    async showPreferences(preferences){
        switch(preferences){
            case 'setFlag':
                let price = new Prices();
                let brands = await price.getMajorBrands();
                this.botInstance.reply("Seleziona un brand",Markup.inlineKeyboard(
                    brands.map(b=>[Markup.button.callback(b,"setPrefData_setFlag_"+b)]))
                )
                break;
        }
        this.botInstance.answerCbQuery()
    }


    handlePreferencesData(pref, data){
        switch(pref){
            case 'setFlag':
            case 'resetFlag':
                this._setFlag(data ?? "");
                this.botInstance.answerCbQuery();
                break;
        }
    }

    async _setFlag(flag){
        let query = `UPDATE users SET preferences = JSON_SET(preferences, '$.flag', '${flag}') WHERE id = '${this.userId}'`
        try{
            this.db.run(query);
            let message;
            if(flag)
                message = `Compagnia ${flag} impostata con successo`;
            else
                message = `Rimossa stazione prefererita`;
            this.botInstance.reply(message);
        }
        catch(err){
            console.error(err)
        }
    }
}

export {
    User, Preferences
}