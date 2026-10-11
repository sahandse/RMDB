'use client';
import BrandLogo from '@/app/components/brand-logo';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
type Details = { title: string; description: string; poster: string|null; facts: [string,string][]; source: string; originalTitle?: string; year?:string; related?:{id:string;title:string;year?:string|null}[]; completeness?:number; cast?: {id:number;name:string}[]; episodes?: {id:number;name:string;season:number;number:number|null}[] };
const clean = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
function DetailContent() {
 const search = useSearchParams();
 const id = search.get('id') || '';
 const english=search.get('lang')==='en';
 const [details,setDetails] = useState<Details|null>(null);
 const label=(fa:string,en:string)=>english?en:fa;
 const localValue=(key:string,value:string)=>{if(english)return value==='نامشخص'?'Unknown':value==='ثبت نشده'?'Not recorded':value;const map:Record<string,string>={Drama:'درام',Comedy:'کمدی',Action:'اکشن',Adventure:'ماجراجویی',Crime:'جنایی',Thriller:'دلهره‌آور',Romance:'عاشقانه',Horror:'ترسناک',Fantasy:'فانتزی',ScienceFiction:'علمی‌تخیلی',Mystery:'معمایی',Animation:'پویانمایی',Family:'خانوادگی',Documentary:'مستند',History:'تاریخی',War:'جنگی',Music:'موسیقی',Sports:'ورزشی',Running:'در حال پخش',Ended:'پایان‌یافته',ToBeDetermined:'نامشخص',InDevelopment:'در حال تولید'};if(key==='ژانر')return value.split('، ').map(x=>map[x.replaceAll(' ','')]||x).join('، ');if(key==='وضعیت')return map[value.replaceAll(' ','')]||value;return value};
 const factName=(name:string)=>({ 'سال انتشار':'Release year','ژانر':'Genres','وضعیت':'Status','شبکه':'Network','کشور':'Country','امتیاز TVmaze':'TVmaze rating','بازیگران':'Cast','تاریخ انتشار':'Release date','کارگردان':'Director','مدت (دقیقه)':'Runtime (minutes)','شناسه Wikidata':'Wikidata ID','عنوان اصلی':'Original title','شناسه IMDb':'IMDb ID','شروع پخش':'Premiered','پایان پخش':'Ended','مدت هر قسمت (دقیقه)':'Episode runtime (minutes)','نوع اثر':'Title type','زبان اصلی':'Original language','وب‌سایت رسمی (نشانی)':'Official website (address)','تعداد قسمت‌ها':'Episodes','تعداد فصل‌ها':'Seasons','تعداد بازیگران ثبت‌شده':'Recorded cast','کارگردان (شناسه Wikidata)':'Directors (Wikidata IDs)','نویسنده (شناسه Wikidata)':'Writers (Wikidata IDs)','تهیه‌کننده (شناسه Wikidata)':'Producers (Wikidata IDs)','بازیگران فیلم (شناسه Wikidata)':'Film cast (Wikidata IDs)','کشورهای تولید (شناسه Wikidata)':'Production countries (Wikidata IDs)','زبان‌ها (شناسه Wikidata)':'Languages (Wikidata IDs)','شرکت‌های تولید (شناسه Wikidata)':'Production companies (Wikidata IDs)' } as Record<string,string>)[name]||name;
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
    const localResponse=await fetch('/RMDB/data/catalog.json',{cache:'no-store'});
    if(localResponse.ok){
      const local=await localResponse.json();
      const record=[...(local.shows||[]),...(local.movies||[])].find((x:{id:string})=>x.id===id);
      if(record){
        const title=english?(record.titleEn||record.title):record.title;
        const cast=(record.cast||[]).filter((x:{id:number;name:string})=>x?.id&&x?.name).map((x:{id:number;name:string})=>({id:x.id,name:x.name}));
        const episodes=(record.episodes||[]).filter((x:{id:number;name:string;season:number})=>x?.id&&x?.name&&Number.isInteger(x.season)).map((x:{id:number;name:string;season:number;number:number|null})=>({id:x.id,name:x.name,season:x.season,number:x.number}));
        const descr=english?(record.descriptionEn||record.summary||record.descriptionFa):(record.descriptionFa||record.summary||record.descriptionEn);
        const facts:[string,string][]=[['سال انتشار',record.year||'نامشخص']];
        const allTitles=[...(local.shows||[]),...(local.movies||[])];
        const tags=new Set((record.genres||[]).filter((x:unknown)=>typeof x==='string'));
        const related=allTitles.filter((x:{id:string;genres?:string[]})=>x.id!==id&&Array.isArray(x.genres)&&x.genres.some(g=>tags.has(g))).slice(0,8).map((x:{id:string;title:string;year?:string|null})=>({id:x.id,title:x.title,year:x.year}));
        const fields=[record.title,record.year,record.image,record.imdbId,record.summary||record.descriptionFa||record.descriptionEn,record.genres?.length,record.cast?.length||record.credits?.cast?.length,record.episodes?.length||record.runtimeMinutes,record.language||record.languages?.length,record.network||record.countries?.length];
        const completeness=Math.round(fields.filter(Boolean).length*100/fields.length);
        const showFacts=(name:string,values:unknown)=>{if(Array.isArray(values)&&values.length)facts.push([name,values.map(String).join('، ')])};
        if(record.titleEn&&record.titleEn!==record.title)facts.push(['عنوان اصلی',record.titleEn]);
        if(record.imdbId)facts.push(['شناسه IMDb',record.imdbId]);
        if(record.premiered)facts.push(['شروع پخش',record.premiered]);
        if(record.ended)facts.push(['پایان پخش',record.ended]);
        if(record.averageRuntime)facts.push(['مدت هر قسمت (دقیقه)',String(record.averageRuntime)]);
        if(record.type)facts.push(['نوع اثر',record.type]);
        if(record.language)facts.push(['زبان اصلی',record.language]);
        if(record.officialSite)facts.push(['وب‌سایت رسمی (نشانی)',String(record.officialSite)]);
        showFacts('کشورهای تولید (شناسه Wikidata)',record.countries);
        showFacts('زبان‌ها (شناسه Wikidata)',record.languages);
        showFacts('شرکت‌های تولید (شناسه Wikidata)',record.productionCompanies);
        if(record.credits){for(const [key,name] of [['directors','کارگردان'],['writers','نویسنده'],['producers','تهیه‌کننده'],['cast','بازیگران فیلم']] as const){showFacts(name+' (شناسه Wikidata)',record.credits[key])}}
        if(episodes.length){facts.push(['تعداد قسمت‌ها',String(episodes.length)]);facts.push(['تعداد فصل‌ها',String(new Set(episodes.map((x:{season:number})=>x.season)).size)])}
        if(cast.length)facts.push(['تعداد بازیگران ثبت‌شده',String(cast.length)]);

        if(record.genres?.length)facts.push(['ژانر',record.genres.join('، ')]);
        if(record.status)facts.push(['وضعیت',record.status]);
        if(record.network)facts.push(['شبکه',record.network]);
        if(record.rating!=null)facts.push(['امتیاز TVmaze',String(record.rating)]);
        if(cast.length)facts.push(['بازیگران',cast.slice(0,12).map((x:{name:string})=>x.name).join('، ')]);
        if(record.releaseDate)facts.push(['تاریخ انتشار',String(record.releaseDate).replace(/^\+/,'').slice(0,10)]);
        if(record.runtimeMinutes)facts.push(['مدت (دقیقه)',String(record.runtimeMinutes)]);
        if(record.wikidataId)facts.push(['شناسه Wikidata',record.wikidataId]);
        if(live)setDetails({title,description:clean(descr||label('توضیحی ثبت نشده است.','No description is available.')),poster:record.image||null,source:record.source||'RMDB',originalTitle:record.titleEn||undefined,year:record.year||undefined,cast,episodes,facts,related,completeness});
        return;
      }
    }
    throw new Error('Record not yet available in RMDB local catalog');
    if (/^tv-\d+$/.test(id)) {
     const r = await fetch('https://api.tvmaze.com/shows/'+id.slice(3)+'?embed=cast');
     if (!r.ok) throw new Error('TVmaze');
     const d = await r.json();
     const cast = (d._embedded?.cast || []).slice(0,12).map((c: {person:{id:number;name:string}})=>({id:c.person.id,name:c.person.name}));
     const result: Details = {title:d.name,description:clean(d.summary||label('خلاصه داستان هنوز ثبت نشده است.','No synopsis available.')),poster:d.image?.original||d.image?.medium||null,source:'TVmaze',originalTitle:d.name,year:(d.premiered||'').slice(0,4),facts:[['سال انتشار',(d.premiered||'').slice(0,4)||'نامشخص'],['ژانر',(d.genres||[]).join('، ')||'نامشخص'],['وضعیت',d.status||'نامشخص'],['شبکه',d.network?.name||d.webChannel?.name||'نامشخص'],['کشور',d.network?.country?.name||'نامشخص'],['امتیاز TVmaze',d.rating?.average?.toString()||'ثبت نشده'],['بازیگران',cast.length?cast.map((a:{name:string})=>a.name).join('، '):'نامشخص']]};
     const ep=await fetch('https://api.tvmaze.com/shows/'+id.slice(3)+'/episodes').then(r=>r.ok?r.json():[]).catch(()=>[]);
     result.cast=cast;
     result.episodes=Array.isArray(ep)?ep.map((e:{id:number;name:string;season:number;number:number|null})=>({id:e.id,name:e.name,season:e.season,number:e.number})):[];
     if(live)setDetails(result);
    } else if (/^wd-Q\d+$/.test(id)) {
     const qid = id.slice(3);
     const r = await fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+qid+'&languages=fa%7Cen&props=labels%7Cdescriptions%7Cclaims%7Csitelinks&format=json&origin=*');
     if (!r.ok) throw new Error('Wikidata');
     const d = await r.json();const e = d.entities?.[qid];if(!e||e.missing)throw new Error('missing');
     const title=(english?e.labels?.en?.value||e.labels?.fa?.value:e.labels?.fa?.value||e.labels?.en?.value)||qid;
     const description=(english?e.descriptions?.en?.value||e.descriptions?.fa?.value:e.descriptions?.fa?.value||e.descriptions?.en?.value)||(english?'Description unavailable.':'توضیحات این اثر هنوز ثبت نشده است.');
     const originalTitle=e.labels?.en?.value||title;
     let wikipediaSummary: string | null = null;
     const wikiSite=english?'enwiki':'fawiki';
     const wikiTitle=e.sitelinks?.[wikiSite]?.title;
     if(wikiTitle){try{const host=english?'en.wikipedia.org':'fa.wikipedia.org';const endpoint='https://'+host+'/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles='+encodeURIComponent(wikiTitle)+'&format=json&origin=*';const answer=await fetch(endpoint);if(answer.ok){const pages=(await answer.json()).query?.pages;const item=Object.values(pages||{})[0] as {extract?:string}|undefined;wikipediaSummary=item?.extract?.slice(0,1200)||null}}catch{}}
     const p=(key:string)=>e.claims?.[key]?.[0]?.mainsnak?.datavalue?.value;
     const date=p('P577')?.time?.replace(/^\+/,'').slice(0,10)||label('نامشخص','Unknown');
     const file=p('P18');
     const quantity=(key:string)=>p(key)?.amount;
     const directorIds=(e.claims?.P57||[]).map((x:{mainsnak?:{datavalue?:{value?:{id?:string}}}})=>x.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0,8);
     let directors=label('نامشخص','Unknown');
     if(directorIds.length){try{const dr=await fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+directorIds.join('%7C')+'&props=labels&languages=fa%7Cen&format=json&origin=*');if(dr.ok){const de=(await dr.json()).entities;directors=directorIds.map((q:string)=>de[q]?.labels?.[english?'en':'fa']?.value||de[q]?.labels?.en?.value).filter(Boolean).join('، ')||directors}}catch{}}
     let poster:string|null=null;
     if(typeof file==='string'){
       try{
         const media=await fetch('https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:'+encodeURIComponent(file)+'&format=json&origin=*');
         if(media.ok){
           const pages=(await media.json()).query?.pages||{};
           const record=Object.values(pages)[0] as {imageinfo?:{extmetadata?:{LicenseShortName?:{value?:string};LicenseUrl?:{value?:string}}}[]} | undefined;
           const license=record?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||'';
           if(/^(CC0|CC BY(?:-SA)?(?: |-|$)|Public domain|PD-)/i.test(license)){
             poster='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=600';
           }
         }
       }catch{}
     }
     if(live)setDetails({title,description:wikipediaSummary||description,poster,source:wikipediaSummary?'Wikipedia / Wikidata':'Wikidata',originalTitle,year:date.slice(0,4),facts:[['تاریخ انتشار',date],['کارگردان',directors],['مدت (دقیقه)',quantity('P2047')||'نامشخص'],['شناسه Wikidata',qid]]});
    } else throw new Error('invalid');
   } catch {if(live)setStatus(label('دریافت اطلاعات این عنوان ممکن نشد. اتصال اینترنت یا سرویس داده را بررسی کنید.','Could not load this title. Please check your connection or data source.'));}
  }
  void load();return()=>{live=false};
 },[id,english]);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href={english?'/RMDB/en/':'/RMDB/'}><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/">فارسی</a><a href="/RMDB/en/">English</a></nav></div></header><main className="layout detail-area"><a className="backlink" href="/RMDB/">{label('← بازگشت به فیلم‌ها و سریال‌ها','← Back to movies and TV')}</a>{details?<article className="detail-cinema"><div className="cinema-backdrop" style={details.poster?{backgroundImage:"linear-gradient(90deg,#0b0e13ee,#0b0e13a8),url("+details.poster+")"}:{}}/><div className="detail-grid"><div className="detail-poster">{details.poster?<img src={details.poster} alt={label('پوستر ','Poster of ')+details.title}/>:<div className="empty">{label('تصویر موجود نیست','Image unavailable')}</div>}</div><div><div className="eyebrow">{label('مرجع اطلاعات فیلم و سریال · ','Movie and TV details · ')}{details.source}</div><h1 dir="auto">{details.title}</h1><div className="filterbar"><a className="secondary-link" href={"/RMDB/title/?id="+id}>فارسی</a><a className="secondary-link" href={"/RMDB/title/?id="+id+"&lang=en"}>English</a></div>{details.originalTitle&&details.originalTitle!==details.title?<p className="original-title" dir="auto">{details.originalTitle}</p>:null}<div className="cinema-pills"><span>{details.year||label("سال نامشخص","Year unknown")}</span><span>{details.source}</span></div><button type="button" className="primary-link save-button" onClick={toggleSaved}>{saved?(english?'✓ Saved to watchlist':'✓ ذخیره‌شده در فهرست من'):(english?'+ Add to watchlist':'+ افزودن به فهرست تماشا')}</button><p className="detail-description">{details.description}</p><nav className="filterbar" aria-label={label('بخش‌های صفحه','Page sections')}><a className="secondary-link" href="#rmdb-facts">{label('مشخصات','Details')}</a><a className="secondary-link" href="#rmdb-cast">{label('عوامل','Cast')}</a><a className="secondary-link" href="#rmdb-episodes">{label('قسمت‌ها','Episodes')}</a><a className="secondary-link" href="#rmdb-related">{label('مشابه','Related')}</a></nav><p className="source-note">{label('میزان تکمیل اطلاعات موجود','Available metadata completeness')}: {details.completeness??'—'}%</p><h2 id="rmdb-facts" className="section-title">{english?"Title details":"مشخصات اثر"}</h2><dl className="fact-list">{details.facts.map(([k,v])=><div key={k}><dt>{english?factName(k):k}</dt><dd>{localValue(k,v)}</dd></div>)}</dl><section className="local-reviews"><h2 className="section-title">{english?"My private rating and notes":"امتیاز و یادداشت من"}</h2><p className="source-note">{english?"Your ratings and notes are stored only in this browser; they are not public RMDB scores.":"این امتیازها شخصی و فقط در مرورگر شما ذخیره می‌شوند؛ امتیاز عمومی RMDB محسوب نمی‌شوند."}</p><div className="filterbar"><select aria-label={label("امتیاز من","My rating")} value={personalRating} onChange={e=>setPersonalRating(Number(e.target.value))}>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i===0?label('بدون امتیاز','No rating'):i+label(' از ۱۰',' out of 10')}</option>)}</select></div><textarea maxLength={1000} value={review} onChange={e=>setReview(e.target.value)} placeholder={english?"Write a private note...":"نقد یا یادداشت شخصی بنویس..."} aria-label={english?"Private note":"یادداشت شخصی"}/><button type="button" onClick={saveReview} disabled={!review.trim()} className="primary-link save-button">{english?"Save note":"ثبت یادداشت"}</button>{reviews.map((r,i)=><div className="review-item" key={i}><strong>{r.rating?r.rating+' / 10':(english?'No rating':'بدون امتیاز')}</strong><p>{r.text}</p></div>)}</section>{details.cast?.length?<><h2 id="rmdb-cast" className="section-title">{english?"Cast":"بازیگران"}</h2><div className="filmography">{details.cast.map(a=><a key={a.id} href={'/RMDB/person/?id='+a.id+(english?'&lang=en':'')}>{a.name} ←</a>)}</div></>:null}{details.episodes?.length?<><h2 id="rmdb-episodes" className="section-title">{english?"Episodes":"قسمت‌های سریال"}</h2><div className="filterbar"><select aria-label={label("انتخاب فصل","Select season")} value={season} onChange={e=>setSeason(Number(e.target.value))}><option value={0}>{english?"All seasons":"همه فصل‌ها"}</option>{[...new Set(details.episodes.map(e=>e.season))].sort((a,b)=>a-b).map(s=><option key={s} value={s}>{label('فصل','Season')} {s}</option>)}</select></div><div className="episode-list">{details.episodes.filter(e=>season===0||e.season===season).map(e=><a key={e.id} href={"/RMDB/episode/?id="+e.id+(english?'&lang=en':'')}>{english?'Season':'فصل'} {e.season} · {english?'Episode':'قسمت'} {e.number??'—'} — {e.name} ←</a>)}</div></>:null}{details.related?.length?<section id="rmdb-related"><h2 className="section-title">{label('آثار مرتبط','Related titles')}</h2><div className="filmography">{details.related.map(x=><a key={x.id} href={'/RMDB/title/?id='+encodeURIComponent(x.id)+(english?'&lang=en':'')}>{x.title} {x.year?'· '+x.year:''} ←</a>)}</div></section>:null}</div></div></article>:<div role="status" className="empty">{status}</div>}</main><footer className="footer"><div className="layout">{label('RMDB · نمایش اطلاعات در همین سایت؛ ذکر منبع داده برای رعایت مجوز','RMDB · Facts are displayed here with data-source attribution')}</div></footer></>;
}
export default function TitlePage(){return <Suspense fallback={<main className="layout detail-area"><div className="skeleton-block" style={{height:200}} aria-hidden="true"/></main>}><DetailContent/></Suspense>}
