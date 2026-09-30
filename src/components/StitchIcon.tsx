export function StitchIcon({name}:{name:string}){switch(name){case 'heart':return <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8] group-hover:fill-brand-lime group-hover:stroke-brand-lime transition-colors" viewBox="0 0 24 24">
<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;case 'tune':return <svg className="w-5 h-5 stroke-current stroke-[1.8]" fill="none" viewBox="0 0 24 24">
<path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;case 'share':return <svg className="w-5 h-5 stroke-current stroke-[1.8]" fill="none" viewBox="0 0 24 24">
<path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;case 'play':return <svg className="w-6 h-6 text-brand-lime fill-brand-lime translate-x-0.5 drop-shadow-[0_0_8px_rgba(212,255,0,0.6)]" viewBox="0 0 24 24">
<path d="M8 5v14l11-7z"></path>
</svg>;case 'discover':return <svg className="w-5 h-5 stroke-current stroke-[2.2]" fill="none" viewBox="0 0 24 24">
<path d="M9 9l10.5-3m0 0L16.5 16.5M19.5 6L6 19.5" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;case 'saved':return <svg className="w-5 h-5 stroke-current stroke-[1.8]" fill="none" viewBox="0 0 24 24">
<path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;case 'profile':return <svg className="w-5 h-5 stroke-current stroke-[1.8]" fill="none" viewBox="0 0 24 24">
<path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>;default:return null;}}