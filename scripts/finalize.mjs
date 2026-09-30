import {createHash} from 'node:crypto';
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
const assets=readdirSync('dist/assets').map(f=>'./assets/'+f);
let sw=readFileSync('dist/sw.js','utf8');
sw=sw.replace("const VERSION = 'drift-shell-v1';",`const VERSION = 'drift-shell-${createHash('sha256').update(assets.join('|')).digest('hex').slice(0,16)}';`);
sw=sw.replace(/const SHELL_ASSETS = .*?;/,`const SHELL_ASSETS = ${JSON.stringify(['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png',...assets])};`);
writeFileSync('dist/sw.js',sw);
