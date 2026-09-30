export interface Like { id:number; title:string; artistName:string; likedAt:number }
export interface Preferences { genre:number; mood:string; query:string }
export interface LikesStore { label:string; list():Promise<Like[]>; set(like:Like,liked:boolean):Promise<void>; preferences():Promise<Preferences | null>; savePreferences(value:Preferences):Promise<void> }
const key='drift-likes-v1'; const prefsKey='drift-preferences-v1';
export const localStore: LikesStore = {
  label:'Saved on this device',
  async list() {const items=JSON.parse(localStorage.getItem(key)||'[]') as Like[]; return items.filter(x=>Number.isSafeInteger(x.id)&&typeof x.title==='string'&&typeof x.artistName==='string'&&typeof x.likedAt==='number');},
  async set(like,liked) {const items=await this.list(); const next=items.filter(x=>x.id!==like.id); if(liked) next.push(like); localStorage.setItem(key,JSON.stringify(next));},
  async preferences() {const v=JSON.parse(localStorage.getItem(prefsKey)||'null'); return v&&typeof v.genre==='number'&&typeof v.mood==='string'&&typeof v.query==='string'?v:null;},
  async savePreferences(v) {localStorage.setItem(prefsKey,JSON.stringify(v));}
};
export async function toggleLike(store:LikesStore, current:Like[], like:Like, onChange:(items:Like[])=>void) {
  const liked=!current.some(x=>x.id===like.id); onChange(liked?[...current,like]:current.filter(x=>x.id!==like.id));
  try {await store.set(like,liked);} catch(e) {onChange(current); throw e;}
}
