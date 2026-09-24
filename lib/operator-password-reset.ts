import {env} from 'cloudflare:workers';
import {db} from '@/lib/server';
// An operator can supply a one-time reset through deployment secrets only.
// Neither the reset password nor its hash belongs in source or an API response.
export async function applyOperatorPasswordReset(){
 const raw=(env as unknown as {ADMIN_PASSWORD_RESET?:string}).ADMIN_PASSWORD_RESET;
 if(!raw)return;
 const reset=JSON.parse(raw) as {id:string,hash:string};
 if(!/^[a-f0-9-]{36}$/.test(reset.id)||!/^pbkdf2:100000:[a-f0-9-]{36}:[a-f0-9]{64}$/.test(reset.hash))throw Error('Invalid operator reset configuration');
 const marker='admin_password_reset_applied';
 // D1 batch is transactional. Concurrent requests cannot apply the same reset twice.
 await db().batch([
  db().prepare('UPDATE admin_account SET password_hash=?,must_change=0,version=version+1,failures=0,locked_until=0,reset_hash=NULL,reset_expires=NULL,reset_version=NULL WHERE username=? AND NOT EXISTS (SELECT 1 FROM site_settings WHERE key=? AND value=?)').bind(reset.hash,'admin',marker,reset.id),
  db().prepare('DELETE FROM admin_sessions WHERE username=? AND NOT EXISTS (SELECT 1 FROM site_settings WHERE key=? AND value=?)').bind('admin',marker,reset.id),
  db().prepare('INSERT INTO site_settings(key,value) SELECT ?,? WHERE EXISTS (SELECT 1 FROM admin_account WHERE username=?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(marker,reset.id,'admin')
 ]);
}
