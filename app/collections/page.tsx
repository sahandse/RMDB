'use client';
import BrandLogo from '@/app/components/brand-logo';
import {Suspense,useEffect,useMemo,useState} from 'react';
import {useSearchParams} from 'next/navigation';
type Entry={id:string;title:string;titleEn?:string|null;year?:string|null;image?:string|null;rating?:number|null};
type Catalog={movies:Entry[];shows:Entry[]};
const recent=(a:Entry,b:Entry)=>(b.year||'').localeCompare(a.year||'')||a.title.localeCompare(b.title);
const categories={
 'new-movies':{fa:'فیلم‌های جدید',en:'Latest movies',type:'movies',ranked:false},
 'new-series':{fa:'سریال‌های جدید',en:'Latest TV series',type:'shows',ranked:false},
 'top-movies':{fa:'۲۵۰ فیلم برتر',en:'Top 250 movies',type:'movies',ranked:true},
 'top-series':{fa:'۲۵۰ سریال برتر',en:'Top 250 TV series',type:'shows',ranked:true}
} as const;
function Collection(){
 const query=useSearchParams();const en=query.get('lang')==='en';
 const raw=query.get('category')||'top-movies';
 const category=Object.prototype.hasOwnProperty.call(categories,raw)?raw as keyof typeof categories:'top-movies';
 const config=categories[category];const t=(fa:string,enText:string)=>en?enText:fa;
 const [catalog,setCatalog]=useState<Catalog|null>(null);const [error,setError]=useState(false);
 const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [year,setYear]=useState('all');
 useEffect(()=>{const controller=new AbortController();fetch('/RMDB/data/catalog.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Catalog unavailable');return r.json()}).then(setCatalog).catch(()=>{if(!controller.signal.aborted)setError(true)});return()=>controller.abort()},[]);
 useEffect(()=>{setPage(1);setSearch('');setYear('all')},[category]);
 const entries=useMemo(()=>{const base=[...(config.type==='movies'?catalog?.movies||[]:catalog?.shows||[])];
 return config.ranked?base.filter(x=>typeof x.rating==='number'&&Number.isFinite(x.rating)).sort((a,b)=>(b.rating??0)-(a.rating??0)||recent(a,b)).slice(0,250):base.sort(recent)},[catalog,category,config.ranked,config.type]);
 const years=useMemo(()=>[...new Set(entries.map(x=>x.year).filter(Boolean))].sort().reverse() as string[],[entries]);
 const filtered=useMemo(()=>entries.filter(x=>(year==='all'||x.year===year)&&(!search.trim()||(x.title+' '+(x.titleEn||'')).toLowerCase().includes(search.trim().toLowerCase()))),[entries,search,year]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/24));const current=Math.min(page,totalPages);
 const selected=filtered.slice((current-1)*24,current*24);
 const link=(name:string)=>'/RMDB/collections/?category='+name+(en?'&lang=en':'');
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href={en?'/RMDB/en/':'/RMDB/'}><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/">{t('خانه','Home')}</a><a href={en?'/RMDB/en/':'/RMDB/'}>{t('فیلم و سریال','Movies and TV')}</a></nav></div></header><main className="layout rmdb-collection"><a className="backlink" href={en?'/RMDB/en/':'/RMDB/'}>{t('← صفحه اصلی','← Homepage')}</a><header className="rmdb-collection-hero"><span className="eyebrow">RMDB / {config.ranked?t('برترین‌ها','Best of cinema'):t('تازه‌ها','Fresh releases')}</span><h1>{en?config.en:config.fa}</h1><p>{config.ranked?t('رتبه‌بندی بر اساس امتیازهای واقعی ثبت‌شده در آرشیو؛ این فهرست رتبه رسمی IMDb نیست.','Ranked by available archive ratings, not IMDb official ranking.'):t('تازه‌ترین آثار آرشیو، مرتب‌شده بر اساس سال انتشار.','Latest catalog titles sorted by release year.')}</p><div className="rmdb-collection-stats"><span>✦ {entries.length.toLocaleString(en?'en-US':'fa-IR')} {t('عنوان موجود','available titles')}</span><span>{config.ranked?t('حداکثر ۲۵۰ اثر','Up to 250 titles'):t('به‌روزرسانی خودکار','Automatically updated')}</span></div></header><nav className="rmdb-collection-tabs">{Object.entries(categories).map(([key,value])=><a className={key===category?'active':''} href={link(key)} key={key}>{en?value.en:value.fa}</a>)}</nav><div className="rmdb-collection-controls"><input aria-label={t('جستجو در فهرست','Search titles')} placeholder={t('جستجو در همین فهرست…','Search this collection…')} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/><select aria-label={t('فیلتر سال انتشار','Release year filter')} value={year} onChange={e=>{setYear(e.target.value);setPage(1)}}><option value="all">{t('همه سال‌ها','All years')}</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div>{catalog?<>{selected.length?<div className="rmdb-collection-grid">{selected.map((item,i)=><a className="rmdb-collection-card" href={'/RMDB/title/?id='+encodeURIComponent(item.id)+(en?'&lang=en':'')} key={item.id}><div className="rmdb-collection-poster">{item.image?<img src={item.image} alt={item.title} loading="lazy" onError={e=>{e.currentTarget.hidden=true}}/>:<span>🎬</span>}{config.ranked&&!search&&!year.startsWith('20')?<strong className="rmdb-rank">#{(current-1)*24+i+1}</strong>:null}</div><div className="rmdb-collection-card-meta"><strong dir="auto">{en?item.titleEn||item.title:item.title}</strong><div><span>{item.year||'—'}</span>{item.rating!=null?<span className="rmdb-rating">★ {item.rating.toFixed(1)}</span>:null}</div></div></a>)}</div>:<div className="empty">{t('عنوانی مطابق فیلتر فعلی پیدا نشد.','No matching titles.')}</div>}<nav className="rmdb-collection-pages"><button disabled={current<=1} onClick={()=>{setPage(current-1);window.scrollTo({top:0,behavior:'smooth'})}}>{t('قبلی','Previous')}</button><span>{current.toLocaleString(en?'en-US':'fa-IR')} / {totalPages.toLocaleString(en?'en-US':'fa-IR')}</span><button disabled={current>=totalPages} onClick={()=>{setPage(current+1);window.scrollTo({top:0,behavior:'smooth'})}}>{t('بعدی','Next')}</button></nav></>:<div className="empty">{error?t('آرشیو فعلاً در دسترس نیست.','Catalog unavailable.'):t('در حال دریافت آرشیو…','Loading catalog…')}</div>}</main></>
}
export default function CollectionsPage(){return <Suspense fallback={<main className="layout detail-area"><div className="skeleton-block" style={{height:240}}/></main>}><Collection/></Suspense>}
