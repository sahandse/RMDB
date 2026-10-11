'use client';
import {usePathname,useSearchParams} from 'next/navigation';
export function useLocale(){const pathname=usePathname();const params=useSearchParams();const en=pathname.startsWith('/en')||params.get('lang')==='en';return {en,t:(fa:string,english:string)=>en?english:fa,link:(url:string)=>en?(url.includes('?')?url+'&lang=en':url+'?lang=en'):url,number:(v:number)=>v.toLocaleString(en?'en-US':'fa-IR')};}
