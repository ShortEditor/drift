import {it,expect,vi,afterEach} from 'vitest';
// @ts-expect-error server module
import handler from '../api/download.js';
afterEach(()=>vi.unstubAllGlobals());
it('increments request count atomically without personal data and serves APK',async()=>{const fetcher=vi.fn(async()=>({ok:true}));vi.stubGlobal('fetch',fetcher);const res:any={setHeader:vi.fn(),status:vi.fn().mockReturnThis(),end:vi.fn()};await handler({method:'GET'},res);const body=JSON.parse((fetcher.mock.calls as any)[0][1].body);expect(body.writes[0].transform.fieldTransforms[0]).toEqual({fieldPath:'count',increment:{integerValue:'1'}});expect(res.setHeader).toHaveBeenCalledWith('Location','/releases/drift-1.7.apk');expect(res.status).toHaveBeenCalledWith(302);});
it('counter outage never blocks a download',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>{throw Error('offline')}));const res:any={setHeader:vi.fn(),status:vi.fn().mockReturnThis(),end:vi.fn()};await handler({method:'GET'},res);expect(res.status).toHaveBeenCalledWith(302);});
it('does not count HEADs or other methods',async()=>{const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const res:any={setHeader:vi.fn(),status:vi.fn().mockReturnThis(),end:vi.fn()};await handler({method:'HEAD'},res);expect(fetcher).not.toHaveBeenCalled();expect(res.status).toHaveBeenCalledWith(405);});
