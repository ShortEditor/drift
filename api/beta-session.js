import {betaAccess} from '../lib/beta-auth.js';
export default async function handler(req,res){
 if(process.env.DRIFT_BETA!=='1')return res.status(404).end();
 if(req.method!=='GET')return res.status(405).end();
 if(!await betaAccess(req,res))return;
 res.setHeader('Cache-Control','no-store');return res.json({uid:req.beta.uid});
}
