// Merge Telegram-curated records into the independent site snapshot without erasing older titles.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dataFile=new URL('../public/data/catalog.json',import.meta.url);
const curatedFile=new URL('../data/telegram-curated.json',import.meta.url);
const load=async(u,fallback)=>{try{return JSON.parse(await readFile(u,'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}};
const current=await load(dataFile,{updatedAt:null,movies:[],shows:[],people:[],errors:[]});
const curated=await load(curatedFile,{items:[]});
for(const key of ['movies','shows','people'])if(!Array.isArray(current[key]))current[key]=[];
if(!Array.isArray(curated.items))throw Error('Invalid Telegram catalog');
const before={movies:current.movies.length,shows:current.shows.length};
for(const item of curated.items){
 const category=item.source==='TVmaze'&&/^tv-\d+$/.test(item.id)?'shows':item.source==='Wikidata'&&/^wd-Q\d+$/.test(item.id)?'movies':null;
 if(!category||typeof item.title!=='string'||!item.title.trim())continue;
 const entry={id:item.id,title:item.title,titleEn:item.titleEn||null,year:item.year||null,source:item.source};
 for(const field of ['image','rating','genres','summary','imdbId','language','status','network','descriptionFa','descriptionEn'])if(item[field]!=null)entry[field]=item[field];
 const at=current[category].findIndex(x=>x.id===item.id);
 if(at<0)current[category].push(entry);
 else current[category][at]={...current[category][at],...entry};
}
if(!current.shows.length)throw Error('No verified TVmaze series in curated or cached archive');
current.updatedAt=new Date().toISOString();
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(dataFile,JSON.stringify(current,null,2)+'\n');
console.log('RMDB incremental merge',before,'→',{movies:current.movies.length,shows:current.shows.length});
