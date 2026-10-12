// Merge Telegram-curated records into the independent site snapshot without erasing older titles.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dataFile=new URL('../public/data/catalog.json',import.meta.url);
const curatedFile=new URL('../data/telegram-curated.json',import.meta.url);
const load=async(u,fallback)=>{try{return JSON.parse(await readFile(u,'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}};
let current=await load(dataFile,null);
if(!current){
 try{
  const r=await fetch('https://sahandse.github.io/RMDB/data/catalog.json',{signal:AbortSignal.timeout(15000)});
  if(r.ok){const previous=await r.json();if(Array.isArray(previous.shows)&&Array.isArray(previous.movies)){current=previous;console.log('Preserving existing published catalog');}}
 }catch(e){console.warn('Published catalog not accessible:',e.message)}
}
if(!current)current={updatedAt:null,movies:[],shows:[],people:[],errors:[]};
const curated=await load(curatedFile,{items:[]});
for(const key of ['movies','shows','people'])if(!Array.isArray(current[key]))current[key]=[];
if(!Array.isArray(curated.items))throw Error('Invalid Telegram catalog');
const credits=await load(new URL('../public/data/image-credits.json',import.meta.url),{items:{}});
const actorImages=await load(new URL('../public/data/person-images.json',import.meta.url),{items:{}});
const before={movies:current.movies.length,shows:current.shows.length};
for(const item of curated.items){
 const category=item.source==='TVmaze'&&/^tv-\d+$/.test(item.id)?'shows':item.source==='Wikidata'&&/^wd-Q\d+$/.test(item.id)?'movies':null;
 if(!category||typeof item.title!=='string'||!item.title.trim())continue;
 const entry={id:item.id,title:item.title,titleEn:item.titleEn||null,year:item.year||null,source:item.source};
 for(const field of ['image','rating','genres','summary','imdbId','language','status','network','descriptionFa','descriptionEn','cast','episodes','officialSite','ended','premiered','averageRuntime','type','wikidataId','credits','countries','languages','productionCompanies','releaseDate','runtimeMinutes','entityNames','gallery'])if(item[field]!=null)entry[field]=item[field];
 if(category==='movies'&&Array.isArray(item.credits?.cast)){
  const castNames=item.entityNames?.cast||[];
  const people=item.credits.cast.map((qid,index)=>({id:qid,name:castNames[index]?.fa||castNames[index]?.en||null,character:null,image:actorImages.items?.[qid]?.image||null,imageCredit:actorImages.items?.[qid]||null})).filter(a=>/^Q\d+$/.test(a.id)&&a.name&&!/^Q\d+$/.test(a.name)).slice(0,30);
  if(people.length)entry.cast=people;
 }
 if(category==='movies'&&credits.items?.[item.id]?.image){
  entry.image=credits.items[item.id].image;
  entry.imageCredit=credits.items[item.id];
}
const at=current[category].findIndex(x=>x.id===item.id);
 if(at<0)current[category].push(entry);
 else {
  // A partial follow-up record must never erase previously verified metadata.
  const previous=current[category][at];
  const additions=Object.fromEntries(Object.entries(entry).filter(([key,value])=>key==='id'||key==='source'||(value!==null&&value!==undefined&&value!==''&&(!Array.isArray(value)||value.length>0))));
  current[category][at]={...previous,...additions};
 }
}
// Licensed OMDb snapshot takes precedence only if the site operator has confirmed
// appropriate republication rights. Otherwise TVmaze/Wikidata remain public sources.
const licensed=process.env.RMDB_OMDB_REPUBLICATION_ALLOWED==='true';
if(licensed){
 const supplemental=await load(new URL('../data/omdb-licensed-metadata.json',import.meta.url),{items:[]});
 for(const x of supplemental.items||[]){
  if(!/^tt\d{7,9}$/.test(x.imdbId||''))continue;
  const all=[...current.movies,...current.shows];
  const target=all.find(v=>v.imdbId===x.imdbId);
  if(!target)continue;
  for(const [key,val] of Object.entries(x.fields||{}))if(val!==null&&val!==undefined&&val!==''&&!(Array.isArray(val)&&!val.length)){
   // Preserve the Wikidata or TVmaze display identity and existing archive history.
   if(['id','source','license','imdbId','imageCredit','addedAt','telegramMessageId'].includes(key))continue;
   target[key]=val;
  }
  // The generic OMDb poster field is kept separate from the public artwork slot.\n  // Publish it only when explicit republication rights have been confirmed.\n  if(process.env.RMDB_OMDB_POSTER_RIGHTS_GRANTED==='true' && typeof x.fields?.omdbPoster==='string' && /^https:\/\//.test(x.fields.omdbPoster) && (!target.image || !target.image.startsWith('/RMDB/media/'))){target.image=x.fields.omdbPoster;target.imageCredit={source:'OMDb',license:'Requires separately verified poster redistribution rights'};}\n  if(typeof x.fields?.imdbRating==='string'&&/^\d(?:\.\d)?$|^10(?:\.0)?$/.test(x.fields.imdbRating))target.rating=Number(x.fields.imdbRating);
  target.detailProvider='OMDb';
 }
}
// Publish authentic catalog records even when a poster or extended synopsis is
// still unavailable. The UI uses its existing neutral missing-poster presentation.
// Never invent metadata or bypass provider attribution and licensing.
const present=x=>typeof x==='string'&&x.trim().length>0;
const allowedId=x=>(x.source==='Wikidata'&&/^wd-Q\d+$/.test(x.id))||(x.source==='TVmaze'&&/^tv-\d+$/.test(x.id));
const publishable=x=>allowedId(x)&&present(x.title);
const hidden={movies:current.movies.length,shows:current.shows.length};
current.movies=current.movies.filter(publishable);
current.shows=current.shows.filter(publishable);
current.qualityGate={requires:['verified provider ID','nonempty title'],excluded:{movies:hidden.movies-current.movies.length,shows:hidden.shows-current.shows.length},notice:'Missing metadata remains missing; no demo or fabricated entries.'};
console.log('RMDB catalog publication:',JSON.stringify({movies:current.movies.length,shows:current.shows.length,qualityGate:current.qualityGate}));

current.updatedAt=new Date().toISOString();
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(dataFile,JSON.stringify(current,null,2)+'\n');
console.log('RMDB incremental merge',before,'→',{movies:current.movies.length,shows:current.shows.length});
