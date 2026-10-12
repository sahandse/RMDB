// Update missing real TVmaze actor portraits for existing RMDB shows.
// Do not invent portrait URLs or replace portraits already verified.
import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../data/telegram-curated.json',import.meta.url);
const data=JSON.parse(await readFile(file,'utf8'));
const eligible=(data.items||[]).filter(x=>x.source==='TVmaze'&&/^tv-\d+$/.test(x.id)&&Array.isArray(x.cast)&&x.cast.length&&x.cast.some(y=>!y.image));
const stateFile=new URL('../data/actor-photo-state.json',import.meta.url);
let cursor=0;
try{const state=JSON.parse(await readFile(stateFile,'utf8'));if(Number.isInteger(state.cursor))cursor=state.cursor}catch{}
const start=eligible.length?cursor%eligible.length:0;
const candidates=Array.from({length:Math.min(8,eligible.length)},(_,i)=>eligible[(start+i)%eligible.length]);
let showsUpdated=0,photosAdded=0;
for(const item of candidates){
 try{
  const r=await fetch('https://api.tvmaze.com/shows/'+item.id.slice(3)+'/cast',{headers:{Accept:'application/json','User-Agent':'RMDB/1.0 (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(18000)});
  if(!r.ok)throw Error('HTTP '+r.status);
  const cast=await r.json();
  if(!Array.isArray(cast))continue;
  const people=new Map(cast.map(v=>[v.person?.id,v.person?.image?.medium||null]));
  let changed=false;
  for(const person of item.cast){
   const portrait=people.get(person.id);
   if(!person.image&&typeof portrait==='string'&&/^https:\/\//.test(portrait)){person.image=portrait;changed=true;photosAdded++;}
  }
  if(changed)showsUpdated++;
 }catch(e){console.warn('Actor photo refresh skipped',item.id,String(e).slice(0,100))}
}
if(photosAdded)await writeFile(file,JSON.stringify(data,null,2)+'\n');
await writeFile(stateFile,JSON.stringify({cursor:cursor+candidates.length,checkedAt:new Date().toISOString()},null,2)+'\n');
console.log(JSON.stringify({showsChecked:candidates.length,showsUpdated,photosAdded,source:'TVmaze'}));
