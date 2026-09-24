import {db,isAdmin,sameOrigin,validDate,future} from '@/lib/server';
import {ensureSchedule,type Hours} from '@/lib/schedule';
import {emailConfigured,notificationPayload,sendNotification,type Reservation} from '@/lib/email';
const invalid=()=>Response.json({error:'invalid'},{status:400});
const conflict=()=>Response.json({error:'conflict'},{status:409});
const interval=(s:number,e:number)=>Number.isInteger(s)&&Number.isInteger(e)&&s>=0&&e<=1440&&e>s&&s%30===0&&e%30===0;
export async function GET(){if(!await isAdmin())return Response.json({error:'forbidden'},{status:403});try{await ensureSchedule();const results=await db().batch([db().prepare('SELECT b.*,e.state AS email_state FROM bookings b LEFT JOIN email_outbox e ON e.id=b.status_event ORDER BY b.date DESC,b.start'),db().prepare('SELECT * FROM availability ORDER BY date,start'),db().prepare('SELECT * FROM durations'),db().prepare('SELECT * FROM weekly_hours ORDER BY weekday'),db().prepare('SELECT * FROM time_blocks ORDER BY date_from,start')]);return Response.json({bookings:results[0].results,availability:results[1].results,durations:results[2].results,hours:results[3].results,blocks:results[4].results,emailConfigured:emailConfigured()});}catch{return Response.json({error:'unavailable'},{status:503});}}
export async function POST(req:Request){if(!sameOrigin(req)||!await isAdmin())return Response.json({error:'forbidden'},{status:403});try{await ensureSchedule();const b=await req.json() as {action:string,date:string,date_from:string,date_to:string,reason:string,start:number,end:number,id:string,status:string,service:string,minutes:number,hours:Hours[]};
if(b.action==='hours'){if(!Array.isArray(b.hours)||b.hours.length!==7||new Set(b.hours.map(h=>h.weekday)).size!==7||b.hours.some(h=>!Number.isInteger(h.weekday)||h.weekday<0||h.weekday>6||![0,1].includes(h.enabled)||!interval(h.start,h.end)))return invalid();await db().batch(b.hours.map(h=>db().prepare('UPDATE weekly_hours SET start=?,end=?,enabled=? WHERE weekday=?').bind(h.start,h.end,h.enabled,h.weekday)));}
else if(b.action==='block'){if(!validDate(b.date_from)||!validDate(b.date_to)||b.date_to<b.date_from||!interval(b.start,b.end)||typeof b.reason!=='string'||b.reason.length>200)return invalid();await db().prepare('INSERT INTO time_blocks(id,date_from,date_to,start,end,reason) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),b.date_from,b.date_to,b.start,b.end,b.reason.trim()).run();}
else if(b.action==='unblock'&&typeof b.id==='string'){await db().prepare('DELETE FROM time_blocks WHERE id=?').bind(b.id).run();}
else if(b.action==='availability'&&validDate(b.date)&&interval(b.start,b.end)){await db().prepare('INSERT INTO availability(id,date,start,end) VALUES (?,?,?,?)').bind(crypto.randomUUID(),b.date,b.start,b.end).run();}
else if(b.action==='remove'&&typeof b.id==='string'){await db().prepare('DELETE FROM availability WHERE id=?').bind(b.id).run();}
else if(b.action==='retry_email'&&typeof b.id==='string'){return Response.json({ok:true,email:await sendNotification(b.id)});}
else if(b.action==='status'&&typeof b.id==='string'){
const booking=await db().prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first<Reservation>();
const transitions:Record<string,string[]>={pending:['confirmed','rejected','cancelled'],confirmed:['cancelled','completed']};
if(!booking||!transitions[booking.status]?.includes(b.status))return conflict();
if(b.status==='confirmed'&&!future(booking.date,booking.start))return conflict();
const event=crypto.randomUUID(),now=Date.now(),notify=b.status!=='completed';const payload=notify?JSON.stringify(await notificationPayload(booking,b.status)):'';
const statements=[db().prepare(`UPDATE bookings SET status=?,status_event=? WHERE id=? AND status=? AND NOT EXISTS (SELECT 1 FROM email_outbox WHERE booking_id=? AND state='sending' AND locked_until>?) AND (?!='confirmed' OR NOT EXISTS (SELECT 1 FROM time_blocks WHERE date_from<=bookings.date AND date_to>=bookings.date AND start<bookings.end AND end>bookings.start))`).bind(b.status,event,b.id,booking.status,b.id,now,b.status)];
if(notify)statements.push(db().prepare("INSERT INTO email_outbox(id,booking_id,kind,payload,state,created) SELECT ?,id,?,?, 'queued',? FROM bookings WHERE id=? AND status_event=?").bind(event,b.status,payload,new Date().toISOString(),b.id,event));
statements.push(db().prepare("UPDATE email_outbox SET state='superseded',locked_until=0 WHERE booking_id=? AND id!=? AND state IN ('queued','failed','sending') AND EXISTS(SELECT 1 FROM bookings WHERE id=? AND status_event=?)").bind(b.id,event,b.id,event));
const result=await db().batch(statements);if(!result[0].meta.changes)return conflict();return Response.json({ok:true,email:notify?await sendNotification(event):null});
}else return invalid();return Response.json({ok:true});}catch(e){console.error(e);return Response.json({error:'unavailable'},{status:503});}}
