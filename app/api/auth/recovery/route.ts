import {env} from 'cloudflare:workers';
import {account,cookie} from '@/lib/auth';
import {db,sameOrigin} from '@/lib/server';
import {digest,hashPassword} from '@/lib/password';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(!sameOrigin(req))return reply({error:'forbidden'},403);
 try{
  const body=await req.json() as {action?:string,token?:string,password?:string,language?:string};
  if(body.action==='reset'){
   if(typeof body.token!=='string'||! /^[a-f0-9]{64}$/.test(body.token))return reply({error:'invalid_token'},400);
   if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply({error:'password_length'},400);
   const tokenHash=await digest(body.token);
   const valid=await db().prepare('SELECT username FROM admin_account WHERE reset_hash=? AND reset_expires>? AND reset_version=version').bind(tokenHash,Date.now()).first();
   if(!valid)return reply({error:'invalid_token'},400);
   const hash=await hashPassword(body.password);
   // Consume and change the password in one statement: only one concurrent reset can win.
   const updated=await db().prepare('UPDATE admin_account SET password_hash=?,must_change=0,version=version+1,failures=0,locked_until=0,reset_hash=NULL,reset_expires=NULL,reset_version=NULL WHERE reset_hash=? AND reset_expires>? AND reset_version=version RETURNING username').bind(hash,tokenHash,Date.now()).first();
   if(!updated)return reply({error:'invalid_token'},400);
   // Incrementing the account version immediately invalidates every older session and reset link.
   return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookie('',req,true)}});
  }
  if(body.action!=='request')return reply({error:'invalid'},400);
  const e=env as unknown as {ADMIN_RECOVERY_EMAIL?:string,PUBLIC_ORIGIN?:string,RESEND_API_KEY?:string,RESEND_FROM?:string};
  if(!e.ADMIN_RECOVERY_EMAIL||!e.PUBLIC_ORIGIN||!e.RESEND_API_KEY||!e.RESEND_FROM)return reply({error:'recovery_unavailable'},503);
  const origin=new URL(e.PUBLIC_ORIGIN);
  if(origin.protocol!=='https:'&&origin.hostname!=='localhost'&&origin.hostname!=='127.0.0.1')return reply({error:'recovery_unavailable'},503);
  const a=await account();if(!a)return reply({error:'recovery_unavailable'},503);
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const tokenHash=await digest(token),now=Date.now();
  const claimed=await db().prepare('UPDATE admin_account SET reset_hash=?,reset_expires=?,reset_version=version,reset_requested=? WHERE username=? AND reset_requested<=? RETURNING username').bind(tokenHash,now+30*60*1000,now,a.username,now-5*60*1000).first();
  if(!claimed)return reply({error:'rate_limited'},429);
  const link=new URL('/admin/reset',origin.origin);link.hash='token='+token;
  const en=body.language==='en';
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${e.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:e.RESEND_FROM,to:[e.ADMIN_RECOVERY_EMAIL],subject:en?'Ivett Kovacs PMU — Reset your admin password':'Ivett Kovacs PMU — Admin jelszó visszaállítása',text:en?`Reset your admin password using this single-use link, valid for 30 minutes:\n\n${link}\n\nIf you did not request this, ignore this email. Your password has not changed.`:`Az admin jelszó visszaállításához nyisd meg az alábbi, egyszer használható linket. A link 30 percig érvényes:\n\n${link}\n\nHa nem te kérted a visszaállítást, hagyd figyelmen kívül ezt a levelet. A jelszavad nem változott meg.`}),signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('delivery_failed');
   const result=await response.json() as {id?:string};if(!result.id)throw Error('delivery_failed');
  }catch{await db().prepare('UPDATE admin_account SET reset_hash=NULL,reset_expires=NULL,reset_version=NULL WHERE reset_hash=?').bind(tokenHash).run();return reply({error:'delivery_failed'},503)}
  return reply({ok:true});
 }catch{return reply({error:'unavailable'},503)}
}
