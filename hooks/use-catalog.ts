'use client';
import {useEffect,useState} from 'react';
import {defaultContact,defaultServices,type Service,type Contact} from '@/lib/catalog';
export function useCatalog(){const [services,setServices]=useState<Service[]>(defaultServices),[contact,setContact]=useState<Contact>(defaultContact),[ready,setReady]=useState(false),[error,setError]=useState(false);async function refresh(){setError(false);try{const r=await fetch('/api/catalog');if(!r.ok)throw Error();const d=await r.json() as {services:Service[],contact:Contact};setServices(d.services);setContact(d.contact);setReady(true)}catch{setError(true)}}useEffect(()=>{refresh()},[]);return {services,contact,ready,error,refresh}}
