import {afterEach,describe,it,expect,vi} from 'vitest';
// @ts-expect-error server module is plain JavaScript
import {isLanguage,languageArtists,mergeLanguageTracks,clearLanguageCache,LANGUAGES} from '../api/lib/language.js';
// @ts-expect-error server module is plain JavaScript
import {languageFeed} from '../api/catalog.js';
import {catalogBatch} from '../src/api/catalog';
import {readLanguage,writeLanguage} from '../src/likes/language';
const track=(id:number,artist=1,over:Record<string,unknown>={})=>({id,title:`Song ${id}`,artist:{id:artist,name:'Artist'},preview:`https://preview.test/${id}`,readable:true,...over});
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();clearLanguageCache();});
describe('language curation',()=>{
 it('accepts only known languages',()=>{expect(isLanguage('telugu')).toBe(true);expect(isLanguage('hindi')).toBe(true);expect(isLanguage('english')).toBe(false);expect(isLanguage('')).toBe(false);expect(isLanguage(undefined)).toBe(false);expect(isLanguage('<script>')).toBe(false);});
 it('rotates artists deterministically per seed and covers every artist',()=>{const base=languageArtists('telugu',0);expect(base).toHaveLength(LANGUAGES.telugu.artists.length);const rotated=languageArtists('telugu',3);expect([...rotated].sort()).toEqual([...base].sort());expect(rotated[0]).toBe(base[3]);expect(languageArtists('telugu',base.length+3)).toEqual(rotated);});
 it('merges blocks deduplicating and keeping only playable tracks',()=>{const merged=mergeLanguageTracks([[track(1),track(2,1,{preview:''}),track(3,1,{readable:false})],[track(1),track(4)]]);expect(merged.map((t:{id:number})=>t.id)).toEqual([1,4]);expect(merged[0].source).toBe('deezer');});
});
describe('language feed',()=>{
 it('serves paginated slices across the merged artist catalog',async()=>{let hitId=0;vi.stubGlobal('fetch',vi.fn(async(url:string)=>{if(url.includes('/search?'))return new Response(JSON.stringify({data:[track(7000+(hitId++))]}));const m=/artist\/(\d+)\/top/.exec(url);const id=Number(m![1]);return new Response(JSON.stringify({data:Array.from({length:30},(_,i)=>track(id*1000+i))}));}));const first=await languageFeed('telugu',0,0);expect(first.data).toHaveLength(25);expect(first.next).toBe('more');expect(first.total).toBe(LANGUAGES.telugu.hits.length+languageArtists('telugu',0).length*30);const second=await languageFeed('telugu',0,25);expect(second.data[0].id).not.toBe(first.data[0].id);const end=await languageFeed('telugu',0,first.total);expect(end.data).toHaveLength(0);expect(end.next).toBeUndefined();});
 it('survives individual artist failures but fails when all fail',async()=>{let calls=0;vi.stubGlobal('fetch',vi.fn(async()=>{calls++;return calls===1?new Response('x',{status:502}):new Response(JSON.stringify({data:[track(calls)]}));}));const r=await languageFeed('hindi',1,0);expect(r.data.length).toBeGreaterThan(0);clearLanguageCache();vi.stubGlobal('fetch',vi.fn(async()=>new Response('x',{status:502})));await expect(languageFeed('hindi',0,0)).rejects.toThrow('unavailable');});
});
describe('catalog language parameter',()=>{
 const stub=()=>{const f=vi.fn(async(_url:string)=>new Response(JSON.stringify({data:[track(1)],total:1})));vi.stubGlobal('fetch',f);return f;};
 it('sends lang for a language feed and omits it for searches',async()=>{const f=stub();await catalogBatch({genre:0,source:'auto',language:'telugu'},0);expect(new URL(f.mock.calls[0][0] as string,'https://x.test').searchParams.get('lang')).toBe('telugu');await catalogBatch({genre:0,source:'auto',language:'telugu',query:'anurag'},0);expect(new URL(f.mock.calls[1][0] as string,'https://x.test').searchParams.get('lang')).toBeNull();await catalogBatch({genre:0,source:'auto',language:'all'},0);expect(new URL(f.mock.calls[2][0] as string,'https://x.test').searchParams.get('lang')).toBeNull();});
});
describe('language preference storage',()=>{
 it('defaults to all, round-trips valid picks and rejects junk',()=>{expect(readLanguage()).toBe('all');writeLanguage('telugu');expect(readLanguage()).toBe('telugu');localStorage.setItem('drift-language-v1','klingon');expect(readLanguage()).toBe('all');});
});
