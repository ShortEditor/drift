import {it,expect} from 'vitest';
// @ts-expect-error server module
import {chooseLyrics} from '../api/lyrics.js';
const row={trackName:'Hello',artistName:'Artist',albumName:'Album',plainLyrics:'fixture lyrics',syncedLyrics:null};
it('requires exact title and artist',()=>{expect(chooseLyrics([row],{title:'Hello',artist:'Other'})).toBeNull();expect(chooseLyrics([row],{title:'Hello remix',artist:'Artist'})).toBeNull();});
it('chooses exact album and refuses ambiguous editions',()=>{expect(chooseLyrics([row,{...row,albumName:'Live'}],{title:'hello',artist:'artist',album:'Album'}).text).toBe('fixture lyrics');expect(chooseLyrics([row,{...row,albumName:'Live'}],{title:'Hello',artist:'Artist'})).toBeNull();});
it('can show static text from LRC without claiming clip sync',()=>{expect(chooseLyrics([{...row,plainLyrics:null,syncedLyrics:'[00:12.00]fixture'}],{title:'Hello',artist:'Artist'}).text).toBe('fixture');});
