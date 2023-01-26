import get from 'axios'
import * as fs from 'fs'

const url = "https://www.mise.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv";

//GET FILE
async function getFile() {
    try {
        let res = await get({
            url: url,
            responseType: 'text'
        })
        return res.data;
    } catch (err) {
        console.error(err)
    }
}

function loadInArray(file){
    let arr = file.split("\n");
    arr = arr.splice(2,arr.length)

    return arr.map(i=>{
        i = i.split(";")
        return {
            id: i[0],
            gestore: i[1],
            bandiera: i[2],
            tipo: i[3],
            nome: i[4],
            indirizzo: i[5],
            comune: i[6],
            provincia: i[7],
            lat: i[8],
            log: i[9],
        }
    });
}


async function main() {
    let file = await getFile();
    file = loadInArray(file);
    console.log(file)
}

main();