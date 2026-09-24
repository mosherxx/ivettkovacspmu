export type CalendarView='day'|'workweek'|'week'|'month';
export const bookingGroup=(status:string)=>status==='completed'?'completed':['cancelled','rejected'].includes(status)?'cancelled':'pending';
export const calendarDate=(date:Date)=>`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
export const shiftDate=(date:string,days:number)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return calendarDate(d)};
export function calendarDays(date:string,view:CalendarView){let start=date,count=1;if(view==='week'||view==='workweek'){const day=new Date(date+'T12:00:00Z').getUTCDay();start=shiftDate(date,-((day+6)%7));count=view==='week'?7:5}if(view==='month'){const first=date.slice(0,8)+'01';start=shiftDate(first,-((new Date(first+'T12:00:00Z').getUTCDay()+6)%7));count=42}return Array.from({length:count},(_,i)=>shiftDate(start,i))}
export function calendarMove(date:string,view:CalendarView,direction:number){if(view!=='month')return shiftDate(date,direction*(view==='day'?1:7));const d=new Date(date.slice(0,8)+'01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+direction);return calendarDate(d)}
export const timeLabel=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
