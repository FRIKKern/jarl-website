import { chromium } from 'playwright';
import fs from 'fs';

const OUT = '/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic13/jarl';
const BASE = 'https://jarl.no';

const PROJECTS = ['barkpark','doey','frick-design-system','bulldocs','scaffy','barkpark-cloud','spreadsheet-wizard','akerbrygge','kronprinsparets-fond','polyflor-ordre','oslobukta','gyldendal','aquatiq-synk','nextgen','lunnheim','galleryspace','hundesteder','ticket-realtime','full-blast','svgloop'];

const PAGES = [
  { path: '/', name: 'hjem', mobile: true, dark: true },
  { path: '/prosjekter', name: 'prosjekter', mobile: true, dark: true },
  { path: '/om', name: 'om', mobile: true, dark: true },
  { path: '/kontakt', name: 'kontakt', mobile: true, dark: true },
  { path: '/notater', name: 'notater' },
  ...PROJECTS.map(s => ({ path: `/prosjekter/${s}`, name: `project-${s}`, mobile: s === 'barkpark', dark: s === 'barkpark' })),
  { path: '/notater/nettsiden-laerte-et-nytt-sprak', name: 'note-sprak' },
  { path: '/notater/dagen-disken-ble-full', name: 'note-disk' },
  { path: '/notater/velkommen', name: 'note-velkommen' },
  { path: '/papers/scaffy-historien', name: 'paper-scaffy' },
  { path: '/papers/jarl-mediedoktrinen', name: 'paper-mediedoktrinen' },
  { path: '/papers/frikk-tiaret-dossier', name: 'paper-dossier' },
];

const metricsProbe = () => {
  const out = {};
  out.title = document.title;
  out.bodyBg = getComputedStyle(document.body).backgroundColor;
  out.docH = document.documentElement.scrollHeight;
  // largest font size actually rendered with visible text
  let maxFs = 0, maxFsText = '';
  let bodyFs = 0;
  const counts = { img: 0, video: 0, canvas: 0, svgLarge: 0, pre: 0 };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const sections = [];
  while (walker.nextNode()) {
    const el = walker.currentNode;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const txt = (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim().slice(0, 60) : '';
    if (txt) {
      const fs = parseFloat(cs.fontSize);
      if (fs > maxFs) { maxFs = fs; maxFsText = txt; }
      if (el.tagName === 'P' && fs > bodyFs && fs <= 22) bodyFs = fs;
    }
    if (el.tagName === 'IMG') counts.img++;
    if (el.tagName === 'VIDEO') counts.video++;
    if (el.tagName === 'CANVAS') counts.canvas++;
    if (el.tagName === 'PRE') counts.pre++;
    if (el.tagName === 'svg') { const r = el.getBoundingClientRect(); if (r.width > 200 && r.height > 150) counts.svgLarge++; }
  }
  // largest single visual element (img/video/canvas/svg/pre/figure)
  let maxVisual = null;
  for (const el of document.querySelectorAll('img, video, canvas, svg, pre, figure')) {
    const r = el.getBoundingClientRect();
    if (r.width < 100 || r.height < 60) continue;
    if (!maxVisual || r.height > maxVisual.h) maxVisual = { tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY), cls: (el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 60) };
  }
  // top-level sections of main
  const main = document.querySelector('main') || document.body;
  for (const el of main.children) {
    const r = el.getBoundingClientRect();
    if (r.height < 10) continue;
    const hasMedia = !!el.querySelector('img, video, canvas, pre, svg[width], figure');
    let mediaArea = 0;
    for (const m of el.querySelectorAll('img, video, canvas, pre')) {
      const mr = m.getBoundingClientRect();
      if (mr.width > 100 && mr.height > 60) mediaArea += mr.width * mr.height;
    }
    sections.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50), top: Math.round(r.top + scrollY), h: Math.round(r.height), media: hasMedia, mediaShare: +(mediaArea / Math.max(1, r.width * r.height)).toFixed(2) });
  }
  // media area within the first 3 viewports (measured against 3*vh strip)
  const vh = innerHeight, vwArea = innerWidth * vh;
  const vp = [0, 0, 0];
  for (const m of document.querySelectorAll('img, video, canvas, pre')) {
    const r = m.getBoundingClientRect();
    const top = r.top + scrollY, bot = r.bottom + scrollY;
    if (r.width < 100 || r.height < 60) continue;
    for (let i = 0; i < 3; i++) {
      const a = i * vh, b = (i + 1) * vh;
      const ov = Math.max(0, Math.min(bot, b) - Math.max(top, a));
      vp[i] += (ov * r.width) / vwArea;
    }
  }
  out.mediaViewportShare = vp.map(x => +x.toFixed(3));
  // hairlines: elements with a visible border <=1.5px on some side, wide
  let hairlines = 0;
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 300) continue;
    for (const side of ['borderTopWidth', 'borderBottomWidth']) {
      const w = parseFloat(cs[side]);
      if (w > 0 && w <= 1.6 && cs[side.replace('Width', 'Style')] !== 'none') hairlines++;
    }
    if (el.tagName === 'HR') hairlines++;
  }
  out.hairlines = hairlines;
  out.buttons = [...new Set([...document.querySelectorAll('a[class*="btn"], a[class*="button"], button, a[class*="cta"], a[class*="Button"]')].map(b => (b.className || '').toString().slice(0, 70)))].slice(0, 12);
  out.maxFs = maxFs; out.maxFsText = maxFsText; out.bodyFs = bodyFs;
  out.counts = counts; out.maxVisual = maxVisual; out.sections = sections;
  out.viewport = { w: innerWidth, h: innerHeight };
  return out;
};

const run = async () => {
  const browser = await chromium.launch();
  const shoot = async (ctx, page, p, suffix) => {
    await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('nav-warn', p.name, e.message));
    await page.waitForTimeout(1200);
    // force-load lazy media
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
      for (let y = 0; y < document.documentElement.scrollHeight; y += 800) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${p.name}${suffix}.png`, fullPage: true });
    return await page.evaluate(metricsProbe);
  };

  const metrics = {};
  // light 1440 for everything
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  let page = await ctx.newPage();
  for (const p of PAGES) {
    try { metrics[p.name] = await shoot(ctx, page, p, '-1440'); console.log('ok', p.name); }
    catch (e) { console.log('FAIL', p.name, e.message); }
  }
  // menu drawer on home
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const burger = page.locator('button[aria-label*="eny" i], button[aria-expanded], header button, [class*="burger"], [class*="menu-toggle"]').first();
    await burger.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/menu-open-1440.png` });
    metrics['menu'] = await page.evaluate(metricsProbe);
    console.log('ok menu');
  } catch (e) { console.log('FAIL menu', e.message); }
  await ctx.close();

  // dark 1440 for main templates
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  page = await ctx.newPage();
  for (const p of PAGES.filter(p => p.dark)) {
    try { metrics[p.name + '-dark'] = await shoot(ctx, page, p, '-1440-dark'); console.log('ok dark', p.name); }
    catch (e) { console.log('FAIL dark', p.name, e.message); }
  }
  await ctx.close();

  // mobile 390 light
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, deviceScaleFactor: 2 });
  page = await ctx.newPage();
  for (const p of PAGES.filter(p => p.mobile)) {
    try { metrics[p.name + '-390'] = await shoot(ctx, page, p, '-390'); console.log('ok 390', p.name); }
    catch (e) { console.log('FAIL 390', p.name, e.message); }
  }
  await ctx.close();

  fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 1));
  await browser.close();
  console.log('DONE');
};
run();
