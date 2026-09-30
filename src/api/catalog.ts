import {apiUrl} from './base';
import {deezer} from './deezer';
import {ApiError, type Track, type CatalogList} from './types';
export type Source='auto'|'deezer'|'jamendo';
export async function catalogBatch(mode:{query?:string;genre:number;source:Source;seed?:number},index:number,signal?:AbortSignal):Promise<CatalogList<Track>> {
 const params=new URLSearchParams({source:mode.source,query:mode.query||'',genre:String(mode.genre),index:String(index),seed:String(mode.seed||0)});
 for(let attempt=0;attempt<3;attempt++){
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  const timeout=new AbortController();const abort=()=>timeout.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>timeout.abort(),18000);
  try{const r=await fetch(apiUrl(`/api/catalog?${params}`),{signal:timeout.signal,cache:'no-store'});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error?.message||'Catalog unavailable');console.info('[catalog routing]',d.routing);return d;}
  catch(e){if(signal?.aborted)throw new DOMException('Aborted','AbortError');if(attempt===2)throw new ApiError((e as Error).name==='AbortError'?'Catalog timed out. Retry.':(e as Error).message);await new Promise(r=>setTimeout(r,500*2**attempt));}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
 throw new ApiError('Catalog unavailable');
}
export async function refreshTrack(id:number):Promise<Track> {if(id>0)return deezer.track(id);const r=await fetch(apiUrl(`/api/catalog?source=jamendo&track=${Math.abs(id)}`));const d=await r.json();if(!r.ok||!d.data?.[0])throw new Error('Preview unavailable');return d.data[0];}
