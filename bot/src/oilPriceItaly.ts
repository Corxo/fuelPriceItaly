/**
 * TODO:
 * Add caching system: store the data obtained from the API in /tmp/dataCache.json. When the user send the coords
 * check the cache, if it's older then 2 hours regenerate it, otherwise use it.
 */

import {
    Telegraf
} from 'telegraf';
import {
    message
} from 'telegraf/filters';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

import Prices from './Prices.ts';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const TELEGRAM_KEY = process.env.TELEGRAM_KEY as string;
const TELEGRAM_KEY_DEV = process.env.TELEGRAM_KEY_DEV as string;
const GEOAPIFY_TOKEN = process.env.GEOAPIFY_TOKEN as string;

let bot: Telegraf;
dayjs.extend(customParseFormat)

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


bot.on(message('location'), async ctx => {
    await ctx.reply("Sto cercando...");
    let userCoords = {
        latitude: ctx.message.location.latitude,
        longitude: ctx.message.location.longitude
    }
  try {

        const prices = new Prices();

        let data = await prices.getPriceFromCloserStations(userCoords.latitude, userCoords.longitude);
        let minPrices = prices.getLowerPricerPerStation(data);

        let msg: string[] = [];
        let cnt = 0;

        let markers = [
            `lonlat:${userCoords.longitude},${userCoords.latitude};type:material;color:%231400ff;size:small;icon:person;iconsize:small;textsize:small`
        ];
        Object.keys(data).map(Number).sort((a, b) => Number(data[a]['distance']) - Number(data[b]['distance'])).forEach(k => {
            let reply = "";
            reply += `${cnt+1}) *${data[k]['flag']}*\n`;
            let address = `[${data[k]['address']}](https://maps.google.it/maps?hl=it&q=${encodeURI(data[k]['address'])}) (${data[k]['distance']}km)`;
            //reply += `⛽ ${address} (${data[k]['distance'].toFixed(2)} km)\n`;
            reply += `⛽ ${address}\n`;
            let date = dayjs(data[k]['tsCattura'], "YYYY-MM-DD HH:mm:ss");

            let markerColor = '00c512';
            if (dayjs().diff(date, 'days') > 3) {
                reply += `🔴 *Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}*\n`;
                markerColor = 'ff0000';
            } else
                reply += `🟢 Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}\n`;

            reply += `💶 Prezzi:\n`;
            data[k]['fuels'].forEach(e => {
                let signLowerPrice = minPrices[`${e['fuel']}_${e['isSelf'] ? 1 : 0}`].station == data[k]['id'] ? ' 💰' : ''
                reply += `\t\t\t${e['fuel']}${e['isSelf'] ? ' (Self): ' : ': '} ${e['price']}€${signLowerPrice}\n`
            });

            msg.push(reply);
            markers.push(`lonlat:${data[k]['log']},${data[k]['lat']};color:%23${markerColor};size:small;text:${cnt+1}`)
            cnt += 1;
        })

        for (let m of msg) {
            await ctx.replyWithMarkdown(m, { link_preview_options: { is_disabled: true } })
        }

        let url = `https://maps.geoapify.com/v1/staticmap?width=512&height=512&apiKey=${GEOAPIFY_TOKEN}&marker=${markers.join("|")}`;
        ctx.replyWithPhoto(url);

    } catch (err) {
        ctx.reply("Error");
        console.log(err);
        return;
    }
})

bot.launch();
