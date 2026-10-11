// Integrity test for Telegram -> independent RMDB catalog -> CC0 public API.
import {readFile,access} from 'node:fs/promises';
const load=async x=>JSON.parse(await readFile(new URL(x,import.meta.url),'utf8'));
const curated=await load('../data/telegram-curated.json');
const site=await load('../public/data/catalog.json');
const api=await load('../public/api/v1/movies.json');
if(!Array.isArray(curated.items)||!Array.isArray(site.movies)||!Array.isArray(site.shows)||!Array.isArray(api.items))throw Error('Invalid RMDB pipeline JSON schema');
const combined=[...site.movies,...site.shows];
const ids=new Set(combined.map(x=>x.id));
if(ids.size!==combined.length)throw Error('Duplicate IDs in published catalog');
const curatedIds=new Set(curated.items.map(x=>x.id));
if(curatedIds.size!==curated.items.length)throw Error('Duplicate IDs in Telegram archive');
const unpublished=curated.items.filter(x=>!ids.has(x.id));
console.log('Records safely retained for future enrichment:',unpublished.length);
for(const item of combined){if(!item.image||!item.imdbId||!(item.summary||item.descriptionFa||item.descriptionEn||item.plot))throw Error('Incomplete title published: '+item.id)}
const apiIds=new Set(api.items.map(x=>x.id));
const missingMovies=site.movies.filter(x=>x.source==='Wikidata'&&!apiIds.has(x.id));
if(missingMovies.length)throw Error('Curated CC0 movies missing from public API: '+missingMovies.slice(0,8).map(x=>x.id).join(', '));
const full=curated.items.filter(x=>ids.has(x.id)&&Array.isArray(x.episodes)&&x.episodes.length);
for(const x of full){const v=site.shows.find(s=>s.id===x.id);if(!Array.isArray(v?.episodes)||v.episodes.length!==x.episodes.length)throw Error('Episode details lost: '+x.id)}
const localImages=combined.filter(x=>typeof x.image==='string'&&x.image.startsWith('/RMDB/media/'));
for(const item of localImages){
 const name=item.image.slice('/RMDB/media/'.length);
 if(!/^[a-zA-Z0-9._-]+$/.test(name))throw Error('Unsafe local media path: '+item.id);
 await access(new URL('../public/media/'+name,import.meta.url)).catch(()=>{throw Error('Local image missing: '+item.id)});
}
// Regression check: a real film imported from the Telegram channel must appear
// in both the RMDB catalog and the free Wikidata-only API.
const filmId='wd-Q1000094';
const archivedFilm=curated.items.find(x=>x.id===filmId);
if(!archivedFilm)throw Error('Expected real test film is missing from Telegram archive: '+filmId);
if(!/^tt\d{7,9}$/.test(archivedFilm.imdbId||'')||!Number.isInteger(archivedFilm.telegramMessageId))throw Error('Film metadata or Telegram delivery evidence invalid: '+filmId);
const publishedFilm=site.movies.find(x=>x.id===filmId),publishedApiFilm=api.items.find(x=>x.id===filmId);
if(publishedFilm&&(!publishedApiFilm||publishedApiFilm.imdbId!==archivedFilm.imdbId))throw Error('Published film CC0 API regression failed: '+filmId);
if(publishedFilm&&publishedFilm.imdbId!==archivedFilm.imdbId)throw Error('Published film IMDb mismatch: '+filmId);
console.log('Single-film Telegram → RMDB CC0 API integrity PASS:',filmId,archivedFilm.title,'publishedInCuratedUI:',Boolean(publishedFilm));
console.log(JSON.stringify({passed:true,localImagesChecked:localImages.length,telegramRecords:curated.items.length,siteFilms:site.movies.length,siteShows:site.shows.length,apiMovies:api.items.length,seriesWithEpisodes:full.length}));
