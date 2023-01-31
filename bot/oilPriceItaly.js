/**
 * TODO:
 * Add caching system: store the data obtained from the API in /tmp/dataCache.json. When the user send the coords
 * check the cache, if it's older then 2 hours regenerate it, otherwise use it.
 */

import {
    Telegraf
} from 'telegraf';
import {
    TELEGRAM_KEY,
    TELEGRAM_KEY_DEV,
    GEOAPIFY_TOKEN
} from './env.js'
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

import Prices from './Prices.js';

let bot = null;
dayjs.extend(customParseFormat)

const prices = new Prices();

if (process.argv[2] && process.argv[2] == 'TEST') {
    bot = new Telegraf(TELEGRAM_KEY_DEV);
    console.log("DEV");
} else {
    bot = new Telegraf(TELEGRAM_KEY);
    console.log("PROD")
}


bot.command('start', ctx => {
    ctx.reply(`Ciao e grazie per usare il nostro bot!\nInvia la posizione per ricevere il prezzo del carburante dei 5 distrbutori più vicini a te!`);
})


bot.use(async ctx => {
    if (ctx['update']['message']['location']) {
        await ctx.reply("Sto cercando...");
        let userCoords = {
            latitude: ctx['update']['message']['location']['latitude'],
            longitude: ctx['update']['message']['location']['longitude']
        }
        try {

            let data = await prices.getPriceFromCloserStations(userCoords.latitude, userCoords.longitude);

            let msg = [];
            let cnt = 0;

            let markers = [
                `lonlat:${userCoords.longitude},${userCoords.latitude};type:material;color:%231400ff;size:small;icon:person;iconsize:small;textsize:small`
            ];
            Object.keys(data).sort((a,b)=>data[a]['distance'] - data[b]['distance']).forEach(k => {
                let reply = "";
                reply += `${cnt+1}) *${data[k]['flag']}*\n`;
                let address = `[${data[k]['address']}](https://maps.google.it/maps?hl=it&q=${encodeURI(data[k]['address'])}) (${data[k]['distance']}km)`;
                //reply += `⛽ ${address} (${data[k]['distance'].toFixed(2)} km)\n`;
                reply += `⛽ ${address}\n`;
                let date = dayjs(data[k]['tsCattura'],"DD/MM/YYYY HH:mm:ss");

                let markerColor = '00c512';
                if (dayjs().diff(date, 'days') > 3) {
                    reply += `🔴 *Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}*\n`;
                    markerColor = 'ff0000';
                } else
                    reply += `🟢 Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}\n`;

                reply += `💶 Prezzi:\n`;
                data[k]['fuels'].forEach(e => reply += `\t\t\t${e['fuel']}${e['isSelf'] ? ' (Self): ' : ': '} ${e['price']}€\n`);

                msg.push(reply);
                markers.push(`lonlat:${data[k]['log']},${data[k]['lat']};color:%23${markerColor};size:small;text:${cnt+1}`)
                cnt+=1;
            })

            for(let m of msg){
                await ctx.replyWithMarkdown(m, {disable_web_page_preview: true})
            }
            
            let url = `https://maps.geoapify.com/v1/staticmap?width=512&height=512&apiKey=${GEOAPIFY_TOKEN}&marker=${markers.join("|")}`;
            ctx.replyWithPhoto(url);

        } catch (err) {
            ctx.reply("Error");
            console.log(err);
            return;
        }
    }
})

bot.launch();