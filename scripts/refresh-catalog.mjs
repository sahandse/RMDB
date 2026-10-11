// Scheduled, key-free metadata snapshot for GitHub Pages.
// Keep provenance and update timestamps. Do not fabricate missing fields.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const root = new URL('../public/data/', import.meta.url);
const stamp = new Date().toISOString();
const snapshot = {updatedAt:stamp,shows:[],movies:[],people:[],errors:[]};
const request = async (url, headers={}) => {
 const response = await fetch(url,{headers:{Accept:'application/json','User-Agent':'RMDB/0.1 (https://github.com/sahandse/RMDB)',...headers},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
};
try{
 const shows=[];
 for(let page=0;page<20;page++){
  try {const batch=await request('https://api.tvmaze.com/shows?page='+page);if(!Array.isArray(batch)||!batch.length)break;shows.push(...batch);await new Promise(resolve=>setTimeout(resolve,650))}
  catch(e){snapshot.errors.push('TVmaze page '+page+': '+String(e));break}
 }
 snapshot.shows=[...new Map(shows.filter(s=>s.id&&s.name).map(s=>[s.id,s])).values()].map(s=>({id:'tv-'+s.id,title:s.name,year:s.premiered?.slice(0,4)||null,image:s.image?.medium||null,rating:s.rating?.average??null,genres:s.genres||[],source:'TVmaze'}));
}catch(e){snapshot.errors.push('TVmaze: '+String(e))}
try{
 const sparql='SELECT ?film ?filmLabel ?titleEn ?date WHERE { ?film wdt:P31 wd:Q11424; wdt:P577 ?date. FILTER(?date >= "1980-01-01T00:00:00Z"^^xsd:dateTime) OPTIONAL { ?film rdfs:label ?titleEn FILTER(LANG(?titleEn) = "en") } SERVICE wikibase:label { bd:serviceParam wikibase:language "fa,en". } } ORDER BY DESC(?date) LIMIT 700';
 const payload=await request('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(sparql),{Accept:'application/sparql-results+json'});
 snapshot.movies=payload.results.bindings.map(b=>({id:'wd-'+b.film.value.split('/').pop(),title:b.filmLabel?.value||'',titleEn:b.titleEn?.value||null,year:b.date?.value?.slice(0,4)||null,source:'Wikidata'})).filter(m=>m.title&&!/^Q\d+$/.test(m.title));
}catch(e){snapshot.errors.push('Wikidata: '+String(e))}
try {
 const peopleQuery='SELECT ?person ?personLabel ?personEn ?birth WHERE { ?person wdt:P106 wd:Q33999. OPTIONAL { ?person wdt:P569 ?birth. } OPTIONAL { ?person rdfs:label ?personEn FILTER(LANG(?personEn) = "en") } SERVICE wikibase:label { bd:serviceParam wikibase:language "fa,en". } } LIMIT 200';
 const people=await request('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(peopleQuery),{Accept:'application/sparql-results+json'});
 snapshot.people=people.results.bindings.map(x=>({id:x.person.value.split('/').pop(),title:x.personLabel?.value||'',titleEn:x.personEn?.value||null,birth:x.birth?.value?.slice(0,10)||null,source:'Wikidata'})).filter(x=>x.title&&!/^Q\d+$/.test(x.title));
}catch(e){snapshot.errors.push('People: '+String(e))}
// Enrich the on-site people directory with real TVmaze person records.
// These are display-only (TVmaze license), excluded from the CC0 public API.
try{
 const tvPeople=await request('https://api.tvmaze.com/people?page=0');
 if(Array.isArray(tvPeople)){
  const entries=tvPeople.filter(x=>Number.isInteger(x.id)&&x.name).map(x=>({
   id:'tvp-'+x.id,title:x.name,titleEn:x.name,image:x.image?.medium||null,
   birth:x.birthday||null,source:'TVmaze'
  }));
  snapshot.people.push(...entries);
 }
}catch(e){snapshot.errors.push('TVmaze people: '+String(e))}
// Preserve previously verified records when one upstream provider times out.
let previous=null;
try{previous=JSON.parse(await readFile(new URL('catalog.json',root),'utf8'))}catch{}
// A partial upstream page fetch must not silently shrink the published catalog.
if(snapshot.errors.some(e=>e.startsWith('TVmaze page '))&&Array.isArray(previous?.shows)&&previous.shows.length>snapshot.shows.length){
 snapshot.shows=previous.shows;
 snapshot.errors.push('TVmaze: retained full earlier verified show archive');
}
for(const key of ['movies','shows','people']){
 if(!snapshot[key].length&&Array.isArray(previous?.[key])&&previous[key].length){
  snapshot[key]=previous[key];
  snapshot.errors.push(key+': retained previous verified snapshot');
 }
}
// Merge user-approved Telegram records AFTER refresh, without treating messages as evidence.
// Every curated record was resolved against TVmaze/Wikidata before approval.
try{
 const curated=JSON.parse(await readFile(new URL('../data/telegram-curated.json',import.meta.url),'utf8'));
 for(const item of Array.isArray(curated.items)?curated.items:[]){
  const target=item.source==='TVmaze'&&/^tv-\\d+$/.test(item.id)?snapshot.shows:
   item.source==='Wikidata'&&/^wd-Q\\d+$/.test(item.id)?snapshot.movies:null;
  if(target&&typeof item.title==='string'&&item.title.trim()&&!target.some(x=>x.id===item.id)){
   const {id,title,titleEn,year,image,rating,genres,source}=item;
   target.push({id,title,titleEn:titleEn||null,year:year||null,image:image||null,rating:rating??null,genres:genres||[],source});
  }
 }
}catch(e){if(e.code!=='ENOENT')snapshot.errors.push('Curated data: '+String(e))}
if(!snapshot.shows.length){console.error('No TVmaze shows available; retaining existing catalog.');process.exitCode=1}
else{await mkdir(root,{recursive:true});await writeFile(new URL('catalog.json',root),JSON.stringify(snapshot,null,2)+'\n');console.log('Saved verified snapshot',snapshot.shows.length,snapshot.movies.length,snapshot.people.length,snapshot.errors);}
