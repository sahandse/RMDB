// Optional, rate-limited OMDb lookup. API key is never committed or bundled for browsers.
// Respect OMDb's noncommercial and redistribution terms. Store limited verification
// metadata locally only; DO NOT copy OMDb plot/posters/ratings into public CC0 API.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const key=process.env.RMDB_OMDB_API_KEY;
if(!key){console.log('OMDb disabled: configure RMDB_OMDB_API_KEY as an Actions secret.');process.exit(0)}
const file=new URL('../data/omdb-match-report.json',import.meta.url);
const curated=JSON.parse(await readFile(new URL('../data/telegram-curated.json',import.meta.url),'utf8'));
let report;
try{report=JSON.parse(await readFile(file,'utf8'))}catch{report={version:1,lookups:{}}}
let done=0;
for(const item of curated.items||[]){
 const imdb=item.imdbId;
 if(done>=2)break; // <= 576 requests per 24h at a strict 5-minute schedule.
 if(!/^tt\d{7,9}$/.test(imdb||'')||report.lookups[imdb])continue;
 const url=new URL('https://www.omdbapi.com/');
 url.searchParams.set('i',imdb);url.searchParams.set('apikey',key);url.searchParams.set('r','json');
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  // Never print full URL: it contains the secret key.
  if(!response.ok)throw Error('OMDb HTTP '+response.status);
  const data=await response.json();
  if(data.Response!=='True'){console.warn('OMDb did not resolve a title:',imdb);continue}
  if(data.imdbID?.toLowerCase()!==imdb.toLowerCase())throw Error('OMDb ID mismatch');
  report.lookups[imdb]={matchedId:imdb,originalRecordId:item.id,verifiedAt:new Date().toISOString(),type:data.Type||null,releaseYear:data.Year||null,titleMatches:Boolean(data.Title&&data.Title.toLowerCase()===String(item.titleEn||item.title).toLowerCase())};
  done++;
 }catch(e){console.warn('OMDb lookup error for',imdb,':',e.message)}
}
await mkdir(new URL('../data/',import.meta.url),{recursive:true});
await writeFile(file,JSON.stringify(report,null,2)+'\n');
console.log('OMDb ID verification requests completed:',done,'; cached matches:',Object.keys(report.lookups).length);
