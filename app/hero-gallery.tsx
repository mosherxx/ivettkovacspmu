'use client';
import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
import {portfolio} from '@/lib/portfolio';
import type {Photo} from '@/lib/content';
import {assetUrl,staticSite} from '@/lib/site-mode';
type Slide=Photo & {src:string};
export default function HeroGallery({en}:{en:boolean}){
 const [photos,setPhotos]=useState<Slide[]>(staticSite?portfolio:[]);
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(false),[visible,setVisible]=useState(true);
 useEffect(()=>{if(staticSite)return;const controller=new AbortController();fetch('/api/gallery',{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json() as {photos:Photo[]};setPhotos(data.photos.filter(p=>p.published).map(p=>({...p,src:`/api/photos/${encodeURIComponent(p.id)}`})))}).catch(()=>{});return()=>controller.abort()},[]);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const motion=()=>setReduced(media.matches);const visibility=()=>setVisible(!document.hidden);motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility)}},[]);
 useEffect(()=>{if(paused||reduced||!visible||photos.length<2)return;const timer=setInterval(()=>setIndex(current=>(current+1)%photos.length),5000);return()=>clearInterval(timer)},[paused,reduced,visible,photos.length,index]);
 const move=(step:number)=>setIndex(current=>(current+step+photos.length)%photos.length);
 return <div className="hero-visual hero-gallery" role="region" aria-roledescription="carousel" aria-label={en?'Selected work':'Válogatott munkáim'}>
 {photos.map((photo,i)=><img key={photo.id} className={i===index?'hero-slide is-active':'hero-slide'} src={assetUrl(photo.src)} alt={en?photo.caption_en||photo.caption_hu:photo.caption_hu} aria-hidden={i!==index} fetchPriority={i===0?'high':'auto'} onError={()=>{setPhotos(current=>current.filter(p=>p.id!==photo.id));setIndex(0)}}/>)}
 {!photos.length&&<div className="hero-gallery-empty"><a href="#munkak">{en?'Explore my work':'Fedezd fel a munkáimat'}</a></div>}
 <div className="image-frame"/>
 {photos.length>0&&<div className="hero-gallery-footer"><span>{en?photos[index]?.caption_en||photos[index]?.caption_hu:photos[index]?.caption_hu}</span>{photos.length>1&&<div className="hero-gallery-controls"><button type="button" onClick={()=>move(-1)} aria-label={en?'Previous photo':'Előző kép'}><ChevronLeft size={18}/></button><span>{index+1} / {photos.length}</span><button type="button" onClick={()=>move(1)} aria-label={en?'Next photo':'Következő kép'}><ChevronRight size={18}/></button>{!reduced&&<button type="button" onClick={()=>setPaused(!paused)} aria-label={paused?(en?'Play slideshow':'Diavetítés indítása'):(en?'Pause slideshow':'Diavetítés szüneteltetése')}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>}</div>}</div>}
 </div>;
}
