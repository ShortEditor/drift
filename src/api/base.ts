// Local Android assets use an HTTPS backend; normal web hosting stays same-origin.
export function apiUrl(path:string){return ['localhost','127.0.0.1'].includes(location.hostname)&&!['http:','https:'].includes(location.protocol)||location.hostname==='localhost'&&location.port===''?`https://drift-music-scroll.vercel.app${path}`:path;}
