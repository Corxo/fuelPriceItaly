import Update from './update.js';

class UpdateStation extends Update {

    file: string = '';

    constructor() {
        super('stations');
    }

    async main(): Promise<void> {
        this.file = await this.getFile();
        this.updateDB()
    }

    prepareInsertValues(): string {
        let arr = this.file.split("\n");
        arr = arr.splice(2, arr.length - 2)

        let res: string[] = [];
        let idCache = new Set<string>();
        arr.forEach(line => {
            let i = line.split("|").map(v => v != 'NULL' ? v.replace(/\"/gi, "") : '');
            if (!!i[0] && !!i[8] && !!i[9]) {
                if (!idCache.has(i[0]) && !isNaN(Number(i[8])) && !isNaN(Number(i[9]))) {
                    let insert = `(${i[0]},"${i[1]}","${i[2]}","${i[3]}","${i[4]}","${i[5]}","${i[6]}","${i[7]}","${i[8]}","${i[9]}")`
                    res.push(insert)
                    console.log(`Creating insert ${insert}`)
                } else
                    idCache.add(i[0])
            }
        })

        return res.join(",");
    }

    updateDB(): void {
        try {
            let inserts = this.prepareInsertValues();
            let query = `REPLACE INTO stations VALUES ${inserts}`;
            this.db.run(query, (err: Error | null) => {
                console.error(err, query)
                if (err)
                    throw new Error(err.message)
            });
        } catch (err) {
            console.log(err)
        }
    }

}

let us = new UpdateStation();
us.main();
