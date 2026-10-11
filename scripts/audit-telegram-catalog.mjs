// Deterministic health report for real Telegram-imported media, no demo entries.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const from=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const curated=await from('../data/telegram-curated.json');
const catalog=await from('../public/data/catalog.json');
const ids=new Set(),dupes=[];
for(const item of curated.items||[]){if(ids.has(item.id))dupes.push(item.id);ids.add(item.id)}
if(dupes.length)throw Error('Duplicate Telegram IDs: '+dupes.slice(0,10).join(', '));
const all=[...(catalog.movies||[]),...(catalog.shows||[])];
const siteIds=new Set(all.map(x=>x.id));
const missing=(curated.items||[]).filter(x=>!siteIds.has(x.id)).map(x=>x.id);
// Records excluded by the public quality gate remain safely in the archive.\nconsole.log('Unpublished archive records awaiting enrichment:',missing.length);
const byType=t=>(curated.items||[]).filter(x=>x.source===t);
const tv=byType('TVmaze'),films=byType('Wikidata');
const stats=items=>({total:items.length,withPoster:items.filter(x=>typeof x.image==='string'&&x.image.length>0).length,withImdb:items.filter(x=>/^tt\d{7,9}$/.test(x.imdbId||'')).length,withSummary:items.filter(x=>Boolean(x.summary||x.descriptionFa||x.descriptionEn)).length});
const report={updatedAt:new Date().toISOString(),telegram:{...stats(curated.items||[]),channelMessages:(curated.items||[]).filter(x=>Number.isInteger(x.telegramMessageId)).length},films:stats(films),series:{...stats(tv),withCast:tv.filter(x=>x.cast?.length).length,withEpisodes:tv.filter(x=>x.episodes?.length).length},site:{films:(catalog.movies||[]).length,series:(catalog.shows||[]).length,awaitingEnrichment:missing.length},notes:'Counts describe verified available metadata, not guaranteed completeness for all titles.'};
const out=new URL('../public/data/import-health.json',import.meta.url);
await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log('RMDB Telegram import integrity:',JSON.stringify(report));
