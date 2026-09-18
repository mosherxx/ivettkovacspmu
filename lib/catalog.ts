import {services as defaults} from '@/lib/services';
export type Service={id:string,hu:string,en:string,price:number,description:string[],active:number,position:number,minutes:number|null};
export type Contact={address:string,email:string,phone:string,instagram:string};
export const defaultContact:Contact={address:'1136 Budapest, Victor Hugo utca 16.',email:'ivettkovacs5@gmail.com',phone:'+36 30 892 1392',instagram:'ivettkovacs_pmu_artist'};
export const defaultServices:Service[]=defaults.map((s,i)=>({...s,active:1,position:i,minutes:null}));
export const telephone=(phone:string)=>'tel:'+phone.replace(/[^+0-9]/g,'');
export const instagramUrl=(handle:string)=>'https://www.instagram.com/'+encodeURIComponent(handle)+'/';
export const mapUrl=(address:string)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
