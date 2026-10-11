'use client';
import {useState} from 'react';
import BrandLogo from '@/app/components/brand-logo';
import {useLocale} from '@/app/components/use-locale';
const base='https://sahandse.github.io/RMDB/api/v1/';
const endpoints=[
 {file:'index.json',fa:'مشخصات API',en:'API index'},
 {file:'movies.json',fa:'فیلم‌ها',en:'Movies'},
 {file:'people.json',fa:'هنرمندان',en:'People'}
];
export default function ApiDocumentation(){
 const {en,t}=useLocale();const [copied,setCopied]=useState('');
 const copy=(url:string)=>{void navigator.clipboard?.writeText(url).then(()=>setCopied(url)).catch(()=>{})};
 return <><header className="topbar"><div className="layout navbar"><a href={en?'/RMDB/en/':'/RMDB/'} className="logo"><BrandLogo/></a><nav className="navlinks"><a href={en?'/RMDB/en/':'/RMDB/'}>{t('خانه','Home')}</a><a href={en?'/RMDB/explore/?lang=en':'/RMDB/explore/'}>{t('آرشیو','Catalog')}</a></nav></div></header>
 <main className="layout detail-area api-docs">
 <span className="eyebrow">RMDB · API v1</span>
 <h1>{t('مرکز API و منابع داده','API & data sources')}</h1>
 <p className="detail-description">{t('مستندات عمومی برای توسعه‌دهندگان و سایت‌هایی که می‌خواهند از اطلاعات آزاد RMDB استفاده کنند.','Public documentation for developers and websites reusing open RMDB data.')}</p>
 <section className="api-status-panel"><strong>{t('نسخه آزمایشی · فایل‌های JSON استاتیک','Preview release · static JSON files')}</strong><p>{t('بدون API Key و بدون هزینه؛ جستجوی سمت سرور و مدیریت کلید هنوز وجود ندارد. فعال‌شدن لینک‌ها به انتشار موفق GitHub Pages بستگی دارد.','No API key or fee. Server-side search and key management are not available yet. Links require a successful GitHub Pages deployment.')}</p></section>
 <section className="section"><h2 className="section-title">{t('مسیرهای عمومی','Public endpoints')}</h2><div className="api-endpoints">{endpoints.map(v=><div key={v.file} className="api-endpoint"><div><strong>{en?v.en:v.fa}</strong><code dir="ltr">{base+v.file}</code></div><div className="api-actions"><a href={base+v.file} target="_blank" rel="noopener noreferrer">{t('مشاهده','Open')}</a><button type="button" onClick={()=>copy(base+v.file)}>{copied===base+v.file?t('کپی شد','Copied'):t('کپی','Copy')}</button></div></div>)}</div></section>
 <section className="section"><h2 className="section-title">{t('مثال استفاده','Usage example')}</h2><pre className="api-code" dir="ltr"><code>{"const response = await fetch('"+base+"movies.json');\nif (!response.ok) throw new Error('API unavailable');\nconst { items, updatedAt } = await response.json();\nconsole.log(items.length, updatedAt);"}</code></pre></section>
 <section className="section"><h2 className="section-title">{t('منابع فعال و کاربردشان','Supported data sources')}</h2><div className="api-source-grid"><article><h3>Wikidata</h3><p>{t('داده ساختاریافته فیلم و هنرمند؛ مبنای خروجی عمومی با مجوز CC0.','Structured movie and person metadata; the CC0 public API source.')}</p><a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">{t('سایت رسمی','Official site')} ↗</a></article><article><h3>TVmaze</h3><p>{t('اطلاعات و برنامه پخش سریال‌ها برای بخش نمایشی RMDB؛ از API عمومی CC0 جدا است.','TV episodes and schedules for RMDB display only; excluded from the CC0 API.')}</p><a href="https://www.tvmaze.com/api" target="_blank" rel="noopener noreferrer">{t('مستندات رسمی','Official API docs')} ↗</a></article><article><h3>Wikipedia</h3><p>{t('خلاصه‌ها و زندگی‌نامه‌های صفحه جزئیات؛ بازنشر متن تابع شرایط مجوز است.','Contextual article excerpts on detail pages; article reuse has separate license conditions.')}</p><a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer">{t('سایت رسمی','Official site')} ↗</a></article><article><h3>Wikimedia Commons</h3><p>{t('تصاویر دارای مجوز بررسی‌شده، با رعایت انتساب؛ تصاویر در خروجی CC0 نیستند.','License-checked images requiring appropriate attribution; not in the CC0 API.')}</p><a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer">{t('سایت رسمی','Official site')} ↗</a></article></div></section>
 <section className="section"><h2 className="section-title">{t('مجوز و محدودیت‌ها','Licensing & limits')}</h2><p className="detail-description">{t('خروجی عمومی فقط داده‌های ساختاریافته CC0 از Wikidata دارد. امتیاز TVmaze، عکس‌ها، پوسترها و متن مقالات به‌طور خودکار قابل بازنشر تحت CC0 نیستند. شناسه‌ها پایدارند؛ نبود مقدار با null نمایش داده می‌شود.','The public snapshot contains only Wikidata CC0 structured records. TVmaze ratings, media and article prose are not automatically CC0. Identifiers are stable and missing data is represented by null.')}</p><p><a className="secondary-link" href="https://github.com/sahandse/RMDB/blob/main/PUBLIC_API.md" target="_blank" rel="noopener noreferrer">{t('مستندات فنی کامل در GitHub','Full technical documentation on GitHub')} ↗</a></p></section>
 </main></>;
}
