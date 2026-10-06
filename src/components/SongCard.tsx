import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Track} from '../api/types';import {playable} from '../api/types';import type {AudioState} from '../audio/controller';import {ListenLinks} from './ListenLinks';import {Lyrics} from './Lyrics';import {StitchIcon} from './StitchIcon';
type Props={track:Track;index:number;active:boolean;liked:boolean;state:AudioState;onActive:(i:number)=>void;onLike:()=>void;onPlay:()=>void;onPause:()=>void;onRetry:()=>void;onNext:()=>void;onHighlight:()=>void;onFromStart:()=>void;followed?:boolean;onFollow?:()=>void;onTune?:()=>void;tags?:string[]};
export function SongCard({track,index,active,liked,state,onActive,onLike,onPlay,onPause,onRetry,onNext,onHighlight,onFromStart,followed,onFollow,onTune,tags=[]}:Props){
 const ref=useRef<HTMLElement>(null),[imageError,setImageError]=useState(false),[shareOpen,setShareOpen]=useState(false);useEffect(()=>{const o=new IntersectionObserver(e=>{if(e.some(v=>v.isIntersecting&&v.intersectionRatio>=.75))onActive(index);},{threshold:[0,.75,1]});if(ref.current)o.observe(ref.current);return()=>o.disconnect();},[index,onActive]);
 const art=track.album?.cover_xl||track.album?.cover_big;const time=active?Math.floor(state.progress):0;
 return <article ref={ref} className="song-card stitch-reel" data-index={index} aria-label={`${track.title} by ${track.artist.name}`}>
 <div className="absolute inset-0 z-0">{art&&!imageError?<img src={art} alt={`${track.album?.title||track.title} album artwork`} className="w-full h-full object-cover object-center scale-[1.03] select-none pointer-events-none" onError={()=>setImageError(true)} loading={active?'eager':'lazy'} referrerPolicy="no-referrer"/>:<div className="stitch-fallback">♫</div>}<div className="absolute inset-0 bg-gradient-to-b from-[#08080A]/85 via-transparent to-[#08080A]/95 mix-blend-multiply"/><div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/50 to-transparent"/></div>
 <div className="stitch-workspace relative z-10 flex-1 flex flex-col justify-end pb-3">
 <aside className="absolute right-4 bottom-24 flex flex-col items-center space-y-4" data-purpose="reel-actions">
 <div className="relative mb-1"><button onClick={onFollow||onTune} aria-label={onFollow?(followed?'Unfollow artist':'Follow artist'):'Discover preferences'} aria-pressed={followed} className="stitch-avatar w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-brand-lime to-white/20">{art&&!imageError?<img alt="Track artwork" className="w-full h-full rounded-full object-cover" src={art}/>:<span>♫</span>}<span className="stitch-follow-badge">{followed?'✓':'+'}</span></button></div>
 <button aria-label={liked?'Unlike song':'Like song'} aria-pressed={liked} onClick={onLike} className="flex flex-col items-center group"><div className={`w-11 h-11 rounded-full glass-btn flex items-center justify-center ${liked?'text-brand-lime':'text-white/90'}`}><StitchIcon name="heart"/></div><span className="text-[11px] font-semibold text-white/80 mt-1">{liked?'Saved':'Like'}</span></button>
 <button aria-label="Discover preferences" onClick={onTune} className="flex flex-col items-center group"><div className="w-11 h-11 rounded-full glass-btn flex items-center justify-center text-white/90"><StitchIcon name="tune"/></div><span className="text-[11px] font-medium text-white/70 mt-1">Tune</span></button>
 <button aria-label="Share song" onClick={()=>{onPause();setShareOpen(true);}} className="flex flex-col items-center group"><div className="w-11 h-11 rounded-full glass-btn flex items-center justify-center text-white/90"><StitchIcon name="share"/></div><span className="text-[11px] font-medium text-white/70 mt-1">Share</span></button>
 </aside>
 <div className="self-center mb-8 pointer-events-auto" data-purpose="playback-control"><button aria-label={active&&state.playing?'Pause preview':active&&state.ended?'Replay preview':'Play preview'} onClick={active&&state.playing?onPause:onPlay} disabled={!playable(track)} className="relative w-14 h-14 rounded-full glass-btn flex items-center justify-center border border-white/20">{active&&state.playing?<span className="text-brand-lime">Ⅱ</span>:<StitchIcon name="play"/>}</button></div>
 <section aria-label="Track Information" className="px-5 pr-20"><div className="flex items-center space-x-2 mb-2.5">{tags.slice(0,2).map(t=><span key={t} className="glass-pill px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase text-white/90">{t}</span>)}<span className="glass-pill px-2.5 py-1 rounded-full text-[10px] text-white/60 tracking-wider">30s Clip</span></div><h1 className="text-[28px] font-bold tracking-tight text-white leading-tight font-display drop-shadow-md">{track.title}</h1><div className="flex items-center space-x-2 mt-1 stitch-artist"><span className="text-base font-semibold text-white/90 tracking-wide">{track.artist.name}</span>{track.explicit_lyrics&&<span className="explicit">E</span>}<span className="text-white/40 text-xs">•</span><span className="text-xs text-white/60 font-normal">{track.album?.title}</span></div><ListenLinks track={track}/><Lyrics track={track} progress={active?state.progress:0}/>{track.source==='jamendo'&&track.credit&&<div className="source credit"><span>{track.credit.artist} · Jamendo</span><a href={track.credit.trackUrl} target="_blank" rel="noopener noreferrer">Track ↗</a><a href={track.credit.licenseUrl} target="_blank" rel="noopener noreferrer">CC ↗</a></div>}</section>
 <div className="px-5 mt-4" data-purpose="audio-scrubber"><div className="progress relative w-full h-[4px] bg-white/15 rounded-full" role="progressbar" aria-label="Preview progress" aria-valuenow={time} aria-valuemin={0} aria-valuemax={30}><span className="h-full bg-brand-lime rounded-full relative" style={{width:active?`${Math.min(100,100*state.progress/state.duration)}%`:'0%'}}><i className="stitch-thumb"/></span></div><div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-white/50 mt-1.5"><span className="text-brand-lime font-medium">0:{String(time).padStart(2,'0')}</span><span>0:30</span></div></div>
 <div className="stitch-extra"><span role="status">{(!playable(track)?'No playable preview.':active?state.message:'')}</span>{active&&state.message.includes('unavailable')&&<button onClick={onRetry}>Retry</button>}<button onClick={onNext} aria-label="Next song">Next ↑</button>{active&&state.highlight&&<><button onClick={onHighlight}>Highlight ↗</button><button onClick={onFromStart}>From start</button></>}</div>
 </div>{shareOpen&&<StoryShare track={track} onClose={()=>setShareOpen(false)}/>}</article>;
}


