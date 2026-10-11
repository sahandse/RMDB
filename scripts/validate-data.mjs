import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('public/data/catalog.json','utf8'));
const valid=(items,prefix,source)=>{
 if(!Array.isArray(items))throw Error(source+' list missing');
 const ids=new Set();
 for(const x of items){
  if(typeof x.id!=='string'||!x.id.startsWith(prefix)||x.source!==source||typeof x.title!=='string'||!x.title.trim())throw Error('Invalid provenance or title in '+source+' record '+String(x.id));
  if(ids.has(x.id))throw Error('Duplicate '+source+' ID '+x.id);ids.add(x.id);
 }
 return ids.size;
};
const shows=valid(data.shows,'tv-','TVmaze');
const movies=valid(data.movies,'wd-Q','Wikidata');
if(!shows)throw Error('Empty TVmaze catalog');
const people=Array.isArray(data.people)?data.people:[];
for(const p of people){if(!p.id||!p.title||!['TVmaze','Wikidata'].includes(p.source))throw Error('Invalid person record')}
const publicIndex=JSON.parse(readFileSync('public/api/v1/index.json','utf8'));
const apiMovies=JSON.parse(readFileSync('public/api/v1/movies.json','utf8'));
const apiPeople=JSON.parse(readFileSync('public/api/v1/people.json','utf8'));
if(publicIndex.license!=='CC0-1.0'||apiMovies.items.some(x=>x.source!=='Wikidata'||x.license!=='CC0-1.0')||apiPeople.items.some(x=>x.source!=='Wikidata'||x.license!=='CC0-1.0'))throw Error('Public API includes non-CC0 data');
if(apiMovies.count!==apiMovies.items.length||apiPeople.count!==apiPeople.items.length)throw Error('API count mismatch');
console.log('Verified source IDs and CC0 API separation:',shows,'shows',movies,'movies',people.length,'people');
