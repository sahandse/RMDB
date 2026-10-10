export type Movie = { id: number; title: string; original_title: string; poster_path: string | null; backdrop_path: string | null; vote_average: number; vote_count: number; release_date: string; overview: string; media_type?: string; name?: string; first_air_date?: string };
type ListResponse = { results: Movie[] };
const BASE = 'https://api.themoviedb.org/3';
async function tmdb(path: string): Promise<ListResponse> {
 const token = process.env.TMDB_READ_ACCESS_TOKEN;
 if (!token) throw new Error('TMDB_NOT_CONFIGURED');
 const response = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + token, accept: 'application/json' }, next: { revalidate: 3600 } });
 if (!response.ok) throw new Error('TMDB_REQUEST_FAILED_' + response.status);
 return response.json();
}
export async function getHomeCollections() {
 const paths = ['/trending/movie/week?language=fa-IR', '/movie/top_rated?language=fa-IR&page=1', '/trending/tv/week?language=fa-IR'];
 const results = await Promise.allSettled(paths.map(tmdb));
 return results.map(result => result.status === 'fulfilled' ? result.value.results : []);
}
export function imageUrl(path: string | null, width: 342 | 780 = 342) {
 return path ? 'https://image.tmdb.org/t/p/w' + width + path : null;
}
export function formatRating(value: number) { return Number.isFinite(value) ? value.toFixed(1) : '—'; }
