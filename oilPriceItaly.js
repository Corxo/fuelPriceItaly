const tg = require('telegraf');
const env = require('./env');
const db = require('better-sqlite3')(env.DB_PATH);

const bot = new tg.Telegraf(env.TELEGRAM_KEY);

bot.command('info',ctx=>{
    let data = db.prepare('SELECT * FROM prices LIMIT 5').all();
    ctx.reply(JSON.stringify(data));
})

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