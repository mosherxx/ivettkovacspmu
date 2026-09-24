'use client';
import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
export function usePhotoReorder(onDrop:(from:string,to:string)=>void,disabled:boolean){
 const [dragging,setDragging]=useState(''),[target,setTarget]=useState('');
 const gesture=useRef<{id:string,x:number,y:number,active:boolean,target:string,timer:ReturnType<typeof setTimeout>}|null>(null);
 useEffect(()=>()=>{if(gesture.current)clearTimeout(gesture.current.timer)},[]);
 function stop(){if(gesture.current)clearTimeout(gesture.current.timer);gesture.current=null;setDragging('');setTarget('')}
 return {dragging,target,bind:(id:string)=>({
 onPointerDown:(e:ReactPointerEvent<HTMLButtonElement>)=>{if(disabled||e.button!==0)return;stop();e.currentTarget.setPointerCapture(e.pointerId);const current={id,x:e.clientX,y:e.clientY,active:false,target:id,timer:setTimeout(()=>{current.active=true;setDragging(id)},300)};gesture.current=current},
 onPointerMove:(e:ReactPointerEvent<HTMLButtonElement>)=>{const current=gesture.current;if(!current)return;if(!current.active){if(Math.hypot(e.clientX-current.x,e.clientY-current.y)>12){if(e.pointerType==='mouse'){clearTimeout(current.timer);current.active=true;setDragging(current.id)}else{stop();return}}else return}e.preventDefault();const card=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-photo-id]');if(card?.dataset.photoId){current.target=card.dataset.photoId;setTarget(current.target)}if(e.clientY<100)window.scrollBy(0,-18);else if(e.clientY>window.innerHeight-100)window.scrollBy(0,18)},
 onPointerUp:()=>{const current=gesture.current;stop();if(current?.active&&current.id!==current.target)onDrop(current.id,current.target)},
 onPointerCancel:stop,onLostPointerCapture:stop,
 onKeyDown:(e:React.KeyboardEvent<HTMLButtonElement>)=>{if(e.key==='Escape')stop()},
 onContextMenu:(e:React.MouseEvent)=>e.preventDefault()
 })};
}
