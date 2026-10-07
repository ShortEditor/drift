import { localStore, type LikesStore, type Preferences } from './store';
export async function createLikesStore():Promise<LikesStore> {
  if(import.meta.env.VITE_DRIFT_BETA==='1'){const {auth}=await import('../beta/client');const {betaLikesStore}=await import('../beta/store');if(!auth.currentUser)throw new Error('Sign in first.');return betaLikesStore(auth.currentUser.uid);}
  const e=import.meta.env; const values=[e.VITE_FIREBASE_API_KEY,e.VITE_FIREBASE_AUTH_DOMAIN,e.VITE_FIREBASE_PROJECT_ID,e.VITE_FIREBASE_APP_ID];
  if(values.every(v=>!v)) return localStore;
  if(values.some(v=>!v)) throw new Error('Firebase config is incomplete. Fill all four fields or clear all for device storage.');
  const [{initializeApp},{getAuth,signInAnonymously,connectAuthEmulator},{getFirestore,collection,getDocs,doc,setDoc,deleteDoc,getDoc,connectFirestoreEmulator}]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
  const app=initializeApp({apiKey:e.VITE_FIREBASE_API_KEY,authDomain:e.VITE_FIREBASE_AUTH_DOMAIN,projectId:e.VITE_FIREBASE_PROJECT_ID,appId:e.VITE_FIREBASE_APP_ID});
  const auth=getAuth(app); const db=getFirestore(app);
  if(e.VITE_USE_FIREBASE_EMULATORS==='true') {connectAuthEmulator(auth,'http://127.0.0.1:9099'); connectFirestoreEmulator(db,'127.0.0.1',8189);}
  const {user}=await signInAnonymously(auth); const uid=user.uid;
  return {label:'Saved to your anonymous Firebase account', async list() {return (await getDocs(collection(db,'users',uid,'likes'))).docs.map(d=>d.data() as import('./store').Like);}, async set(like,liked) {const ref=doc(db,'users',uid,'likes',String(like.id)); if(liked) await setDoc(ref,like); else await deleteDoc(ref);}, async preferences() {const d=await getDoc(doc(db,'users',uid,'preferences','discovery')); return d.exists()?d.data() as Preferences:null;}, async savePreferences(v) {await setDoc(doc(db,'users',uid,'preferences','discovery'),v);} };
}
