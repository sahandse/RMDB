'use client';
import {useEffect,useState} from 'react';
export function useLocale(){
 const [en,setEn]=useState(false);
 useEffect(()=>{
  const sync=()=>{const route=window.location.pathname;setEn(/\/RMDB\/en\/?$/.test(route)||new URLSearchParams(window.location.search).get('lang')==='en')};
  sync();window.addEventListener('popstate',sync);
  return ()=>window.removeEventListener('popstate',sync);
 },[]);
 return {
  en,t:(fa:string,english:string)=>en?english:fa,
  link:(url:string)=>{
   if(!en)return url;
   if(url==='/RMDB/'||url==='/RMDB')return '/RMDB/en/';
   if(url.startsWith('#'))return url;
   const [beforeHash,...hashParts]=url.split('#');
   const [pathname,query]=beforeHash.split('?');
   const params=new URLSearchParams(query||'');
   params.set('lang','en');
   return pathname+'?'+params.toString()+(hashParts.length?'#'+hashParts.join('#'):'');
  },
  number:(v:number)=>v.toLocaleString(en?'en-US':'fa-IR')
 };
}
