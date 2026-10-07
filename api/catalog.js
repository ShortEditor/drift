import {betaAccess} from '../lib/beta-auth.js';
import {routeCatalog} from './lib/router.js';
export function mapJamendo(t) {
 const id=Number(t.id),artistId=Number(t.artist_id);if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(artistId)||!t.name||!t.artist_name||!t.license_ccurl||!t.shareurl)return null;
 return {id:-id,duration:Number(t.duration)||undefined,lyrics:typeof t.lyrics==='string'?t.lyrics:undefined,title:t.name,artist:{id:-artistId,name:t.artist_name},album:{id:-Number(t.album_id||id),title:t.album_name||t.name,cover_big:t.image},preview:t.audio,source:'jamendo',providerId:id,credit:{licenseUrl:t.license_ccurl,trackUrl:t.shareurl,artist:t.artist_name,provider:'Jamendo'}};
}
export default async function handler(req,res) {
 if(!await betaAccess(req,res))return;
 if(req.method!=='GET')return res.status(405).json({error:{message:'GET only'}});
 const q=req.query;
 if(Object.keys(q).some(k=>!['source','query','genre','index','intent','track','status','seed'].includes(k))||Object.values(q).some(v=>typeof v!=='string'))return res.status(400).json({error:{message:'Invalid query'}});
 if(q.status==='1')return res.json({jamendo:Boolean(process.env.JAMENDO_CLIENT_ID),jev:false});
 if(q.query?.length>200||!['auto','deezer','jamendo'].includes(q.source||'auto')||['genre','index','track','seed'].some(k=>q[k]!==undefined&&!/^\d+$/.test(q[k])))return res.status(400).json({error:{message:'Invalid parameter'}});
 const seed=Number(q.seed||0);if(seed>19)return res.status(400).json({error:{message:'Invalid seed'}});const index=Number(q.index||0);if(index>10000)return res.status(400).json({error:{message:'Index too large'}});
 const providers={
  deezer:async()=>{const p=new URLSearchParams({limit:'100',index:'0'});if(q.query)p.set('q',q.query);const path=q.query?'/search':`/chart/${q.genre||0}/tracks`;const r=await fetch(`https://api.deezer.com${path}?${p}`,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(`Catalog HTTP ${r.status}`);const d=await r.json();if(d.error)throw new Error(d.error.message||'Catalog error');
   const rotation=(q.query?0:seed*25)%Math.max(1,d.data.length);const ordered=[...d.data.slice(rotation),...d.data.slice(0,rotation)];return {data:ordered.slice(index,index+25).map(t=>({...t,source:'deezer'})),total:ordered.length,next:index+25<ordered.length?'more':undefined};},
  jamendo:async()=>{if(!process.env.JAMENDO_CLIENT_ID)throw new Error('Jamendo setup pending');const start=index+(q.query?0:seed*100);for(let attempt=0;attempt<3;attempt++){const offset=start+attempt*100;const p=new URLSearchParams({client_id:process.env.JAMENDO_CLIENT_ID,format:'json',limit:q.track?'1':'100',audioformat:'mp32',order:q.query?'relevance':'popularity_total',include:'licenses+lyrics'});if(!q.track)p.set('offset',String(offset));if(q.track)p.set('id',q.track);else if(q.query)p.set('search',q.query.replace(/copyright.?free|royalty.?free|creative commons|\bcc0\b/gi,'').trim());const r=await fetch(`https://api.jamendo.com/v3.0/tracks/?${p}`,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(`Jamendo HTTP ${r.status}`);const d=await r.json();if(d.headers?.status!=='success')throw new Error(d.headers?.error_message||'Jamendo error');const data=d.results.map(mapJamendo).filter(Boolean);if(data.length||d.results.length<100||q.track)return {data,total:d.headers?.results_fullcount,nextIndex:index+(attempt+1)*100,next:!q.track&&d.results.length===100&&offset+100<10000?'more':undefined};}return {data:[]};}

 };
 try {const input={source:q.track?'jamendo':q.source||'auto',query:q.query||'',intent:q.intent||''};const result=await routeCatalog(input,providers);res.setHeader('Cache-Control','no-store');return res.json(result);}
 catch(e){return res.status(503).json({error:{message:e.message},routing:e.routing});}
}
