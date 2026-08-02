import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const M = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/media';
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://barkpark.jarl.no/studio', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${M}/studio-login-barkpark-jarl-no.png` });
console.log('URL:', page.url());
console.log('TITLE:', await page.title());
const text = await page.evaluate(() => document.body.innerText.slice(0, 1200));
console.log('TEXT:', text);
const inputs = await page.evaluate(() => [...document.querySelectorAll('input,button,a')].slice(0, 20).map(e => `${e.tagName}:${e.type || ''}:${(e.name || e.id || '')}:${(e.innerText || e.placeholder || '').slice(0, 40)}`));
console.log('CONTROLS:', JSON.stringify(inputs, null, 1));
await browser.close();
