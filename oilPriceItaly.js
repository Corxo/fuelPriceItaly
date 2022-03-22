import { Telegraf, Telegram } from 'telegraf';
import {TELEGRAM_KEY} from './env.js'
import fetch from 'node-fetch';

const bot = new Telegraf(TELEGRAM_KEY);

const getInfo = async (lat,log)=>{
    if(!lat || !log)
        throw "Missing latitude or longitude";
    let body = {"points": [{lat: lat, lng: log}]};
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
                "body": JSON.stringify(body),
                "method": "POST"
            }
        );
        return call.text();
    }
    catch(err){
        throw err;
    }
}

/* async function test(){
    console.log(await getInfo(41.890546, 12.49425));
}
test(); */

bot.command('nearme',ctx=>{
    //GET POSITION AND RETURN CLOSEST STATIONS SORTED BY PRICE
    if(!ctx['update']['message']['location']){
        ctx.reply('Missing coordinates!');
        return;
    }
})

bot.use(ctx=>{
    console.log(ctx);
    if(ctx['update']['message']['location'])
        console.log(ctx['update']['message']['location']);
    ctx.reply('test');
})

bot.launch();