import {db,bucket,isAdmin,sameOrigin} from '@/lib/server';
export async function GET(req:Request){try{const setting=await db().prepare("SELECT value FROM site_settings WHERE key='profile_photo'").first<{value:string}>();if(!setting)return Response.redirect(new URL('/photos/profile.jpg',req.url),302);const object=await bucket().get(setting.value);if(!object)return new Response('Not found',{status:404});return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Unavailable',{status:503})}}
export async function POST(req:Request){if(!sameOrigin(req)||!await isAdmin())return Response.json({error:'forbidden'},{status:403});try{
 if(Number(req.headers.get('content-length'))>11*1024*1024)return Response.json({error:'size'},{status:413});
 const form=await req.formData(),file=form.get('photo');if(!(file instanceof File)||file.size<12||file.size>10*1024*1024)return Response.json({error:'invalid'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());const mime=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'image/png':new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'?'image/webp':'';
 if(!mime||file.type!==mime)return Response.json({error:'format'},{status:400});
 const key='profile/'+crypto.randomUUID();await bucket().put(key,bytes,{httpMetadata:{contentType:mime}});
 const old=await db().prepare("SELECT value FROM site_settings WHERE key='profile_photo'").first<{value:string}>();
 try{await db().prepare("INSERT INTO site_settings(key,value) VALUES ('profile_photo',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key).run()}catch(e){await bucket().delete(key);throw e}
 if(old?.value.startsWith('profile/'))await bucket().delete(old.value);
 return Response.json({ok:true});
 }catch{return Response.json({error:'unavailable'},{status:503})}}
