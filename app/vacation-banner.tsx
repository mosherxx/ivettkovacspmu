'use client';
import {useEffect,useState} from 'react';
import {staticSite} from '@/lib/site-mode';
import {timeLabel} from '@/lib/calendar';
type Period={date_from:string,date_to:string,start:number,end:number};
export default function VacationBanner({en}:{en:boolean}){
 const [periods,setPeriods]=useState<Period[]>([]);
 useEffect(()=>{if(staticSite)return;let active=true;const controller=new AbortController();async function load(){try{const r=await fetch('/api/unavailability',{signal:controller.signal});if(!r.ok)return;const data=await r.json() as {periods:Period[]};if(active)setPeriods(data.periods)}catch{}}load();const timer=setInterval(load,60000);window.addEventListener('focus',load);return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',load)}},[]);
 if(!periods.length)return null;
 const format=(date:string)=>new Intl.DateTimeFormat(en?'en-GB':'hu-HU',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 return <aside className="vacation-banner" aria-label={en?'Studio availability':'A szalon elérhetősége'}><strong>{en?'The studio is unavailable during these periods:':'Az alábbi időszakokban a szolgáltatások nem elérhetők:'}</strong><ul>{periods.map((p,i)=><li key={i}>{format(p.date_from)}{p.date_to!==p.date_from&&' – '+format(p.date_to)}{(p.start!==0||p.end!==1440)&&` · ${timeLabel(p.start)}–${timeLabel(p.end)} (${en?'each day, Budapest time':'naponta, budapesti idő szerint'})`}</li>)}</ul></aside>;
}
