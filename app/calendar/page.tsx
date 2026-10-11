'use client';
import {useEffect,useState} from 'react';
type Airing={id:number;name:string;airdate:string;season:number;number:number|null;show?:{id:number;name:string;image?:{medium?:string}}};
const dateFa=(s:string)=>s?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(new Date(s+'T12:00:00Z')):'نامشخص';
export default function Calendar(){
 const [items,setItems]=useState<Airing[]>([]),[error,setError]=useState(''),[day,setDay]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('https://api.tvmaze.com/schedule?country=US',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setItems(d)).catch(()=>setError('دریافت برنامه پخش ممکن نشد.'));return()=>controller.abort()},[]);
 const dates=[...new Set(items.map(x=>x.airdate))].sort();
 const shown=items.filter(x=>!day||x.airdate===day);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/">RMDB.</a><nav className="navlinks"><a href="/RMDB/">خانه</a><a href="/RMDB/explore/">کاوش</a></nav></div></header><main className="layout detail-area"><span className="eyebrow">تقویم انتشار قسمت‌ها</span><h1>جدول پخش سریال‌ها</h1><p className="detail-description">اطلاعات واقعی TVmaze؛ محدوده فعلی جدول پخش آمریکا است و برای همه کشورها یا سرویس‌های استریم کامل نیست.</p><div className="filterbar"><button onClick={()=>setDay('')} className={!day?'active':''}>همه</button>{dates.map(d=><button key={d} className={day===d?'active':''} onClick={()=>setDay(d)}>{dateFa(d)}</button>)}</div>{error?<div className="empty">{error}</div>:shown.length?<div className="search-results">{shown.map(e=><a href={'/RMDB/title/?id=tv-'+e.show?.id} className="result-item" key={e.id}><div>{e.show?.image?.medium?<img src={e.show.image.medium} alt=""/>:<span>📺</span>}</div><section><strong>{e.show?.name||e.name}</strong><p>{dateFa(e.airdate)} · فصل {e.season} · قسمت {e.number??'—'} · {e.name}</p></section></a>)}</div>:<div className="empty">فعلاً موردی دریافت نشده است.</div>}</main></>;
}
