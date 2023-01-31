import Update from './update.js';

class UpdatePrices extends Update {

    file;

    constructor() {
        super('prices');
    }

    async main() {
        this.file = await this.getFile();
        this.updateDB()
    }

    prepareInsertValues() {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2)

        let res = [];
        arr.forEach(async i => {
            i = i.split(";").map(i => i != 'NULL' ? i.replace(/\"/gi, "") : '');
            if (!!i[0]) {
                let insert = `(${i[0]},"${i[1]}",${i[2]},${i[3]},"${i[4]}")`
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
    }

}

let us = new UpdatePrices();
us.main();