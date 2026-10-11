// Integrity test for Telegram -> independent RMDB catalog -> CC0 public API.
import {readFile} from 'node:fs/promises';
const load=async x=>JSON.parse(await readFile(new URL(x,import.meta.url),'utf8'));
const curated=await load('../data/telegram-curated.json');
const site=await load('../public/data/catalog.json');
const api=await load('../public/api/v1/movies.json');
if(!Array.isArray(curated.items)||!Array.isArray(site.movies)||!Array.isArray(site.shows)||!Array.isArray(api.items))throw Error('Invalid RMDB pipeline JSON schema');
const ids=new Set([...site.movies,...site.shows].map(x=>x.id));
const missing=curated.items.filter(x=>!ids.has(x.id));
if(missing.length)throw Error('Telegram records missing from site: '+missing.slice(0,10).map(x=>x.id).join(', '));
const apiIds=new Set(api.items.map(x=>x.id));
const missingMovies=curated.items.filter(x=>x.source==='Wikidata'&&!apiIds.has(x.id));
if(missingMovies.length)throw Error('Curated CC0 movies missing from public API: '+missingMovies.slice(0,8).map(x=>x.id).join(', '));
const full=curated.items.filter(x=>Array.isArray(x.episodes)&&x.episodes.length);
for(const x of full){const v=site.shows.find(s=>s.id===x.id);if(!Array.isArray(v?.episodes)||v.episodes.length!==x.episodes.length)throw Error('Episode details lost: '+x.id)}
console.log(JSON.stringify({passed:true,telegramRecords:curated.items.length,siteFilms:site.movies.length,siteShows:site.shows.length,apiMovies:api.items.length,seriesWithEpisodes:full.length}));
