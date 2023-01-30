import Update from './update.js';

class UpdatePrices extends Update{

    file;

    constructor(){
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
        let idCache = new Set();
        arr.forEach(async i => {
            i = i.split(";").map(i => i != 'NULL' ? i.replace(/\"/gi, "") : '');
            if (!!i[0]) {
                if (!idCache.has(i[0]) && !isNaN(i[2])) {
                    let insert = `(${i[0]},"${i[1]}",${i[2]},${i[3]},"${i[4]}")`
                    res.push(insert)
                    console.log(`Creating insert ${insert}`)
                }
                else
                    idCache.add(i[0])
            }
        })

        return res;
    }

    updateDB() {
        try {
            let inserts = this.prepareInsertValues();
            inserts.forEach(i => {
                let query = `REPLACE INTO prices VALUES ${i}`;
                this.db.run(query, (err) => {
                    console.error(err, query)
                    if (err)
                        throw new Error(err)
                });
                console.log(query)
            })
        } catch (err) {
            console.log(err)
        }
    }

}

let us = new UpdatePrices();
us.main();