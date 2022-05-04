const mariadb = require('mariadb');
const env = require('./env');

class OilPriceData{
    _db;

    constructor(){
        
    }

    async createConnection(){
        return await mariadb.createConnection({
            user: env.DB.USER,
            password: env.DB.PASSWORD,
            host: env.DB.HOST,
            port: env.DB.PORT,
        });
    }

    async setPreferences(){
        //TODO
    }
}

module.exports = {
    OilPriceData
}