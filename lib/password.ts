const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
export async function hashPassword(password:string,salt=crypto.randomUUID()){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const value=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return `pbkdf2:100000:${salt}:${hex(value)}`;
}
export async function verifyPassword(password:string,hash:string){const parts=hash.split(':');if(parts.length!==4||parts[0]!=='pbkdf2'||parts[1]!=='100000')return false;const candidate=await hashPassword(password,parts[2]);let different=hash.length^candidate.length;for(let i=0;i<hash.length;i++)different|=hash.charCodeAt(i)^candidate.charCodeAt(i);return different===0;}
