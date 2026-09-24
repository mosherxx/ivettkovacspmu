import {db,today} from '@/lib/server';
export async function GET(){try{const result=await db().prepare('SELECT date_from,date_to,start,end FROM time_blocks WHERE date_to>=? ORDER BY date_from,start').bind(today()).all();return Response.json({periods:result.results},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'unavailable'},{status:503})}}
