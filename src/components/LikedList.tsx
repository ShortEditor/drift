import {ListenLinks} from './ListenLinks';
import { useEffect,useState } from 'react';
import {refreshTrack} from '../api/catalog';
import type { Track } from '../api/types';
import type { Like } from '../likes/store';
export function LikedList({likes,label,onUnlike,onOpen}:{likes:Like[];label:string;onUnlike:(like:Like)=>void;onOpen:(t:Track)=>void}) {
 const [tracks,setTracks]=useState<Record<number,Track|null>>({}); const [retry,setRetry]=useState(0);
 useEffect(()=>{const abort=new AbortController(); const queue=[...likes]; const work=async()=>{while(queue.length&&!abort.signal.aborted){const like=queue.shift()!;try{const t=await refreshTrack(like.id);if(!abort.signal.aborted)setTracks(old=>({...old,[like.id]:t}));}catch{if(!abort.signal.aborted)setTracks(old=>({...old,[like.id]:null}));}}}; void Promise.all([work(),work()]);return()=>abort.abort();},[likes,retry]);
 return <section className="page"><p className="eyebrow">Keep the good ones</p><h1>Your liked songs</h1><p className="muted">{label}. Likes stay in this app.</p>{!likes.length?<div className="empty"><span>♡</span><h2>A little room for your favorites.</h2><p>Tap the heart on a song to save it here.</p></div>:likes.map(like=><div className="liked-row" key={like.id}><div><strong>{like.title}</strong><p>{like.artistName}</p><small>{tracks[like.id]===null?'Listen using the links below':tracks[like.id]?'Ready to rediscover':'Getting your preview…'}</small><ListenLinks track={{id:like.id,title:like.title,artist:{id:0,name:like.artistName}}}/></div><button disabled={!tracks[like.id]} onClick={()=>onOpen(tracks[like.id]!)} aria-label={`Open ${like.title}`}>↗</button><button onClick={()=>onUnlike(like)} aria-label={`Unlike ${like.title}`}>♥</button></div>)}{Object.values(tracks).some(t=>t===null)&&<button onClick={()=>setRetry(r=>r+1)}>Check previews again</button>}</section>;
}
