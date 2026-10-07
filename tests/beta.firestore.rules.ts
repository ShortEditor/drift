import {beforeAll,afterAll,it} from 'vitest';
import {initializeTestEnvironment,assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
let env:RulesTestEnvironment;
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-drift-beta',firestore:{host:'127.0.0.1',port:8189,rules:readFileSync('beta.firestore.rules','utf8')}});await env.withSecurityRulesDisabled(async c=>{for(const email of ['a@example.test','b@example.test'])await setDoc(doc(c.firestore(),'invites',email),{active:true});});});
afterAll(()=>env.cleanup());
const ctx=(id:string,email:string)=>env.authenticatedContext(id,{email,email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
it('denies unauthenticated and uninvited database access',async()=>{await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'profiles','a')));await assertFails(getDoc(doc(ctx('c','c@example.test'),'profiles','a')));await assertFails(setDoc(doc(ctx('c','c@example.test'),'invites','c@example.test'),{active:true}));});
it('claims unique username atomically, keeps emails private, and allows only saved-song messages',async()=>{const a=ctx('a','a@example.test'),b=ctx('b','b@example.test');for(const [db,uid,name,email] of [[a,'a','alpha','a@example.test'],[b,'b','bravo','b@example.test']] as const){const batch=writeBatch(db);batch.set(doc(db,'profiles',uid),{username:name,active:true});batch.set(doc(db,'usernames',name),{uid});batch.set(doc(db,'memberships',uid),{email});await assertSucceeds(batch.commit());}await assertFails(getDoc(doc(a,'memberships','b')));await assertFails(setDoc(doc(b,'usernames','alpha'),{uid:'b'}));await assertSucceeds(setDoc(doc(a,'messages','unsaved'),{from:'a',to:'b',songId:3,sentAt:serverTimestamp()}));await assertSucceeds(setDoc(doc(a,'users','a','likes','3'),{id:3,title:'Song',artistName:'Artist',likedAt:1}));await assertSucceeds(setDoc(doc(a,'messages','song'),{from:'a',to:'b',songId:3,sentAt:serverTimestamp()}));await assertSucceeds(getDoc(doc(b,'messages','song')));await assertFails(getDoc(doc(ctx('c','c@example.test'),'messages','song')));await assertFails(setDoc(doc(a,'messages','text'),{from:'a',to:'b',songId:3,text:'hi',sentAt:serverTimestamp()}));await assertFails(setDoc(doc(a,'messages','spoof'),{from:'b',to:'a',songId:3,sentAt:serverTimestamp()}));await assertFails(getDoc(doc(b,'users','a','likes','3')));});
it('denies expired membership, unverified or non-Google identity and arbitrary fields',async()=>{
 const a=ctx('a','a@example.test'),b=ctx('b','b@example.test');
 await assertFails(getDoc(doc(env.authenticatedContext('a',{email:'a@example.test',email_verified:false,firebase:{sign_in_provider:'google.com'}}).firestore(),'profiles','a')));
 await assertFails(getDoc(doc(env.authenticatedContext('a',{email:'a@example.test',email_verified:true,firebase:{sign_in_provider:'password'}}).firestore(),'profiles','a')));
 await assertFails(setDoc(doc(a,'profiles','a'),{username:'changed',active:true}));
 await assertFails(setDoc(doc(a,'users','a','likes','4'),{id:4,title:'Song',artistName:'Artist',likedAt:1,text:'not allowed'}));
 await assertFails(setDoc(doc(a,'messages','self'),{from:'a',to:'a',songId:3,sentAt:serverTimestamp()}));
 await assertFails(setDoc(doc(a,'messages','file'),{from:'a',to:'b',songId:3,url:'file',sentAt:serverTimestamp()}));
 await assertFails(setDoc(doc(a,'messages','wrongtime'),{from:'a',to:'b',songId:3,sentAt:123}));
 await assertSucceeds(setDoc(doc(a,'users','a','preferences','discovery'),{genre:0,mood:'',query:''}));
 await assertFails(getDoc(doc(b,'users','a','preferences','discovery')));
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'invites','b@example.test'),{active:false}));
 await assertFails(setDoc(doc(a,'messages','revoked'),{from:'a',to:'b',songId:3,sentAt:serverTimestamp()}));
 await assertFails(getDoc(doc(b,'messages','song')));
 await assertFails(getDoc(doc(b,'users','b','preferences','discovery')));
});
it('enforces five lifetime single-use links, atomic redemption, no open signup or replay',async()=>{
 const a=ctx('a','a@example.test');const c=ctx('c','c@example.test'),d=ctx('d','d@example.test');
 const token=(i:number)=>i.toString(16).padStart(64,'0');
 for(let i=1;i<=5;i++){const batch=writeBatch(a);batch.set(doc(a,'inviteSlots','a','slots',String(i)),{token:token(i)});batch.set(doc(a,'inviteLinks',token(i)),{creator:'a',slot:String(i),createdAt:serverTimestamp(),redeemedUid:''});await assertSucceeds(batch.commit());}
 const sixth=writeBatch(a);sixth.set(doc(a,'inviteSlots','a','slots','6'),{token:token(6)});sixth.set(doc(a,'inviteLinks',token(6)),{creator:'a',slot:'6',createdAt:serverTimestamp(),redeemedUid:''});await assertFails(sixth.commit());
 await assertFails(setDoc(doc(a,'inviteLinks',token(99)),{creator:'a',slot:'1',createdAt:serverTimestamp(),redeemedUid:''}));
 await assertFails(setDoc(doc(c,'inviteSlots','c','slots','1'),{token:token(8)}));
 await assertFails(setDoc(doc(c,'invites','c@example.test'),{active:true,uid:'c',invitedBy:'a',linkToken:token(1)}));
 const redeem=writeBatch(c);redeem.update(doc(c,'inviteLinks',token(1)),{redeemedUid:'c'});redeem.set(doc(c,'invites','c@example.test'),{active:true,uid:'c',invitedBy:'a',linkToken:token(1)});await assertSucceeds(redeem.commit());
 await assertSucceeds(getDoc(doc(c,'profiles','a')));
 const account=writeBatch(c);account.set(doc(c,'profiles','c'),{username:'charlie',active:true});account.set(doc(c,'memberships','c'),{email:'c@example.test'});account.set(doc(c,'usernames','charlie'),{uid:'c'});await assertSucceeds(account.commit());
 const child=writeBatch(c);child.set(doc(c,'inviteSlots','c','slots','1'),{token:token(10)});child.set(doc(c,'inviteLinks',token(10)),{creator:'c',slot:'1',createdAt:serverTimestamp(),redeemedUid:''});await assertSucceeds(child.commit());
 await assertFails(setDoc(doc(a,'inviteSlots','a','slots','1'),{token:token(11)}));

 const replay=writeBatch(d);replay.update(doc(d,'inviteLinks',token(1)),{redeemedUid:'d'});replay.set(doc(d,'invites','d@example.test'),{active:true,uid:'d',invitedBy:'a',linkToken:token(1)});await assertFails(replay.commit());
 await assertFails(setDoc(doc(c,'invites','someone@example.test'),{active:true,uid:'c',invitedBy:'a',linkToken:token(2)}));
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'invites','a@example.test'),{active:false}));
 const revoked=writeBatch(d);revoked.update(doc(d,'inviteLinks',token(2)),{redeemedUid:'d'});revoked.set(doc(d,'invites','d@example.test'),{active:true,uid:'d',invitedBy:'a',linkToken:token(2)});await assertFails(revoked.commit());
});
