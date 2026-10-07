import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export function validIdentity(p,project){return p.aud===project&&p.iss===`https://securetoken.google.com/${project}`&&typeof p.sub==='string'&&p.sub.length>0&&p.email_verified===true&&typeof p.email==='string'&&p.firebase?.sign_in_provider==='google.com';}
export async function betaAccess(req,res){
 if(process.env.DRIFT_BETA!=='1')return true;
 res.setHeader('Cache-Control','no-store');
 const project=process.env.BETA_FIREBASE_PROJECT_ID;
 const token=/^Bearer (\S+)$/.exec(req.headers?.authorization||'')?.[1];
 if(!project||!token){res.status(401).json({error:{message:'Sign in to the private beta.'}});return false;}
 try{
  const {payload}=await jwtVerify(token,keys,{audience:project,issuer:`https://securetoken.google.com/${project}`,algorithms:['RS256']});
  if(!validIdentity(payload,project))throw Error('identity');
  const url=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/invites/${encodeURIComponent(payload.email)}`;
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(5000)});
  const d=await r.json();if(!r.ok||d.fields?.active?.booleanValue!==true)throw Error('not invited');
  req.beta={uid:payload.sub,email:payload.email,token};return true;
 }catch{res.status(403).json({error:{message:'This Google account does not have beta access.'}});return false;}
}
