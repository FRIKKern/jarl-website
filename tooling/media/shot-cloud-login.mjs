import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const M = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/media';
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://jarl.barkpark.cloud/studio', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
console.log('URL:', page.url());
await page.screenshot({ path: `${M}/studio-login-jarl-barkpark-cloud.png` });
await browser.close();
