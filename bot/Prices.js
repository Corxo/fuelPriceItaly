import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";

export default class Prices {

    db = new sqlite3.Database(DB_PATH);

    constructor() {}

    getPriceFromCloserStations(lat, log, nRes = 5) {
        let query = `
            SELECT 
                p.idStation, 
                fuel, 
                price, 
                isSelf, 
                tsCattura, 
                flag, 
                address, 
                municipality, 
                province, 
                lat, 
                log,
                SQRT(POW(69.1 * (lat - ${lat}), 2) + POW(69.1 * (${log} - log) * COS(lat / 57.3), 2)) distance 
            FROM prices p
            JOIN stations s ON p.idStation = s.idStation  
            WHERE p.idStation IN (
                SELECT s.idStation
                FROM stations s
                JOIN prices p on s.idStation = p.idStation 
                GROUP by s.idStation
                ORDER by SQRT(POW(69.1 * (lat - ${lat}), 2) + POW(69.1 * (${log} - log) * COS(lat / 57.3), 2)), tsCattura 
                LIMIT ${nRes}
            )
            GROUP BY p.idStation, fuel, isSelf
            ORDER BY tsCattura desc
        `;

        return new Promise((res, rej) =>
            this.db.all(query, (err, rows) => {
                if (err)
                    rej(err);
                res(this._parseData(rows));
            })
        );
    }

    _parseData(data) {
        let d = {};
        data.forEach(r => {
            d[r.idStation] = d[r.idStation] ?? [];

            if (!d[r.idStation]['fuels'])
                d[r.idStation]['fuels'] = [];

            d[r.idStation]['flag'] = r.flag;
            d[r.idStation]['address'] = r.address;
            d[r.idStation]['municipality'] = r.municipality;
            d[r.idStation]['province'] = r.province;
            d[r.idStation]['tsCattura'] = r.tsCattura;
            d[r.idStation]['fuels'].push({
                fuel: r.fuel,
                isSelf: !!r.isSelf,
                price: r.price,
            })
        })
        return d;
    }

    getData() {

    }
}