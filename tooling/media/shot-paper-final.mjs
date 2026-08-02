import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const M = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/media';
const token = readFileSync('/tmp/jarl_admin_token', 'utf8').trim();
const browser = await chromium.launch({ executablePath: '/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('https://barkpark.jarl.no/studio', { waitUntil: 'networkidle', timeout: 30000 });
await page.click('text=Sign in with an API token');
await page.fill('input[name="token"]', token);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
  page.locator('input[name="token"]').press('Enter'),
]);
await page.waitForTimeout(2500);
await page.click('text=Papers');
await page.waitForTimeout(3000);

await page.locator('button.bp-doc-row-body', { hasText: 'scaffy-historien' }).first().click({ force: true });
await page.waitForTimeout(6000);
console.log('URL:', page.url());
console.log('TEXT HEAD:', (await page.evaluate(() => document.body.innerText.slice(0, 400))).replace(/\n/g, ' | '));
await page.screenshot({ path: `${M}/studio-paper-editing.png` });
await browser.close();
