import Update from './update.js';
import Notifier from './notifier.js';

class UpdateStation extends Update {

    file;

    constructor() {
        super('stations');
    }

    async main() {
        this.file = await this.getFile(); 
        this.updateDB()
    }

    prepareInsertValues() {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2)

        let res = [];
        let idCache = new Set();
        arr.forEach(async i => {
            i = i.split(";").map(i => i != 'NULL' ? i.replace(/\"/gi, "") : '');
            if (!!i[0] && !!i[8] && !!i[9]) {
                if (!idCache.has(i[0]) && !isNaN(i[8]) && !isNaN(i[9])) {
                    let insert = `(${i[0]},"${i[1]}","${i[2]}","${i[3]}","${i[4]}","${i[5]}","${i[6]}","${i[7]}","${i[8]}","${i[9]}")`
                    res.push(insert)
                    console.log(`Creating insert ${insert}`)
                } else
                    idCache.add(i[0])
            }
        })

        return res.join(",");
    }

    updateDB() {
        try {
            let inserts = this.prepareInsertValues();
            let query = `REPLACE INTO stations VALUES ${inserts}`;
            this.db.run(query, (err) => {
                console.error(err, query)
                if (err)
                    throw new Error(err)
            });
        } catch (err) {
            console.log(err)
        }

        let notifier = new Notifier(0);
        notifier.tableUpdateTerminated('stations');
    }

}

let us = new UpdateStation();
us.main();