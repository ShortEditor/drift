const cache=new Map();let blockedUntil=0;let chain=Promise.resolve();
export const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function chooseLyrics(rows,{title,artist,album,duration}){
 const hits=rows.filter(r=>normalize(r.trackName)===normalize(title)&&normalize(r.artistName)===normalize(artist)&&(!duration||Math.abs(r.duration-duration)<=2));
 const exact=hits.filter(r=>album&&normalize(r.albumName)===normalize(album));
 const list=exact.length?exact:hits;
 if(!list.length)return null;
 // Multiple submissions of the same album/duration are revisions, not different tracks.
 if(list.length>1&&(!exact.length||list.some(r=>Math.abs(r.duration-list[0].duration)>2)))return null;
 const r=[...list].sort((a,b)=>Number(Boolean(b.plainLyrics))-Number(Boolean(a.plainLyrics))||Number(b.id)-Number(a.id))[0];if(!r.plainLyrics&&!r.syncedLyrics)return null;
 const text=r.plainLyrics||r.syncedLyrics.replace(/\[[^\]]*\]/g,'').trim();
 return {text,source:'LRCLIB',sourceUrl:'https://lrclib.net/',syncedLyrics:duration&&exact.length? r.syncedLyrics||null:null,syncedAvailable:Boolean(duration&&exact.length&&r.syncedLyrics),instrumental:Boolean(r.instrumental)};
}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const {title,artist,album='',duration:rawDuration}=req.query;const duration=rawDuration?Number(rawDuration):undefined;
 if(Object.keys(req.query).some(k=>!['title','artist','album','duration'].includes(k))||[title,artist,album].some(v=>typeof v!=='string'||v.length>200)||!title||!artist||(rawDuration!==undefined&&(typeof rawDuration!=='string'||!Number.isFinite(duration)||duration<=0||duration>36000)))return res.status(400).json({error:'Invalid track metadata'});
 const key=JSON.stringify([title,artist,album,duration]);const hit=cache.get(key);
 if(hit&&hit.until>Date.now())return res.json(hit.value);
 if(Date.now()<blockedUntil)return res.status(503).json({error:'Lyrics temporarily unavailable'});
 let release;const previous=chain;chain=new Promise(r=>release=r);await previous;
 try{
 if(Date.now()<blockedUntil)return res.status(503).json({error:'Lyrics temporarily unavailable'});
 const url=new URL(duration?'https://lrclib.net/api/get':'https://lrclib.net/api/search');url.search=new URLSearchParams({track_name:title,artist_name:artist,...(duration?{album_name:album,duration:String(duration)}:{})}).toString();
 const response=await fetch(url,{headers:{'User-Agent':'drift/1.4 (https://drift-music-scroll.vercel.app)'},signal:AbortSignal.timeout(8000)});
 if(response.status===429){const retry=response.headers.get('retry-after');const seconds=Number(retry);blockedUntil=Date.now()+(Number.isFinite(seconds)&&seconds>0?seconds*1000:Math.max(60000,Date.parse(retry||'')-Date.now()||60000));return res.status(503).json({error:'Lyrics temporarily unavailable'});}
 if(response.status===404)return res.json({lyrics:null});if(!response.ok)throw new Error();const result=await response.json();const rows=duration?[result]:result;if(!Array.isArray(rows))throw new Error();
 const value={lyrics:chooseLyrics(rows,{title,artist,album,duration})};if(cache.size>150)cache.clear();cache.set(key,{value,until:Date.now()+3600000});res.setHeader('Cache-Control','public, s-maxage=3600');return res.json(value);
 }catch{return res.status(503).json({error:'Lyrics unavailable right now'});}finally{await new Promise(r=>setTimeout(r,300));release();}
}
