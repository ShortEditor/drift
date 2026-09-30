export interface Track { duration?:number; lyrics?:string; source?:'deezer'|'jamendo'; providerId?:number; credit?:{licenseUrl:string;trackUrl:string;artist:string;provider:string}; id: number; title: string; artist: { id: number; name: string }; album?: { id: number; title: string; cover_big?: string; cover_xl?: string }; preview?: string; link?: string; readable?: boolean; explicit_lyrics?: boolean }
export interface CatalogList<T> { data: T[]; total?: number; next?: string; nextIndex?:number }
export interface Genre { id: number; name: string }
export const playable = (t: Track) => Boolean(t.preview) && t.readable !== false;
export class ApiError extends Error { constructor(message: string, public code?: number) { super(message); this.name = 'ApiError'; } }
export function validateEnvelope<T>(value: unknown): T {
  if (!value || typeof value !== 'object') throw new ApiError('Invalid catalog response');
  if ('error' in value) { const error = (value as {error: {message?: string; code?: number}}).error; throw new ApiError(error?.message || 'Music catalog unavailable', error?.code); }
  return value as T;
}

export interface Artist {id:number; name:string; picture_medium?:string; nb_fan?:number}
