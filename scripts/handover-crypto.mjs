import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';

const [mode,input,output,keyPath]=process.argv.slice(2);
const magic=Buffer.from('IVETTBAK1');
if(!['encrypt','decrypt'].includes(mode)||!input||!output||!keyPath){
 console.error('Usage: node scripts/handover-crypto.mjs encrypt|decrypt INPUT OUTPUT KEY_FILE');
 process.exit(2);
}

try{
 if(mode==='encrypt'){
  const plain=await readFile(input);
  const key=randomBytes(32),nonce=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,nonce);
  const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
  const payload=Buffer.concat([magic,nonce,cipher.getAuthTag(),encrypted]);
  await writeFile(output,payload,{flag:'wx'});
  await writeFile(keyPath,key.toString('base64')+'\n',{flag:'wx'});
  console.log(`Encrypted ${plain.length} bytes to ${output}. Keep ${keyPath} outside GitHub.`);
 }else{
  const key=Buffer.from((await readFile(keyPath,'utf8')).trim(),'base64');
  if(key.length!==32)throw Error('Key must decode to 32 bytes');
  const payload=await readFile(input);
  if(payload.length<magic.length+12+16||!payload.subarray(0,magic.length).equals(magic))throw Error('Invalid backup format');
  const nonce=payload.subarray(magic.length,magic.length+12);
  const tag=payload.subarray(magic.length+12,magic.length+28);
  const decipher=createDecipheriv('aes-256-gcm',key,nonce);
  decipher.setAuthTag(tag);
  const plain=Buffer.concat([decipher.update(payload.subarray(magic.length+28)),decipher.final()]);
  await writeFile(output,plain,{flag:'wx'});
  console.log(`Decrypted ${plain.length} bytes to ${output}.`);
 }
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
