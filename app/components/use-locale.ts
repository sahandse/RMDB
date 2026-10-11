'use client';
import {usePathname,useSearchParams} from 'next/navigation';
export function useLocale(){
 const path=usePathname();const params=useSearchParams();
 const en=path==='/en'||path.startsWith('/en/')||params.get('lang')==='en';
 return {
  en,
  t:(fa:string,english:string)=>en?english:fa,
  link:(url:string)=>{
   if(!en)return url;
   if(url==='/RMDB/'||url==='/RMDB')return '/RMDB/en/';
   if(url.startsWith('#'))return url;
   const [base,hash]=url.split('#');
   const [pathname,query]=base.split('?');
   const search=new URLSearchParams(query||'');
   search.set('lang','en');
   return pathname+'?'+search.toString()+(hash?'#'+hash:'');
  },
  number:(v:number)=>v.toLocaleString(en?'en-US':'fa-IR')
 };
}
