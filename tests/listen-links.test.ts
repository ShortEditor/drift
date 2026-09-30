import {describe,it,expect} from 'vitest';
import {searchLinks,verifiedLinks} from '../src/components/ListenLinks';
// @ts-expect-error server module
import {safePlatformUrl} from '../api/listen-links.js';
describe('full-song outbound links',()=>{
 it('encodes title and artist without losing Telugu or punctuation',()=>{const links=searchLinks('తెలుగు & song','Sid Sriram');expect(decodeURIComponent(links.spotify.split('/search/')[1])).toBe('తెలుగు & song Sid Sriram');expect(new URL(links.appleMusic).searchParams.get('term')).toBe('తెలుగు & song Sid Sriram');expect(new URL(links.youtubeMusic).searchParams.get('q')).toBe('తెలుగు & song Sid Sriram');});
 it('rejects unexpected hosts and non-HTTPS schemes',()=>{expect(verifiedLinks({spotify:'https://open.spotify.com.evil.test/track/1',appleMusic:'javascript:alert(1)',youtubeMusic:'https://music.youtube.com/watch?v=123'})).toEqual({youtubeMusic:'https://music.youtube.com/watch?v=123'});expect(safePlatformUrl('https://evil.test','spotify')).toBeNull();});
 it('keeps provider-returned URLs including query parameters',()=>{const url='https://music.apple.com/in/album/song/123?i=456';expect(verifiedLinks({appleMusic:url})).toEqual({appleMusic:url});expect(safePlatformUrl(url,'appleMusic')).toBe(url);});
});
