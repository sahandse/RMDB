'use client';
import {useRef} from 'react';
import {useRouter} from 'next/navigation';
export default function BrandLogo(){
 const tap=useRef({count:0,last:0});
 const router=useRouter();
 return <span className="brand-lockup" title="RMDB" onClickCapture={event=>{
  // The logo is wrapped by home links; cancel their navigation while counting taps.
  event.preventDefault();event.stopPropagation();
  const now=Date.now();tap.current.count=now-tap.current.last<1700?tap.current.count+1:1;tap.current.last=now;
  if(tap.current.count>=5){tap.current.count=0;router.push('/admin/')}
 }}><img src="/RMDB/icon.svg" width="33" height="33" alt="" aria-hidden="true"/><span>RMDB<span className="brand-dot">.</span></span></span>
}