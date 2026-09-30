import {describe,it,expect,vi} from 'vitest';
// Server-only implementation is intentionally plain JavaScript.
// @ts-expect-error no declarations needed for server module
import {decideSource,routeCatalog} from '../api/lib/router.js';
describe('intent router',()=>{
 it('routes Telugu/mainstream and artist searches to mainstream catalog',()=>{expect(decideSource({query:'తెలుగు పాటలు'}).chosen).toBe('deezer');expect(decideSource({query:'Anirudh'}).chosen).toBe('deezer');expect(decideSource({kind:'artists',query:'unknown'}).fallbackAllowed).toBe(false);});
 it('honors manual overrides without hidden switching',()=>{expect(decideSource({source:'jamendo',query:'Sid Sriram'})).toMatchObject({chosen:'jamendo',reason:'manual-override',fallbackAllowed:false});});
 it('never falls back to mainstream for reusable-music intent',async()=>{const mainstream=vi.fn();const r=await routeCatalog({query:'copyright free for my edit'},{jamendo:async()=>({data:[]}),deezer:mainstream});expect(r.routing.served).toBe('jamendo');expect(mainstream).not.toHaveBeenCalled();});
 it('falls back on provider error in auto mode and explains actual source',async()=>{const r=await routeCatalog({query:'rock'},{deezer:async()=>{throw new Error('forced failure');},jamendo:async()=>({data:[{id:-1}]})});expect(r.routing).toMatchObject({chosen:'deezer',served:'jamendo',fallback:true});expect(r.routing.attempts[0].error).toBe('forced failure');});
 it('keeps better primary results when fallback is thinner',async()=>{const r=await routeCatalog({query:'rock'},{deezer:async()=>({data:[1,2]}),jamendo:async()=>({data:[3]})});expect(r.data).toEqual([1,2]);expect(r.routing.served).toBe('deezer');});
});
// @ts-expect-error server module
import {mapJamendo} from '../api/catalog.js';
it('namespaces Jamendo IDs and preserves original credit URLs',()=>{expect(mapJamendo({id:'12',artist_id:'34',name:'Song',artist_name:'Artist',audio:'https://audio.test/file',license_ccurl:'https://creativecommons.org/licenses/by/3.0/',shareurl:'https://www.jamendo.com/track/12'})).toMatchObject({id:-12,artist:{id:-34},source:'jamendo',credit:{provider:'Jamendo',trackUrl:'https://www.jamendo.com/track/12'}});expect(mapJamendo({id:'12'})).toBeNull();});
