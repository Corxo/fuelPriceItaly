import Update from './update.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(customParseFormat)

class UpdatePrices extends Update {

    file: string = '';

    constructor() {
        super('prices');
    }

    async main(): Promise<void> {
        this.file = await this.getFile();
        this.updateDB()
    }

    _parseDate(date: string): string {
        return dayjs(date, "DD/MM/YYYY HH:mm:SS").format("YYYY-MM-DD HH:mm:ss")
    }

    prepareInsertValues(): string {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2)

        let res: string[] = [];
        arr.forEach(line => {
            let i = line.split("|").map(v => v != 'NULL' ? v.replace(/\"/gi, "") : '');
            if (!!i[0]) {
                let date = this._parseDate(i[4]);
                let insert =    `(${i[0]},"${i[1]}",${i[2]},${i[3]},"${date}")`
                res.push(insert);
            }
        })

        return res.join(",");
    }

    updateDB(): void {
        try {
            let inserts = this.prepareInsertValues();
            let query = `REPLACE INTO prices VALUES ${inserts}`;
            this.db.run(query, (err: Error | null) => {
                if (err)
                    throw new Error(err.message)
            });
        } catch (err) {
            console.log(err)
        }
    }

}

let us = new UpdatePrices();
us.main();
