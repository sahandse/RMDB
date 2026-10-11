// Incrementally archive at most 10 verified films and 10 verified TV series per run.
// Telegram = append-only human-readable record stream; GitHub JSON = independent catalog.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const token=process.env.RMDB_TELEGRAM_BOT_TOKEN,channel=process.env.RMDB_TELEGRAM_CHANNEL_ID;
if(!token||!/^\-100\d+$/.test(channel||''))throw Error('Missing bot token or Telegram channel ID');
const file=new URL('../data/telegram-curated.json',import.meta.url);
const cursorFile=new URL('../data/auto-import-state.json',import.meta.url);
const load=async(u,v)=>{try{return JSON.parse(await readFile(u,'utf8'))}catch(e){if(e.code==='ENOENT')return v;throw e}};
const catalog=await load(file,{version:1,items:[]});
const state=await load(cursorFile,{tvPage:0,movieOffset:0});
if(!Array.isArray(catalog.items))throw Error('Curated catalog is not an array');
const existing=new Set(catalog.items.map(x=>x.id));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url){for(let n=0;n<3;n++){try{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'RMDB/1.0 data synchronization (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(25000)});if(r.status===429||r.status===503){await delay(2500*(n+1));continue}if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}catch(e){if(n===2)throw e;await delay(1600*(n+1))}}}
async function telegram(item){const text='RMDB AUTO · '+item.source+'\n'+JSON.stringify(item);const r=await jsonPost('sendMessage',{chat_id:channel,text,disable_web_page_preview:true});return r.message_id}
async function jsonPost(name,body){const r=await fetch('https://api.telegram.org/bot'+token+'/'+name,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok||!data.ok)throw Error('Telegram '+name+' '+(data.description||r.status));return data.result}
const counts={films:0,shows:0,errors:[]};
const persist=async()=>{await mkdir(new URL('../data/',import.meta.url),{recursive:true});await writeFile(file,JSON.stringify(catalog,null,2)+'\n');await writeFile(cursorFile,JSON.stringify(state,null,2)+'\n')};
async function add(item,type){if(existing.has(item.id))return false;const messageId=await telegram(item);catalog.items.push({...item,telegramMessageId:messageId,addedAt:new Date().toISOString()});existing.add(item.id);counts[type]++;await persist();await delay(650);return true}
try{
 // Stable TVmaze show-index page numbers; page N contains IDs in the N*250 range.
 for(let pages=0;pages<8&&counts.shows<10;pages++){
  const page=state.tvPage;
  let rows;try{rows=await json('https://api.tvmaze.com/shows?page='+page)}catch(e){if(String(e).includes('HTTP 404')){state.tvPage=0;break}throw e}
  if(!Array.isArray(rows)||!rows.length){state.tvPage=0;break}
  for(const s of rows){if(counts.shows>=10)break;if(!Number.isInteger(s.id)||!s.name)continue;
   await add({id:'tv-'+s.id,title:s.name,titleEn:s.name,year:s.premiered?.slice(0,4)||null,image:s.image?.medium||null,rating:s.rating?.average??null,genres:s.genres||[],summary:s.summary||null,language:s.language||null,status:s.status||null,network:s.network?.name||s.webChannel?.name||null,imdbId:s.externals?.imdb||null,source:'TVmaze',license:'CC BY-SA 4.0'},'shows')
  }
  // Revisit same page until all its records are archived. Existing IDs are skipped.
  if(rows.every(s=>existing.has('tv-'+s.id)))state.tvPage++;
  else if(counts.shows<10)state.tvPage++;
  await persist();
 }
}catch(e){counts.errors.push('TVmaze: '+e.message)}
try{
 // Small deterministic Wikidata batches, no IMDb dataset copy or scraping.
 for(let attempts=0;attempts<5&&counts.films<10;attempts++){
  const q='SELECT DISTINCT ?film WHERE { ?film wdt:P31 wd:Q11424. } ORDER BY ?film LIMIT 40 OFFSET '+state.movieOffset;
  const result=await json('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q));
  const rows=result.results?.bindings||[];
  if(!rows.length){state.movieOffset=0;break}
  for(const v of rows){if(counts.films>=10)break;
   const qid=v.film?.value?.split('/').pop();if(!/^Q\d+$/.test(qid)||existing.has('wd-'+qid))continue;
   try{
    const entity=await json('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+qid+'&props=labels%7Cclaims%7Cdescriptions&languages=fa%7Cen&format=json');
    const x=entity.entities?.[qid];if(!x||x.missing!==undefined)continue;
    const claim=(property)=>x.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
    if(!(x.claims?.P31||[]).some(v=>v.mainsnak?.datavalue?.value?.id==='Q11424'))continue;
    const title=x.labels?.fa?.value||x.labels?.en?.value;if(!title)continue;
    const release=claim('P577')?.time;
    const imdbId=claim('P345');
    const id='wd-'+qid;
    await add({id,title,titleEn:x.labels?.en?.value||null,year:typeof release==='string'?release.match(/\d{4}/)?.[0]||null:null,descriptionFa:x.descriptions?.fa?.value||null,descriptionEn:x.descriptions?.en?.value||null,imdbId:typeof imdbId==='string'?imdbId:null,source:'Wikidata',license:'CC0-1.0'},'films')
   }catch(e){counts.errors.push(qid+': '+e.message)}
  }
  // Stay on the current batch while verified records remain unarchived.\n  if(rows.every(v=>existing.has('wd-'+(v.film?.value?.split('/').pop()||'')))||counts.films<10)state.movieOffset+=40;\n  await persist();
 }
}catch(e){counts.errors.push('Wikidata: '+e.message)}
await persist();
console.log(JSON.stringify({addedFilms:counts.films,addedShows:counts.shows,total:catalog.items.length,cursor:state,errors:counts.errors.slice(0,8)}));
