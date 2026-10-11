// Resolve Wikidata entity identifiers into bilingual display labels for the RMDB site.
import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../data/telegram-curated.json',import.meta.url);
const data=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(data.items))throw Error('Invalid curated items');
const fields=['countries','genres','languages','productionCompanies'];
const credits=['directors','cast','writers','producers'];
const films=data.items.filter(x=>x.source==='Wikidata');
const ids=[...new Set(films.flatMap(x=>[...fields.flatMap(k=>x[k]||[]),...credits.flatMap(k=>x.credits?.[k]||[])]).filter(x=>/^Q\d+$/.test(x)))];
const labels={};let batches=0;
for(let i=0;i<ids.length&&batches<12;i+=35,batches++){
 const batch=ids.slice(i,i+35);try{
  const url='https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+batch.join('%7C')+'&props=labels&languages=fa%7Cen&format=json';
  const r=await fetch(url,{headers:{'User-Agent':'RMDB/1.0 (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const entities=(await r.json()).entities||{};
  for(const id of batch){const e=entities[id];if(e?.labels?.en||e?.labels?.fa)labels[id]={fa:e.labels.fa?.value||null,en:e.labels.en?.value||null}}
 }catch(e){console.warn('Entity-label batch unavailable:',e.message)}
}
let updated=0;for(const x of films){const names={};for(const k of fields)names[k]=(x[k]||[]).map(id=>labels[id]||{en:id,fa:id});for(const k of credits)names[k]=(x.credits?.[k]||[]).map(id=>labels[id]||{en:id,fa:id});if(JSON.stringify(names)!==JSON.stringify(x.entityNames)){x.entityNames=names;updated++}}
if(updated)await writeFile(file,JSON.stringify(data,null,2)+'\n');
console.log('Localized Wikidata film metadata:',updated,'records; labels:',Object.keys(labels).length);
