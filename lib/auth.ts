import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';
import {db} from '@/lib/server';
import {digest} from '@/lib/password';
import {applyOperatorPasswordReset} from '@/lib/operator-password-reset';
export const SESSION_COOKIE='ivett_admin';
export type Account={username:string,password_hash:string,must_change:number,version:number,failures:number,locked_until:number};
export async function account(){
 const initial=(env as unknown as {ADMIN_INITIAL_HASH?:string}).ADMIN_INITIAL_HASH;
 if(initial)await db().prepare('INSERT OR IGNORE INTO admin_account(username,password_hash) VALUES (?,?)').bind('admin',initial).run();
 await applyOperatorPasswordReset();
 return db().prepare('SELECT * FROM admin_account WHERE username=?').bind('admin').first<Account>();
}
export async function adminSession(){await applyOperatorPasswordReset();const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return db().prepare('SELECT a.* FROM admin_account a JOIN admin_sessions s ON a.username=s.username AND a.version=s.version WHERE s.token_hash=? AND s.expires>?').bind(await digest(token),Date.now()).first<Account>();}
export async function createSession(a:Account){const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');await db().batch([db().prepare('DELETE FROM admin_sessions WHERE expires<?').bind(Date.now()),db().prepare('INSERT INTO admin_sessions(token_hash,username,version,expires) VALUES (?,?,?,?)').bind(await digest(token),a.username,a.version,Date.now()+8*60*60*1000)]);return token;}
export function cookie(token:string,request:Request,clear=false){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:28800}${new URL((env as unknown as {PUBLIC_ORIGIN?:string}).PUBLIC_ORIGIN||request.url).protocol==='https:'?'; Secure':''}`;}
