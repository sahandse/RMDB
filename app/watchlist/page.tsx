import BrandLogo from '@/app/components/brand-logo';
'use client';
import {useEffect,useState} from 'react';
type Saved={id:string;title:string;image?:string|null;year?:string};
const KEY='rmdb-watchlist-v1';
export default function Watchlist(){const [items,setItems]=useState<Saved[]>([]);useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch{setItems([])}},[]);
const remove=(id:string)=>{const next=items.filter(x=>x.id!==id);setItems(next);localStorage.setItem(KEY,JSON.stringify(next))};
return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/"><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/explore/">کاوش</a></nav></div></header><main className="layout detail-area"><span className="eyebrow">فهرست شخصی</span><h1>می‌خواهم تماشا کنم</h1><p className="detail-description">این فهرست فقط روی همین مرورگر ذخیره می‌شود؛ حساب کاربری یا همگام‌سازی ابری ندارد.</p>{items.length?<div className="search-results watchlist-grid">{items.map(item=><div className="result-item" key={item.id}><a href={'/RMDB/title/?id='+item.id}><strong>{item.title}</strong><p>{item.year||''}</p></a><button className="small-button" onClick={()=>remove(item.id)}>حذف</button></div>)}</div>:<div className="empty">هنوز فیلم یا سریالی به فهرستت اضافه نکردی.</div>}</main></>}
