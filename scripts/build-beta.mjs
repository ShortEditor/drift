import {rmSync} from 'node:fs';
rmSync('dist/releases',{recursive:true,force:true});

if(process.env.VITE_DRIFT_BETA!=='1') throw Error('VITE_DRIFT_BETA=1 required for separate beta');
