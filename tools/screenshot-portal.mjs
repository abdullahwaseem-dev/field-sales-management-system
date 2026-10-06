#!/usr/bin/env node
/**
 * Captures the design-system page with the locally installed Chrome (no browser download):
 *   docs/design-system/screenshots/portal/<specimen>.png   each specimen, showing all four combos
 *   docs/design-system/screenshots/portal/page-<combo>.png the page chrome in each combo
 * Usage: npm run screenshots   (builds the portal first)
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { preview } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'docs', 'design-system', 'screenshots', 'portal');
mkdirSync(out, { recursive: true });

const server = await preview({ root: join(root, 'apps', 'portal'), preview: { port: 4179, strictPort: true }, logLevel: 'error' });
const url = 'http://localhost:4179/';
const browser = await chromium.launch({ channel: 'chrome' });

async function open(prefs, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await context.addInitScript((p) => localStorage.setItem('sfms.prefs', JSON.stringify(p)), prefs);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, errors };
}

try {
  // 1) Every specimen (each already contains EN/AR × light/dark), with English-light page chrome.
  const { page, context, errors } = await open({ theme: 'light', locale: 'en', digits: 'latn', hijri: false });
  // Element shots scroll the page; un-stick the header so it never overlays a specimen.
  await page.addStyleTag({ content: 'header.sticky { position: relative !important; }' });
  const shots = await page.$$eval('[data-shot]', (els) => els.map((e) => e.getAttribute('data-shot')));
  for (const id of shots) {
    const el = page.locator(`[data-shot="${id}"]`);
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: join(out, `${id}.png`) });
  }
  for (const id of ['brand', 'mobile']) {
    await page.locator(`#${id} img`).last().scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    await page.locator(`#${id}`).screenshot({ path: join(out, `${id}.png`) });
  }
  const typo = page.locator('#typography');
  await typo.screenshot({ path: join(out, 'typography.png') });
  await context.close();
  console.log(`✔ ${shots.length + 2} specimen screenshots`);
  if (errors.length) console.warn('⚠ console errors:', errors);

  // 2) The page itself in each combination (first viewport), proving page-level switching works.
  for (const [theme, locale] of [['light', 'en'], ['dark', 'en'], ['light', 'ar'], ['dark', 'ar']]) {
    const s = await open({ theme, locale, digits: 'latn', hijri: false });
    await s.page.screenshot({ path: join(out, `page-${locale}-${theme}.png`) });
    if (s.errors.length) console.warn(`⚠ ${locale}-${theme} console errors:`, s.errors);
    await s.context.close();
  }
  // 3) Automated WCAG 2.2 A/AA scan (axe-core) of the whole page, in Arabic-dark and English-light.
  const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  for (const [theme, locale] of [['dark', 'ar'], ['light', 'en']]) {
    const s = await open({ theme, locale, digits: 'latn', hijri: false });
    await s.page.addScriptTag({ content: axeSource });
    const result = await s.page.evaluate(() =>
      window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }));
    const v = result.violations;
    console.log(v.length ? `✖ axe ${locale}-${theme}: ${v.length} rule(s) violated` : `✔ axe ${locale}-${theme}: 0 WCAG 2.2 A/AA violations (${result.passes.length} rules passed)`);
    for (const r of v) console.log(`   - ${r.id} (${r.impact}): ${r.help} — ${r.nodes.length} node(s), e.g. ${r.nodes[0]?.target.join(' ')}`);
    await s.context.close();
  }

  // 4) Phone-width check: no horizontal page scroll.
  const phone = await open({ theme: 'light', locale: 'ar', digits: 'latn', hijri: false }, 390);
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await phone.page.screenshot({ path: join(out, 'page-phone-ar-light.png') });
  await phone.context.close();
  console.log(overflow > 0 ? `✖ horizontal page overflow at 390px: ${overflow}px` : '✔ no horizontal page scroll at 390px');
} finally {
  await browser.close();
  server.httpServer.close();
}
