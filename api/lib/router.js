// Pure, testable intent routing. Never let network fallback change reuse rights.
export function decideSource({source='auto',query='',intent='',kind='tracks'}) {
 const normalized=query.trim().toLowerCase().replace(/\s+/g,' ');
 const reuse=/copyright.?free|royalty.?free|creative commons|\bcc0\b|reusable|for (?:my )?(?:edit|film|video)/i.test(`${intent} ${normalized}`);
 if(source==='deezer'||source==='jamendo') return {chosen:source,reason:'manual-override',fallbackAllowed:false,normalized,reuse};
 if(kind==='artists'||kind==='following')return {chosen:'deezer',reason:'artist-catalog',fallbackAllowed:false,normalized,reuse};
 if(reuse||/\bindie\b|\bjamendo\b/i.test(`${intent} ${normalized}`))return {chosen:'jamendo',reason:reuse?'reuse-intent':'indie-intent',fallbackAllowed:!reuse,normalized,reuse};
 if(/[\u0c00-\u0c7f\u0900-\u097f]|telugu|hindi|sid sriram|anirudh|devi sri prasad|arijit|rahman|mainstream/i.test(normalized))return {chosen:'deezer',reason:'language-or-mainstream',fallbackAllowed:!reuse,normalized,reuse};
 return {chosen:'deezer',reason:normalized?'general-search':'global-charts',fallbackAllowed:!reuse,normalized,reuse};
}
export async function routeCatalog(input,providers) {
 const decision=decideSource(input);const attempts=[];let primary;
 const read=async source=>{try {const result=await providers[source]();if(!Array.isArray(result.data))throw new Error('Invalid track list');attempts.push({source,count:result.data.length});return result;}catch(e){attempts.push({source,error:e.message});return null;}};
 primary=await read(decision.chosen);let served=decision.chosen,result=primary;
 if((!primary||primary.data.length<3)&&decision.fallbackAllowed){const other=decision.chosen==='deezer'?'jamendo':'deezer';const fallback=await read(other);if(fallback&&(!primary||fallback.data.length>primary.data.length)){result=fallback;served=other;}}
 if(!result)throw Object.assign(new Error('Music sources unavailable'),{routing:{...decision,served:null,attempts}});
 return {...result,routing:{...decision,served,fallback:served!==decision.chosen,attempts}};
}
