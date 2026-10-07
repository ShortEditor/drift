import './stitch-fonts.css';
import './stitch-utilities.css';
import {Capacitor} from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App';
import {Analytics} from '@vercel/analytics/react';
import {DownloadPage} from './components/DownloadApp';
import './style.css';
import {lazy,Suspense} from 'react';
const BetaApp=lazy(()=>import('./beta/BetaApp').then(m=>({default:m.BetaApp})));
if(Capacitor.isNativePlatform())document.documentElement.classList.add('native-android');
createRoot(document.getElementById('root')!).render(<>{import.meta.env.VITE_DRIFT_BETA==='1'?<Suspense fallback={<p>Loading beta…</p>}><BetaApp/></Suspense>:location.pathname==='/download'?<DownloadPage/>:<App/>}{!Capacitor.isNativePlatform()&&import.meta.env.VITE_DRIFT_BETA!=='1'&&<Analytics/>}</>);
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform() && import.meta.env.VITE_DRIFT_BETA!=='1') {window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js').catch(console.warn);});}
