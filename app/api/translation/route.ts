import {isAdmin} from '@/lib/server';
import {translationEnabled} from '@/lib/translation';
export async function GET(){if(!await isAdmin())return Response.json({error:'forbidden'},{status:403});return Response.json({enabled:translationEnabled()},{headers:{'Cache-Control':'no-store'}})}
