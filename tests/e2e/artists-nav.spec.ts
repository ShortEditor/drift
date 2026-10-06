import {test,expect} from '@playwright/test';
for (const width of [320,360,390,480,1440]) {
 test(`four visible equal dock tabs and artist navigation at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  const buttons=nav.getByRole('button');
  await expect(buttons).toHaveCount(4);
  for(const label of ['Discover','Saved','Artists','Profile']) await expect(nav.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  const sizes=await buttons.evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {width:b.width,height:b.height,right:b.right,left:b.left};}));
  expect(Math.max(...sizes.map(b=>b.width))-Math.min(...sizes.map(b=>b.width))).toBeLessThan(1);
  for(const box of sizes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);}
  await nav.getByRole('button',{name:'Artists',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Follow your artists.'})).toBeVisible();
  await expect(nav.getByRole('button',{name:'Artists',exact:true})).toHaveAttribute('aria-current','page');
  await expect(nav.getByRole('button',{name:'Artists',exact:true}).locator('svg')).toHaveCount(1);
  await page.screenshot({path:`/downloads/artists-fixed-${width}.png`,fullPage:true});
  await nav.getByRole('button',{name:'Discover',exact:true}).click();
  await expect(nav.getByRole('button',{name:'Discover',exact:true})).toHaveAttribute('aria-current','page');
 });
}
for(const width of [320,390,1440])test(`song and artist search at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});const queries:string[]=[];
 await page.route('**/api/deezer?*',r=>r.fulfill({json:{data:[]}}));
 await page.route('**/api/catalog?*',async r=>{const u=new URL(r.request().url());const q=u.searchParams.get('query')||'';if(!u.searchParams.has('status'))queries.push(q);await r.fulfill({json:u.searchParams.has('status')?{jamendo:false}:{data:q==='nothingxyz'?[]:[{id:q?100:1,title:q==='Zara Larsson'?'Artist song':q||'Global song',artist:{id:7,name:'Zara Larsson'},album:{id:1,title:'Album'},preview:'https://preview.invalid/song',link:'https://www.deezer.com/track/100'}]}});});
 await page.goto('/');await expect(page.locator('.song-card').first()).toBeVisible();const input=page.getByRole('searchbox',{name:'Search songs or artists'});await input.fill('Midnight Sun');expect(queries).not.toContain('Midnight Sun');await page.getByRole('button',{name:'Search songs',exact:true}).click();await expect(page.getByRole('heading',{name:'Midnight Sun',exact:true})).toBeVisible();await expect(page.locator('.song-search p')).toContainText('1 song loaded');
 await page.screenshot({path:`/downloads/search-tested-${width}.png`});const box=await input.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
 await page.getByRole('tab',{name:/Following/}).click();await input.fill('Zara Larsson');await input.press('Enter');await expect(page.getByRole('tab',{name:'Global',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('heading',{name:'Artist song'})).toBeVisible();
 await input.fill('తెలుగు');await input.press('Enter');await expect(page.getByRole('heading',{name:'తెలుగు',exact:true})).toBeVisible();await input.fill('nothingxyz');await input.press('Enter');await expect(page.getByText('No matches. Try another artist or song.')).toBeVisible();await page.getByRole('button',{name:'Clear song search'}).click();await expect(input).toHaveValue('');await expect(page.getByRole('heading',{name:'Global song'})).toBeVisible();
});
