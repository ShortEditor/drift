import {describe,it,expect,afterEach,vi} from 'vitest';
import {readFollows,writeFollows,followingTracks,followsKey} from '../src/follows/store';
import {Deezer} from '../src/api/deezer';
import {transport} from '../src/api/transport';
import {ApiError} from '../src/api/types';
import type {Track} from '../src/api/types';
const track=(id:number,artist:number):Track=>({id,title:`Track ${id}`,artist:{id:artist,name:'Artist'}});
afterEach(()=>{localStorage.clear();vi.restoreAllMocks();vi.unstubAllGlobals();document.head.querySelectorAll('script').forEach(s=>s.remove());});
describe('artist follows',()=>{
 it('persists only artist IDs and names and deduplicates reads',()=>{writeFollows([{id:1,name:'Sid Sriram'},{id:1,name:'Sid Sriram'}]);expect(readFollows()).toEqual([{id:1,name:'Sid Sriram'}]);expect(JSON.parse(localStorage.getItem(followsKey)!)[0]).toEqual({id:1,name:'Sid Sriram'});writeFollows([]);expect(readFollows()).toEqual([]);});
 it('filters malformed saved follows',()=>{localStorage.setItem(followsKey,JSON.stringify([null,{id:-1,name:'bad'},{id:1,name:'Valid'}]));expect(readFollows()).toEqual([{id:1,name:'Valid'}]);});
 it('never mixes non-followed artists into Following and deduplicates',()=>{expect(followingTracks([track(1,1),track(1,1),track(2,2),track(3,1)],[{id:1,name:'A'}]).map(t=>t.id).sort()).toEqual([1,3]);expect(followingTracks([track(1,1)],[])).toEqual([]);});
 it('uses artist search and top-track catalog endpoints',async()=>{const t=vi.fn(async()=>({data:[]}));const d=new Deezer(t as never);await d.artists('Devi Sri Prasad');await d.artistTop(1);expect(t).toHaveBeenNthCalledWith(1,'/search/artist',{q:'Devi Sri Prasad',limit:25},undefined);expect(t).toHaveBeenNthCalledWith(2,'/artist/1/top',{limit:50},undefined);});
});
function reply(data:unknown){const script=document.head.querySelector('script')!;const name=new URL(script.src).searchParams.get('callback')!;(window as unknown as Record<string,(d:unknown)=>void>)[name](data);}
describe('relay-first transport',()=>{
 it('uses same-origin relay first with encoded query',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({data:[]})});vi.stubGlobal('fetch',fetcher);expect(await transport('/search',{q:'తెలుగు & Hindi'})).toEqual({data:[]});expect(new URL(fetcher.mock.calls[0][0],'https://app.test').searchParams.get('q')).toBe('తెలుగు & Hindi');expect(document.head.querySelector('script')).toBeNull();});
 it('preserves API errors without masking them as network failures',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({error:{code:4,message:'Rate limit'}})}));await expect(transport('/genre')).rejects.toThrow(ApiError);expect(document.head.querySelector('script')).toBeNull();});
 it('falls back to direct transport on relay network failure',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline relay')));const request=transport('/genre');await vi.waitFor(()=>expect(document.head.querySelector('script')).not.toBeNull());reply({data:[]});expect(await request).toEqual({data:[]});});
 it('falls back on non-JSON relay response',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>{throw new Error('bad JSON');}}));const request=transport('/genre');await vi.waitFor(()=>expect(document.head.querySelector('script')).not.toBeNull());reply({data:[]});expect(await request).toEqual({data:[]});});
 it('reports both failures',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('relay down')));const request=transport('/genre');const failed=expect(request).rejects.toThrow('Relay: relay down. Direct: Could not reach catalog');await vi.waitFor(()=>expect(document.head.querySelector('script')).not.toBeNull());document.head.querySelector('script')!.dispatchEvent(new Event('error'));await failed;});
 it('does not fall back after owner abort',async()=>{const a=new AbortController();a.abort();await expect(transport('/genre',{},a.signal)).rejects.toMatchObject({name:'AbortError'});expect(document.head.querySelector('script')).toBeNull();});
});
