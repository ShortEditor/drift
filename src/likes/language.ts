export const LANGUAGES = [{id:'all',label:'All languages'},{id:'telugu',label:'Telugu'},{id:'hindi',label:'Hindi'}] as const;
export type Language = typeof LANGUAGES[number]['id'];
const key = 'drift-language-v1';
export function readLanguage(): Language {
  try { const v = localStorage.getItem(key); return (LANGUAGES.some(l => l.id === v) ? v : 'all') as Language; } catch { return 'all'; }
}
export function writeLanguage(value: Language) { try { localStorage.setItem(key, value); } catch { /* storage unavailable: preference stays session-only */ } }
