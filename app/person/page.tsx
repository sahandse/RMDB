'use client';
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
type Person={name:string;birthday?:string;country?:{name:string};image?:{medium?:string}};
type Credit={_embedded?:{show?:{id:number;name:string}}};
function Profile(){
 const id=useSearchParams().get('id')||'';
 const [person,setPerson]=useState<Person|null>(null);
 const [credits,setCredits]=useState<Credit[]>([]);
 useEffect(()=>{if(!/^\d+$/.test(id))return;const controller=new AbortController();Promise.all([fetch('https://api.tvmaze.com/people/'+id,{signal:controller.signal}),fetch('https://api.tvmaze.com/people/'+id+'/castcredits?embed=show',{signal:controller.signal})]).then(async([p,c])=>{if(!p.ok)return;setPerson(await p.json());if(c.ok)setCredits(await c.json())}).catch(()=>{});return()=>controller.abort()},[id]);
 return <><header className="topbar"><div className="layout navbar"><a href="/RMDB/" className="logo">RMDB.</a><nav className="navlinks"><a href="/RMDB/people/">بازیگران</a></nav></div></header><main className="layout detail-area">{person?<div className="detail-grid"><div className="detail-poster">{person.image?.medium?<img src={person.image.medium} alt={person.name}/>:<div className="empty">تصویر موجود نیست</div>}</div><div><h1>{person.name}</h1><p>تاریخ تولد: {person.birthday||'نامشخص'}</p><p>کشور: {person.country?.name||'نامشخص'}</p><h2 className="section-title">آثار تلویزیونی</h2><div className="filmography">{credits.map((x,i)=>x._embedded?.show?<a key={i} href={'/RMDB/title/?id=tv-'+x._embedded.show.id}>{x._embedded.show.name}</a>:null)}</div></div></div>:<div className="empty">در حال دریافت اطلاعات هنرمند...</div>}</main></>;
}
export default function PersonPage(){return <Suspense fallback={<div className="layout">در حال بارگذاری...</div>}><Profile/></Suspense>}
