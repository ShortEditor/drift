import {cachedHighlight,type Highlight} from './highlight';
import { playable, type Track } from '../api/types';
export interface AudioState { id?: number; playing: boolean; enabled: boolean; pausedByUser: boolean; ended: boolean; progress: number; duration: number; message: string; highlight?:Highlight; highlighted?:boolean }
export class AudioController {
  state: AudioState={playing:false,enabled:false,pausedByUser:false,ended:false,progress:0,duration:30,message:''};
  private listeners=new Set<() => void>(); private token=0; private current?: Track; private refreshed=false; private disposed=false;private useHighlight=true;
  constructor(public audio: HTMLAudioElement, private refresh: (id:number)=>Promise<Track>) {
    audio.preload='none'; audio.addEventListener('timeupdate',this.time); audio.addEventListener('loadedmetadata',this.time); audio.addEventListener('ended',this.end); audio.addEventListener('error',this.error);
  }
  subscribe=(fn:()=>void) => {this.listeners.add(fn); return ()=>{this.listeners.delete(fn);};};
  snapshot=()=>this.state;
  private emit(patch: Partial<AudioState>) { this.state={...this.state,...patch}; this.listeners.forEach(f=>f()); }
  private time=()=> { if(this.audio.currentTime>=30) {this.audio.pause(); this.end(); return;} this.emit({progress:this.audio.currentTime,duration:Math.min(30,Number.isFinite(this.audio.duration)&&this.audio.duration>0?this.audio.duration:30)}); };
  private end=()=>{this.audio.pause(); this.emit({playing:false,ended:true,message:'Preview ended. Replay or swipe for another.'});};
  private error=()=> {void this.recover(this.token);};
  setTrack(track: Track) {
    if(this.current?.id===track.id) { if(this.state.enabled&&!this.state.pausedByUser&&!this.state.playing&&!this.state.ended) void this.play(); return; }
    this.token++; this.audio.pause(); this.audio.currentTime=0; this.current=track; this.refreshed=false;this.useHighlight=true;
    this.audio.removeAttribute('src'); if(playable(track)) this.audio.src=track.preview!;
    this.emit({id:track.id,playing:false,ended:false,progress:0,highlight:cachedHighlight(track.id),highlighted:false,message:playable(track)?'':'Preview unavailable. Skip or retry.'});
    if(this.state.enabled&&!this.state.pausedByUser){this.applyHighlight();void this.play();}
  }
  setHighlight(id:number,value:Highlight){if(this.current?.id===id)this.emit({highlight:value});}
  private applyHighlight(){if(this.useHighlight&&this.state.highlight&&this.audio.currentTime===0){this.audio.currentTime=this.state.highlight.offset;this.emit({progress:this.audio.currentTime,highlighted:this.audio.currentTime>0});}}
  fromStart(){this.useHighlight=false;this.audio.currentTime=0;this.emit({highlighted:false,progress:0});this.start();}
  jumpHighlight(){if(!this.state.highlight)return;this.useHighlight=true;this.audio.currentTime=this.state.highlight.offset;this.emit({highlighted:true,progress:this.audio.currentTime});this.start();}
  start() { if(this.state.ended) this.audio.currentTime=0; this.applyHighlight();this.emit({enabled:true,pausedByUser:false,ended:false}); void this.play(); }
  replay() {this.audio.currentTime=0; this.start();}
  pause(user=true) {this.token++; this.audio.pause(); this.emit({playing:false,pausedByUser:user || this.state.pausedByUser});}
  suspend() {this.pause(true); this.emit({enabled:false,message:'Tap to resume listening.'});}
  async play() {
    if(!this.current || !playable(this.current) || this.disposed) return;
    const token=++this.token;
    try {await this.audio.play(); if(token!==this.token || this.disposed) { if(this.disposed || this.state.pausedByUser || !this.state.enabled) this.audio.pause(); return; } this.emit({playing:true,message:''});}
    catch(e) {if(token!==this.token) return; if((e as Error).name==='NotAllowedError') this.emit({playing:false,pausedByUser:true,message:'Tap to play. Your browser needs a gesture.'}); else await this.recover(token);}
  }
  async retry() {if(!this.current) return; this.refreshed=false; this.emit({enabled:true,pausedByUser:false}); await this.recover(this.token);}
  private async recover(token:number) {
    if(this.refreshed || !this.current || this.disposed) { this.audio.pause(); if(token===this.token) this.emit({playing:false,message:'Preview unavailable. Skip or retry.'}); return; }
    this.refreshed=true; this.audio.pause();
    try { const track=await this.refresh(this.current.id); if(token!==this.token || this.disposed) return; this.current=track;
      if(!playable(track)) throw new Error('Unavailable'); this.audio.src=track.preview!;
      if(this.state.enabled&&!this.state.pausedByUser) await this.play();
    } catch {if(token===this.token) this.emit({playing:false,message:'Preview unavailable. Skip or retry.'});}
  }
  dispose() {this.disposed=true; this.token++; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.removeEventListener('timeupdate',this.time); this.audio.removeEventListener('loadedmetadata',this.time); this.audio.removeEventListener('ended',this.end); this.audio.removeEventListener('error',this.error); this.listeners.clear();}
}
