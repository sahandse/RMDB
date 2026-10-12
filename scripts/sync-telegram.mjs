// GitHub Actions-only Telegram inbox. Never bundle credentials into the website.
// Commands: /add tv-<id>, /add wd-Q<id>, /remove <id>, /status
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const token=process.env.RMDB_TELEGRAM_BOT_TOKEN;
const owner=String(process.env.RMDB_TELEGRAM_OWNER_ID||'');
const channel=String(process.env.RMDB_TELEGRAM_CHANNEL_ID||'');
if(!token||!/^\d+$/.test(owner)||!/^-100\d+$/.test(channel)){console.warn('Telegram inbox not configured; skipping optional bot poll.');process.exit(0)}
const path=new URL('../data/telegram-curated.json',import.meta.url);
const statePath=new URL('../data/telegram-offset.json',import.meta.url);
const load=async(url,fallback)=>{try{return JSON.parse(await readFile(url,'utf8'))}catch{return fallback}};
const current=await load(path,{version:1,items:[]});
const state=await load(statePath,{offset:0});
if(!Array.isArray(current.items)||!Number.isSafeInteger(state.offset))throw Error('Invalid saved Telegram state');
const api=async(method,params)=>{
 const response=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Telegram HTTP '+response.status);
 const json=await response.json();if(!json.ok)throw Error('Telegram API error '+json.error_code);
 return json.result;
};
const reply=async(chat_id,text)=>api('sendMessage',{chat_id,text}).catch(e=>console.error('Reply failed:',e.message));
const fetchJson=async(url)=>{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'RMDB Telegram curator (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Source HTTP '+r.status);return r.json()};
async function verified(id){
 if(/^imdb[: ]tt\d{7,9}$/i.test(id)){
  const imdb=id.match(/tt\d{7,9}/i)[0].toLowerCase();
  // Exact IMDb identifier lookup only. No IMDb page scraping or dataset redistribution.
  try {
   const show=await fetch('https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
   if(show.ok){const found=await show.json();if(found?.id&&found?.externals?.imdb===imdb)return verified('tv-'+found.id)}
  }catch(e){console.warn('TVmaze IMDb lookup:',String(e).slice(0,100))}
  // Wikidata P345 stores cross-references under CC0 terms; verify entity type afterwards.
  const sparql='SELECT ?item WHERE { ?item wdt:P345 "'+imdb+'" . ?item wdt:P31 wd:Q11424 . } LIMIT 2';
  const query=await fetchJson('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(sparql));
  const matches=query?.results?.bindings||[];
  if(matches.length!==1)throw Error('No unique verified film match for '+imdb);
  const qid=matches[0].item?.value?.split('/').pop();
  if(!/^Q\d+$/.test(qid))throw Error('Invalid Wikidata match');
  return verified('wd-'+qid);
 }
 if(/^tv-\d+$/.test(id)){const key=id.slice(3);const v=await fetchJson('https://api.tvmaze.com/shows/'+key);
  if(String(v.id)!==key||!v.name)throw Error('TVmaze identifier mismatch');
  return {id,title:v.name,titleEn:v.name,year:v.premiered?.slice(0,4)||null,image:v.image?.medium||null,rating:v.rating?.average??null,genres:v.genres||[],source:'TVmaze',license:'CC BY-SA 4.0'};
 }
 if(/^wd-Q\d+$/.test(id)){const key=id.slice(3);const v=await fetchJson('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+key+'&props=labels%7Cclaims&languages=fa%7Cen&format=json');
  const e=v.entities?.[key];if(!e||e.missing!==undefined)throw Error('Unknown Wikidata item');
  const instance=(e.claims?.P31||[]).map(x=>x.mainsnak?.datavalue?.value?.id);
  if(!instance.includes('Q11424'))throw Error('Only verified film (Q11424) Wikidata IDs supported');
  const title=e.labels?.fa?.value||e.labels?.en?.value;if(!title)throw Error('No verified title');
  return {id,title,titleEn:e.labels?.en?.value||null,year:null,source:'Wikidata',license:'CC0-1.0'};
 }
 throw Error('Supported formats: tv-123, wd-Q123 or imdb tt0903747');
}
const bot=await api('getMe',{});
console.log('Telegram authentication OK; bot:',bot.username||bot.id,'; owner configured:',Boolean(owner),'channel configured:',Boolean(channel));
const webhook=await api('getWebhookInfo',{});
if(webhook.url)throw Error('Telegram webhook is active; getUpdates polling cannot work. Remove webhook or migrate this bot to webhook delivery.');
const updates=await api('getUpdates',{offset:state.offset,limit:50,timeout:0,allowed_updates:['message','channel_post','callback_query']});
let touched=false;
for(const u of updates){
 if(!Number.isSafeInteger(u.update_id))continue;
 state.offset=Math.max(state.offset,u.update_id+1);touched=true;
 const callback=u.callback_query;
 if(callback){
  const permitted=String(callback.from?.id)===owner&&callback.message?.chat?.type==='private';
  if(!permitted){await api('answerCallbackQuery',{callback_query_id:callback.id,text:'دسترسی مجاز نیست',show_alert:true}).catch(()=>{});continue}
  if(callback.data==='rmdb_import_10_10'){
   await writeFile(new URL('../data/manual-import-request.json',import.meta.url),JSON.stringify({requestedAt:new Date().toISOString(),chatId:String(callback.message.chat.id),request:'10 movies and 10 series'})+'\n');
   await api('answerCallbackQuery',{callback_query_id:callback.id,text:'درخواست دریافت شد؛ نتیجه پس از اجرای واردکننده مشخص می‌شود.'});
   await reply(callback.message.chat.id,'🎬 درخواست ۱۰ فیلم و ۱۰ سریال ثبت شد. این Workflow واردکننده را در همین اجرا فراخوانی می‌کند؛ تعداد نهایی به آثار معتبر و نتیجه انتشار بستگی دارد.');
  }else await api('answerCallbackQuery',{callback_query_id:callback.id,text:'دکمه ناشناخته'}).catch(()=>{});
  continue;
 }
 const m=u.message||u.channel_post;
 const privateOwner=m?.chat?.type==='private'&&String(m.from?.id)===owner;
 const approvedChannel=m?.chat?.type==='channel'&&String(m.chat.id)===channel;
 if(!privateOwner&&!approvedChannel){
  if(m?.chat?.type==='private'&&/^\/(?:start|menu|help)(?:@\w+)?(?:\s|$)/i.test(String(m.text||''))){
   await reply(m.chat.id,'⚠️ این حساب به‌عنوان مدیر RMDB شناخته نشد.\nشناسه عددی تلگرام شما: '+m.from?.id+'\nمقدار Secret با نام RMDB_TELEGRAM_OWNER_ID در GitHub باید دقیقاً همین عدد باشد.');
   console.warn('RMDB owner mismatch for private start; confirm OWNER_ID secret');
  }
  continue;
 }
 // Ignore bot-authored channel messages to prevent re-import loops.
 if(approvedChannel&&(m.from?.id===bot.id||m.sender_chat?.id===m.chat.id&&/^(RMDB approved record|RMDB AUTO|RMDB imported)/.test(m.text||m.caption||'')))continue;
 const text=String(m.text||m.caption||'').trim();
 const imdbLink=text.match(/https?:\/\/(?:www\.|m\.)?imdb\.com\/(?:title|[a-z]{2}\/[a-z]{2}\/title)\/(tt\d{7,9})(?:[/?#]|$)/i);
 const directImdb=text.match(/^tt\d{7,9}$/i);
 const importId=imdbLink?'imdb '+imdbLink[1]:directImdb?'imdb '+directImdb[0]:null;
 console.log('Authorized command:',text.split(' ')[0]||'(none)');
 if(privateOwner&&(/^\/(?:start|help|menu)(?:@\w+)?(?:\s|$)/i.test(text))){await api('sendMessage',{chat_id:m.chat.id,text:'🎬 مدیریت RMDB\nبرای درخواست واردکردن یک نوبت جدید، روی دکمه زیر بزن.\nدستورهای دیگر: /status ، /add ، /remove',reply_markup:{inline_keyboard:[[{text:'🎬 افزودن ۱۰ فیلم و ۱۰ سریال',callback_data:'rmdb_import_10_10'}]]}});continue}
 if(privateOwner&&text==='/status'){await reply(m.chat.id,'تعداد رکوردهای آرشیوشده: '+current.items.length+'\nبرای بازکردن دکمه واردکننده: /menu');continue}
 try{
  if(importId||text.startsWith('/add ')){
   const id=importId||text.slice(5).trim();
   const item=await verified(id);
   if(current.items.some(x=>x.id===item.id)){if(privateOwner)await reply(m.chat.id,'Already saved: '+item.id);continue}
   // Telegram channel acts as a durable human-readable audit of approved entries.
   await api('sendMessage',{chat_id:channel,text:'RMDB approved record\n'+JSON.stringify(item),disable_web_page_preview:true});
   current.items.push(item);touched=true;if(privateOwner)await reply(m.chat.id,'Saved: '+item.title+' ('+item.id+')');
  }else if(privateOwner&&text.startsWith('/remove ')){
   const id=text.slice(8).trim();if(!/^(tv-\d+|wd-Q\d+)$/.test(id))throw Error('Invalid ID');
   const n=current.items.length;current.items=current.items.filter(x=>x.id!==id);
   if(current.items.length!==n){await api('sendMessage',{chat_id:channel,text:'RMDB removal: '+id});touched=true}
   await reply(m.chat.id,n===current.items.length?'Not found':'Removed: '+id);
  }else if(privateOwner&&text.startsWith('/'))await reply(m.chat.id,'Unknown command. Send /help.');
 }catch(e){console.error('Telegram command failed:',e.message);if(privateOwner)await reply(m.chat.id,'Failed: '+e.message)}
}
if(!updates.length)console.log('No pending bot messages; send /start or /add in a PRIVATE chat with this bot.');
if(touched){await mkdir(new URL('../data/',import.meta.url),{recursive:true});await writeFile(path,JSON.stringify(current,null,2)+'\n');await writeFile(statePath,JSON.stringify(state,null,2)+'\n');}
console.log('Processed Telegram inbox updates:',updates.length,'; approved records:',current.items.length);
