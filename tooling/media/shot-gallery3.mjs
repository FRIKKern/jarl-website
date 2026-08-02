import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const M = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/media';
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5302/', { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(5000);
  const st = await page.evaluate(() => {
    const imgs = [...document.images];
    return { total: imgs.length, ok: imgs.filter(i => i.complete && i.naturalWidth > 0).length, broken: imgs.filter(i => i.complete && i.naturalWidth === 0).length };
  });
  console.log(i, JSON.stringify(st));
  if (st.total > 0 && st.ok === st.total) break;
}
await page.screenshot({ path: `${M}/galleryspace-home.png`, timeout: 60000 });
await browser.close();
