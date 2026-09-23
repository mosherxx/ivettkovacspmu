'use client';
import {useEffect,useState} from 'react';
import {staticSite} from '@/lib/site-mode';
import {defaultContact,defaultServices,type Service,type Contact} from '@/lib/catalog';
export function useCatalog(){const [services,setServices]=useState<Service[]>(defaultServices),[contact,setContact]=useState<Contact>(defaultContact),[ready,setReady]=useState(staticSite),[error,setError]=useState(false);async function refresh(){if(staticSite)return;setError(false);try{const r=await fetch('/api/catalog');if(!r.ok)throw Error();const d=await r.json() as {services:Service[],contact:Contact};setServices(d.services);setContact(d.contact);setReady(true)}catch{setError(true)}}useEffect(()=>{refresh()},[]);return {services,contact,ready,error,refresh}}
