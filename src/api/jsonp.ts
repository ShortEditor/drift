import { validateEnvelope } from './types';
const allowedPath = /^\/(search(?:\/artist)?|genre|track\/\d+|artist\/\d+(\/top)?|album\/\d+(\/tracks)?|chart\/\d+\/tracks)$/;
let sequence = 0;
export function jsonp<T>(path: string, params: Record<string, string | number> = {}, signal?: AbortSignal, timeout = 8000): Promise<T> {
  if (!allowedPath.test(path)) return Promise.reject(new Error('Catalog path not allowed'));
  if (Object.keys(params).some(k => !['q', 'limit', 'index'].includes(k))) return Promise.reject(new Error('Query not allowed'));
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const name = `__drift_${Date.now()}_${++sequence}`;
    const callbacks = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const query = new URLSearchParams(Object.entries(params).map(([k,v]) => [k,String(v)]));
    query.set('output', 'jsonp'); query.set('callback', name);
    let done = false;
    const cleanup = () => { clearTimeout(timer); script.remove(); script.onerror = null; signal?.removeEventListener('abort', abort); delete callbacks[name]; };
    const finish = (value?: unknown, error?: Error) => { if (done) return; done = true; cleanup(); if (error) reject(error); else { try { resolve(validateEnvelope<T>(value)); } catch(e) { reject(e); } } };
    // Late network replies target a unique, deleted name and cannot settle or overwrite another request.
    callbacks[name] = (value: unknown) => finish(value);
    const abort = () => finish(undefined, new DOMException('Aborted','AbortError'));
    const timer = setTimeout(() => finish(undefined,new Error('Catalog timed out. Try again.')), timeout);
    signal?.addEventListener('abort', abort, {once:true});
    script.onerror = () => finish(undefined,new Error('Could not reach catalog. Try again.'));
    script.src = `https://api.deezer.com${path}?${query}`;
    document.head.appendChild(script);
  });
}
