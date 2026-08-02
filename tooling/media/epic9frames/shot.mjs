import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic9frames';
const url = process.argv[2];
const name = process.argv[3];
const scheme = process.argv[4] || 'light';
const full = process.argv[5] === 'full';
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2500);
// report card image geometry
const geo = await page.evaluate(() => [...document.images].slice(0, 8).map(i => ({
  src: i.currentSrc.split('/').pop(), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height),
  nat: i.naturalWidth + 'x' + i.naturalHeight, fit: getComputedStyle(i).objectFit, pos: getComputedStyle(i).objectPosition,
})));
console.log(JSON.stringify(geo, null, 1));
await page.screenshot({ path: `${OUT}/${name}`, fullPage: full, timeout: 60000 });
await browser.close();
