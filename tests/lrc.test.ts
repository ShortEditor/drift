import {it,expect} from 'vitest';import {parseLrc} from '../src/components/Lyrics';
it('uses real timestamps and offset, including repeated time tags',()=>{expect(parseLrc('[offset:500]\n[00:01.20][00:03.2]one\n[00:05]two')).toEqual([{time:1.7,text:'one'},{time:3.7,text:'one'},{time:5.5,text:'two'}]);});
it('does not invent timestamps for static text',()=>{expect(parseLrc('plain words')).toEqual([]);});
