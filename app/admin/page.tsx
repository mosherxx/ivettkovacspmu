import {isAdmin} from '@/lib/server';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import Admin from './panel';
export const dynamic='force-dynamic';
export default async function AdminPage(){const user=await getChatGPTUser();if(!user)return <main className="admin-panel"><a href="/">← Ivett Kovacs PMU</a><h1>Adminisztráció / Administration</h1><p>Bejelentkezés a foglalások kezeléséhez. / Sign in to manage appointments.</p><a className="button" href={chatGPTSignInPath('/admin')} target="_top">Bejelentkezés ChatGPT-vel / Sign in with ChatGPT</a></main>;if(!await isAdmin())return <main className="admin-panel"><a href="/">← Ivett Kovacs PMU</a><h1>Hozzáférés korlátozva / Access restricted</h1><p>Ez a felület csak a szalon adminisztrátorának elérhető. / Only the salon administrator can access this page.</p><a className="text-link" href="/signout-with-chatgpt?return_to=/admin" target="_top">Másik fiók / Switch account</a></main>;return <Admin/>}
