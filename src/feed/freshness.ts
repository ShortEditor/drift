const KEY='drift-feed-refresh-v1';
export function nextFeedSeed():number {
 try {const old=Number(localStorage.getItem(KEY)||'0');const seed=Number.isSafeInteger(old)&&old>=0?old%20:0;localStorage.setItem(KEY,String(seed+1));return seed;}catch{return Math.floor(Math.random()*20);}
}
const RECENT='drift-feed-recent-v1';
export function recentTracks():number[]{try{const value=JSON.parse(localStorage.getItem(RECENT)||'[]');return Array.isArray(value)?value.filter(n=>Number.isSafeInteger(n)&&n!==0).slice(-80):[];}catch{return [];}}
export function rememberTrack(id:number){try{localStorage.setItem(RECENT,JSON.stringify([...recentTracks().filter(n=>n!==id),id].slice(-80)));}catch{/* Feed still works when storage is unavailable. */}}
