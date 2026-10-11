'use client';
import BrandLogo from '@/app/components/brand-logo';
import {Suspense,useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
type PersonEntry={id:string;title:string;titleEn?:string|null;birth?:string|null;image?:string|null};
type ShowEntry={id:string;title:string;titleEn?:string|null;year?:string|null;image?:string|null;cast?:{id:number;name:string;character?:string|null}[]};
type Catalog={people?:PersonEntry[];shows?:ShowEntry[]};
function Profile(){
 const params=useSearchParams();const id=params.get('id')||'';const en=params.get('lang')==='en';const t=(fa:string,english:string)=>en?english:fa;
 const [catalog,setCatalog]=useState<Catalog|null>(null);const [error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/RMDB/data/catalog.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then((d:Catalog)=>setCatalog(d)).catch(()=>{if(!controller.signal.aborted)setError(t('اطلاعات در آرشیو داخلی پیدا نشد.','No locally archived data available.'))});return()=>controller.abort()},[id,en]);
 const person=useMemo(()=>catalog?.people?.find(x=>x.id==='tvp-'+id||x.id===id)||null,[catalog,id]);
 const work=useMemo(()=>catalog?.shows?.flatMap(show=>(show.cast||[]).filter(a=>String(a.id)===id).map(a=>({id:show.id,title:show.title,titleEn:show.titleEn,year:show.year,role:a.character})))||[],[catalog,id]);
 const displayName=person?(en?person.titleEn||person.title:person.title):work[0]?(catalog?.shows||[]).flatMap(s=>s.cast||[]).find(a=>String(a.id)===id)?.name||'':null;
 return <><header className="topbar"><div className="layout navbar"><a href={en?'/RMDB/en/':'/RMDB/'} className="logo"><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/people/">{t('هنرمندان','People')}</a></nav></div></header><main className="layout detail-area"><a className="backlink" href="/RMDB/people/">{t('← بازگشت به هنرمندان','← Back to people')}</a>{displayName?<article className="detail-cinema"><div className="detail-grid"><div className="detail-poster">{person?.image?<img src={person.image} alt={displayName} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="empty">{t('تصویر موجود نیست','No image available')}</div>}</div><div><div className="eyebrow">RMDB · {t('هنرمند','Artist')}</div><h1 dir="auto">{displayName}</h1>{person?.birth?<p className="original-title">{t('تاریخ تولد','Date of birth')}: {person.birth}</p>:null}<h2 className="section-title">{t('فیلم‌شناسی ثبت‌شده','Archived filmography')}</h2>{work.length?<div className="filmography">{work.map((x,i)=><a key={x.id+'-'+i} href={'/RMDB/title/?id='+encodeURIComponent(x.id)+(en?'&lang=en':'')}>{en?x.titleEn||x.title:x.title}{x.year?' · '+x.year:''}{x.role?' · '+x.role:''} ←</a>)}</div>:<p className="source-note">{t('در آرشیو فعلی اثر مرتبطی ثبت نشده است.','No matching archived title yet.')}</p>}</div></div></article>:<div role="status" className="empty">{catalog?t('پروفایل این هنرمند هنوز در آرشیو RMDB موجود نیست.','This profile is not archived in RMDB yet.'):error||t('در حال بارگذاری…','Loading…')}</div>}</main></>;
}
export default function PersonPage(){return <Suspense fallback={<main className="layout detail-area"><div className="skeleton-block" style={{height:200}}/></main>}><Profile/></Suspense>}
