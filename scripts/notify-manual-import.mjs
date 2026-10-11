// Notify the authenticated Telegram owner only for an explicit inline-button request.
import {readFile} from 'node:fs/promises';
const load=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
let request;
try{request=await load('../data/manual-import-request.json')}catch{process.exit(0)}
const token=process.env.RMDB_TELEGRAM_BOT_TOKEN;
const owner=String(process.env.RMDB_TELEGRAM_OWNER_ID||'');
if(!token||!/^\d+$/.test(owner)||request.chatId!==owner)throw Error('Invalid Telegram owner notification settings');
const catalog=await load('../public/data/catalog.json');
const movies=Array.isArray(catalog.movies)?catalog.movies.length:0;
const shows=Array.isArray(catalog.shows)?catalog.shows.length:0;
const message='✅ انتشار RMDB انجام شد.\n🎬 فیلم‌های قابل نمایش: '+movies+'\n📺 سریال‌های قابل نمایش: '+shows+'\nاین‌ها تعداد کل آرشیو منتشرشده‌اند، نه تعداد افزوده‌شده در همین نوبت.\nhttps://sahandse.github.io/RMDB/';
const response=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:owner,text:message,disable_web_page_preview:true}),signal:AbortSignal.timeout(15000)});
if(!response.ok||(await response.json()).ok!==true)throw Error('Telegram publish notification failed');
console.log('Sent requested RMDB publication summary to authorized owner');
