import { transport as catalogTransport } from './transport';
import { ApiError, type CatalogList, type Track, type Genre, type Artist } from './types';
export type Transport = <T>(path: string, params: Record<string,string|number>, signal?: AbortSignal) => Promise<T>;
const delay = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve,reject) => { const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted','AbortError')); }; const timer = setTimeout(() => { signal?.removeEventListener('abort',abort); resolve(); },ms); signal?.addEventListener('abort',abort,{once:true}); if(signal?.aborted) abort(); });
export class Deezer {
  private active = 0;
  private nextStart = 0;
  private pending = new Map<string,Promise<unknown>>();
  constructor(private transport: Transport = catalogTransport) {}
  async get<T>(path: string, params: Record<string,string|number> = {}, signal?: AbortSignal): Promise<T> {
    // Coalesce unscoped reads (likes/refresh); scoped feed reads retain individual cancellation.
    const key = path + JSON.stringify(params);
    if (!signal && this.pending.has(key)) return this.pending.get(key) as Promise<T>;
    const run = async () => {
      for(let attempt=0;attempt<3;attempt++) {
        while(this.active >= 2 || Date.now() < this.nextStart) await delay(100,signal);
        if(signal?.aborted) throw new DOMException('Aborted','AbortError');
        this.active++; this.nextStart = Date.now()+250;
        try { return await this.transport<T>(path,params,signal); }
        catch(e) { if((e as Error).name==='AbortError' || (e instanceof ApiError && ![4,800].includes(e.code || 0)) || attempt===2) throw e; }
        finally { this.active--; }
        await delay(500 * 2**attempt,signal);
      }
      throw new Error('Catalog unavailable');
    };
    const request = run();
    if (!signal) { this.pending.set(key,request); void request.finally(() => this.pending.delete(key)).catch(() => {}); }
    return request;
  }
  artists(query:string, signal?:AbortSignal) { return this.get<CatalogList<Artist>>('/search/artist',{q:query,limit:25},signal); }
  artistTop(id:number,signal?:AbortSignal) {return this.get<CatalogList<Track>>(`/artist/${id}/top`,{limit:50},signal);}
  genres(signal?: AbortSignal) { return this.get<CatalogList<Genre>>('/genre',{},signal); }
  track(id: number, signal?: AbortSignal) { return this.get<Track>(`/track/${id}`,{},signal); }
  batch(mode: {query?: string; genre: number}, index: number, signal?: AbortSignal) {
    return mode.query ? this.get<CatalogList<Track>>('/search',{q:mode.query,limit:25,index},signal) : this.get<CatalogList<Track>>(`/chart/${mode.genre}/tracks`,{limit:25,index},signal);
  }
}
export const deezer = new Deezer();
