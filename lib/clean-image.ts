export async function cleanImage(file:File){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('format');
 const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>50000000){bitmap.close();throw Error('format')}
 const canvas=document.createElement('canvas'),scale=Math.min(1,4000/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');if(!ctx){bitmap.close();throw Error('format')}ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('format')),'image/jpeg',.94));
}
