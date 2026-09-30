const PROJECT='drift-download-counters';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).end();
 // Counts requests, not completion/installation. No identities or device IDs stored.
 try{const response=await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:commit`,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(2000),body:JSON.stringify({writes:[{transform:{document:`projects/${PROJECT}/databases/(default)/documents/counters/downloads`,fieldTransforms:[{fieldPath:'count',increment:{integerValue:'1'}}]}}]})});if(!response.ok)console.warn('Download counter unavailable');}catch{console.warn('Download counter unavailable');}
 // An analytics outage never blocks installation.
 res.setHeader('Location','/releases/drift-1.6.apk');return res.status(302).end();
}
