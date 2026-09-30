// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
it('service worker only precaches local shell, never intercepts remote music/images',()=>{
 const listeners:Record<string,(e:unknown)=>void>={};const put:string[][]=[];
 const context={URL,self:{location:{origin:'http://localhost'},registration:{scope:'http://localhost/'},addEventListener:(name:string,fn:(e:unknown)=>void)=>listeners[name]=fn},caches:{open:async()=>({addAll:(items:string[])=>{put.push(items);}})}};
 vm.runInNewContext(readFileSync('public/sw.js','utf8'),context);
 for(const url of ['https://api.deezer.com/search','https://cdn-images.dzcdn.net/a.jpg','https://cdnt-preview.dzcdn.net/a.mp3']) {let intercepted=false;listeners.fetch({request:{url,method:'GET'},respondWith:()=>intercepted=true});expect(intercepted).toBe(false);}
 let wait:Promise<unknown>|undefined;listeners.install({waitUntil:(p:Promise<unknown>)=>wait=p});return wait!.then(()=>{expect(put[0].every(p=>p.startsWith('./'))).toBe(true);});
});
