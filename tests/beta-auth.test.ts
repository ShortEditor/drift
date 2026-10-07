import {it,expect,vi,afterEach} from 'vitest';
// @ts-expect-error server JS
import {betaAccess,validIdentity} from '../lib/beta-auth.js';
afterEach(()=>vi.unstubAllEnvs());
const identity={aud:'beta',iss:'https://securetoken.google.com/beta',sub:'u1',email:'u@example.test',email_verified:true,firebase:{sign_in_provider:'google.com'}};
it('requires verified Google identity bound to the project',()=>{expect(validIdentity(identity,'beta')).toBe(true);for(const p of [{...identity,email_verified:false},{...identity,aud:'other'},{...identity,iss:'attacker'},{...identity,firebase:{sign_in_provider:'anonymous'}},{...identity,sub:''}])expect(validIdentity(p,'beta')).toBe(false);});
it('beta access fails closed without token or configuration',async()=>{vi.stubEnv('DRIFT_BETA','1');vi.stubEnv('BETA_FIREBASE_PROJECT_ID','beta');const res:any={setHeader:vi.fn(),status:vi.fn().mockReturnThis(),json:vi.fn()};expect(await betaAccess({headers:{}},res)).toBe(false);expect(res.status).toHaveBeenCalledWith(401);expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','no-store');});
it('main mode preserves its prior access model',async()=>{vi.stubEnv('DRIFT_BETA','');expect(await betaAccess({},{})).toBe(true);});
it('rejects malformed and invalid Firebase tokens without serving beta content',async()=>{vi.stubEnv('DRIFT_BETA','1');vi.stubEnv('BETA_FIREBASE_PROJECT_ID','beta');for(const authorization of ['Basic nope','Bearer invalid.jwt.token']){const res:any={setHeader:vi.fn(),status:vi.fn().mockReturnThis(),json:vi.fn()};expect(await betaAccess({headers:{authorization}},res)).toBe(false);expect(res.status).toHaveBeenCalledWith(authorization.startsWith('Basic')?401:403);}});
