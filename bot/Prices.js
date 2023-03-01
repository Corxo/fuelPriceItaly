import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";
import * as crypto from 'crypto'
import {Preferences} from './UserData.js'


export default class Prices {

    db = new sqlite3.Database(DB_PATH);
    pricesFromCloserStations = [];

    constructor(userId, ctx) {
        this.userId = crypto.createHash('md5').update(userId.toString()).digest('hex');
        this.ctx = ctx;
    }

    async getPriceFromCloserStations(lat, log, nRes = 5, unit = 'km') {
        let conv = unit == 'km' ? 111.045 : 69.1;
        let where = await this.getWhere();
        let query = `
                SELECT
                    p.idStation, fuel, price, isSelf, MAX(tsCattura) tsCattura, flag, address, municipality, province, lat, log, p2.distance
                FROM
                    prices p
                JOIN stations s ON p.idStation = s.idStation 	
                JOIN (
                    SELECT
                        s.idStation,
                        SQRT(POW(${conv} * (lat - ${lat}), 2) + POW(${conv} * (${log} - log) * COS(lat / 57.3), 2)) distance
                    FROM
                        stations s
                    JOIN prices p ON s.idStation = p.idStation
                    ${where}
                    GROUP BY s.idStation
                    ORDER BY distance
                    LIMIT ${nRes}
                ) p2
                ON p.idStation = p2.idStation
                GROUP BY p.idStation, fuel, isSelf
                ORDER BY distance
        `;

        return new Promise((res, rej) =>
            this.db.all(query, (err, rows) => {
                if (err)
                    rej(err);
                this.pricesFromCloserStations = rows;
                res(this._parseData(rows));
            })
        );
    }

    async getWhere(){
        let pref = new Preferences(this.ctx.from.id);
        let preferences = await pref.getPreferences();
        preferences = JSON.parse(preferences['preferences']);
        let prefItem = [];
        for(let k of Object.keys(preferences)){
            if(!!preferences[k])
                prefItem.push(`${k} = '${preferences[k]}'`)
        }

        return prefItem.length > 0 ? "WHERE "+prefItem.join(" AND ") : "";
    }
    
    getMajorBrands(){
        let query = "SELECT flag FROM stations GROUP BY flag HAVING COUNT(flag) > 100 ORDER BY COUNT(flag) DESC LIMIT 13;";
        return new Promise((res,rej)=>{
            this.db.all(query,(err,rows)=>{
                if(err)
                    rej(err);
                res(rows.map(r=>r['flag']))
            })
        })
    }

    _parseData(data) {
        let d = {};
        data.forEach(r => {
            d[r.idStation] = d[r.idStation] ?? [];

            if (!d[r.idStation]['fuels'])
                d[r.idStation]['fuels'] = [];

            d[r.idStation]['id'] = r.idStation;
            d[r.idStation]['flag'] = r.flag;
            d[r.idStation]['address'] = r.address;
            d[r.idStation]['municipality'] = r.municipality;
            d[r.idStation]['province'] = r.province;
            d[r.idStation]['tsCattura'] = r.tsCattura;
            d[r.idStation]['log'] = r.log;
            d[r.idStation]['lat'] = r.lat;
            d[r.idStation]['distance'] = r.distance.toFixed(2);
            d[r.idStation]['fuels'].push({
                fuel: r.fuel,
                isSelf: !!r.isSelf,
                price: r.price,
            })
        })
        return d;
    }

    getLowerPricerPerStation() {
        let res = {};
        this.pricesFromCloserStations.forEach(d => {
            let key = `${d.fuel}_${d.isSelf}`
                if (!res[key])
                    res[key] = {
                        station: d.idStation,
                        price: d.price
                    };
                else if (d.price < res[key].price)
                    res[key] = {
                        station: d.idStation,
                        price: d.price
                    };
        })
        return res;
    }
}