import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic9frames';
const [url, name, scheme] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme || 'light' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
// force every lazy image to load, then scroll the whole page
await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
});
await page.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
const st = await page.evaluate(() => {
  const im = [...document.images];
  return { total: im.length, ok: im.filter(i => i.naturalWidth > 0).length,
           broken: im.filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc) };
});
console.log(JSON.stringify(st));
await page.screenshot({ path: `${OUT}/${name}`, fullPage: true, timeout: 60000 });
await browser.close();
