import {test,expect} from '@playwright/test';
async function mockCatalog(page:import('@playwright/test').Page) {
 await page.route('https://api.deezer.com/**',async route=>{const url=new URL(route.request().url());const cb=url.searchParams.get('callback');const data=url.pathname==='/genre'?{data:[{id:132,name:'Pop'},{id:116,name:'Rap/Hip Hop'}]}:url.pathname.startsWith('/track/')?{id:1,title:'First Light',artist:{id:27,name:'A little discovery'},album:{id:1,title:'First Light'},preview:'https://preview.invalid/1?token=signed',link:'https://www.deezer.com/track/1'}:{data:Array.from({length:25},(_,i)=>({id:i+1,title:['First Light','A New Frequency','Night Swim'][i%3],artist:{id:i%4+1,name:['A little discovery','Your next favorite','After-hours radio'][i%3]},album:{id:i+1,title:'Session'},preview:`https://preview.invalid/${i}?token=signed`,link:`https://www.deezer.com/track/${i+1}`}))};await route.fulfill({contentType:'application/javascript',body:`${cb}(${JSON.stringify(data)});`});});
}
for(const viewport of [{width:360,height:800},{width:1440,height:1000}])test(`feed, likes, preferences at ${viewport.width}`,async({page})=>{
 await page.setViewportSize(viewport);await mockCatalog(page);await page.goto('/');await expect(page.locator('.song-card').first()).toBeVisible();await expect(page.locator('.song-card')).toHaveCount(3);await expect(page.locator('audio')).toHaveCount(0);
 const card=page.locator('.song-card').first();const play=card.getByRole('button',{name:'Tap to start listening'});await expect(play).toBeVisible();const box=await play.boundingBox();expect(box!.y+box!.height).toBeLessThan(viewport.height-60);
 await page.screenshot({path:`verification-${viewport.width}.png`,fullPage:true});
 await card.getByRole('button',{name:'Like song',exact:true}).click();await page.getByRole('button',{name:/Liked/}).click();await expect(page.getByText('Saved on this device.',{exact:false})).toBeVisible();await expect(page.locator('.liked-row')).toHaveCount(1);
 await page.reload();await page.getByRole('button',{name:/Liked/}).click();await expect(page.locator('.liked-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Discover preferences'}).click();await page.getByLabel('Artist or song').fill('తెలుగు');await page.waitForTimeout(500);await expect(page.getByLabel('Artist or song')).toHaveValue('తెలుగు');await page.getByRole('button',{name:'Close preferences'}).click();
 await page.getByRole('button',{name:/Discover$/}).click();
 for(let i=0;i<7;i++){await page.locator('.feed').evaluate(el=>el.scrollTo({top:el.clientHeight*(Math.round(el.scrollTop/el.clientHeight)+1)}));await page.waitForTimeout(250);}
 expect(await page.locator('.song-card').count()).toBeLessThanOrEqual(5);await expect(page.locator('.spacer').first()).toBeVisible();
});
test('offline shell works and remote catalog/art/audio are not cached',async({page,context})=>{
 await page.goto('/');await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await page.reload();await context.setOffline(true);await page.reload();await expect(page.getByText('Connect to load music. Offline music is not available.')).toBeVisible();
 const cached=await page.evaluate(async()=>{const names=await caches.keys();return (await Promise.all(names.map(async name=>(await (await caches.open(name)).keys()).map(r=>r.url)))).flat();});expect(cached.length).toBeGreaterThan(4);expect(cached.every(url=>url.startsWith('http://127.0.0.1:4173/'))).toBe(true);
});
