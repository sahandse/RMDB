'use client';
import BrandLogo from '@/app/components/brand-logo';
import {useLocale} from '@/app/components/use-locale';
import {useEffect,useState} from 'react';
type Airing={id:number;name:string;airdate:string;season:number;number:number|null;show?:{id:number;name:string;image?:{medium?:string}}};
const formatDate=(s:string,en:boolean)=>s?new Intl.DateTimeFormat(en?'en-US':'fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(new Date(s+'T12:00:00Z')):(en?'Unknown':'نامشخص');
export default function Calendar(){const {en,t,link}=useLocale();
 const [items,setItems]=useState<Airing[]>([]),[error,setError]=useState(''),[day,setDay]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('https://api.tvmaze.com/schedule?country=US',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setItems(d)).catch(()=>setError(t("دریافت برنامه پخش ممکن نشد.","Unable to load episode schedule.")));return()=>controller.abort()},[]);
 const dates=[...new Set(items.map(x=>x.airdate))].sort();
 const shown=items.filter(x=>!day||x.airdate===day);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href={en?'/RMDB/en/':'/RMDB/'}><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/">{t("خانه","Home")}</a><a href={link("/RMDB/explore/")}>{t("کاوش","Explore")}</a></nav></div></header><main className="layout detail-area"><span className="eyebrow">{t("تقویم انتشار قسمت‌ها","Episode schedule")}</span><h1>{t("جدول پخش سریال‌ها","TV schedule")}</h1><p className="detail-description">{t("اطلاعات واقعی TVmaze؛ محدوده فعلی جدول پخش آمریکا است و برای همه کشورها یا سرویس‌های استریم کامل نیست.","Live TVmaze schedule data for the United States. Other countries and streaming services may not be covered.")}</p><div className="filterbar"><button onClick={()=>setDay('')} className={!day?'active':''}>{t("همه","All")}</button>{dates.map(d=><button key={d} className={day===d?'active':''} onClick={()=>setDay(d)}>{formatDate(d,en)}</button>)}</div>{error?<div className="empty">{error}</div>:shown.length?<div className="search-results calendar-grid">{shown.map(e=><a href={link('/RMDB/title/?id=tv-'+e.show?.id)} className="result-item" key={e.id}><div>{e.show?.image?.medium?<img src={e.show.image.medium} alt=""/>:<span>📺</span>}</div><section><strong>{e.show?.name||e.name}</strong><p>{formatDate(e.airdate,en)} · فصل {e.season} · قسمت {e.number??'—'} · {e.name}</p></section></a>)}</div>:<div className="empty">{t("فعلاً موردی دریافت نشده است.","No episodes found.")}</div>}</main></>;
}
