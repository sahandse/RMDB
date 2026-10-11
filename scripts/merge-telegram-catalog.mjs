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
const before={movies:current.movies.length,shows:current.shows.length};
for(const item of curated.items){
 const category=item.source==='TVmaze'&&/^tv-\d+$/.test(item.id)?'shows':item.source==='Wikidata'&&/^wd-Q\d+$/.test(item.id)?'movies':null;
 if(!category||typeof item.title!=='string'||!item.title.trim())continue;
 const entry={id:item.id,title:item.title,titleEn:item.titleEn||null,year:item.year||null,source:item.source};
 for(const field of ['image','rating','genres','summary','imdbId','language','status','network','descriptionFa','descriptionEn','cast','episodes','officialSite','ended','premiered','averageRuntime','type','wikidataId','credits','countries','languages','productionCompanies','releaseDate','runtimeMinutes','entityNames'])if(item[field]!=null)entry[field]=item[field];
 if(category==='movies'&&credits.items?.[item.id]?.image){
  entry.image=credits.items[item.id].image;
  entry.imageCredit=credits.items[item.id];
}
const at=current[category].findIndex(x=>x.id===item.id);
 if(at<0)current[category].push(entry);
 else current[category][at]={...current[category][at],...entry};
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
  for(const [key,val] of Object.entries(x.fields||{}))if(val!==null&&val!==undefined&&val!==''&&!(Array.isArray(val)&&!val.length))target[key]=val;
  target.detailProvider='OMDb';
 }
}
if(!current.shows.length)throw Error('No verified TVmaze series in curated or cached archive');
current.updatedAt=new Date().toISOString();
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(dataFile,JSON.stringify(current,null,2)+'\n');
console.log('RMDB incremental merge',before,'→',{movies:current.movies.length,shows:current.shows.length});
