import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RMDB | مرجع فارسی فیلم و سریال', description: 'اطلاعات واقعی فیلم‌ها، سریال‌ها و هنرمندان سینما به زبان فارسی' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
