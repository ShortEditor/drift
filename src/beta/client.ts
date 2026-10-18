import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithPopup,signInWithCredential,signOut} from 'firebase/auth';
import {Capacitor} from '@capacitor/core';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
const e=import.meta.env;
export const betaApp=initializeApp({apiKey:e.VITE_BETA_FIREBASE_API_KEY,authDomain:e.VITE_BETA_FIREBASE_AUTH_DOMAIN,projectId:e.VITE_BETA_FIREBASE_PROJECT_ID,appId:e.VITE_BETA_FIREBASE_APP_ID},'drift-beta');
export const auth=getAuth(betaApp),db=getFirestore(betaApp);
if(import.meta.env.DEV&&e.VITE_BETA_EMULATORS==='1'){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8189);}
export const login=async()=>{
 if(Capacitor.isNativePlatform()){
  let r;
  try{r=await FirebaseAuthentication.signInWithGoogle();}
  catch(err){const m=String((err as any)?.message??err);if(!/credential manager/i.test(m))throw err;r=await FirebaseAuthentication.signInWithGoogle({useCredentialManager:false});}
  const t=r.credential?.idToken;
  if(!t)throw Error('Google sign-in did not return a credential.');
  return signInWithCredential(auth,GoogleAuthProvider.credential(t));
 }
 return signInWithPopup(auth,new GoogleAuthProvider());
};
export const logout=()=>signOut(auth);
const original=window.fetch.bind(window);
export function installBetaFetch(){window.fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof Request?input.url:input.toString(),location.href);if(url.origin===location.origin&&url.pathname.startsWith('/api/')){const headers=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));const token=await auth.currentUser?.getIdToken();if(token)headers.set('Authorization',`Bearer ${token}`);return original(input,{...init,headers,cache:'no-store'});}return original(input,init);};}
