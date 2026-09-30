import { useEffect, useState } from 'react';
import type { Genre } from '../api/types';
import type { Preferences } from '../likes/store';
export const MOODS: Record<string,string>={Chill:'acoustic',Workout:'dance',Focus:'instrumental',Romantic:'love'};
export function Picker({value,genres,onChange,onClose}:{value:Preferences;genres:Genre[];onChange:(v:Preferences)=>void;onClose:()=>void}) {
  const [query,setQuery]=useState(value.query);
  useEffect(()=>{const timer=setTimeout(()=>{if(query!==value.query) onChange({...value,query:query.slice(0,200),mood:''});},400); return ()=>clearTimeout(timer);},[query,value,onChange]);
  return <section className="picker" aria-label="Discover preferences"><div className="section-heading"><h2>Find your next song</h2><button aria-label="Close preferences" onClick={onClose}>Done</button></div><label>Artist or song<input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Arijit, Sid Sriram, తెలుగు…" maxLength={200}/></label><label>Genre<select value={value.genre} onChange={e=>{setQuery('');onChange({genre:Number(e.target.value),mood:'',query:''});}}><option value="0">All charts</option>{genres.filter(g=>g.id!==0).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><p className="eyebrow">A starting point, not an algorithm</p><div className="chips">{Object.keys(MOODS).map(m=><button key={m} className={value.mood===m?'selected':''} onClick={()=>{setQuery('');onChange({...value,mood:value.mood===m?'':m,query:''});}}>{m}</button>)}</div><p className="muted">Mood chips use editable search seeds, not catalog mood metadata. Hindi and Telugu searches work too; results depend on the catalog.</p></section>;
}
