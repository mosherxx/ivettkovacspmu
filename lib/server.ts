import {env} from 'cloudflare:workers';
import {adminSession} from '@/lib/auth';
export function db(){const binding=(env as unknown as {DB?:D1Database}).DB;if(!binding)throw new Error('Database unavailable');return binding;}
export async function isAdmin(){const session=await adminSession();return !!session&&!session.must_change;}
export function bucket(){const b=(env as unknown as {BUCKET?:R2Bucket}).BUCKET;if(!b)throw new Error('Storage unavailable');return b;}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&s>=today()&&s<=new Date(Date.now()+366*864e5).toISOString().slice(0,10)&&new Date(s).toISOString().slice(0,10)===s;}
export function future(date:string,start:number){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Budapest',hour:'2-digit',minute:'2-digit'}).format(new Date()).split(':').map(Number);return date>today()||(date===today()&&start>parts[0]*60+parts[1]+30);}
export function sameOrigin(r:Request){const configured=(env as unknown as {PUBLIC_ORIGIN?:string}).PUBLIC_ORIGIN;return r.headers.get('origin')===(configured?new URL(configured).origin:new URL(r.url).origin);}
