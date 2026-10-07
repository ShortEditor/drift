import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {collection,getDocs,addDoc,serverTimestamp} from 'firebase/firestore';
import {auth,db} from './client';
import type {Track} from '../api/types';
export default function ShareSong({track,onClose}:{track:Track;onClose:()=>void}){
 const [people,setPeople]=useState<{uid:string;username:string}[]>([]),[to,setTo]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{void getDocs(collection(db,'profiles')).then(s=>setPeople(s.docs.filter(d=>d.id!==auth.currentUser?.uid&&d.data().active).map(d=>({uid:d.id,username:d.data().username})))).catch(()=>setStatus('Could not load usernames.'));},[]);
 const send=async()=>{setBusy(true);try{await addDoc(collection(db,'messages'),{from:auth.currentUser!.uid,to,songId:track.id,sentAt:serverTimestamp()});setStatus('Song sent.');}catch{setStatus('Song could not be sent. Check that your friend still has beta access.');}finally{setBusy(false);}};
 return createPortal(<div className="beta-share-backdrop" onKeyDown={e=>{if(e.key==='Escape')onClose();}}><section className="beta-share-sheet" role="dialog" aria-modal="true" aria-label="Send current song"><button className="beta-share-close" onClick={onClose} aria-label="Close sharing">×</button><h2>Send this song</h2><p>{track.title} · {track.artist.name}</p><label>Username<select autoFocus value={to} onChange={e=>{setTo(e.target.value);setStatus('');}} aria-label="Recipient username"><option value="">Choose username</option>{people.map(p=><option key={p.uid} value={p.uid}>@{p.username}</option>)}</select></label>{!people.length&&<p>No other beta members yet. Invite a friend from your account menu.</p>}<button className="primary" disabled={!to||busy||status==='Song sent.'} onClick={()=>void send()}>Send song</button><p role="status">{status}</p><p>Only this song's ID is shared. No text or audio files.</p></section></div>,document.body);
}
