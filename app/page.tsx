import Image from 'next/image';
import { getHomeCollections, imageUrl, formatRating, type Movie } from '@/lib/tmdb';
const sections = ['محبوب‌ترین فیلم‌های هفته', 'فیلم‌های برتر', 'سریال‌های محبوب هفته'];
function MovieCard({ movie, isSeries }: { movie: Movie; isSeries: boolean }) {
 const poster = imageUrl(movie.poster_path);
 const title = isSeries ? movie.name || movie.title : movie.title;
 const year = (isSeries ? movie.first_air_date : movie.release_date)?.slice(0, 4) || 'نامشخص';
 return <article className="movie"><div className="poster">{poster ? <Image src={poster} alt={title} width={342} height={513} sizes="(max-width: 650px) 50vw, (max-width: 1000px) 25vw, 16vw" /> : <span>پوستر موجود نیست</span>}</div><h3 title={title}>{title}</h3><div className="meta"><span>{year}</span><span className="rating" aria-label={'امتیاز TMDB: '+formatRating(movie.vote_average)}>★ {formatRating(movie.vote_average)}</span></div></article>;
}
export default async function Home() {
 const collections = await getHomeCollections();
 const configured = Boolean(process.env.TMDB_READ_ACCESS_TOKEN);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/">RMDB<span style={{color:'#fff'}}>.</span></a><nav className="navlinks" aria-label="منوی اصلی"><a href="#movies">فیلم‌ها</a><a href="#series">سریال‌ها</a><a href="#top">برترین‌ها</a></nav><div className="nav-end">مرجع اطلاعات سینما و تلویزیون</div></div></header><main><div className="hero"><div className="layout"><span className="eyebrow">مرجع فارسی فیلم و سریال</span><h1>دنیای سینما، یک‌جا و به فارسی.</h1><p>فیلم‌ها، سریال‌ها، اطلاعات واقعی آثار و امتیازهای ثبت‌شده در TMDB؛ بدون اطلاعات نمایشی یا ساختگی.</p></div></div><div className="layout">{!configured && <div className="empty" role="status">برای نمایش اطلاعات واقعی، متغیر محیطی TMDB_READ_ACCESS_TOKEN را روی سرور تنظیم کنید. تا آن زمان هیچ محتوای ساختگی نمایش داده نمی‌شود.</div>}{sections.map((heading,index)=><section className="section" id={index===0?'movies':index===1?'top':'series'} key={heading}><h2 className="section-title">{heading}</h2>{collections[index].length?<div className="cards">{collections[index].slice(0,12).map(movie=><MovieCard key={movie.id} movie={movie} isSeries={index===2}/>)}</div>:<div className="empty">اطلاعات این بخش در حال حاضر قابل دریافت نیست. پس از اتصال منبع، آثار واقعی نمایش داده می‌شوند.</div>}</section>)}</div></main><footer className="footer"><div className="layout">RMDB — پایگاه اطلاعات فارسی فیلم و سریال. این محصول مورد تأیید یا حمایت TMDB نیست.</div></footer></>;
}
