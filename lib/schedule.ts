import {db} from '@/lib/server';
export type Hours={weekday:number,start:number,end:number,enabled:number};
export type Block={id:string,date_from:string,date_to:string,start:number,end:number,reason:string};
export const defaultMinutes:Record<string,number>={hair:180,powder:180,lips:180,consult:60,correction:90,refresh18:120,refresh24:120};
export async function ensureSchedule(){await db().batch([
 db().prepare('INSERT OR IGNORE INTO weekly_hours(weekday,start,end,enabled) VALUES (0,540,1020,0),(1,540,1020,1),(2,540,1020,1),(3,540,1020,1),(4,540,1020,1),(5,540,1020,1),(6,540,1020,0)'),
 db().prepare("INSERT OR IGNORE INTO durations(service,minutes) VALUES ('hair',180),('powder',180),('lips',180),('consult',60),('correction',90),('refresh18',120),('refresh24',120)")
]);}
// Used by both slot listing and the atomic booking insert; SQLite evaluates the current schedule.
export const windowsSql=`SELECT start,end FROM weekly_hours WHERE weekday=CAST(strftime('%w',?) AS INTEGER) AND enabled=1 UNION ALL SELECT start,end FROM availability WHERE date=?`;
