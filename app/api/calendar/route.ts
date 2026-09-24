import {db,validDate} from '@/lib/server';
import {GET as slotsForDate} from '../booking/route';
// Deliberately return only time ranges. No identifiers, names, services or private notes.
export async function GET(req:Request){try{const url=new URL(req.url),start=url.searchParams.get('date')||'',service=url.searchParams.get('service')||'';if(!validDate(start))return Response.json({error:'invalid'},{status:400});const days=[];
 for(let i=0;i<7;i++){const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);const date=d.toISOString().slice(0,10);if(!validDate(date))break;
 const response=await slotsForDate(new Request(new URL('/api/booking?'+new URLSearchParams({date,service}),req.url)));if(!response.ok)return response;
 const {slots,duration}=await response.json() as {slots:number[],duration:number};
 const busy=await db().prepare("SELECT start,end FROM bookings WHERE date=? AND status NOT IN ('cancelled','rejected') UNION SELECT start,end FROM time_blocks WHERE date_from<=? AND date_to>=? ORDER BY start").bind(date,date,date).all<{start:number,end:number}>();
 days.push({date,slots,duration,busy:busy.results.map(({start,end})=>({start,end}))});}
 return Response.json({days},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'unavailable'},{status:503})}}
