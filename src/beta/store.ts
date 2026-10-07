import {collection,doc,getDoc,getDocs,setDoc,deleteDoc} from 'firebase/firestore';
import {db} from './client';
import type {Like,LikesStore,Preferences} from '../likes/store';
export function betaLikesStore(uid:string):LikesStore{return {label:'Saved to your private beta account',async list(){return (await getDocs(collection(db,'users',uid,'likes'))).docs.map(d=>d.data() as Like);},async set(l,v){if(v)await setDoc(doc(db,'users',uid,'likes',String(l.id)),l);else await deleteDoc(doc(db,'users',uid,'likes',String(l.id)));},async preferences(){const d=await getDoc(doc(db,'users',uid,'preferences','discovery'));return d.exists()?d.data() as Preferences:null;},async savePreferences(v){await setDoc(doc(db,'users',uid,'preferences','discovery'),v);}};}
