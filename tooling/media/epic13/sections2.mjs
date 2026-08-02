import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic13/jarl';
const PAGES = [['/', 'hjem'], ['/prosjekter', 'prosjekter'], ['/om', 'om'], ['/kontakt', 'kontakt'], ['/prosjekter/barkpark', 'project-barkpark'], ['/prosjekter/scaffy', 'project-scaffy'], ['/prosjekter/oslobukta', 'project-oslobukta'], ['/notater', 'notater']];
const probe = () => {
  // find the deepest wrapper whose children are the real sections
  let root = document.querySelector('main') || document.body;
  while (root.children.length === 1) root = root.children[0];
  const secs = [];
  const collect = (el, depth) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      if (r.height < 40) continue;
      if (depth < 1 && c.children.length > 1 && !['SECTION', 'ARTICLE', 'HEADER', 'FOOTER'].includes(c.tagName) && r.height > innerHeight * 1.5) { collect(c, depth + 1); continue; }
      let mediaArea = 0;
      for (const m of c.querySelectorAll('img, video, canvas, pre, figure, svg')) {
        const mr = m.getBoundingClientRect();
        if (mr.width > 150 && mr.height > 80) mediaArea += mr.width * mr.height;
      }
      const bg = getComputedStyle(c).backgroundColor;
      secs.push({ tag: c.tagName.toLowerCase(), cls: (c.className || '').toString().slice(0, 55), top: Math.round(r.top + scrollY), h: Math.round(r.height), mediaShare: +(mediaArea / Math.max(1, r.width * r.height)).toFixed(2), bg, text: (c.textContent || '').trim().slice(0, 50) });
    }
  };
  collect(root, 0);
  return { rootCls: (root.className || '').toString(), secs };
};
const run = async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const out = {};
  for (const [path, name] of PAGES) {
    await page.goto('https://jarl.no' + path, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1000);
    out[name] = await page.evaluate(probe);
    console.log('ok', name, out[name].secs.length);
  }
  fs.writeFileSync(OUT + '/sections2.json', JSON.stringify(out, null, 1));
  await b.close();
};
run();
