import {useEffect,useState} from 'react';
import {collection,doc,getDocs,runTransaction,serverTimestamp} from 'firebase/firestore';
import type {User} from 'firebase/auth';
import {db} from './client';
export async function redeemInvite(user:User,token:string){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid invitation link.');
 await runTransaction(db,async t=>{const link=doc(db,'inviteLinks',token),grant=doc(db,'invites',user.email!);const [l,g]=await Promise.all([t.get(link),t.get(grant)]);if(g.exists()){if(!g.data().active)throw Error('Your access has been revoked.');return;}if(!l.exists()||l.data().redeemedUid)throw Error('This invitation is invalid or has already been used.');t.update(link,{redeemedUid:user.uid});t.set(grant,{active:true,uid:user.uid,invitedBy:l.data().creator,linkToken:token});});
}
export function InvitePeople({uid}:{uid:string}){
 const [links,setLinks]=useState<{slot:string;token:string}[]>([]),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{const r=await getDocs(collection(db,'inviteSlots',uid,'slots'));setLinks(r.docs.map(d=>({slot:d.id,token:d.data().token})).sort((a,b)=>a.slot.localeCompare(b.slot)));};
 useEffect(()=>{void load().catch(()=>setStatus('Could not load invitations.'));},[uid]);
 const create=async()=>{setBusy(true);setStatus('');try{await runTransaction(db,async t=>{const refs=['1','2','3','4','5'].map(s=>doc(db,'inviteSlots',uid,'slots',s));const slots=await Promise.all(refs.map(r=>t.get(r)));const i=slots.findIndex(s=>!s.exists());if(i<0)throw Error('All five invitations have been created.');const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');t.set(refs[i],{token});t.set(doc(db,'inviteLinks',token),{creator:uid,slot:String(i+1),createdAt:serverTimestamp(),redeemedUid:''});});await load();setStatus('Invitation created. Share it only with the person you want to admit.');}catch(e){setStatus((e as Error).message);}finally{setBusy(false);}};
 return <section className="beta-invites"><h2>Invite your circle</h2><p>Each member gets five single-use invitations in total. The first Google account to redeem a link gets access. Keep links private; used slots cannot be replaced.</p><button disabled={busy||links.length>=5} onClick={()=>void create()}>Create invite ({links.length}/5 used)</button><p role="status">{status}</p>{links.map(l=><div key={l.slot}><label>Invitation {l.slot}<input readOnly value={`${location.origin}/?invite=${l.token}`} aria-label={`Invitation ${l.slot} link`}/></label><button onClick={()=>void navigator.clipboard.writeText(`${location.origin}/?invite=${l.token}`).then(()=>setStatus('Link copied.')).catch(()=>setStatus('Copy the link from the field.'))}>Copy link</button></div>)}</section>;
}
