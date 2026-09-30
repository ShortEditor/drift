import {it,expect} from 'vitest';
import {findHighlight} from '../src/audio/highlight';
// @ts-expect-error server module
import {allowedPreview} from '../api/preview-audio.js';
it('selects energetic 12s section inside the provided preview',()=>{const data=new Float32Array(3000);data.fill(.02);data.fill(.8,1200,2500);const result=findHighlight(data,100);expect(result.offset).toBeGreaterThanOrEqual(12);expect(result.offset).toBeLessThanOrEqual(13);expect(result.length).toBe(12);});
it('defaults to start for silence and short audio',()=>{expect(findHighlight(new Float32Array(3000),100).offset).toBe(0);expect(findHighlight(new Float32Array(500),100)).toEqual({offset:0,length:5});});
it('does not select an offset outside the last playable window',()=>{const d=new Float32Array(3000);d.fill(1,2500);expect(findHighlight(d,100).offset).toBeLessThanOrEqual(18);});
it('refuses arbitrary preview hosts and redirects in the relay',()=>{expect(allowedPreview('https://cdnt-preview.dzcdn.net/a.mp3')).toBe(true);expect(allowedPreview('https://evil.test/a.mp3')).toBe(false);expect(allowedPreview('https://dzcdn.net.evil.test/a.mp3')).toBe(false);expect(allowedPreview('http://cdnt-preview.dzcdn.net/a.mp3')).toBe(false);});
import {AudioController} from '../src/audio/controller';
import {vi} from 'vitest';
it('does not seek when analysis finishes during playback, allows Jump and From start',async()=>{const a=new EventTarget() as HTMLAudioElement;Object.assign(a,{currentTime:0,duration:30,src:'',preload:'',play:vi.fn().mockResolvedValue(undefined),pause:vi.fn(),removeAttribute:vi.fn()});const c=new AudioController(a,async()=>({id:1,title:'A',artist:{id:1,name:'B'},preview:'https://p.test'}));c.setTrack({id:1,title:'A',artist:{id:1,name:'B'},preview:'https://p.test'});c.start();a.currentTime=3;c.setHighlight(1,{offset:12,length:12});expect(a.currentTime).toBe(3);c.jumpHighlight();expect(a.currentTime).toBe(12);c.fromStart();expect(a.currentTime).toBe(0);c.dispose();});
