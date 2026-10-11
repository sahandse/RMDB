// Diagnostics only: never erase catalog records based on an outage.
import {mkdir,writeFile} from 'node:fs/promises';
const sources=[
 {name:'TVmaze',url:'https://api.tvmaze.com/shows/1',validate:d=>d?.id===1&&typeof d.name==='string'},
 {name:'Wikidata Entity API',url:'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q42&props=labels&languages=en&format=json',validate:d=>Boolean(d?.entities?.Q42?.labels?.en?.value)},
 {name:'Wikidata SPARQL',url:'https://query.wikidata.org/sparql?query='+encodeURIComponent('SELECT (COUNT(*) AS ?count) WHERE { wd:Q42 ?p ?o }')+'&format=json',validate:d=>Array.isArray(d?.results?.bindings)},
 {name:'Wikipedia',url:'https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json',validate:d=>Boolean(d?.query?.general)},
 {name:'Wikimedia Commons',url:'https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&format=json',validate:d=>Boolean(d?.query?.general)}
];
const records=await Promise.all(sources.map(async s=>{try{const r=await fetch(s.url,{headers:{Accept:'application/json','User-Agent':'RMDB metadata monitor (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(14000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!s.validate(data))throw Error('Unexpected response');return {name:s.name,reachable:true,status:'responded'};}catch(e){return {name:s.name,reachable:false,status:String(e).slice(0,160)};}}));
const report={checkedAt:new Date().toISOString(),note:'Point-in-time network probe; failure does not prove discontinuation or revoke any source.',sources:records};
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(new URL('../public/data/sources-health.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(records.map(x=>x.name+': '+(x.reachable?'OK':x.status)).join('\n'));
