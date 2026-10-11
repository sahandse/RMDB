'use client';
import {useEffect} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
export default function LanguageSwitch(){
 const raw=usePathname();const path=raw.replace(/\/$/,'')||'/';const params=useSearchParams();
 const en=path==='/en'||params.get('lang')==='en';
 useEffect(()=>{document.documentElement.lang=en?'en':'fa';document.documentElement.dir=en?'ltr':'rtl'},[en]);
 const next=new URLSearchParams(params.toString());next.delete('lang');
 let route=path;
 if(path==='/'||path==='/en'){route=en?'/':'/en'}else if(!en){next.set('lang','en')}
 const q=next.toString();const destination='/RMDB'+(route==='/'?'/':route+'/')+(q?'?'+q:'');
 return <a href={destination} className="locale-toggle" lang={en?'fa':'en'} aria-label={en?'Switch to Persian':'تغییر زبان به انگلیسی'}>{en?'فارسی':'English'}</a>;
}
