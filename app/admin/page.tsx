import {adminSession} from '@/lib/auth';
import Admin from './panel';
import Login from './login';
export const dynamic='force-dynamic';
export default async function AdminPage(){try{const session=await adminSession();if(!session)return <Login/>;if(session.must_change)return <Login mustChange/>;return <Admin/>}catch{return <main className="admin-panel"><h1>Átmenetileg nem elérhető / Temporarily unavailable</h1><a href="/admin">Újrapróbálás / Try again</a></main>}}
