import { chromium } from '/Users/frikkjarl/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT='/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/recrop';
const b=await chromium.launch({executablePath:'/Users/frikkjarl/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
for (const slug of ['lunnheim','aquatiq-synk']) {
  const p=await b.newPage({viewport:{width:1440,height:1100},colorScheme:'light',deviceScaleFactor:2});
  await p.goto(`https://jarl.no/prosjekter/${slug}`,{waitUntil:'networkidle',timeout:120000});
  await p.evaluate(()=>{for(const i of document.images){i.loading='eager';i.setAttribute('loading','eager');}});
  await p.waitForTimeout(2500);
  await p.screenshot({path:`${OUT}/detail-${slug}.png`});
  await p.close();
}
await b.close(); console.log('ok');
