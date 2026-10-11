import BrandLogo from '@/app/components/brand-logo';
'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
type Details = { title: string; description: string; poster: string|null; facts: [string,string][]; source: string; originalTitle?: string; year?:string; cast?: {id:number;name:string}[]; episodes?: {id:number;name:string;season:number;number:number|null}[] };
const clean = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
function DetailContent() {
 const search = useSearchParams();
 const id = search.get('id') || '';
 const english=search.get('lang')==='en';
 const [details,setDetails] = useState<Details|null>(null);
 const [status,setStatus] = useState('در حال دریافت اطلاعات واقعی...');
 const [saved,setSaved]=useState(false);
 const [season,setSeason]=useState(0);
 const [personalRating,setPersonalRating]=useState(0);
 const [review,setReview]=useState('');
 const [reviews,setReviews]=useState<{rating:number;text:string;date:string}[]>([]);
 useEffect(()=>{try{setReviews(JSON.parse(localStorage.getItem('rmdb-reviews-'+id)||'[]'))}catch{setReviews([])}},[id]);
 const saveReview=()=>{if(!review.trim()||review.length>1000)return;const next=[{rating:personalRating,text:review.trim(),date:new Date().toISOString()},...reviews];localStorage.setItem('rmdb-reviews-'+id,JSON.stringify(next));setReviews(next);setReview('')};
 useEffect(()=>{try{setSaved((JSON.parse(localStorage.getItem('rmdb-watchlist-v1')||'[]') as {id:string}[]).some(x=>x.id===id))}catch{setSaved(false)}},[id]);
 const toggleSaved=()=>{if(!details)return;try{const list=JSON.parse(localStorage.getItem('rmdb-watchlist-v1')||'[]') as {id:string;title:string;year?:string;image?:string|null}[];const next=saved?list.filter(x=>x.id!==id):[...list.filter(x=>x.id!==id),{id,title:details.title,year:details.year,image:details.poster}];localStorage.setItem('rmdb-watchlist-v1',JSON.stringify(next));setSaved(!saved)}catch{}};
 useEffect(() => {
  let live = true;
  async function load() {
   setDetails(null);setStatus('در حال دریافت اطلاعات واقعی...');
   try {
    if (/^tv-\d+$/.test(id)) {
     const r = await fetch('https://api.tvmaze.com/shows/'+id.slice(3)+'?embed=cast');
     if (!r.ok) throw new Error('TVmaze');
     const d = await r.json();
     const cast = (d._embedded?.cast || []).slice(0,12).map((c: {person:{id:number;name:string}})=>({id:c.person.id,name:c.person.name}));
     const result: Details = {title:d.name,description:clean(d.summary||'خلاصه داستان هنوز ثبت نشده است.'),poster:d.image?.original||d.image?.medium||null,source:'TVmaze',originalTitle:d.name,year:(d.premiered||'').slice(0,4),facts:[['سال انتشار',(d.premiered||'').slice(0,4)||'نامشخص'],['ژانر',(d.genres||[]).join('، ')||'نامشخص'],['وضعیت',d.status||'نامشخص'],['شبکه',d.network?.name||d.webChannel?.name||'نامشخص'],['کشور',d.network?.country?.name||'نامشخص'],['امتیاز TVmaze',d.rating?.average?.toString()||'ثبت نشده'],['بازیگران',cast.length?cast.map((a:{name:string})=>a.name).join('، '):'نامشخص']]};
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
     const date=p('P577')?.time?.replace(/^\+/,'').slice(0,10)||'نامشخص';
     const file=p('P18');
     const quantity=(key:string)=>p(key)?.amount;
     const directorIds=(e.claims?.P57||[]).map((x:{mainsnak?:{datavalue?:{value?:{id?:string}}}})=>x.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0,8);
     let directors='نامشخص';
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
   } catch {if(live)setStatus('دریافت اطلاعات این عنوان ممکن نشد. اتصال اینترنت یا سرویس داده را بررسی کنید.');}
  }
  void load();return()=>{live=false};
 },[id,english]);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/"><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/">فارسی</a><a href="/RMDB/en/">English</a></nav></div></header><main className="layout detail-area"><a className="backlink" href="/RMDB/">← بازگشت به فیلم‌ها و سریال‌ها</a>{details?<article className="detail-cinema"><div className="cinema-backdrop" style={details.poster?{backgroundImage:"linear-gradient(90deg,#0b0e13ee,#0b0e13a8),url("+details.poster+")"}:{}}/><div className="detail-grid"><div className="detail-poster">{details.poster?<img src={details.poster} alt={'پوستر '+details.title}/>:<div className="empty">تصویر موجود نیست</div>}</div><div><div className="eyebrow">مرجع اطلاعات فیلم و سریال · {details.source}</div><h1 dir="auto">{details.title}</h1><div className="filterbar"><a className="secondary-link" href={"/RMDB/title/?id="+id}>فارسی</a><a className="secondary-link" href={"/RMDB/title/?id="+id+"&lang=en"}>English</a></div>{details.originalTitle&&details.originalTitle!==details.title?<p className="original-title" dir="auto">{details.originalTitle}</p>:null}<div className="cinema-pills"><span>{details.year||"سال نامشخص"}</span><span>{details.source}</span></div><button type="button" className="primary-link save-button" onClick={toggleSaved}>{saved?"✓ ذخیره‌شده در فهرست من":"+ افزودن به فهرست تماشا"}</button><p className="detail-description">{details.description}</p><h2 className="section-title">{english?"Title details":"مشخصات اثر"}</h2><dl className="fact-list">{details.facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><section className="local-reviews"><h2 className="section-title">{english?"My private rating and notes":"امتیاز و یادداشت من"}</h2><p className="source-note">این امتیازها شخصی و فقط در مرورگر شما ذخیره می‌شوند؛ امتیاز عمومی RMDB محسوب نمی‌شوند.</p><div className="filterbar"><select aria-label="امتیاز من" value={personalRating} onChange={e=>setPersonalRating(Number(e.target.value))}>{Array.from({length:11},(_,i)=><option key={i} value={i}>{i===0?'بدون امتیاز':i+' از ۱۰'}</option>)}</select></div><textarea maxLength={1000} value={review} onChange={e=>setReview(e.target.value)} placeholder="نقد یا یادداشت شخصی بنویس..." aria-label="یادداشت شخصی"/><button type="button" onClick={saveReview} disabled={!review.trim()} className="primary-link save-button">ثبت یادداشت</button>{reviews.map((r,i)=><div className="review-item" key={i}><strong>{r.rating?r.rating+' / ۱۰':'بدون امتیاز'}</strong><p>{r.text}</p></div>)}</section>{details.cast?.length?<><h2 className="section-title">{english?"Cast":"بازیگران"}</h2><div className="filmography">{details.cast.map(a=><a key={a.id} href={'/RMDB/person/?id='+a.id}>{a.name} ←</a>)}</div></>:null}{details.episodes?.length?<><h2 className="section-title">{english?"Episodes":"قسمت‌های سریال"}</h2><div className="filterbar"><select aria-label="انتخاب فصل" value={season} onChange={e=>setSeason(Number(e.target.value))}><option value={0}>همه فصل‌ها</option>{[...new Set(details.episodes.map(e=>e.season))].sort((a,b)=>a-b).map(s=><option key={s} value={s}>فصل {s}</option>)}</select></div><div className="episode-list">{details.episodes.filter(e=>season===0||e.season===season).map(e=><a key={e.id} href={"/RMDB/episode/?id="+e.id}>فصل {e.season} · قسمت {e.number??'—'} — {e.name} ←</a>)}</div></>:null}</div></div></article>:<div role="status" className="empty">{status}</div>}</main><footer className="footer"><div className="layout">RMDB · نمایش اطلاعات در همین سایت؛ ذکر منبع داده برای رعایت مجوز</div></footer></>;
}
export default function TitlePage(){return <Suspense fallback={<main className="layout detail-area">در حال بارگذاری…</main>}><DetailContent/></Suspense>}
