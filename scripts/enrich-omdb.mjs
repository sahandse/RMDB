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
// 8 x 144 ten-minute runs can reach the daily ceiling; never exceed 1000.\nconst dailyMax=1000,perRunMax=8;
const saveBudget=async()=>{await mkdir(new URL('../data/',import.meta.url),{recursive:true});await writeFile(budgetFile,JSON.stringify(budget,null,2)+'\n')};
let done=0,attempted=0;
for(const item of curated.items||[]){
 const imdb=item.imdbId;
 if(attempted>=perRunMax||budget.requests>=dailyMax)break;
 if(!/^tt\d{7,9}$/.test(imdb||'')||report.lookups[imdb])continue;
 const url=new URL('https://www.omdbapi.com/');
 url.searchParams.set('i',imdb);url.searchParams.set('apikey',key);url.searchParams.set('r','json');url.searchParams.set('plot','full');
 try{
  budget.requests++;attempted++;await saveBudget();
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  // Never print full URL: it contains the secret key.
  if(!response.ok)throw Error('OMDb HTTP '+response.status);
  const data=await response.json();
  if(data.Response!=='True'){console.warn('OMDb did not resolve a title:',imdb);continue}
  if(data.imdbID?.toLowerCase()!==imdb.toLowerCase())throw Error('OMDb ID mismatch');
  const record={matchedId:imdb,originalRecordId:item.id,verifiedAt:new Date().toISOString(),type:data.Type||null,releaseYear:data.Year||null,titleMatches:Boolean(data.Title&&data.Title.toLowerCase()===String(item.titleEn||item.title).toLowerCase()),source:'OMDb identifier cross-check',availableFields:Object.fromEntries(['Rated','Released','Runtime','Genre','Director','Writer','Actors','Plot','Language','Country','Awards','Poster','Ratings','Metascore','imdbRating','imdbVotes','BoxOffice','Production','DVD','totalSeasons'].map(field=>[field,data[field]!=null&&data[field]!=='N/A'&&data[field]!==''&&(!Array.isArray(data[field])||data[field].length>0)]))};
  const form=new FormData();
  form.set('chat_id',channel);
  form.set('caption','RMDB OMDb ID verification · '+imdb+' · '+item.id);
  form.set('document',new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),imdb+'-verified.json');
  const sent=await fetch('https://api.telegram.org/bot'+botToken+'/sendDocument',{method:'POST',body:form,signal:AbortSignal.timeout(25000)});
  const reply=await sent.json();
  if(!sent.ok||!reply.ok)throw Error('Telegram OMDb archive failed: '+(reply.description||sent.status));
  if(process.env.RMDB_OMDB_REPUBLICATION_ALLOWED==='true'){
   // Activate only if redistribution/storage rights are confirmed for this project.
   const licensedFile=new URL('../data/omdb-licensed-metadata.json',import.meta.url);
   let licensed={version:1,items:[]};
   try{licensed=JSON.parse(await readFile(licensedFile,'utf8'))}catch{}
   const pick=(k)=>data[k]&&data[k]!=='N/A'?data[k]:null;
   const fields={
    titleEn:pick('Title'),year:pick('Year'),rated:pick('Rated'),released:pick('Released'),
    runtimeText:pick('Runtime'),genresText:pick('Genre'),directorsText:pick('Director'),
    writersText:pick('Writer'),actorsText:pick('Actors'),plot:pick('Plot'),
    languageText:pick('Language'),countryText:pick('Country'),awards:pick('Awards'),
    omdbPoster:pick('Poster'),ratings:Array.isArray(data.Ratings)?data.Ratings:[],
    metascore:pick('Metascore'),imdbRating:pick('imdbRating'),imdbVotes:pick('imdbVotes'),
    boxOffice:pick('BoxOffice'),production:pick('Production'),dvd:pick('DVD'),
    totalSeasons:pick('totalSeasons'),omdbType:pick('Type')
   };
   licensed.items=licensed.items.filter(x=>x.imdbId!==imdb);
   licensed.items.push({imdbId:imdb,fields,license:'CC BY-NC 4.0',verifiedAt:record.verifiedAt});
   await writeFile(licensedFile,JSON.stringify(licensed,null,2)+'\n');
  }
  report.lookups[imdb]={...record,telegramMessageId:reply.result.message_id};
  await mkdir(new URL('../data/',import.meta.url),{recursive:true});
  await writeFile(file,JSON.stringify(report,null,2)+'\n');
  done++;
 }catch(e){console.warn('OMDb lookup error for',imdb,':',e.message)}
}
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(file,JSON.stringify(report,null,2)+'\n');
console.log('OMDb verification summary:',JSON.stringify({date:today,requestAttemptsThisRun:attempted,verifiedThisRun:done,requestsToday:budget.requests,dailyLimit:dailyMax,cachedMatches:Object.keys(report.lookups).length}));
