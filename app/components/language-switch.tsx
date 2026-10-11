'use client';
import {usePathname,useSearchParams} from 'next/navigation';
import {useEffect} from 'react';
export default function LanguageSwitch(){
 const path=usePathname(),params=useSearchParams();
 const en=path.startsWith('/en')||params.get('lang')==='en';
 useEffect(()=>{document.documentElement.lang=en?'en':'fa';document.documentElement.dir=en?'ltr':'rtl';},[en]);
 const search=new URLSearchParams(params.toString());
 const target=en?'fa':'en';
 if(target==='fa')search.delete('lang');else search.set('lang','en');
 const suffix=search.toString()?'?'+search.toString():'';
 const destination=path==='/en'?'/RMDB/':path==='/'?'/RMDB/en/':'/RMDB'+path+suffix;
 return <a className="locale-toggle" href={destination} aria-label={en?'Switch to Persian':'Switch to English'}>{en?'فارسی':'English'}</a>;
}
