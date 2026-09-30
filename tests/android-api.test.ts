import {it,expect,vi,afterEach} from 'vitest';
import {apiUrl} from '../src/api/base';
afterEach(()=>vi.unstubAllGlobals());
it('uses HTTPS backend for packaged localhost app without changing normal web URLs',()=>{vi.stubGlobal('location',{hostname:'localhost',port:'',protocol:'https:'});expect(apiUrl('/api/catalog?status=1')).toBe('https://drift-music-scroll.vercel.app/api/catalog?status=1');vi.stubGlobal('location',{hostname:'drift-music-scroll.vercel.app',port:'',protocol:'https:'});expect(apiUrl('/api/catalog')).toBe('/api/catalog');vi.stubGlobal('location',{hostname:'localhost',port:'5173',protocol:'http:'});expect(apiUrl('/api/catalog')).toBe('/api/catalog');});
