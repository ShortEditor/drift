import type { CatalogList, Track } from '../api/types';
export function shuffle<T>(items: T[]): T[] { const copy=[...items]; for(let i=copy.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; }
export class TrackPool {
  constructor(public recent:number[]=[]){}
  seen=new Set<number>(); index=0; exhausted=false;
  append(batch: CatalogList<Track>, currentArtist?: number) {
    if(!Array.isArray(batch.data)) throw new Error('Invalid track list');
    let fresh = shuffle(batch.data.filter(t => Number.isSafeInteger(t.id) && t.id!==0 && t.artist && typeof t.title==='string')).filter(t => { if(this.seen.has(t.id)) return false; this.seen.add(t.id); return true; });
    const unseen=fresh.filter(t=>!this.recent.includes(t.id));fresh=[...unseen,...fresh.filter(t=>this.recent.includes(t.id))];
    this.index=Number.isSafeInteger(batch.nextIndex)&&batch.nextIndex!>this.index?batch.nextIndex!:this.index+batch.data.length;
    this.exhausted=!batch.next || batch.data.length===0 || fresh.length===0;
    if(fresh[0]?.artist.id===currentArtist) { const other=fresh.findIndex(t=>t.artist.id!==currentArtist); if(other>0) [fresh[0],fresh[other]]=[fresh[other],fresh[0]]; }
    for(let i=1;i<fresh.length;i++) if(fresh[i].artist.id===fresh[i-1].artist.id) { const other=fresh.findIndex((t,j)=>j>i && t.artist.id!==fresh[i-1].artist.id); if(other>i) [fresh[i],fresh[other]]=[fresh[other],fresh[i]]; }
    return fresh;
  }
}
