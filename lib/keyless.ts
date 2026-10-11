export type Entry = { id: string; title: string; subtitle: string; year: string; image: string | null; url: string; source: 'Wikidata' | 'TVmaze'; rating: number | null };
type TVShow = { id: number; name: string; premiered: string | null; image: { medium?: string } | null; url: string; rating: { average: number | null } };
type Binding = { film: { value: string }; filmLabel?: { value: string }; date?: { value: string }; image?: { value: string } };
function year(value?: string | null) { return value?.slice(0, 4) || 'نامشخص'; }
export async function getShows(): Promise<Entry[]> {
 try {
  const response = await fetch('https://api.tvmaze.com/shows?page=0', { next: { revalidate: 86400 }, headers: { 'User-Agent': 'RMDB/0.1 (public movie reference)' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) return [];
  const shows = (await response.json()) as TVShow[];
  return shows.filter(s => s.name && s.url).slice(0, 12).map(s => ({ id: 'tv-' + s.id, title: s.name, subtitle: 'سریال تلویزیونی', year: year(s.premiered), image: s.image?.medium || null, url: s.url, source: 'TVmaze' as const, rating: s.rating?.average ?? null }));
 } catch { return []; }
}
export async function getFilms(language: 'fa' | 'en' = 'fa'): Promise<Entry[]> {
 const query = `SELECT ?film ?filmLabel ?date ?image WHERE {
  ?film wdt:P31 wd:Q11424.
  OPTIONAL { ?film wdt:P577 ?date. }
  OPTIONAL { ?film wdt:P18 ?image. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${language},${language === 'fa' ? 'en' : 'fa'}". }
 } LIMIT 12`;
 try {
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
  const response = await fetch(url, { next: { revalidate: 86400 }, headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'RMDB/0.1 (contact: https://github.com/sahandse/RMDB)' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) return [];
  const payload = await response.json() as { results: { bindings: Binding[] } };
  return payload.results.bindings.map(b => {
   const id = b.film.value.split('/').pop() || '';
   const title = b.filmLabel?.value || id;
   const filename = b.image?.value.split('/').pop();
   return { id: 'wd-' + id, title, subtitle: 'فیلم سینمایی', year: year(b.date?.value), image: filename ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(decodeURIComponent(filename)) + '?width=320' : null, url: 'https://www.wikidata.org/wiki/' + id, source: 'Wikidata' as const, rating: null };
  }).filter(e => e.title && !/^Q\\d+$/.test(e.title));
 } catch { return []; }
}
