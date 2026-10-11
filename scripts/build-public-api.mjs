// Publish versioned, static, CC0-only API snapshots from verified Wikidata records.
// GitHub Pages serves these files; this is not a dynamic, rate-limited API.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dir=new URL('../public/api/v1/',import.meta.url);
const input=JSON.parse(await readFile(new URL('../public/data/catalog.json',import.meta.url),'utf8'));
const unique=(items,prefix)=>[...new Map((Array.isArray(items)?items:[]).filter(x=>typeof x.id==='string'&&x.id.startsWith(prefix)&&typeof x.title==='string'&&x.title.trim()).map(x=>[x.id,x])).values()];
const movies=unique(input.movies,'wd-Q').map(x=>({id:x.id,wikidataId:x.id.slice(3),title:{display:x.title,en:x.titleEn||null},year:x.year||null,descriptionFa:x.descriptionFa||null,descriptionEn:x.descriptionEn||null,imdbId:x.imdbId||null,credits:x.credits||null,genres:x.genres||[],countries:x.countries||[],languages:x.languages||[],productionCompanies:x.productionCompanies||[],releaseDate:x.releaseDate||null,runtimeMinutes:x.runtimeMinutes||null,source:'Wikidata',license:'CC0-1.0'}));
const people=unique(input.people,'Q').map(x=>({id:'wd-'+x.id,wikidataId:x.id,title:{display:x.title,en:x.titleEn||null},born:x.birth||null,source:'Wikidata',license:'CC0-1.0'}));
// Empty CC0 lists are honest; do not misclassify TVmaze series as films.
const updatedAt=input.updatedAt||new Date().toISOString();
const emit=async(name,body)=>writeFile(new URL(name,dir),JSON.stringify(body,null,2)+'\n');
await mkdir(dir,{recursive:true});
await emit('movies.json',{version:'v1',updatedAt,license:'CC0-1.0',source:'Wikidata',count:movies.length,items:movies});
await emit('people.json',{version:'v1',updatedAt,license:'CC0-1.0',source:'Wikidata',count:people.length,items:people});
await emit('index.json',{name:'RMDB Public Data',version:'v1',updatedAt,base:'/RMDB/api/v1/',license:'CC0-1.0',source:'Wikidata',endpoints:['movies.json','people.json'],notice:'This read-only static snapshot contains only CC0 Wikidata records. TVmaze and media files are excluded.'});
console.log('Created CC0 public snapshot:',movies.length,'movies,',people.length,'people');
