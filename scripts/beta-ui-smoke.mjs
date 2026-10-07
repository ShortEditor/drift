import {chromium} from '@playwright/test';
import {initializeApp} from 'firebase/app';
import {getFirestore,connectFirestoreEmulator,doc,setDoc,serverTimestamp} from 'firebase/firestore';
const db=getFirestore(initializeApp({projectId:'demo-drift-beta'}));connectFirestoreEmulator(db,'127.0.0.1',8189);
// Emulator fixture writes only, no production accounts or grants.
const put=async(path,fields)=>{const r=await fetch(`http://127.0.0.1:8189/v1/projects/demo-drift-beta/databases/(default)/documents/${path}`,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer owner'},body:JSON.stringify({fields})});if(!r.ok)throw Error(await r.text());};
for(const [uid,email,username] of [['alpha','alpha@example.test','alpha'],['bravo','bravo@example.test','bravo']]){
 await put(`invites/${email}`,{active:{booleanValue:true}});
 await put(`profiles/${uid}`,{username:{stringValue:username},active:{booleanValue:true}});
 await put(`memberships/${uid}`,{email:{stringValue:email}});
 await put(`usernames/${username}`,{uid:{stringValue:uid}});
}
await put('users/alpha/likes/3',{id:{integerValue:'3'},title:{stringValue:'Sample saved song'},artistName:{stringValue:'Sample artist'},likedAt:{integerValue:'1'}});
await put('messages/received',{from:{stringValue:'bravo'},to:{stringValue:'alpha'},songId:{integerValue:'3'},sentAt:{timestampValue:new Date().toISOString()}});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>console.log('PAGEERROR',e.message));page.on('console',m=>console.log('BROWSER',m.text()));
await page.route('**/api/beta-session',r=>r.fulfill({status:200,json:{uid:'alpha'}}));
await page.route('http://127.0.0.1:5174/api/deezer**',r=>r.fulfill({status:200,json:{id:3,title:'Sample received song',artist:{id:2,name:'Sample artist'},preview:'',link:'https://www.deezer.com/track/3'}}));
await page.goto('http://127.0.0.1:5174');
const actualUid=await page.evaluate(async()=>{const {auth}=await import('/src/beta/client.ts');const {signInWithCredential,GoogleAuthProvider}=await import('/node_modules/.vite/deps/firebase_auth.js');const payload={sub:'alpha',email:'alpha@example.test',email_verified:true,name:'Alpha tester',iss:'https://accounts.google.com',aud:'demo-client',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600};const result=await signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify(payload)));return result.user.uid;});
await put(`profiles/${actualUid}`,{username:{stringValue:'alpha'},active:{booleanValue:true}});await put(`memberships/${actualUid}`,{email:{stringValue:'alpha@example.test'}});await put(`users/${actualUid}/likes/3`,{id:{integerValue:'3'},title:{stringValue:'Sample saved song'},artistName:{stringValue:'Sample artist'},likedAt:{integerValue:'1'}});await put('messages/received',{from:{stringValue:'bravo'},to:{stringValue:actualUid},songId:{integerValue:'3'},sentAt:{timestampValue:new Date().toISOString()}});await page.goto('http://127.0.0.1:5174/?smoke=1');await page.getByRole('button',{name:'Songs inbox'}).waitFor();await page.getByRole('button',{name:'Songs inbox'}).click();await page.getByText('Sample received song · Sample artist').waitFor();
await page.locator('select').nth(0).selectOption('bravo');await page.locator('select').nth(1).selectOption('3');await page.screenshot({path:'/downloads/beta-before-send.png'});await page.getByRole('button',{name:'Send song',exact:true}).click();await page.getByRole('status').filter({hasText:'Song sent.'}).waitFor();
for(let i=0;i<5;i++){await page.getByRole('button',{name:`Create invite (${i}/5 used)`}).click();await page.getByLabel(`Invitation ${i+1} link`,{exact:true}).waitFor();}if(!await page.getByRole('button',{name:'Create invite (5/5 used)'}).isDisabled())throw Error('Sixth invitation button must be disabled');await page.screenshot({path:'/downloads/beta-invites-mobile.png',fullPage:true});await page.screenshot({path:'/downloads/beta-inbox-mobile.png',fullPage:true});await page.getByRole('button',{name:'Back to music'}).click();await page.screenshot({path:'/downloads/beta-music-mobile.png',fullPage:true});await page.getByRole('button',{name:'Songs inbox'}).click();await page.setViewportSize({width:1440,height:950});await page.screenshot({path:'/downloads/beta-inbox-desktop.png',fullPage:true});
console.log('Authenticated inbox loaded, song-only send succeeded; desktop/mobile screenshots saved.');await browser.close();process.exit(0);
