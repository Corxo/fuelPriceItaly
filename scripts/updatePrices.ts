// filepath: /fuelPriceItaly/scripts/updatePrices.ts
//import Notifier from './notifier.js';
import Update from './update';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

class UpdatePrices extends Update {
    file!: string;
    parser: any;

    constructor() {
        super('prices');
        this.parser = dayjs;
        this.parser.extend(customParseFormat);
    }

    async main(): Promise<void> {
        this.file = await this.getFile() as string;
        this.updateDB();
    }

    private parseDate(date: string): string {
        return this.parser(date, "DD/MM/YYYY HH:mm:SS").format("YYYY-MM-DD HH:mm:ss");
    }

    private prepareInsertValues(): string {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2);

        let res: string[] = [];
        arr.forEach((i: any) => {
            i = i.split(";").map(i => i !== 'NULL' ? i.replace(/\"/gi, "") : '');
            if (!!i[0]) {
                let date = this.parseDate(i[4]);
                let insert = `(${i[0]},"${i[1]}",${i[2]},${i[3]},"${date}")`;
                res.push(insert);
            }
        });

        return res.join(",");
    }

    private updateDB(): void {
        try {
            let inserts = this.prepareInsertValues();
            let query = `REPLACE INTO prices VALUES ${inserts}`;
            this.db.run(query, (err: Error | null) => {
                if (err) 
                    throw new Error(err.message);
            });
        } catch (err) {
            console.log(err);
        }


        //TODO fix this so when the script will end it will notify the end of the process
        /* let notifier = new Notifier(0);
        notifier.tableUpdateTerminated('prices'); */
    }
}

let us = new UpdatePrices();
us.main();