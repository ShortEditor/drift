import {apiUrl} from '../api/base';
export interface Highlight {offset:number;length:number}
// Energy and positive energy changes are a heuristic, not chorus or hook detection.
export function findHighlight(samples:Float32Array,sampleRate:number):Highlight {
 const duration=Math.min(30,samples.length/sampleRate);if(duration<15||!Number.isFinite(sampleRate)||sampleRate<=0)return {offset:0,length:duration};
 const frame=Math.max(1,Math.floor(sampleRate/5));const energy:number[]=[];for(let i=0;i<duration*sampleRate;i+=frame){let sum=0;const end=Math.min(i+frame,samples.length);for(let j=i;j<end;j++)sum+=samples[j]*samples[j];energy.push(Math.sqrt(sum/Math.max(1,end-i)));}
 const window=60;let best=0,bestScore=-Infinity;for(let start=0;start+window<=energy.length;start++){let score=0;for(let j=start;j<start+window;j++)score+=energy[j]+.3*Math.max(0,energy[j]-(energy[j-1]||energy[j]));if(score>bestScore+1e-5){bestScore=score;best=start;}}
 return {offset:Math.max(0,Math.min(duration-12,best/5)),length:12};
}
const cached=new Map<number,Highlight>();
export function cachedHighlight(id:number){return cached.get(id);}
export async function analyzePreview(id:number,signal:AbortSignal):Promise<Highlight|undefined>{
 if(cached.has(id))return cached.get(id);if(id<=0)return;let context:AudioContext|undefined;
 try{const r=await fetch(apiUrl(`/api/preview-audio?id=${id}`),{signal,cache:'no-store'});if(!r.ok)return;const bytes=await r.arrayBuffer();if(signal.aborted)return;context=new AudioContext();const decoded=await context.decodeAudioData(bytes);if(signal.aborted)return;
 const mono=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const channel=decoded.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/decoded.numberOfChannels;}
 const result=findHighlight(mono,decoded.sampleRate);cached.set(id,result);return result;
 }catch{return;}finally{if(context)void context.close().catch(()=>{});}
}
