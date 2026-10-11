// Human-readable health summary for GitHub Actions; only verified catalog facts.
import {readFile,writeFile} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const catalog=await read('../public/data/catalog.json');
const curated=await read('../data/telegram-curated.json');
const films=catalog.movies||[],shows=catalog.shows||[];
const all=[...films,...shows];
const filled=k=>all.filter(x=>x[k]!==undefined&&x[k]!==null&&x[k]!==''&&(!Array.isArray(x[k])||x[k].length>0)).length;
const lines=[
 '# RMDB data sync report',
 '',
 '| Metric | Value |',
 '|---|---:|',
 '| Telegram archived records | '+curated.items.length+' |',
 '| Site films | '+films.length+' |',
 '| Site TV series | '+shows.length+' |',
 '| Has image | '+filled('image')+' |',
 '| Has IMDb reference | '+filled('imdbId')+' |',
 '| Has description or summary | '+all.filter(x=>x.summary||x.descriptionFa||x.descriptionEn).length+' |',
 '| Series with cast | '+shows.filter(x=>Array.isArray(x.cast)&&x.cast.length).length+' |',
 '| Series with episodes | '+shows.filter(x=>Array.isArray(x.episodes)&&x.episodes.length).length+' |',
 '| Images hosted by RMDB | '+all.filter(x=>typeof x.image==='string'&&x.image.startsWith('/RMDB/media/')).length+' |'
];
const report=lines.join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,report,{flag:'a'});
console.log(report);