// Story export deliberately uses original Drift graphics, never API artwork/audio.
export const DRIFT_SHARE_URL='https://drift-music-scroll.vercel.app/';
export function songShareUrl(track:Track):string|undefined {
 const value=track.credit?.trackUrl||track.link;
 try {const u=new URL(value||'');if(u.protocol!=='https:')return;
  if(['www.deezer.com','deezer.com','www.jamendo.com','jamendo.com'].includes(u.hostname)&&/^\/(?:[a-z]{2}\/)?track\/\d+(?:\/|$)/.test(u.pathname))return u.href;
 }catch{/* Invalid provider links must never become share destinations. */}
}
function canvasLines(ctx:CanvasRenderingContext2D,text:string,width:number,size:number,maxLines:number):string[]{
 ctx.font=`700 ${size}px system-ui, sans-serif`;
 const lines:string[]=[];let line='';
 for(const word of text.replace(/[\u0000-\u001f]/g,' ').slice(0,500).split(/\s+/)){
  if(ctx.measureText(line+(line?' ':'')+word).width<=width){line+=(line?' ':'')+word;continue;}
  if(line){lines.push(line);line='';}
  for(const char of Array.from(word)){if(ctx.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
 }
 if(line)lines.push(line);if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(ctx.measureText(last+'…').width>width)last=last.slice(0,-1);lines[maxLines-1]=last+'…';}return lines;
}
export async function createStoryCard(track:Track):Promise<Blob> {
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export unavailable');
 const gradient=ctx.createLinearGradient(0,0,1080,1920);gradient.addColorStop(0,'#101b20');gradient.addColorStop(1,'#08080a');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
 ctx.fillStyle='#d4ff00';ctx.font='italic 96px Georgia, serif';ctx.fillText('drift',86,222);
 ctx.fillStyle='#b3bac0';ctx.font='30px system-ui, sans-serif';ctx.fillText('FOUND A NEW FAVORITE',88,292);
 ctx.strokeStyle='#d4ff00';ctx.lineWidth=12;
 for(let i=0;i<17;i++){const h=70+Math.sin(i*.8)**2*210;ctx.beginPath();ctx.moveTo(120+i*52,660-h/2);ctx.lineTo(120+i*52,660+h/2);ctx.stroke();}
 ctx.fillStyle='#ffffff';const title=canvasLines(ctx,track.title,900,70,4);title.forEach((line,i)=>ctx.fillText(line,88,995+i*88));
 ctx.fillStyle='#d4ff00';ctx.font='42px system-ui, sans-serif';const artist=canvasLines(ctx,track.artist.name,900,42,2);ctx.font='42px system-ui, sans-serif';artist.forEach((line,i)=>ctx.fillText(line,88,1055+title.length*88+i*55));
 ctx.fillStyle='#ffffff';ctx.font='700 42px system-ui, sans-serif';ctx.fillText('Discover it on drift',88,1580);
 // The exported image carries the Drift wordmark only, not a URL.
 ctx.fillStyle='#a1a8ae';ctx.font='26px system-ui, sans-serif';ctx.fillText('Song link shared separately. No audio included.',88,1720);
 ctx.font='24px system-ui, sans-serif';ctx.fillText('Original Drift graphic. No album artwork.',88,1765);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export unavailable')),'image/png'));
}
function StoryShare({track,onClose}:{track:Track;onClose:()=>void}) {
 const close=useRef(onClose);close.current=onClose;const dialog=useRef<HTMLDivElement>(null);const [image,setImage]=useState<{blob:Blob;url:string}>();const [status,setStatus]=useState('Making your story card…');
 const songUrl=songShareUrl(track);const label=`${track.title} · ${track.artist.name}`;const shareText=`${label}\nDiscovered on Drift: ${DRIFT_SHARE_URL}${songUrl?'\nOriginal song: '+songUrl:''}`;
 useEffect(()=>{let alive=true;let objectUrl='';const previous=document.activeElement as HTMLElement|null;
  dialog.current?.focus();void createStoryCard(track).then(blob=>{if(!alive)return;objectUrl=URL.createObjectURL(blob);setImage({blob,url:objectUrl});setStatus('Ready. Choose how to share.');}).catch(()=>{if(alive)setStatus('Card export unavailable. You can still copy or share the link.');});
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close.current();}if(e.key==='Tab'){const els=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],textarea');if(!els?.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);
  return()=>{alive=false;URL.revokeObjectURL(objectUrl);document.removeEventListener('keydown',key);previous?.focus();};
 },[track]);
 const copy=async(value:string)=>{try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(value);setStatus('Link copied. Add it as a link sticker in Instagram.');}catch{setStatus('Clipboard unavailable. Select and copy the link below.');}};
 const native=async()=>{try{if(!navigator.share){setStatus('Use Download card, then add it to your Story and paste a link sticker.');return;}
  const file=image?new File([image.blob],'drift-story.png',{type:'image/png'}):undefined;
  if(file&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:label,text:shareText});setStatus('Card handed to your share sheet. Choose your destination.');}
  else{await navigator.share({title:label,text:shareText,url:DRIFT_SHARE_URL});setStatus('Link handed to your share sheet. Download the card separately.');}
 }catch(e){setStatus((e as Error).name==='AbortError'?'Sharing canceled. Nothing posted.':'Native sharing unavailable. Download the card and copy the link instead.');}};
 return createPortal(<div className="drift-share-backdrop stitch-ui"><style>{`
 .drift-share-backdrop.stitch-ui{max-width:none;width:auto;height:auto;position:fixed;inset:0;z-index:100;background:#000b;display:grid;place-items:center;padding:14px}.drift-share-sheet{width:min(100%,420px);max-height:calc(100dvh - 28px);overflow:auto;padding:20px;background:#11151c;border:1px solid #ffffff26;border-radius:22px;box-shadow:0 20px 80px #0008;color:#fff}.stitch-ui .drift-share-sheet button,.stitch-ui .drift-share-sheet a{padding:10px 14px;min-height:44px;border-radius:12px;border:1px solid #ffffff35;display:inline-flex;align-items:center;justify-content:center;background:#20262e;font-size:13px;color:white}.stitch-ui .drift-share-sheet .drift-share-primary{background:#d4ff00;color:#0a0b0e;border:0;font-weight:700}.drift-share-sheet h2{font-size:21px;margin:0}.drift-share-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.drift-share-sheet p{font-size:12px;line-height:1.5;color:#b8c0cb}.drift-share-sheet img{display:block;width:155px;max-width:55%;height:auto;margin:14px auto;border:1px solid #ffffff35;border-radius:10px}.drift-share-actions{display:flex;flex-wrap:wrap;gap:8px}.drift-share-sheet textarea{width:100%;min-height:60px;background:#080b10;border:1px solid #ffffff30;color:#d4ff00;border-radius:8px;padding:8px;font-size:11px;resize:vertical}.drift-share-sheet label{display:block;font-size:11px;color:#bcc4cf;margin-top:14px}.drift-share-sheet [role=status]{color:#e3e8ee;margin-bottom:0}@media(max-height:650px){.drift-share-sheet img{width:105px}.drift-share-sheet{padding:14px}}
 `}</style><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`share-heading-${track.id}`} tabIndex={-1} className="drift-share-sheet"><div className="drift-share-heading"><h2 id={`share-heading-${track.id}`}>Share your discovery</h2><button onClick={onClose} aria-label="Close sharing">✕</button></div>
 <p>A story-ready card with Drift's watermark. No album artwork or audio. Instagram Stories may not appear in your device's share sheet.</p>
 {image&&<img src={image.url} alt={`Drift story card for ${label}`}/>}
 <div className="drift-share-actions"><button className="drift-share-primary" onClick={()=>void native()} disabled={!image}>Share card</button>{image&&<a href={image.url} download="drift-story.png">Download card</a>}<button onClick={()=>void copy(DRIFT_SHARE_URL)}>Copy Drift link</button>{songUrl&&<button onClick={()=>void copy(songUrl)}>Copy song link</button>}</div>
 <p>For Instagram: download the card, add it to your Story, then paste a link sticker. The image itself has no clickable link.</p>
 <label>Links for manual copy<textarea readOnly aria-label="Share links" value={shareText}/></label><p role="status" aria-live="polite">{status}</p></div></div>,document.body);
}
