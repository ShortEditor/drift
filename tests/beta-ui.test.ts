import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
it('beta build has no bundled APK and no direct catalog bypass',()=>{expect(readFileSync('scripts/build-beta.mjs','utf8')).toContain("rmSync('dist/releases'");expect(readFileSync('src/api/transport.ts','utf8')).toContain("VITE_DRIFT_BETA==='1'");expect(readFileSync('src/main.tsx','utf8')).toContain('Suspense');});
