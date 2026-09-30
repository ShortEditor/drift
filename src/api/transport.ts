import {apiUrl} from './base';
import { jsonp } from './jsonp';
import { validateEnvelope, ApiError } from './types';
export function timeoutMs() { const connection=(navigator as Navigator & {connection?:{effectiveType?:string;saveData?:boolean}}).connection; return connection?.saveData||connection?.effectiveType?.includes('2g')?25000:/Android|iPhone|Mobile/i.test(navigator.userAgent)?18000:12000; }
export async function transport<T>(path:string,params:Record<string,string|number>={},signal?:AbortSignal):Promise<T> {
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 const controller=new AbortController(); const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>controller.abort(),timeoutMs());let cause='';
 try {const query=new URLSearchParams({path,...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))});const r=await fetch(apiUrl(`/api/deezer?${query}`),{signal:controller.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return validateEnvelope<T>(await r.json());}
 catch(e){if(signal?.aborted)throw new DOMException('Aborted','AbortError');if(e instanceof ApiError)throw e;cause=(e as Error).name==='AbortError'?'timed out':(e as Error).message;console.warn('[catalog] relay failed:',cause);}
 finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 try {return await jsonp<T>(path,params,signal,timeoutMs());}catch(e){if((e as Error).name==='AbortError'||e instanceof ApiError)throw e;throw new Error(`The music catalog did not answer. Relay: ${cause}. Direct: ${(e as Error).message}. Retry or check your connection.`);}
}
