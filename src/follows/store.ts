import type {Artist,Track} from '../api/types';
import {shuffle} from '../feed/pool';
export type Follow = Pick<Artist,'id'|'name'>;
export const followsKey='drift-follows-v1';
export function readFollows():Follow[] {const data=JSON.parse(localStorage.getItem(followsKey)||'[]');if(!Array.isArray(data))throw new Error('Invalid saved artists');return [...new Map(data.filter((a:Follow)=>a&&Number.isSafeInteger(a.id)&&a.id>0&&typeof a.name==='string').map((a:Follow)=>[a.id,{id:a.id,name:a.name}])).values()] as Follow[];}
export function writeFollows(follows:Follow[]) {localStorage.setItem(followsKey,JSON.stringify(follows.map(({id,name})=>({id,name}))));}
export function followingTracks(tracks:Track[], follows:Follow[]) {const ids=new Set(follows.map(a=>a.id));return shuffle([...new Map(tracks.filter(t=>t&&Number.isSafeInteger(t.id)&&t.id>0&&t.artist&&ids.has(t.artist.id)).map(t=>[t.id,t])).values()]);}
