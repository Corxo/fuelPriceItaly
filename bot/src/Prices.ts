import sqlite3 from "sqlite3";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const DB_PATH = process.env.DB_PATH as string;

interface PriceRow {
    idStation: number;
    fuel: string;
    price: number;
    isSelf: number;
    tsCattura: string;
    flag: string;
    address: string;
    municipality: string;
    province: string;
    lat: string;
    log: string;
    distance: number;
}

interface FuelPrice {
    fuel: string;
    isSelf: boolean;
    price: number;
}

export interface StationData {
    id: number;
    flag: string;
    address: string;
    municipality: string;
    province: string;
    tsCattura: string;
    log: string;
    lat: string;
    distance: string;
    fuels: FuelPrice[];
}

export interface LowestPrice {
    station: number;
    price: number;
}

export default class Prices {

    db = new sqlite3.Database(DB_PATH);
    pricesFromCloserStations: PriceRow[] = [];

    getPriceFromCloserStations(lat: number, log: number, nRes = 5, unit: 'km' | 'mi' = 'km'): Promise<Record<number, StationData>> {
        let conv = unit == 'km' ? 111.045 : 69.1;
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
                    GROUP BY s.idStation
                    ORDER BY distance
                    LIMIT ${nRes}
                ) p2
                ON p.idStation = p2.idStation
                GROUP BY p.idStation, fuel, isSelf
                ORDER BY distance
        `;

        return new Promise((res, rej) =>
            this.db.all(query, (err: Error | null, rows: PriceRow[]) => {
                if (err)
                    rej(err);
                this.pricesFromCloserStations = rows;
                res(this.parseData(rows));
            })
        );
    }

    private parseData(data: PriceRow[]): Record<number, StationData> {
        let d: Record<number, StationData> = {};
        data.forEach(r => {
            if (!d[r.idStation]) {
                d[r.idStation] = {
                    id: r.idStation,
                    flag: r.flag,
                    address: r.address,
                    municipality: r.municipality,
                    province: r.province,
                    tsCattura: r.tsCattura,
                    log: r.log,
                    lat: r.lat,
                    distance: r.distance.toFixed(2),
                    fuels: []
                };
            }
            d[r.idStation].fuels.push({
                fuel: r.fuel,
                isSelf: !!r.isSelf,
                price: r.price,
            })
        })
        return d;
    }

    getLowerPricerPerStation(_data?: Record<number, StationData>): Record<string, LowestPrice> {
        let res: Record<string, LowestPrice> = {};
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
