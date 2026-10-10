'use client';
import { Suspense,useEffect,useState } from 'react';
import {useSearchParams} from 'next/navigation';
type Hit={id:string;name:string;kind:'movie'|'series'|'person';year?:string;image?:string|null;desc?:string};
function SearchBody(){
 const params=useSearchParams(),initial=params.get('q')||'';
 const [query,setQuery]=useState(initial),[results,setResults]=useState<Hit[]>([]),[loading,setLoading]=useState(false),[filter,setFilter]=useState('all');
 useEffect(()=>{setQuery(initial)},[initial]);
 useEffect(()=>{
  if(!query.trim()){setResults([]);return}
  const controller=new AbortController();const timer=setTimeout(async()=>{
   setLoading(true);
   try{
    const term=encodeURIComponent(query.trim());
    const [tv,wiki]=await Promise.allSettled([
      fetch('https://api.tvmaze.com/search/shows?q='+term,{signal:controller.signal}).then(r=>r.ok?r.json():[]),
      fetch('https://www.wikidata.org/w/api.php?action=wbsearchentities&search='+term+'&language=fa&uselang=fa&type=item&limit=20&format=json&origin=*',{signal:controller.signal}).then(r=>r.ok?r.json():{search:[]})
    ]);
    const shows:Hit[]=tv.status==='fulfilled'?tv.value.map((v:{show:{id:number;name:string;premiered?:string;image?:{medium?:string};summary?:string}})=>({id:'tv-'+v.show.id,name:v.show.name,kind:'series',year:v.show.premiered?.slice(0,4),image:v.show.image?.medium})): [];
    const items:Hit[]=wiki.status==='fulfilled'?wiki.value.search.map((v:{id:string;label:string;description?:string})=>({id:'wd-'+v.id,name:v.label,kind:'movie',desc:v.description})): [];
    if(!controller.signal.aborted)setResults([...shows,...items]);
   }catch{if(!controller.signal.aborted)setResults([])}
   finally{if(!controller.signal.aborted)setLoading(false)}
  },400);
  return ()=>{clearTimeout(timer);controller.abort()}
 },[query]);
 const visible=results.filter(r=>filter==='all'||r.kind===filter);
 return <><header className="topbar"><div className="layout navbar"><a href="/RMDB/" className="logo">RMDB.</a><nav className="navlinks"><a href="/RMDB/">خانه</a><a href="/RMDB/people/">بازیگران</a></nav></div></header><main className="layout detail-area"><div className="eyebrow">جستجوی مستقل RMDB</div><h1>دنبال چه فیلم یا سریالی می‌گردی؟</h1><input className="search-input" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام فارسی یا انگلیسی را بنویس..." aria-label="جستجوی فیلم و سریال"/><div className="filterbar">{[['all','همه'],['series','سریال‌ها'],['movie','فیلم‌ها و موارد ویکی‌داده']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div>{loading?<div className="empty">در حال جستجوی داده‌های واقعی…</div>:!query.trim()?<div className="empty">نام فیلم یا سریال را وارد کن.</div>:visible.length?<div className="search-results">{visible.map(v=><a key={v.id} className="result-item" href={'/RMDB/title/?id='+v.id}><div>{v.image?<img src={v.image} alt="" loading="lazy"/>:<span>🎬</span>}</div><section><strong>{v.name}</strong><p>{v.desc|| (v.kind==='series'?'سریال':'نتیجه Wikidata؛ نوع اثر در صفحه جزئیات بررسی شود')} {v.year||''}</p></section><b>←</b></a>)}</div>:<div className="empty">نتیجه‌ای دریافت نشد. ممکن است سرویس در دسترس نباشد یا موردی پیدا نشده باشد.</div>}<p className="source-note">نتایج Wikidata ممکن است شامل مواردی غیر از فیلم باشند و هنوز فیلتر نوع اثر ندارند. منبع داده: Wikidata و TVmaze.</p></main></>;
}
export default function Search(){return <Suspense fallback={<main className="layout">بارگذاری جستجو…</main>}><SearchBody/></Suspense>}
