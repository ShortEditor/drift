// Pure, testable language-feed curation. Deezer search has no language
// relevance for Indian languages, so each language feed is built from a
// curated list of hit song titles (resolved live to playable tracks) plus
// top tracks of artists whose Deezer catalogs lean towards that language,
// ordered strongest-language-match first.
export const LANGUAGES = {
 telugu: {
  label: 'Telugu',
  hits: ['Buttabomma', 'Samajavaragamana', 'Oo Antava', 'Naatu Naatu', 'Srivalli', 'Inkem Inkem', 'Ramuloo Ramulaa', 'Kalaavathi', 'Nee Kannu Neeli Samudram', 'Chamkeela Angeelesi', 'Ma Ma Mahesha', 'Tillu Anna DJ Pedithe', 'Saami Saami', 'Eyy Bidda Idhi Naa Adda', 'Jinthaak', 'Priyathama Priyathama', 'Oke Oka Jeevitham', 'Nijame Ne Chebuthunna', 'Bullet Song', 'Adirindey', 'Kurchi Madathapetti', 'Emitemitemo', 'Pillaa Raa', 'Vintunnavaa'],
  artists: [11577417, 5018114, 5588729, 66381602, 10367396, 541067, 4660615, 13450407, 7325920, 4666615, 5769405, 13202925, 9129552, 98323, 204414, 1215220, 127529, 4219860, 350631912, 101677, 1516162]
 },
 hindi: {
  label: 'Hindi',
  hits: [],
  artists: [3830821, 98371, 491, 290619, 7760, 8419888, 70075, 129846, 450023, 5017623]
 }
};
export const isLanguage = value => typeof value === 'string' && value in LANGUAGES;
// Deterministic per-seed rotation so a feed refresh reshuffles the lineup.
export function languageArtists(lang, seed = 0) {
 const artists = LANGUAGES[lang].artists;
 const at = Math.abs(Math.trunc(seed)) % artists.length;
 return [...artists.slice(at), ...artists.slice(0, at)];
}
// One virtual track list per language: resolved hits first, then artist
// blocks in rotated order. Playable tracks only, duplicates removed
// keeping first occurrence.
export function mergeLanguageTracks(blocks) {
 const seen = new Set(); const out = [];
 for (const tracks of blocks) {
  if (!Array.isArray(tracks)) continue;
  for (const t of tracks) {
   if (!t || !Number.isSafeInteger(t.id) || !t.preview || t.readable === false || !t.artist || seen.has(t.id)) continue;
   seen.add(t.id); out.push({ ...t, source: 'deezer' });
  }
 }
 return out;
}
const cache = new Map(); const CACHE_TTL = 30 * 60 * 1000;
export function clearLanguageCache() { cache.clear(); }
async function cached(key, load) {
 const hit = cache.get(key); if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
 const data = await load(); cache.set(key, { at: Date.now(), data }); return data;
}
async function deezerJson(url) {
 const r = await fetch(url, { signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error(`Catalog HTTP ${r.status}`);
 const d = await r.json(); if (d.error) throw new Error(d.error.message || 'Catalog error'); return d;
}
export async function artistTop(id) {
 return cached(`artist:${id}`, async () => {
  const d = await deezerJson(`https://api.deezer.com/artist/${id}/top?limit=100`);
  if (!Array.isArray(d.data)) throw new Error('Invalid track list'); return d.data;
 });
}
// First playable search match for a hit title, or null when none.
export async function hitTrack(title) {
 return cached(`hit:${title}`, async () => {
  const d = await deezerJson(`https://api.deezer.com/search?q=${encodeURIComponent(title)}&limit=3`);
  if (!Array.isArray(d.data)) throw new Error('Invalid track list');
  return d.data.find(t => t && t.preview && t.readable !== false) || null;
 });
}
