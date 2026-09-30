import {apiUrl} from '../api/base';
import {useState} from 'react';
import type {Track} from '../api/types';
export type Platform='spotify'|'appleMusic'|'youtubeMusic';
export function searchLinks(title:string,artist:string):Record<Platform,string>{const q=encodeURIComponent(`${title} ${artist}`);return {spotify:`https://open.spotify.com/search/${q}`,appleMusic:`https://music.apple.com/in/search?term=${q}`,youtubeMusic:`https://music.youtube.com/search?q=${q}`};}
const labels:Record<Platform,string>={spotify:'Spotify',appleMusic:'Apple Music',youtubeMusic:'YouTube Music'};
const hosts:Record<Platform,string>={spotify:'open.spotify.com',appleMusic:'music.apple.com',youtubeMusic:'music.youtube.com'};
export function verifiedLinks(input:unknown):Partial<Record<Platform,string>>{const result:Partial<Record<Platform,string>>={};if(!input||typeof input!=='object')return result;for(const platform of Object.keys(hosts) as Platform[]){try{const value=(input as Record<string,string>)[platform];const u=new URL(value);if(u.protocol==='https:'&&u.hostname===hosts[platform])result[platform]=u.href;}catch{/* use search */}}return result;}
const cache=new Map<number,Partial<Record<Platform,string>>>();
export function ListenLinks({track}:{track:Pick<Track,'id'|'title'|'artist'>}){
 const [open,setOpen]=useState(false);const [matched,setMatched]=useState<Partial<Record<Platform,string>>>(()=>cache.get(track.id)||{});const [loading,setLoading]=useState(false);const fallback=searchLinks(track.title,track.artist.name);
 const reveal=async()=>{setOpen(v=>!v);if(open||track.id<=0||cache.has(track.id)||loading)return;setLoading(true);try{const r=await fetch(apiUrl(`/api/listen-links?id=${track.id}`),{signal:AbortSignal.timeout(8000)});if(r.ok){const d=await r.json();const safe=verifiedLinks(d.links);cache.set(track.id,safe);setMatched(safe);}}catch{/* search remains usable */}finally{setLoading(false);}};
 return <div className="listen-links"><button className="listen-toggle" aria-expanded={open} onClick={()=>void reveal()}>Listen full on ↗</button>{open&&<><div className="platform-links">{(Object.keys(labels) as Platform[]).map(platform=><a key={platform} href={matched[platform]||fallback[platform]} target="_blank" rel="noopener noreferrer" aria-label={`${matched[platform]?'Open':'Search'} ${track.title} on ${labels[platform]}`}>{labels[platform]}{!matched[platform]&&<small>Search</small>}</a>)}</div><p>{loading?'Matching this song… Search links work now.':'Exact matches when available; otherwise search. Platform access or subscription may be needed.'}</p></>}</div>;
}
