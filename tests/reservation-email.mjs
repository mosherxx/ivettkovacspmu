import {build} from 'esbuild';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'ivett-email-'));
try{
 await build({entryPoints:['lib/reservation-email.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'email.mjs')});
 const {reservationEmail}=await import(pathToFileURL(join(dir,'email.mjs')).href);
 const booking={id:'example-booking',name:'Kiss Anna',date:'2026-10-12',start:540,end:720,price:80000,service:'Púderes szemöldöktetoválás',language:'hu'};
 const contact={address:'1136 Budapest, Victor Hugo utca 16.',email:'ivettkovacs5@gmail.com',phone:'+36 30 892 1392'};
 const titles={hu:{pending:'Megkaptam az időpontkérésedet',confirmed:'Időpontod visszaigazolva',cancelled:'Időpontod lemondva',rejected:'Időpontkérésed elutasítva'},en:{pending:'Your appointment request was received',confirmed:'Your appointment is confirmed',cancelled:'Your appointment is cancelled',rejected:'Your appointment request was declined'}};
 for(const language of ['hu','en'])for(const kind of ['pending','confirmed','cancelled','rejected']){
  const rejectionReason=language==='en'?'The requested treatment is unavailable on this date.':'A kért kezelés ezen a napon nem elérhető.';
  const result=reservationEmail({...booking,language,service:language==='en'?'Powder brows':booking.service,rejectionReason},kind,contact);
  assert(result.html.includes('Kiss Anna'));assert(result.html.includes('09:00–12:00'));assert(result.text.includes('Victor Hugo'));assert(result.text.includes('80'));assert(result.text.includes('Ft'));assert(result.html.includes('PERMANENT MAKEUP'));
  assert(result.subject.includes(titles[language][kind]));assert(result.text.includes(titles[language][kind]));assert(result.html.includes(`<html lang="${language}">`));
  assert.equal(result.html.includes('Directions to the studio')||result.html.includes('Útvonal a szalonhoz'),kind==='confirmed');
  assert.equal(result.text.includes(rejectionReason),kind==='rejected');assert.equal(result.html.includes(language==='en'?'Reason for declining':'Az elutasítás oka'),kind==='rejected');
  if(kind==='pending'){
   assert(result.text.includes(language==='en'?'not yet confirmed':'még nincs visszaigazolva'));
   assert(result.text.includes(language==='en'?'separate confirmation email':'külön levélben'));
  }
  if(process.env.EMAIL_PREVIEW_DIR){mkdirSync(process.env.EMAIL_PREVIEW_DIR,{recursive:true});writeFileSync(join(process.env.EMAIL_PREVIEW_DIR,kind+'-'+language+'.html'),result.html)}
 }
 const injected=reservationEmail({...booking,name:'<img src=x onerror="bad()">',service:'A & B <script>x</script>'},'confirmed',contact);
 assert(!injected.html.includes('<img'));assert(!injected.html.includes('<script>'));assert(injected.html.includes('&lt;img'));assert(injected.html.includes('A &amp; B'));
 const legacy=reservationEmail({...booking,price:null},'cancelled',contact);assert(legacy.text.includes('Nincs rögzített ár'));assert(!legacy.text.includes('0 Ft'));
 console.log('PASS: the original reservation language controls request receipt, confirmation, cancellation, and rejection templates; rejection reasons, original prices, missing-price handling, personalized details, and HTML escaping are covered.');
}finally{rmSync(dir,{recursive:true,force:true})}
