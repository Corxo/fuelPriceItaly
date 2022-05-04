/**
 * TODO:
 * Add caching system: store the data obtained from the API in /tmp/dataCache.json. When the user send the coords
 * check the cache, if it's older then 2 hours regenerate it, otherwise use it.
 */

import { Telegraf, Telegram } from 'telegraf';
import {TELEGRAM_KEY, PROXY_URL, TELEGRAM_KEY_DEV} from './env.js'
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import moment from 'moment';
import StaticMaps from 'staticmaps';
import { Readable } from 'stream'

const bot = new Telegraf(TELEGRAM_KEY_DEV);

const getInfo = async (lat,log)=>{
    if(!lat || !log)
        throw Error("Missing latitude or longitude");
    let body = {"points": [{lat: lat, lng: log}]};
    let proxy = new HttpsProxyAgent(PROXY_URL);
    try{
        let call = await fetch(
            "https://carburanti.mise.gov.it/ospzApi/search/zone", {
                "headers": {
                    "accept": "application/json",
                    "accept-language": "it-IT,it;q=0.9,en-GB;q=0.8,en;q=0.7",
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "sec-gpc": "1",
                    "cookie": "cookies_consent=true",
                    "Referer": "https://carburanti.mise.gov.it/ospzSearch/zona",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "agent": proxy,
                "body": JSON.stringify(body),
                "method": "POST"
            }
        );
        return call.json();
    }
    catch(err){
        throw err;
    }
}

function addDistance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    
    function toRadians(value) {
        return value * Math.PI / 180
    }

    var R = 6371.0710
    var rlat1 = toRadians(x1) // Convert degrees to radians
    var rlat2 = toRadians(x2) // Convert degrees to radians
    var difflat = rlat2 - rlat1 // Radian difference (latitudes)
    var difflon = toRadians(y2 - y1) // Radian difference (longitudes)
    return 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)))
}

bot.command('start',ctx=>{
    ctx.reply(`Ciao e grazie per usare il nostro bot!\nInvia la posizione per ricevere il prezzo del carburante dei 5 distrbutori più vicini a te!`)
})

bot.use(async ctx=>{
    if(ctx['update']['message']['location']){
        ctx.reply("Sto cercando...");
        //TODO let timeout = setTimeout(()=>{},5000);
        try{
            let data = await getInfo(ctx['update']['message']['location']['latitude'], ctx['update']['message']['location']['longitude']);
            data['results'].forEach(e=>{
                e['distance'] = addDistance(
                        {x: ctx['update']['message']['location']['latitude'], y: ctx['update']['message']['location']['longitude']},
                        {x: e['location']['lat'], y: e['location']['lng']} 
                    );
            });
            data['results'].sort((x,y)=>x['distance']-y['distance']);
            

            let options = {width: 600,height: 400};
            let map = new StaticMaps(options);
            let marker = {img: `/home/cri/Cloud/Progetti/oilPrice/bot/marker.png`, width: 48, height: 48}
            let cnt = 0;
            while(cnt < (data['results'].length >= 5 ? 5 : data['results'].length)){
                let reply = "";
                reply += `*${data['results'][cnt]['brand']}*\n`;
                let address = `[${data['results'][cnt]['address']}](https://maps.google.it/maps?hl=it&q=${encodeURI(data['results'][cnt]['address'])})`;
                reply += `⛽ ${address} (${data['results'][cnt]['distance'].toFixed(2)} km)\n`;
                let date = moment(data['results'][cnt]['insertDate']);
                if(moment().diff(date,'days') > 2)
                    reply += `🔴 *Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}*\n`;
                else
                    reply += `🟢 Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}\n`;
                reply += `💶 Prezzi:\n`;
                data['results'][cnt]['fuels'].forEach(e=>reply+=`\t\t\t${e['name']}${e['isSelf'] ? ' (Self): ' : ': '} ${e['price']}€\n`);
                await ctx.replyWithMarkdown(reply,{disable_web_page_preview: true});

                map.addMarker({
                    coord: [data['results'][cnt]['location']['lat'], data['results'][cnt]['location']['lng']],
                    ...marker
                });
                cnt++;
            }
            await map.render();
            let buf = await map.image.buffer('image/png',{quality: 75});
            //ctx.replyWithPhoto(Readable.from(buf.toString()));
            ctx.replyWithPhoto({
                source: Buffer.from(buf, 'base64')
            });

        }
        catch(err){
            ctx.reply("Error");
            console.log(err);
            return;
        }
    }
})

bot.launch();