// Cache only Wikidata-linked Wikimedia Commons photographs with verified reuse licenses.
// Do not mirror TVmaze artwork: studios may hold the copyrights.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const src=new URL('../data/telegram-curated.json',import.meta.url);
const out=new URL('../public/media/',import.meta.url);
const manifestFile=new URL('../public/data/image-credits.json',import.meta.url);
const catalog=JSON.parse(await readFile(src,'utf8'));
const previous=await readFile(manifestFile,'utf8').then(JSON.parse).catch(()=>({items:{}}));
const manifest={items:previous.items||{},updatedAt:new Date().toISOString()};
const clean=x=>String(x||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
await mkdir(out,{recursive:true});
for(const item of catalog.items||[]){
 if(item.source!=='Wikidata'||!/^wd-Q\d+$/.test(item.id)||manifest.items[item.id])continue;
 try{
  const qid=item.id.slice(3);
  const request=async(url)=>{const r=await fetch(url,{headers:{'User-Agent':'RMDB image archiver (https://github.com/sahandse/RMDB)'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);return r};
  const entity=await(await request('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+qid+'&props=claims&format=json')).json();
  const filename=entity.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if(typeof filename!=='string')continue;
  const query=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'400',titles:'File:'+filename});
  const info=await(await request('https://commons.wikimedia.org/w/api.php?'+query)).json();
  const page=Object.values(info.query?.pages||{})[0];const details=page?.imageinfo?.[0];const meta=details?.extmetadata||{};
  const license=clean(meta.LicenseShortName?.value);
  // Explicit allowlist; other licenses need human review. Author/credit still preserved.
  if(!/^(CC0(?: 1\.0)?|Public domain|PD|CC BY 4\.0|CC BY-SA 4\.0)$/i.test(license))continue;
  const url=details.thumburl||details.url;
  if(!/^https:\/\/upload\.wikimedia\.org\//.test(url||''))continue;
  const response=await request(url);
  const type=response.headers.get('content-type')||'';
  if(!/^image\/(?:jpeg|png|webp)$/.test(type))continue;
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length>1200000)continue;
  const ext=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
  const local='/RMDB/media/'+qid+'.'+ext;
  await writeFile(new URL(qid+'.'+ext,out),bytes);
  manifest.items[item.id]={image:local,source:'Wikimedia Commons',sourcePage:details.descriptionurl||null,license,licenseUrl:clean(meta.LicenseUrl?.value),artist:clean(meta.Artist?.value),attribution:clean(meta.Attribution?.value)};
 }catch(e){console.warn('Image skipped',item.id,String(e).slice(0,120))}
}
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log('Verified locally hosted Commons images:',Object.keys(manifest.items).length);
