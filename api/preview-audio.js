import {betaAccess} from '../lib/beta-auth.js';
export function allowedPreview(url){try{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='cdnt-preview.dzcdn.net'||u.hostname.endsWith('.dzcdn.net'))&&u.pathname.endsWith('.mp3');}catch{return false;}}
export default async function handler(req,res){
 if(!await betaAccess(req,res))return;
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();const {id}=req.query;if(typeof id!=='string'||!/^\d+$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<=0||Object.keys(req.query).some(k=>k!=='id'))return res.status(400).json({error:'Invalid preview ID'});
 try{const metadata=await fetch(`https://api.deezer.com/track/${id}`,{signal:AbortSignal.timeout(5000)});if(!metadata.ok)throw new Error('Metadata unavailable');const t=await metadata.json();if(!allowedPreview(t.preview))return res.status(404).json({error:'Preview unavailable'});
 const audio=await fetch(t.preview,{signal:AbortSignal.timeout(7000),redirect:'error'});if(!audio.ok||Number(audio.headers.get('content-length')||0)>2000000)throw new Error('Audio unavailable');
 const reader=audio.body.getReader();const chunks=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>2000000){await reader.cancel();throw new Error('Preview too large');}chunks.push(value);}res.setHeader('Content-Type','audio/mpeg');return res.status(200).send(Buffer.concat(chunks.map(c=>Buffer.from(c))));
 }catch{return res.status(502).json({error:'Preview analysis unavailable'});}
}
