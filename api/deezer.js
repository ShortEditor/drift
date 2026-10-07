import {betaAccess} from '../lib/beta-auth.js';
const allowedPath = /^\/(search(?:\/artist)?|genre|track\/\d+|artist\/\d+(?:\/top)?|album\/\d+(?:\/tracks)?|chart\/\d+\/tracks)$/;
export default async function handler(req, res) {
 if(!await betaAccess(req,res))return;
 if(req.method !== 'GET') return res.status(405).json({error:{message:'GET only'}});
 const {path, ...params}=req.query;
 if(typeof path!=='string'||!allowedPath.test(path)||Object.keys(params).some(k=>!['q','limit','index'].includes(k))||Object.values(params).some(v=>typeof v!=='string')) return res.status(400).json({error:{message:'Catalog request not allowed'}});
 if((params.q?.length||0)>200||['limit','index'].some(k=>params[k]!==undefined&&(!/^\d+$/.test(params[k])||Number(params[k])>(k==='limit'?100:10000)))) return res.status(400).json({error:{message:'Invalid catalog parameter'}});
 try {const response=await fetch(`https://api.deezer.com${path}?${new URLSearchParams(params)}`,{signal:AbortSignal.timeout(15000)});if(!response.ok) throw new Error(`Catalog HTTP ${response.status}`); const data=await response.json(); res.setHeader('Cache-Control',process.env.DRIFT_BETA==='1'?'no-store':'public, s-maxage=120, stale-while-revalidate=300'); return res.status(200).json(data);}
 catch(e){return res.status(502).json({error:{message:`Catalog relay unavailable: ${e.message}`}});}
}
