import type { Metadata } from 'next';
import './globals.css';
import {Suspense} from 'react';
import LanguageSwitch from './components/language-switch';
import MobileNav from './components/mobile-nav';
export const metadata: Metadata = { title: 'RMDB | مرجع فارسی فیلم و سریال', description: 'اطلاعات واقعی فیلم‌ها، سریال‌ها و هنرمندان سینما به زبان فارسی', manifest:'/RMDB/manifest.webmanifest' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="fa" dir="rtl"><body>{children}<Suspense fallback={null}><LanguageSwitch/></Suspense><MobileNav/></body></html>;
}
