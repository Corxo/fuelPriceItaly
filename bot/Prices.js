import sqlite3 from "sqlite3";
import {
    DB_PATH
} from "./env.js";

export default class Prices {

    db = new sqlite3.Database(DB_PATH);

    constructor() {}

    getPriceFromCloserStations(lat, log, nRes = 5, unit = 'km') {
        let conv = unit == 'km' ? 111.045 : 69.1;
        let query = `
                SELECT
                    p.idStation, fuel, price, isSelf, tsCattura, flag, address, municipality, province, lat, log, p2.distance
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
                    GROUP BY s.idStation
                    ORDER BY distance, tsCattura DESC
                    LIMIT 5
                ) p2
                WHERE p.idStation IN (p2.idStation)
                GROUP BY p.idStation, fuel, isSelf
                ORDER BY distance
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

    getData() {

    }
}