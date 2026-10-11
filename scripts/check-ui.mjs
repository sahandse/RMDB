import {readFileSync,existsSync} from 'node:fs';
const pages=['page','en/page','title/page','person/page','actor/page','episode/page','people/page','search/page','explore/page','calendar/page','iran/page','top/page','compare/page','watchlist/page','api/page'];
let problems=[];
for(const item of pages){
 const path='app/'+item+'.tsx';
 if(!existsSync(path)){problems.push('Missing page: '+path);continue}
 const text=readFileSync(path,'utf8');
 if(!text.includes('BrandLogo')&&!(item==='en/page'&&text.includes("import Home from '../page'")))problems.push('Missing brand: '+path);
 if(text.includes('useState(')||text.includes('useEffect(')){
   if(!text.trimStart().startsWith("'use client';"))problems.push('Client directive missing: '+path)
 }
 if(/href=["']\/RMDB\/(?:watch|download)\//.test(text))problems.push('Unsupported watch/download route: '+path);
 const untranslated=[...text.matchAll(/>([^<>{}]*[\u0600-\u06FF][^<>{}]*)</g)].map(x=>x[1].trim()).filter(x=>x&&x!=='فارسی');
 const labels=[...text.matchAll(/(?:placeholder|aria-label)="([^"]*[\u0600-\u06FF][^"]*)"/g)];
 if(untranslated.length||labels.length)problems.push('Unlocalized static UI literals in '+path+': '+untranslated.slice(0,3).join(', '));
}
const api=readFileSync('app/api/page.tsx','utf8');
if(!api.includes('movies.json')||!api.includes('people.json')||!api.includes('Wikidata')||!api.includes('TVmaze'))problems.push('API portal missing endpoints or sources');
const home=readFileSync('app/page.tsx','utf8');
if(!home.includes('useLocale')||!home.includes('titleEn'))problems.push('Bilingual homepage or verified English labels missing');
const english=readFileSync('app/en/page.tsx','utf8');
if(!english.includes("import Home from '../page'"))problems.push('English and Persian home layouts diverged');
const switchCode=readFileSync('app/components/language-switch.tsx','utf8');
if(!switchCode.includes('next.delete')||!switchCode.includes('next.set'))problems.push('Locale switch must preserve route parameters');
const layout=readFileSync('app/layout.tsx','utf8');
if(!layout.includes('<MobileNav/>')||!layout.includes('<LanguageSwitch/>'))problems.push('Missing global navigation');
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
if(!manifest.icons?.some(x=>x.src==='/RMDB/icon.svg'))problems.push('Missing RMDB icon');
if(!existsSync('public/icon.svg'))problems.push('Missing actual icon');
if(problems.length){console.error(problems.join('\n'));process.exitCode=1}else console.log('RMDB UI smoke checks passed for',pages.length,'pages');
