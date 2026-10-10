'use client';
import {useEffect,useState} from 'react';
type Person={id:number;name:string;image?:{medium?:string}};
export default function People(){
 const [query,setQuery]=useState('');const [people,setPeople]=useState<Person[]>([]);
 useEffect(()=>{if(!query.trim()){setPeople([]);return}const controller=new AbortController();const timer=setTimeout(()=>{fetch('https://api.tvmaze.com/search/people?q='+encodeURIComponent(query),{signal:controller.signal}).then(r=>r.json()).then((data:{person:Person}[])=>setPeople(data.map(x=>x.person))).catch(()=>setPeople([]))},400);return()=>{clearTimeout(timer);controller.abort()}},[query]);
 return <><header className="topbar"><div className="layout navbar"><a className="logo" href="/RMDB/">RMDB.</a><nav className="navlinks"><a href="/RMDB/search/">جستجو</a></nav></div></header><main className="layout detail-area"><h1>بازیگران و هنرمندان</h1><input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام هنرمند را بنویس..." aria-label="نام هنرمند"/><div className="cards">{people.map(p=><a className="movie" href={'/RMDB/person/?id='+p.id} key={p.id}><div className="poster">{p.image?.medium?<img src={p.image.medium} alt={p.name}/>:<span>بدون تصویر</span>}</div><h3>{p.name}</h3></a>)}</div>{!people.length&&<div className="empty">برای نمایش هنرمندان، جستجو کن.</div>}</main></>;
}