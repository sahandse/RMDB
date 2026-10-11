// Optional, rate-limited OMDb lookup. API key is never committed or bundled for browsers.
// Respect OMDb's noncommercial and redistribution terms. Store limited verification
// metadata locally only; DO NOT copy OMDb plot/posters/ratings into public CC0 API.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const key=process.env.RMDB_OMDB_API_KEY;
const botToken=process.env.RMDB_TELEGRAM_BOT_TOKEN;
const channel=process.env.RMDB_TELEGRAM_CHANNEL_ID;
if(!key){console.log('OMDb disabled: configure RMDB_OMDB_API_KEY as an Actions secret.');process.exit(0)}
if(!botToken||!/^[-]100\d+$/.test(channel||''))throw Error('Telegram secrets required for OMDb verification archive');
const file=new URL('../data/omdb-match-report.json',import.meta.url);
const curated=JSON.parse(await readFile(new URL('../data/telegram-curated.json',import.meta.url),'utf8'));
let report;
try{report=JSON.parse(await readFile(file,'utf8'))}catch{report={version:1,lookups:{}}}
// Count ALL attempted HTTP calls, including errors, against the per-day account budget.
const budgetFile=new URL('../data/omdb-daily-budget.json',import.meta.url);
const today=new Date().toISOString().slice(0,10);
let budget={date:today,requests:0};
try{const saved=JSON.parse(await readFile(budgetFile,'utf8'));if(saved.date===today&&Number.isInteger(saved.requests)&&saved.requests>=0)budget=saved}catch{}
const dailyMax=1000,perRunMax=4;
const saveBudget=async()=>{await mkdir(new URL('../data/',import.meta.url),{recursive:true});await writeFile(budgetFile,JSON.stringify(budget,null,2)+'\n')};
let done=0,attempted=0;
for(const item of curated.items||[]){
 const imdb=item.imdbId;
 if(attempted>=perRunMax||budget.requests>=dailyMax)break;
 if(!/^tt\d{7,9}$/.test(imdb||'')||report.lookups[imdb])continue;
 const url=new URL('https://www.omdbapi.com/');
 url.searchParams.set('i',imdb);url.searchParams.set('apikey',key);url.searchParams.set('r','json');
 try{
  budget.requests++;attempted++;await saveBudget();
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  // Never print full URL: it contains the secret key.
  if(!response.ok)throw Error('OMDb HTTP '+response.status);
  const data=await response.json();
  if(data.Response!=='True'){console.warn('OMDb did not resolve a title:',imdb);continue}
  if(data.imdbID?.toLowerCase()!==imdb.toLowerCase())throw Error('OMDb ID mismatch');
  const record={matchedId:imdb,originalRecordId:item.id,verifiedAt:new Date().toISOString(),type:data.Type||null,releaseYear:data.Year||null,titleMatches:Boolean(data.Title&&data.Title.toLowerCase()===String(item.titleEn||item.title).toLowerCase()),source:'OMDb identifier cross-check'};
  const form=new FormData();
  form.set('chat_id',channel);
  form.set('caption','RMDB OMDb ID verification · '+imdb+' · '+item.id);
  form.set('document',new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),imdb+'-verified.json');
  const sent=await fetch('https://api.telegram.org/bot'+botToken+'/sendDocument',{method:'POST',body:form,signal:AbortSignal.timeout(25000)});
  const reply=await sent.json();
  if(!sent.ok||!reply.ok)throw Error('Telegram OMDb archive failed: '+(reply.description||sent.status));
  report.lookups[imdb]={...record,telegramMessageId:reply.result.message_id};
  await mkdir(new URL('../data/',import.meta.url),{recursive:true});
  await writeFile(file,JSON.stringify(report,null,2)+'\n');
  done++;
 }catch(e){console.warn('OMDb lookup error for',imdb,':',e.message)}
}
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(file,JSON.stringify(report,null,2)+'\n');
console.log('OMDb verification summary:',JSON.stringify({date:today,requestAttemptsThisRun:attempted,verifiedThisRun:done,requestsToday:budget.requests,dailyLimit:dailyMax,cachedMatches:Object.keys(report.lookups).length}));
