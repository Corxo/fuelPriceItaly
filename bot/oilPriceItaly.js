/**
 * TODO:
 * Add caching system: store the data obtained from the API in /tmp/dataCache.json. When the user send the coords
 * check the cache, if it's older then 2 hours regenerate it, otherwise use it.
 */

import { Telegraf } from 'telegraf';
import {TELEGRAM_KEY, PROXY_URL, TELEGRAM_KEY_DEV, GEOAPIFY_TOKEN} from './env.js'
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import moment from 'moment';

let bot = null;

if(process.argv[2] && process.argv[2] == 'TEST'){
    bot = new Telegraf(TELEGRAM_KEY_DEV);
    console.log("DEV");
}
else{
    bot = new Telegraf(TELEGRAM_KEY);
    console.log("PROD")
}

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
    ctx.reply(`Ciao e grazie per usare il nostro bot!\nInvia la posizione per ricevere il prezzo del carburante dei 5 distrbutori più vicini a te!`);
})

/*bot.command('id',ctx=>{
    console.log(ctx.message)
});


bot.command('carburante',async ctx=>{
    let fuels = {"results":[{"id":"1-x","description":"Benzina"},{"id":"1-1","description":"Benzina (Self)"},{"id":"1-0","description":"Benzina (Servito)"},{"id":"2-x","description":"Gasolio"},{"id":"2-1","description":"Gasolio (Self)"},{"id":"2-0","description":"Gasolio (Servito)"},{"id":"3-x","description":"Metano"},{"id":"3-1","description":"Metano (Self)"},{"id":"3-0","description":"Metano (Servito)"},{"id":"4-x","description":"GPL"},{"id":"4-1","description":"GPL (Self)"},{"id":"4-0","description":"GPL (Servito)"},{"id":"323-x","description":"L-GNC"},{"id":"323-1","description":"L-GNC (Self)"},{"id":"323-0","description":"L-GNC (Servito)"},{"id":"324-x","description":"GNL"},{"id":"324-1","description":"GNL (Self)"},{"id":"324-0","description":"GNL (Servito)"}]};
    ctx.reply("Scegli un carburante:",{
        reply_markup:{
            inline_keyboard: fuels['results'].map(e=>[{text: e['description'], callback_data: 'fuel_'+e['id']}])
        }
    })
})

bot.on('callback_query', ctx=>{
    console.log(ctx['update']['callback_query']['data'])
}) */

bot.use(async ctx=>{
    if(ctx['update']['message']['location']){
        await ctx.reply("Sto cercando...");
        let userCoords = {
            latitude: ctx['update']['message']['location']['latitude'],
            longitude: ctx['update']['message']['location']['longitude']
        }
        try{
            let data = await getInfo(userCoords.latitude, userCoords.longitude);
            data['results'].forEach(e=>{
                e['distance'] = addDistance(
                        {x: userCoords.latitude, y: userCoords.longitude},
                        {x: e['location']['lat'], y: e['location']['lng']} 
                    );
            });
            data['results'].sort((x,y)=>x['distance']-y['distance']);
            
            let markers = [
                `lonlat:${userCoords.longitude},${userCoords.latitude};type:material;color:%231400ff;size:small;icon:person;iconsize:small;textsize:small`
            ];
            let cnt = 0;
            while(cnt < (data['results'].length >= 5 ? 5 : data['results'].length)){
                let reply = "";
                reply += `${cnt+1}) *${data['results'][cnt]['brand']}*\n`;
                let address = `[${data['results'][cnt]['address']}](https://maps.google.it/maps?hl=it&q=${encodeURI(data['results'][cnt]['address'])})`;
                reply += `⛽ ${address} (${data['results'][cnt]['distance'].toFixed(2)} km)\n`;
                let date = moment(data['results'][cnt]['insertDate']);

                let markerColor = '00c512';
                if(moment().diff(date,'days') > 2){
                    reply += `🔴 *Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}*\n`;
                    markerColor = 'ff0000';
                }
                else
                    reply += `🟢 Ultima rilevazione: ${date.format('DD-MM-YYYY HH:mm')}\n`;

                reply += `💶 Prezzi:\n`;
                data['results'][cnt]['fuels'].forEach(e=>reply+=`\t\t\t${e['name']}${e['isSelf'] ? ' (Self): ' : ': '} ${e['price']}€\n`);

                await ctx.replyWithMarkdown(reply,{disable_web_page_preview: true});
                
                markers.push(`lonlat:${data['results'][cnt]['location']['lng']},${data['results'][cnt]['location']['lat']};color:%23${markerColor};size:small;text:${cnt+1}`)
                cnt++;
            }

            let url = `https://maps.geoapify.com/v1/staticmap?width=1000&height=1000&apiKey=${GEOAPIFY_TOKEN}&marker=${markers.join("|")}`;
            ctx.replyWithPhoto(url);

        }
        catch(err){
            ctx.reply("Error");
            console.log(err);
            return;
        }
    }
})

bot.launch();