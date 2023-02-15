import Notifier from './notifier.js';
import Update from './update.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

class UpdatePrices extends Update {

    file;
    parser;

    constructor() {
        super('prices');
        this.parser = dayjs;
        this.parser.extend(customParseFormat)
    }

    async main() {
        this.file = await this.getFile();
        this.updateDB()
    }

    _parseDate(date){
        return this.parser(date, "DD/MM/YYYY HH:mm:SS").format("YYYY-MM-DD HH:mm:ss")
    }

    prepareInsertValues() {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2)

        let res = [];
        arr.forEach(async i => {
            i = i.split(";").map(i => i != 'NULL' ? i.replace(/\"/gi, "") : '');
            if (!!i[0]) {
                let date = this._parseDate(i[4]);
                let insert =    `(${i[0]},"${i[1]}",${i[2]},${i[3]},"${date}")`
                res.push(insert);
            }
        })

        return res.join(",");
    }

    updateDB() {
        try {
            let inserts = this.prepareInsertValues();
            let query = `REPLACE INTO prices VALUES ${inserts}`;
            this.db.run(query, (err) => {
                if (err)
                    throw new Error(err)
            });
        } catch (err) {
            console.log(err)
        }

        let notifier = new Notifier(0);
        notifier.tableUpdateTerminated('prices');
    }

}

let us = new UpdatePrices();
us.main();