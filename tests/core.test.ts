import {afterEach,describe,it,expect,vi} from 'vitest';
import {jsonp} from '../src/api/jsonp';
import {ApiError,validateEnvelope,type Track} from '../src/api/types';
import {TrackPool} from '../src/feed/pool';
import {localStore,toggleLike} from '../src/likes/store';
import {AudioController} from '../src/audio/controller';
import {Deezer} from '../src/api/deezer';
const track=(id:number,artist=1):Track=>({id,title:`Song ${id}`,artist:{id:artist,name:'Artist'},preview:`https://preview.test/${id}?signed=keep`,link:`https://www.deezer.com/track/${id}`});
afterEach(()=>{vi.useRealTimers();localStorage.clear();document.head.querySelectorAll('script').forEach(s=>s.remove());});
function callback(){const s=document.head.querySelector('script')!;return {script:s,name:new URL(s.src).searchParams.get('callback')!};}
function deliver(name:string,data:unknown){(window as unknown as Record<string,(v:unknown)=>void>)[name](data);}
describe('JSONP transport',()=>{
 it('encodes queries and cleans script/callback after success',async()=>{const p=jsonp('/search',{q:'తెలుగు love & song',limit:25});const {script,name}=callback();expect(new URL(script.src).searchParams.get('q')).toBe('తెలుగు love & song');const late=(window as unknown as Record<string,(v:unknown)=>void>)[name];deliver(name,{data:[]});expect(await p).toEqual({data:[]});expect(document.contains(script)).toBe(false);expect(name in window).toBe(false);expect(()=>late({data:[track(2)]})).not.toThrow();});
 it('rejects HTTP-200 error envelopes',async()=>{const p=jsonp('/genre');deliver(callback().name,{error:{code:4,message:'Rate limit'}});await expect(p).rejects.toThrow('Rate limit');expect(document.head.querySelector('script')).toBeNull();});
 it('times out and removes callback',async()=>{vi.useFakeTimers();const p=jsonp('/genre');const name=callback().name;const failure=expect(p).rejects.toThrow('timed out');await vi.advanceTimersByTimeAsync(8000);await failure;expect(name in window).toBe(false);expect(document.head.querySelector('script')).toBeNull();});
 it('cleans abort and script errors',async()=>{const a=new AbortController();const p=jsonp('/genre',{},a.signal);a.abort();await expect(p).rejects.toMatchObject({name:'AbortError'});const p2=jsonp('/genre');callback().script.dispatchEvent(new Event('error'));await expect(p2).rejects.toThrow('Could not reach');expect(document.head.querySelector('script')).toBeNull();});
 it('rejects arbitrary hosts, paths and queries',async()=>{await expect(jsonp('https://evil.test')).rejects.toThrow('not allowed');await expect(jsonp('/search',{token:'secret'})).rejects.toThrow('not allowed');});
});
describe('catalog and pool',()=>{
 it('validates error envelopes',()=>{expect(()=>validateEnvelope({error:{code:100,message:'bad'}})).toThrow(ApiError);});
 it('deduplicates, respects next and ends exhausted searches',()=>{const p=new TrackPool();expect(p.append({data:[track(1),track(1),track(2,2)],next:'provider-next'})).toHaveLength(2);expect(p.index).toBe(3);expect(p.exhausted).toBe(false);expect(p.append({data:[track(2),track(3)]})).toHaveLength(1);expect(p.exhausted).toBe(true);});
 it('stops empty or repeating batches',()=>{const p=new TrackPool();p.append({data:[track(1)],next:'next'});p.append({data:[track(1)],next:'next'});expect(p.exhausted).toBe(true);const empty=new TrackPool();empty.append({data:[],next:'next'});expect(empty.exhausted).toBe(true);});
 it('coalesces duplicate session reads',async()=>{const transport=vi.fn(async()=>track(1));const d=new Deezer(transport as never);const [a,b]=await Promise.all([d.track(1),d.track(1)]);expect(a).toEqual(b);expect(transport).toHaveBeenCalledTimes(1);});
});
describe('likes',()=>{
 it('persists only permitted metadata, idempotently',async()=>{const like={id:1,title:'Song',artistName:'Artist',likedAt:1};await localStore.set(like,true);await localStore.set(like,true);expect(await localStore.list()).toEqual([like]);await localStore.set(like,false);expect(await localStore.list()).toEqual([]);expect(localStorage.getItem('drift-likes-v1')).not.toContain('preview');});
 it('rolls back failed writes',async()=>{const changes:unknown[]=[];const broken={...localStore,set:vi.fn().mockRejectedValue(new Error('permission'))};await expect(toggleLike(broken,[],{id:1,title:'A',artistName:'B',likedAt:1},v=>changes.push(v))).rejects.toThrow();expect(changes).toHaveLength(2);expect(changes[1]).toEqual([]);});
});
function fakeAudio(){const a=new EventTarget() as HTMLAudioElement;Object.assign(a,{currentTime:0,duration:30,preload:'',src:'',play:vi.fn().mockResolvedValue(undefined),pause:vi.fn(),removeAttribute:vi.fn()});return a;}
describe('shared audio',()=>{
 it('uses one element, preserves pause across rapid swipes',async()=>{const a=fakeAudio(),c=new AudioController(a,async id=>track(id));c.setTrack(track(1));c.start();await Promise.resolve();c.setTrack(track(2));c.setTrack(track(3));await Promise.resolve();expect(a.src).toBe(track(3).preview);expect(c.state.id).toBe(3);c.pause();const count=vi.mocked(a.play).mock.calls.length;c.setTrack(track(4));expect(a.play).toHaveBeenCalledTimes(count);expect(c.state.pausedByUser).toBe(true);c.dispose();});
 it('discards stale plays and pauses on visibility/route suspension',async()=>{const a=fakeAudio();let resolve!:()=>void;vi.mocked(a.play).mockImplementationOnce(()=>new Promise<void>(r=>resolve=r));const c=new AudioController(a,async id=>track(id));c.setTrack(track(1));c.start();c.suspend();resolve();await Promise.resolve();expect(c.state.playing).toBe(false);expect(c.state.enabled).toBe(false);expect(a.pause).toHaveBeenCalled();c.dispose();});
 it('handles rejected mobile autoplay',async()=>{const a=fakeAudio();vi.mocked(a.play).mockRejectedValue(new DOMException('Gesture','NotAllowedError'));const refresh=vi.fn();const c=new AudioController(a,refresh);c.setTrack(track(1));c.start();await Promise.resolve();expect(c.state.message).toContain('Tap to play');expect(refresh).not.toHaveBeenCalled();c.dispose();});
 it('refreshes an expired URL once, never loops refreshes',async()=>{const a=fakeAudio();vi.mocked(a.play).mockRejectedValueOnce(new DOMException('Expired','NotSupportedError')).mockResolvedValue(undefined);const refresh=vi.fn(async()=>({...track(1),preview:'https://preview.test/fresh?signed=yes'}));const c=new AudioController(a,refresh);c.setTrack(track(1));c.start();await vi.waitFor(()=>expect(c.state.playing).toBe(true));expect(refresh).toHaveBeenCalledTimes(1);expect(a.src).toContain('signed=yes');a.dispatchEvent(new Event('error'));await Promise.resolve();expect(refresh).toHaveBeenCalledTimes(1);expect(c.state.message).toContain('unavailable');c.dispose();});
 it('stops on ended and clamps at 30 seconds',()=>{const a=fakeAudio(),c=new AudioController(a,async id=>track(id));c.setTrack(track(1));a.currentTime=30;a.dispatchEvent(new Event('timeupdate'));expect(c.state.ended).toBe(true);expect(c.state.playing).toBe(false);expect(a.pause).toHaveBeenCalled();c.dispose();});
});
