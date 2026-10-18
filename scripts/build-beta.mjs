import {rmSync} from 'node:fs';
// Beta ships its Android APK under /releases on the web deployment. The Android build removes dist/releases before cap sync.

if(process.env.VITE_DRIFT_BETA!=='1') throw Error('VITE_DRIFT_BETA=1 required for separate beta');
