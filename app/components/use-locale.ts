'use client';
import {useEffect,useState} from 'react';
export function useLocale(){const [en,setEn]=useState(false);useEffect(()=>{const check=()=>setEn(location.pathname.replace(/\/RMDB\/|\/$/g,'').startsWith('en')||new URLSearchParams(location.search).get('lang')==='en');check();window.addEventListener('popstate',check);return()=>window.removeEventListener('popstate',check)},[]);return {en,t:(fa:string,english:string)=>en?english:fa,link:(url:string)=>en?(url.includes('?')?url+'&lang=en':url+'?lang=en'):url,number:(v:number)=>v.toLocaleString(en?'en-US':'fa-IR')};}
