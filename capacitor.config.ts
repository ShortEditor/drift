import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
 appId:'app.drift.music.beta',appName:'Drift Beta',webDir:'dist',
 server:{cleartext:false},
 android:{allowMixedContent:false,backgroundColor:'#101217',webContentsDebuggingEnabled:false},
};
export default config;
