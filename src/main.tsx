import './stitch-fonts.css';
import './stitch-utilities.css';
import {Capacitor} from '@capacitor/core';
import { createRoot } from 'react-dom/client';
import App from './App';
import {Analytics} from '@vercel/analytics/react';
import {DownloadPage} from './components/DownloadApp';
import './style.css';
if(Capacitor.isNativePlatform())document.documentElement.classList.add('native-android');
createRoot(document.getElementById('root')!).render(<>{location.pathname==='/download'?<DownloadPage/>:<App/>}{!Capacitor.isNativePlatform()&&<Analytics/>}</>);
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js').catch(console.warn);});}
