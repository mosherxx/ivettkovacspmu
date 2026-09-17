import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export function db(){const binding=(env as unknown as {DB?:D1Database}).DB;if(!binding)throw new Error('Database unavailable');return binding;}
export async function isAdmin(){const u=await getChatGPTUser();const allowed=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;return !!u&&!!allowed&&u.email.toLowerCase()===allowed.trim().toLowerCase();}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&s>=today()&&s<=new Date(Date.now()+366*864e5).toISOString().slice(0,10)&&new Date(s).toISOString().slice(0,10)===s;}
export function future(date:string,start:number){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Budapest',hour:'2-digit',minute:'2-digit'}).format(new Date()).split(':').map(Number);return date>today()||(date===today()&&start>parts[0]*60+parts[1]+30);}
export function sameOrigin(r:Request){return r.headers.get('origin')===new URL(r.url).origin;}
