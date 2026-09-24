import {build} from 'esbuild';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'ivett-email-'));
try{
 await build({entryPoints:['lib/reservation-email.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'email.mjs')});
 const {reservationEmail}=await import(join(dir,'email.mjs'));
 const booking={id:'example-booking',name:'Kiss Anna',date:'2026-10-12',start:540,end:720,price:80000,service:'Púderes szemöldöktetoválás',language:'hu'};
 const contact={address:'1136 Budapest, Victor Hugo utca 16.',email:'ivettkovacs5@gmail.com',phone:'+36 30 892 1392'};
 for(const language of ['hu','en'])for(const kind of ['confirmed','cancelled','rejected']){
  const result=reservationEmail({...booking,language,service:language==='en'?'Powder brows':booking.service},kind,contact);
  assert(result.html.includes('Kiss Anna'));assert(result.html.includes('09:00–12:00'));assert(result.text.includes('Victor Hugo'));assert(result.text.includes('80'));assert(result.text.includes('Ft'));assert(result.html.includes('PERMANENT MAKEUP'));
  assert.equal(result.html.includes('Directions to the studio')||result.html.includes('Útvonal a szalonhoz'),kind==='confirmed');
  if(process.env.EMAIL_PREVIEW_DIR){mkdirSync(process.env.EMAIL_PREVIEW_DIR,{recursive:true});writeFileSync(join(process.env.EMAIL_PREVIEW_DIR,kind+'-'+language+'.html'),result.html)}
 }
 const injected=reservationEmail({...booking,name:'<img src=x onerror="bad()">',service:'A & B <script>x</script>'},'confirmed',contact);
 assert(!injected.html.includes('<img'));assert(!injected.html.includes('<script>'));assert(injected.html.includes('&lt;img'));assert(injected.html.includes('A &amp; B'));
 const legacy=reservationEmail({...booking,price:null},'cancelled',contact);assert(legacy.text.includes('Nincs rögzített ár'));assert(!legacy.text.includes('0 Ft'));
 console.log('PASS: bilingual confirmed/cancelled/rejected templates, original prices, missing-price handling, personalized details, and HTML escaping.');
}finally{rmSync(dir,{recursive:true,force:true})}
