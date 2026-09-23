// Node-only equivalents of the D1/R2 subset used by this app. Sites keeps its native bindings.
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {readFile,writeFile,rename,unlink,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';

let connection:DatabaseSync|undefined;
function sqlite(){
 if(connection)return connection;
 const directory=resolve(process.env.DATA_DIR||'data');mkdirSync(directory,{recursive:true});
 const database=new DatabaseSync(resolve(directory,'ivett.sqlite'));
 database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS app_migrations(name TEXT PRIMARY KEY)');
 try{
  for(const name of readdirSync(resolve(process.cwd(),'drizzle')).filter(x=>/^\d+.*\.sql$/.test(x)).sort()){
   database.exec('BEGIN IMMEDIATE');
   try{if(!database.prepare('SELECT name FROM app_migrations WHERE name=?').get(name)){database.exec(readFileSync(resolve('drizzle',name),'utf8'));database.prepare('INSERT INTO app_migrations(name) VALUES (?)').run(name)}database.exec('COMMIT')}catch(e){database.exec('ROLLBACK');throw e}
  }
 }catch(e){database.close();throw e}
 connection=database;return database;
}
class Statement{
 constructor(readonly sql:string,readonly args:SQLInputValue[]=[]){ }
 bind(...args:SQLInputValue[]){return new Statement(this.sql,args)}
 execute(){const database=sqlite(),query=database.prepare(this.sql);const results=query.columns().length?query.all(...this.args):[];let changes=0;if(!query.columns().length)changes=Number(query.run(...this.args).changes);else changes=Number((database.prepare('SELECT changes() AS count').get() as {count:number}).count);return {success:true,results,meta:{changes}}}
 async all(){return this.execute()}
 async run(){return this.execute()}
 async first(){return sqlite().prepare(this.sql).get(...this.args)||null}
}
const DB={prepare(sql:string){return new Statement(sql)},async batch(statements:Statement[]){const database=sqlite();database.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>s.execute());database.exec('COMMIT');return result}catch(e){database.exec('ROLLBACK');throw e}}};
const objectPath=(key:string)=>resolve(process.env.DATA_DIR||'data','uploads',createHash('sha256').update(key).digest('hex'));
const BUCKET={
 async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string}}){const path=objectPath(key);await mkdir(dirname(path),{recursive:true});const temporary=path+'.'+crypto.randomUUID();await writeFile(temporary,Buffer.concat([Buffer.from(JSON.stringify(options.httpMetadata)+'\n'),Buffer.from(bytes)]));await rename(temporary,path)},
 async get(key:string){try{const file=await readFile(objectPath(key)),separator=file.indexOf(10);return {httpMetadata:JSON.parse(file.subarray(0,separator).toString()),body:new Uint8Array(file.subarray(separator+1))}}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e}},
 async delete(key:string){try{await unlink(objectPath(key))}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}}
};
export const env=new Proxy({DB,BUCKET},{get(target,key){return key in target?target[key as keyof typeof target]:process.env[String(key)]}});
