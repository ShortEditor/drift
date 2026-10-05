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
