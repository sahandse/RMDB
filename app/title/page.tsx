'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
type Details = { title: string; description: string; poster: string|null; facts: [string,string][]; source: string; originalTitle?: string; year?:string; cast?: {id:number;name:string}[]; episodes?: {id:number;name:string;season:number;number:number|null}[] };
const clean = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
function DetailContent() {
 const search = useSearchParams();
 const id = search.get('id') || '';
 const [details,setDetails] = useState<Details|null>(null);
 const [status,setStatus] = useState('در حال دریافت اطلاعات واقعی...');
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
     result.episodes=Array.isArray(ep)?ep.slice(0,250).map((e:{id:number;name:string;season:number;number:number|null})=>({id:e.id,name:e.name,season:e.season,number:e.number})):[];
     if(live)setDetails(result);
    } else if (/^wd-Q\d+$/.test(id)) {
     const qid = id.slice(3);
     const r = await fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+qid+'&languages=fa%7Cen&props=labels%7Cdescriptions%7Cclaims&format=json&origin=*');
     if (!r.ok) throw new Error('Wikidata');
     const d = await r.json();const e = d.entities?.[qid];if(!e||e.missing)throw new Error('missing');
     const title=e.labels?.fa?.value||e.labels?.en?.value||qid;
     const description=e.descriptions?.fa?.value||e.descriptions?.en?.value||'توضیحات این اثر هنوز ثبت نشده است.';
     const originalTitle=e.labels?.en?.value||title;
     const p=(key:string)=>e.claims?.[key]?.[0]?.mainsnak?.datavalue?.value;
     const date=p('P577')?.time?.replace(/^\+/,'').slice(0,10)||'نامشخص';
     const file=p('P18');
     const poster=typeof file==='string'?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=600':null;
     if(live)setDetails({title,description,poster,source:'Wikidata',originalTitle,year:date.slice(0,4),facts:[['تاریخ انتشار',date],['شناسه Wikidata',qid]]});
    } else throw new Error('invalid');
   } catch {if(live)setStatus('دریافت اطلاعات این عنوان ممکن نشد. اتصال اینترنت یا سرویس داده را بررسی کنید.');}
  }
  void load();return()=>{live=false};
 },[id]);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/">RMDB.</a><nav className="navlinks"><a href="/RMDB/">صفحه اصلی</a></nav></div></header><main className="layout detail-area"><a className="backlink" href="/RMDB/">← بازگشت به فیلم‌ها و سریال‌ها</a>{details?<article className="detail-cinema"><div className="cinema-backdrop" style={details.poster?{backgroundImage:"linear-gradient(90deg,#0b0e13ee,#0b0e13a8),url("+details.poster+")"}:{}}/><div className="detail-grid"><div className="detail-poster">{details.poster?<img src={details.poster} alt={'پوستر '+details.title}/>:<div className="empty">تصویر موجود نیست</div>}</div><div><div className="eyebrow">مرجع اطلاعات فیلم و سریال · {details.source}</div><h1>{details.title}</h1>{details.originalTitle&&details.originalTitle!==details.title?<p className="original-title" dir="auto">{details.originalTitle}</p>:null}<div className="cinema-pills"><span>{details.year||"سال نامشخص"}</span><span>{details.source}</span></div><p className="detail-description">{details.description}</p><h2 className="section-title">مشخصات اثر</h2><dl className="fact-list">{details.facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>{details.cast?.length?<><h2 className="section-title">بازیگران</h2><div className="filmography">{details.cast.map(a=><a key={a.id} href={'/RMDB/person/?id='+a.id}>{a.name} ←</a>)}</div></>:null}{details.episodes?.length?<><h2 className="section-title">قسمت‌های سریال</h2><div className="episode-list">{details.episodes.map(e=><div key={e.id}>فصل {e.season} · قسمت {e.number??'—'} — {e.name}</div>)}</div></>:null}</div></div></article>:<div role="status" className="empty">{status}</div>}</main><footer className="footer"><div className="layout">RMDB · نمایش اطلاعات در همین سایت؛ ذکر منبع داده برای رعایت مجوز</div></footer></>;
}
export default function TitlePage(){return <Suspense fallback={<main className="layout detail-area">در حال بارگذاری…</main>}><DetailContent/></Suspense>}
