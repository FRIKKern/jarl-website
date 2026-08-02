import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/recrop';
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
for (const scheme of ['light','dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: scheme, deviceScaleFactor: 2 });
  await page.goto('https://jarl.no/prosjekter', { waitUntil: 'networkidle', timeout: 120000 });
  // force every image eager, then scroll the whole page so nothing stays lazy
  await page.evaluate(() => { for (const i of document.images) { i.loading='eager'; i.setAttribute('loading','eager'); } });
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y=0; y<h; y+=400) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,120)); }
    window.scrollTo(0,0);
  });
  for (let i=0;i<20;i++) {
    const st = await page.evaluate(() => { const im=[...document.images]; return {t:im.length, ok:im.filter(x=>x.complete&&x.naturalWidth>0).length}; });
    if (st.t>0 && st.ok===st.t) { console.log(scheme,'all images loaded',JSON.stringify(st)); break; }
    await page.waitForTimeout(1000);
    if (i===19) console.log(scheme,'TIMEOUT',JSON.stringify(st));
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/verify-prosjekter-${scheme}.png`, fullPage: true, timeout: 120000 });
  const n = await page.evaluate(() => [...document.images].map(i=>({src:i.currentSrc.split('/').pop(), w:i.naturalWidth, h:i.naturalHeight, rw:Math.round(i.getBoundingClientRect().width), rh:Math.round(i.getBoundingClientRect().height)})));
  console.log(scheme, JSON.stringify(n));
  await page.close();
}
await browser.close();
