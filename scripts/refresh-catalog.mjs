// Scheduled, key-free metadata snapshot for GitHub Pages.
// Keep provenance and update timestamps. Do not fabricate missing fields.
import { mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../public/data/', import.meta.url);
const stamp = new Date().toISOString();
const snapshot = {updatedAt:stamp,shows:[],movies:[],errors:[]};
const request = async (url, headers={}) => {
 const response = await fetch(url,{headers:{Accept:'application/json','User-Agent':'RMDB/0.1 (https://github.com/sahandse/RMDB)',...headers},signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.json();
};
try{
 const shows=[];
 for(let page=0;page<5;page++){
  try {const batch=await request('https://api.tvmaze.com/shows?page='+page);if(!Array.isArray(batch)||!batch.length)break;shows.push(...batch)}
  catch(e){snapshot.errors.push('TVmaze page '+page+': '+String(e));break}
 }
 snapshot.shows=shows.filter(s=>s.id&&s.name).map(s=>({id:'tv-'+s.id,title:s.name,year:s.premiered?.slice(0,4)||null,image:s.image?.medium||null,rating:s.rating?.average??null,source:'TVmaze'}));
}catch(e){snapshot.errors.push('TVmaze: '+String(e))}
try{
 const sparql='SELECT ?film ?filmLabel ?date WHERE { ?film wdt:P31 wd:Q11424; wdt:P577 ?date. FILTER(?date >= "1980-01-01T00:00:00Z"^^xsd:dateTime) SERVICE wikibase:label { bd:serviceParam wikibase:language "fa,en". } } ORDER BY DESC(?date) LIMIT 700';
 const payload=await request('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(sparql),{Accept:'application/sparql-results+json'});
 snapshot.movies=payload.results.bindings.map(b=>({id:'wd-'+b.film.value.split('/').pop(),title:b.filmLabel?.value||'',year:b.date?.value?.slice(0,4)||null,source:'Wikidata'})).filter(m=>m.title&&!/^Q\d+$/.test(m.title));
}catch(e){snapshot.errors.push('Wikidata: '+String(e))}
if(!snapshot.shows.length&&!snapshot.movies.length){console.error('No fresh data. Keeping previous snapshot.');process.exitCode=1}
else{await mkdir(root,{recursive:true});await writeFile(new URL('catalog.json',root),JSON.stringify(snapshot,null,2)+'\n');console.log('Saved snapshot',snapshot.shows.length,snapshot.movies.length,snapshot.errors);}
