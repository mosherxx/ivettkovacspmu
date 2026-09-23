import {pbkdf2Sync,randomUUID} from 'node:crypto';
// Initial admin/admin remains a one-time setup login; the app requires password rotation.
if(!process.env.ADMIN_INITIAL_HASH){const salt=randomUUID();process.env.ADMIN_INITIAL_HASH=`pbkdf2:100000:${salt}:${pbkdf2Sync('admin',salt,100000,32,'sha256').toString('hex')}`;}
await import('./server.js');
