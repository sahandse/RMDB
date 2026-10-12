// Incrementally cache properly licensed Wikimedia Commons portraits for Wikidata film casts.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const read=async(path,fallback)=>{try{return JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw e}};
const curated=await read('../data/telegram-curated.json',{items:[]});
const manifestPath=new URL('../public/data/person-images.json',import.meta.url);
const manifest=await read('../public/data/person-images.json',{items:{},attempted:{}});
manifest.items||={};manifest.attempted||={};
const actors=[...new Set((curated.items||[]).filter(x=>x.source==='Wikidata').flatMap(x=>x.credits?.cast||[]).filter(x=>/^Q\d+$/.test(x)))];
const candidates=actors.filter(id=>!manifest.items[id]&&!manifest.attempted[id]).slice(0,8);
const clean=x=>String(x||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const headers={'User-Agent':'RMDB/1.0 (https://github.com/sahandse/RMDB)'};
const get=async(url)=>{const r=await fetch(url,{headers,signal:AbortSignal.timeout(16000)});if(!r.ok)throw Error('HTTP '+r.status);return r};
let added=0;
await mkdir(new URL('../public/media/',import.meta.url),{recursive:true});
for(const id of candidates){
 try{
  const entity=await(await get('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+id+'&props=claims&format=json')).json();
  const file=entity.entities?.[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if(typeof file!=='string'){manifest.attempted[id]='No P18 image';continue}
  const qs=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'320',titles:'File:'+file});
  const details=await(await get('https://commons.wikimedia.org/w/api.php?'+qs)).json();
  const record=Object.values(details.query?.pages||{})[0]?.imageinfo?.[0];
  const meta=record?.extmetadata||{};
  const license=clean(meta.LicenseShortName?.value);
  if(!/^(CC0(?: 1\.0)?|Public domain|PD|CC BY (?:3\.0|4\.0)|CC BY-SA (?:3\.0|4\.0))$/i.test(license)){manifest.attempted[id]='License not in allowlist';continue}
  const url=record.thumburl||record.url;
  if(!/^https:\/\/upload\.wikimedia\.org\//.test(url||'')){manifest.attempted[id]='Missing verified Commons URL';continue}
  const response=await get(url);const type=response.headers.get('content-type')||'';
  if(!/^image\/(jpeg|png|webp)$/.test(type)){manifest.attempted[id]='Unsupported image type';continue}
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length>500000){manifest.attempted[id]='Image too large';continue}
  const extension=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
  const name='actor-'+id+'.'+extension;
  await writeFile(new URL('../public/media/'+name,import.meta.url),bytes);
  manifest.items[id]={image:'/RMDB/media/'+name,source:'Wikimedia Commons',sourcePage:record.descriptionurl||null,license,licenseUrl:clean(meta.LicenseUrl?.value),artist:clean(meta.Artist?.value),attribution:clean(meta.Attribution?.value)};
  added++;
 }catch(e){console.warn('Skipped actor image',id,String(e).slice(0,130))}
}
manifest.updatedAt=new Date().toISOString();
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Wikidata film actor portraits: added',added,'checked',candidates.length,'cached',Object.keys(manifest.items).length);
