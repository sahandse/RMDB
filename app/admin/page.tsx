'use client';
import BrandLogo from '@/app/components/brand-logo';
import {useState} from 'react';
const base='https://api.github.com/repos/sahandse/RMDB';
export default function AdminPage(){
 const [token,setToken]=useState(''),[logged,setLogged]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[auto,setAuto]=useState<boolean|null>(null);
 async function request(path:string,method='GET',body?:unknown){
  const r=await fetch(path.startsWith('https://')?path:base+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error('GitHub API '+r.status+' — '+(await r.text()).slice(0,170));
  return r.status===204?null:r.json();
 }
 async function login(){setBusy(true);try{
  const me=await request('https://api.github.com/user');
  if(me.login!=='sahandse')throw Error('فقط حساب مدیر مخزن مجاز است.');
  await request('/actions/workflows/telegram-sync.yml');
  const variable=await request('/actions/variables/RMDB_AUTO_IMPORT_ENABLED').catch(()=>null);
  setAuto(variable?.value!=='false');setLogged(true);setNotice('اتصال مدیر تأیید شد. کلید فقط در حافظه این صفحه نگه داشته می‌شود.');
 }catch(e){setNotice(String(e))}finally{setBusy(false)}}
 async function run(){setBusy(true);try{await request('/actions/workflows/telegram-sync.yml/dispatches','POST',{ref:'main'});setNotice('درخواست ورود حداکثر ۱۰ فیلم و ۱۰ سریال ثبت شد؛ نتیجه را در Actions بررسی کن.')}catch(e){setNotice(String(e))}finally{setBusy(false)}}
 async function setAutomatic(value:boolean){setBusy(true);try{
  await request('/actions/variables/RMDB_AUTO_IMPORT_ENABLED','PATCH',{name:'RMDB_AUTO_IMPORT_ENABLED',value:String(value)}).catch(async()=>request('/actions/variables','POST',{name:'RMDB_AUTO_IMPORT_ENABLED',value:String(value)}));
  setAuto(value);setNotice(value?'اجرای زمان‌بندی‌شده فعال شد.':'اجرای زمان‌بندی‌شده غیرفعال شد؛ اجرای دستی همچنان مجاز است.');
 }catch(e){setNotice(String(e))}finally{setBusy(false)}}
 return <main className="layout rmdb-admin"><header className="rmdb-admin-head"><BrandLogo/><a href="/RMDB/">بازگشت به سایت</a></header><div className="rmdb-admin-intro"><span>پنل مدیریت اختصاصی</span><h1>کنترل آرشیو RMDB</h1><p>مدیریت ورود واقعی فیلم و سریال، بدون دیتای نمایشی و بدون قرارگرفتن رمز در کد سایت.</p></div>{!logged?<section className="rmdb-admin-panel"><h2>ورود مدیر با GitHub</h2><p>برای مدیریت امن GitHub Pages، توکن Fine-grained GitHub با دسترسی Actions: Read and write و Variables: Read and write برای همین مخزن لازمه. این توکن رمز ورود محسوب می‌شه؛ داخل حافظه همین صفحه است و ذخیره دائمی نمی‌شه.</p><label htmlFor="admin-token">توکن دسترسی GitHub</label><input id="admin-token" type="password" autoComplete="off" placeholder="github_pat_..." value={token} onChange={e=>setToken(e.target.value)}/><button onClick={login} disabled={busy||!token.trim()}>بررسی دسترسی و ورود</button></section>:<div className="rmdb-admin-grid"><section className="rmdb-admin-panel"><span>ورود دستی</span><h2>۱۰ فیلم + ۱۰ سریال</h2><p>درخواست یک نوبت ورود، تکمیل اطلاعات و انتشار واقعی روی سایت را ثبت کن.</p><button disabled={busy} onClick={run}>اجرای دستی واردکننده</button></section><section className="rmdb-admin-panel"><span>زمان‌بندی</span><h2>اجرای خودکار هر ۱۰ دقیقه</h2><p>درخواست‌های روزانه OMDb و بررسی مجوز تصاویر همچنان اعمال می‌شوند.</p><button disabled={busy||auto===true} onClick={()=>setAutomatic(true)}>فعال‌سازی خودکار</button><button className="rmdb-admin-secondary" disabled={busy||auto===false} onClick={()=>setAutomatic(false)}>توقف خودکار</button></section><section className="rmdb-admin-panel"><h2>گزارش و کنترل</h2><a href="https://github.com/sahandse/RMDB/actions/workflows/telegram-sync.yml" target="_blank" rel="noreferrer">مشاهده وضعیت آخرین اجرا ←</a><a href="/RMDB/data/import-health.json" target="_blank" rel="noreferrer">گزارش تعداد آثار منتشرشده ←</a><button className="rmdb-admin-secondary" onClick={()=>{setToken('');setLogged(false);setNotice('از پنل خارج شدی.')}}>خروج از پنل</button></section></div>}{notice?<p role="status" className="rmdb-admin-message">{notice}</p>:null}<p className="rmdb-admin-foot">پنج بار لمس لوگو فقط راه ورود به صفحه است و جای احراز هویت GitHub را نمی‌گیرد.</p></main>
}