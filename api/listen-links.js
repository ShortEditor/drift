import {betaAccess} from '../lib/beta-auth.js';
const platforms={spotify:'open.spotify.com',appleMusic:'music.apple.com',youtubeMusic:'music.youtube.com'};
export function safePlatformUrl(value,platform){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===platforms[platform]?u.href:null;}catch{return null;}}
const cache=new Map();let nextRequest=0;
export default async function handler(req,res){
 if(!await betaAccess(req,res))return;
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const {id}=req.query;if(typeof id!=='string'||!/^\d+$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<=0||Object.keys(req.query).some(k=>k!=='id'))return res.status(400).json({error:'Invalid track ID'});
 if(!process.env.ODESLI_API_KEY)return res.status(200).json({links:{},reason:'Search links only: public matching API is deprecated'});
 const cached=cache.get(id);if(cached&&cached.expires>Date.now()){res.setHeader('Cache-Control','public, s-maxage=86400');return res.json(cached.value);}
 // Conservative instance-local pace. Upstream quota still governs across instances.
 if(Date.now()<nextRequest)return res.status(429).json({links:{},reason:'Search links available while exact matching is busy'});nextRequest=Date.now()+7000;
 try{const p=new URLSearchParams({url:`https://www.deezer.com/track/${id}`,userCountry:'IN',key:process.env.ODESLI_API_KEY});const r=await fetch(`https://api.song.link/v1-alpha.1/links?${p}`,{signal:AbortSignal.timeout(7000)});if(!r.ok)throw new Error(`Matching HTTP ${r.status}`);const d=await r.json();const links={};for(const platform of Object.keys(platforms)){const url=safePlatformUrl(d.linksByPlatform?.[platform]?.url,platform);if(url)links[platform]=url;}
 const value={links};if(Object.keys(links).length){cache.set(id,{expires:Date.now()+86400000,value});if(cache.size>500)cache.delete(cache.keys().next().value);res.setHeader('Cache-Control','public, s-maxage=86400');}return res.json(value);
 }catch{return res.status(200).json({links:{},reason:'Exact matching unavailable. Use platform search.'});}
}
