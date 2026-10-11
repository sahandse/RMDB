'use client';
import BrandLogo from '@/app/components/brand-logo';
import {useLocale} from '@/app/components/use-locale';
import {useEffect,useState} from 'react';
type Saved={id:string;title:string;image?:string|null;year?:string};
const KEY='rmdb-watchlist-v1';
export default function Watchlist(){const {en,t,link}=useLocale();const [items,setItems]=useState<Saved[]>([]);useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch{setItems([])}},[]);
const remove=(id:string)=>{const next=items.filter(x=>x.id!==id);setItems(next);localStorage.setItem(KEY,JSON.stringify(next))};
return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/"><BrandLogo/></a><nav className="navlinks"><a href="/RMDB/explore/">{t("کاوش","Explore")}</a></nav></div></header><main className="layout detail-area"><span className="eyebrow">{t("فهرست شخصی","My list")}</span><h1>{t("می‌خواهم تماشا کنم","My watchlist")}</h1><p className="detail-description">{t("این فهرست فقط روی همین مرورگر ذخیره می‌شود؛ حساب کاربری یا همگام‌سازی ابری ندارد.","Saved only on this device. No account or cloud syncing.")}</p>{items.length?<div className="search-results watchlist-grid">{items.map(item=><div className="result-item" key={item.id}><a href={link('/RMDB/title/?id+'+item.id)}><strong>{item.title}</strong><p>{item.year||''}</p></a><button className="small-button" onClick={()=>remove(item.id)}>{t("حذف","Remove")}</button></div>)}</div>:<div className="empty">{t("هنوز فیلم یا سریالی به فهرستت اضافه نکردی.","Your watchlist is empty.")}</div>}</main></>}
