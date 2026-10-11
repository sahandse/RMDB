'use client';
import BrandLogo from '@/app/components/brand-logo';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
type Details = { title: string; description: string; poster: string|null; facts: [string,string][]; source: string; originalTitle?: string; year?:string; related?:{id:string;title:string;year?:string|null}[]; completeness?:number; score?:number|null; cast?: {id:number;name:string}[]; episodes?: {id:number;name:string;season:number;number:number|null}[] };
const clean = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
function DetailContent() {
 const search = useSearchParams();
 const id = search.get('id') || '';
 const english=search.get('lang')==='en';
 const [details,setDetails] = useState<Details|null>(null);
 const label=(fa:string,en:string)=>english?en:fa;
 const localValue=(key:string,value:string)=>{if(english)return value==='نامشخص'?'Unknown':value==='ثبت نشده'?'Not recorded':value;const map:Record<string,string>={Drama:'درام',Comedy:'کمدی',Action:'اکشن',Adventure:'ماجراجویی',Crime:'جنایی',Thriller:'دلهره‌آور',Romance:'عاشقانه',Horror:'ترسناک',Fantasy:'فانتزی',ScienceFiction:'علمی‌تخیلی',Mystery:'معمایی',Animation:'پویانمایی',Family:'خانوادگی',Documentary:'مستند',History:'تاریخی',War:'جنگی',Music:'موسیقی',Sports:'ورزشی',Running:'در حال پخش',Ended:'پایان‌یافته',ToBeDetermined:'نامشخص',InDevelopment:'در حال تولید'};if(key==='ژانر')return value.split('، ').map(x=>map[x.replaceAll(' ','')]||x).join('، ');if(key==='وضعیت')return map[value.replaceAll(' ','')]||value;return value};
 const factName=(name:string)=>({ 'سال انتشار':'Release year','ژانر':'Genres','وضعیت':'Status','شبکه':'Network','کشور':'Country','امتیاز':'Rating','امتیاز TVmaze':'Rating','بازیگران':'Cast','تاریخ انتشار':'Release date','کارگردان':'Director','مدت (دقیقه)':'Runtime (minutes)','شناسه Wikidata':'Wikidata ID','عنوان اصلی':'Original title','شناسه IMDb':'IMDb ID','شروع پخش':'Premiered','پایان پخش':'Ended','مدت هر قسمت (دقیقه)':'Episode runtime (minutes)','نوع اثر':'Title type','زبان اصلی':'Original language','وب‌سایت رسمی (نشانی)':'Official website (address)','تعداد قسمت‌ها':'Episodes','تعداد فصل‌ها':'Seasons','تعداد بازیگران ثبت‌شده':'Recorded cast','کارگردان (شناسه Wikidata)':'Directors (Wikidata IDs)','نویسنده (شناسه Wikidata)':'Writers (Wikidata IDs)','تهیه‌کننده (شناسه Wikidata)':'Producers (Wikidata IDs)','بازیگران فیلم (شناسه Wikidata)':'Film cast (Wikidata IDs)','کشورهای تولید (شناسه Wikidata)':'Production countries (Wikidata IDs)','زبان‌ها (شناسه Wikidata)':'Languages (Wikidata IDs)','شرکت‌های تولید (شناسه Wikidata)':'Production companies (Wikidata IDs)','کشورهای تولید':'Production countries','زبان‌ها':'Languages','شرکت‌های تولید':'Production companies','نویسنده':'Writers','تهیه‌کننده':'Producers','بازیگران فیلم':'Film cast','رده‌بندی سنی':'Content rating','انتشار':'Released','مدت':'Runtime','ژانرهای بیشتر':'Additional genres','نویسندگان':'Writers','بازیگران اصلی':'Lead actors','کشورها':'Countries','جوایز':'Awards','متاسکور':'Metascore','امتیاز IMDb':'IMDb rating','تعداد رأی IMDb':'IMDb votes','فروش گیشه':'Box office','شرکت تولید':'Production','عرضه خانگی':'Home release','تعداد فصل‌های ثبت‌شده':'Reported seasons' } as Record<string,string>)[name]||name;
 const [status,setStatus] = useState('');
 const [saved,setSaved]=useState(false);
 const [season,setSeason]=useState(0);
 const [personalRating,setPersonalRating]=useState(0);
 const [review,setReview]=useState('');
 const [reviews,setReviews]=useState<{rating:number;text:string;date:string}[]>([]);
 useEffect(()=>{try{setReviews(JSON.parse(localStorage.getItem('rmdb-reviews-'+id)||'[]'))}catch{setReviews([])}},[id]);
 const saveReview=()=>{if(!review.trim()||review.length>1000)return;const next=[{rating:personalRating,text:review.trim(),date:new Date().toISOString()},...reviews];localStorage.setItem('rmdb-reviews-'+id,JSON.stringify(next));setReviews(next);setReview('')};
 useEffect(()=>{try{setSaved((JSON.parse(localStorage.getItem('rmdb-watchlist-v1')||'[]') as {id:string}[]).some(x=>x.id===id))}catch{setSaved(false)}},[id]);
 const toggleSaved=()=>{if(!details)return;try{const list=JSON.parse(localStorage.getItem('rmdb-watchlist-v1')||'[]') as {id:string;title:string;year?:string;image?:string|null;titleEn?:string}[];const next=saved?list.filter(x=>x.id!==id):[...list.filter(x=>x.id!==id),{id,title:details.title,titleEn:details.originalTitle,year:details.year,image:details.poster}];localStorage.setItem('rmdb-watchlist-v1',JSON.stringify(next));setSaved(!saved)}catch{}};
 useEffect(() => {
  let live = true;
  async function load() {
   setDetails(null);setStatus(label('در حال دریافت اطلاعات واقعی...','Loading verified data...'));
   try {
    // Read the same archived metadata delivered through Telegram first. Works without
    // contacting TVmaze/Wikidata from a user's browser (including restricted networks).
    const localResponse=await fetch('/RMDB/data/catalog.json');
    if(localResponse.ok){
      const local=await localResponse.json();
      const record=[...(local.shows||[]),...(local.movies||[])].find((x:{id:string})=>x.id===id);
      if(record){
        const title=english?(record.titleEn||record.title):record.title;
        const cast=(record.cast||[]).filter((x:{id:number;name:string})=>x?.id&&x?.name).map((x:{id:number;name:string})=>({id:x.id,name:x.name}));
        const episodes=(record.episodes||[]).filter((x:{id:number;name:string;season:number})=>x?.id&&x?.name&&Number.isInteger(x.season)).map((x:{id:number;name:string;season:number;number:number|null})=>({id:x.id,name:x.name,season:x.season,number:x.number}));
        const descr=english?(record.descriptionEn||record.plot||record.summary||record.descriptionFa):(record.descriptionFa||record.plot||record.summary||record.descriptionEn);
        const facts:[string,string][]=[['سال انتشار',record.year||'نامشخص']];
        const allTitles=[...(local.shows||[]),...(local.movies||[])];
        const tags=new Set((record.genres||[]).filter((x:unknown)=>typeof x==='string'));
        const related=allTitles.filter((x:{id:string;genres?:string[]})=>x.id!==id&&tags.size>0&&Array.isArray(x.genres)&&x.genres.some(g=>tags.has(g))).slice(0,8).map((x:{id:string;title:string;year?:string|null})=>({id:x.id,title:x.title,year:x.year}));
        const fields=[record.title,record.year,record.image,record.imdbId,record.summary||record.descriptionFa||record.descriptionEn,record.genres?.length,record.cast?.length||record.credits?.cast?.length,record.episodes?.length||record.runtimeMinutes,record.language||record.languages?.length,record.network||record.countries?.length];
        const completeness=Math.round(fields.filter(Boolean).length*100/fields.length);
        const showFacts=(name:string,values:unknown,field?:string)=>{if(Array.isArray(values)&&values.length){const known=field&&record.entityNames?.[field];const display=Array.isArray(known)&&known.length?known.map((x:{fa?:string;en?:string})=>(english?x.en||x.fa:x.fa||x.en)||'').filter(Boolean):values.map(String).filter(v=>!/^Q\d+$/.test(v));if(display.length)facts.push([name,display.join('، ')])}};
        if(record.titleEn&&record.titleEn!==record.title)facts.push(['عنوان اصلی',record.titleEn]);
        if(record.imdbId)facts.push(['شناسه IMDb',record.imdbId]);
        // OMDb-specific metadata is present only when republication was explicitly enabled
        // in the server-side pipeline. Never fetch OMDb directly from the browser.
        for(const [field,name] of [
         ['rated','رده‌بندی سنی'],['released','انتشار'],['runtimeText','مدت'],['genresText','ژانرهای بیشتر'],
         ['directorsText','کارگردان'],['writersText','نویسندگان'],['actorsText','بازیگران اصلی'],
         ['languageText','زبان‌ها'],['countryText','کشورها'],['awards','جوایز'],
         ['metascore','متاسکور'],['imdbRating','امتیاز IMDb'],['imdbVotes','تعداد رأی IMDb'],
         ['boxOffice','فروش گیشه'],['production','شرکت تولید'],['dvd','عرضه خانگی'],
         ['totalSeasons','تعداد فصل‌های ثبت‌شده']] as const){if(typeof record[field]==='string'&&record[field]!=='N/A')facts.push([name,record[field]])}
        if(Array.isArray(record.ratings))for(const score of record.ratings){if(typeof score.Source==='string'&&typeof score.Value==='string')facts.push([score.Source,score.Value])}
        
        if(record.premiered)facts.push(['شروع پخش',record.premiered]);
        if(record.ended)facts.push(['پایان پخش',record.ended]);
        if(record.averageRuntime)facts.push(['مدت هر قسمت (دقیقه)',String(record.averageRuntime)]);
        if(record.type)facts.push(['نوع اثر',record.type]);
        if(record.language)facts.push(['زبان اصلی',record.language]);
        
        showFacts('کشورهای تولید',record.countries,'countries');
        showFacts('زبان‌ها',record.languages,'languages');
        showFacts('شرکت‌های تولید',record.productionCompanies,'productionCompanies');
        if(record.credits){for(const [key,name] of [['directors','کارگردان'],['writers','نویسنده'],['producers','تهیه‌کننده'],['cast','بازیگران فیلم']] as const){showFacts(name,record.credits[key],key)}}
        if(episodes.length){facts.push(['تعداد قسمت‌ها',String(episodes.length)]);facts.push(['تعداد فصل‌ها',String(new Set(episodes.map((x:{season:number})=>x.season)).size)])}
        if(cast.length)facts.push(['تعداد بازیگران ثبت‌شده',String(cast.length)]);

        if(record.genres?.length)showFacts('ژانر',record.genres,'genres');
        if(record.status)facts.push(['وضعیت',record.status]);
        if(record.network)facts.push(['شبکه',record.network]);
        if(record.rating!=null)facts.push(['امتیاز',String(record.rating)]);
        if(cast.length)facts.push(['بازیگران',cast.slice(0,12).map((x:{name:string})=>x.name).join('، ')]);
        if(record.releaseDate)facts.push(['تاریخ انتشار',String(record.releaseDate).replace(/^\+/,'').slice(0,10)]);
        if(record.runtimeMinutes)facts.push(['مدت (دقیقه)',String(record.runtimeMinutes)]);
        
        if(live)setDetails({title,description:clean(descr||label('توضیحی ثبت نشده است.','No description is available.')),poster:record.image||null,source:record.source||'RMDB',originalTitle:record.titleEn||undefined,year:record.year||undefined,cast,episodes,facts,related,completeness,score:typeof record.rating==='number'?record.rating:null});
        return;
      }
    }
    throw new Error('Record not yet available in RMDB local catalog');
   } catch {if(live)setStatus(label('جزئیات این اثر هنوز در آرشیو RMDB ثبت نشده است.','This title is not yet available in RMDB.'));}
  }
  void load();return()=>{live=false};
 },[id,english]);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href={english?'/RMDB/en/':'/RMDB/'}><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/">فارسی</a><a href="/RMDB/en/">English</a></nav></div></header><main className="layout detail-area"><a className="backlink" href="/RMDB/">{label('← بازگشت به فیلم‌ها و سریال‌ها','← Back to movies and TV')}</a>{details?<article className="detail-cinema"><div className="cinema-backdrop" style={details.poster?{backgroundImage:"linear-gradient(90deg,#0b0e13ee,#0b0e13a8),url("+details.poster+")"}:{}}/><div className="detail-grid"><div className="detail-poster">{details.poster?<img src={details.poster} alt={label('پوستر ','Poster of ')+details.title} onError={e=>{e.currentTarget.hidden=true;e.currentTarget.parentElement?.classList.add("poster-failed")}}/>:<div className="empty">{label('تصویر موجود نیست','Image unavailable')}</div>}</div><div><div className="eyebrow">{label('فیلم و سریال در RMDB','Movies & TV · RMDB')}</div><h1 dir="auto">{details.title}</h1><div className="filterbar"><a className="secondary-link" href={"/RMDB/title/?id="+id}>فارسی</a><a className="secondary-link" href={"/RMDB/title/?id="+id+"&lang=en"}>English</a></div>{details.originalTitle&&details.originalTitle!==details.title?<p className="original-title" dir="auto">{details.originalTitle}</p>:null}<div className="cinema-pills"><span>{details.year||label("سال نامشخص","Year unknown")}</span><span>{id.startsWith('tv-')?label('سریال','Series'):label('فیلم سینمایی','Movie')}</span>{details.score!=null?<span className="rmdb-score">★ {details.score.toFixed(1)} / 10</span>:null}</div><button type="button" className="primary-link save-button" onClick={toggleSaved}>{saved?(english?'✓ Saved to watchlist':'✓ ذخیره‌شده در فهرست من'):(english?'+ Add to watchlist':'+ افزودن به فهرست تماشا')}</button><p className="detail-description">{details.description}</p><nav className="filterbar" aria-label={label('بخش‌های صفحه','Page sections')}><a className="secondary-link" href="#rmdb-facts">{label('مشخصات','Details')}</a><a className="secondary-link" href="#rmdb-cast">{label('عوامل','Cast')}</a><a className="secondary-link" href="#rmdb-episodes">{label('قسمت‌ها','Episodes')}</a><a className="secondary-link" href="#rmdb-related">{label('مشابه','Related')}</a></nav><div className="rmdb-completeness" aria-label={label("تکمیل اطلاعات","Metadata completeness")}><div className="rmdb-completeness-top"><span>{label("جزئیات ثبت‌شده","Recorded details")}</span><strong>{details.completeness??0}%</strong></div><div className="rmdb-completeness-track"><div style={{width:(details.completeness??0)+"%"}}/></div></div><h2 id="rmdb-facts" className="section-title">{english?"Title details":"مشخصات اثر"}</h2><dl className="fact-list">{details.facts.map(([k,v])=><div key={k}><dt>{english?factName(k):k}</dt><dd>{localValue(k,v)}</dd></div>)}</dl><section className="local-reviews"><h2 className="section-title">{english?"My private rating and notes":"امتیاز و یادداشت من"}</h2><p className="source-note">{english?"Your ratings and notes are stored only in this browser; they are not public RMDB scores.":"این امتیازها شخصی و فقط در مرورگر شما ذخیره می‌شوند؛ امتیاز عمومی RMDB محسوب نمی‌شوند."}</p><div className="filterbar"><select aria-label={label("امتیاز من","My rating")} value={personalRating} onChange={e=>setPersonalRating(Number(e.target.value))}>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i===0?label('بدون امتیاز','No rating'):i+label(' از ۱۰',' out of 10')}</option>)}</select></div><textarea maxLength={1000} value={review} onChange={e=>setReview(e.target.value)} placeholder={english?"Write a private note...":"نقد یا یادداشت شخصی بنویس..."} aria-label={english?"Private note":"یادداشت شخصی"}/><button type="button" onClick={saveReview} disabled={!review.trim()} className="primary-link save-button">{english?"Save note":"ثبت یادداشت"}</button>{reviews.map((r,i)=><div className="review-item" key={i}><strong>{r.rating?r.rating+' / 10':(english?'No rating':'بدون امتیاز')}</strong><p>{r.text}</p></div>)}</section>{details.cast?.length?<><h2 id="rmdb-cast" className="section-title">{english?"Cast":"بازیگران"}</h2><div className="filmography">{details.cast.map(a=><a key={a.id} href={'/RMDB/person/?id='+a.id+(english?'&lang=en':'')}>{a.name} ←</a>)}</div></>:null}{details.episodes?.length?<><h2 id="rmdb-episodes" className="section-title">{english?"Episodes":"قسمت‌های سریال"}</h2><div className="filterbar"><select aria-label={label("انتخاب فصل","Select season")} value={season} onChange={e=>setSeason(Number(e.target.value))}><option value={0}>{english?"All seasons":"همه فصل‌ها"}</option>{[...new Set(details.episodes.map(e=>e.season))].sort((a,b)=>a-b).map(s=><option key={s} value={s}>{label('فصل','Season')} {s}</option>)}</select></div><div className="episode-list">{details.episodes.filter(e=>season===0||e.season===season).map(e=><a key={e.id} href={"/RMDB/episode/?id="+e.id+(english?'&lang=en':'')}>{english?'Season':'فصل'} {e.season} · {english?'Episode':'قسمت'} {e.number??'—'} — {e.name} ←</a>)}</div></>:null}{details.related?.length?<section id="rmdb-related"><h2 className="section-title">{label('آثار مرتبط','Related titles')}</h2><div className="filmography">{details.related.map(x=><a key={x.id} href={'/RMDB/title/?id='+encodeURIComponent(x.id)+(english?'&lang=en':'')}>{x.title} {x.year?'· '+x.year:''} ←</a>)}</div></section>:null}</div></div></article>:<div role="status" className="empty">{status}</div>}</main><footer className="footer"><div className="layout">© RMDB · {label('اطلاعات سینمایی','Cinema information')} <details className="credit-disclosure"><summary>{label('حقوق داده‌ها و تصاویر','Data and image credits')}</summary><p>{label('اطلاعات سریال‌ها: TVmaze با شرایط CC BY-SA؛ داده‌های ساختاریافته فیلم‌ها: Wikidata با شرایط CC0. حقوق تصاویر طبق مشخصات مجوز هر فایل محفوظ است.','Series metadata: TVmaze (CC BY-SA); structured film data: Wikidata (CC0). Image licensing and author credits follow each image record.')}</p><p><a href="/RMDB/data/image-credits.json">{label('اطلاعات مجوز تصاویر','Image attribution records')}</a></p></details></div></footer></>;
}
export default function TitlePage(){return <Suspense fallback={<main className="layout detail-area"><div className="skeleton-block" style={{height:200}} aria-hidden="true"/></main>}><DetailContent/></Suspense>}
