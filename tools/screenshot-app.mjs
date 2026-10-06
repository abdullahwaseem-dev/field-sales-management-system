#!/usr/bin/env node
/**
 * Signs in to the running portal (npm run dev:portal + API) and captures every page in all four
 * combinations: docs/screenshots/portal-app/<page>-<locale>-<theme>.png
 * Usage: node tools/screenshot-app.mjs [employeeId] [password]
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'docs', 'screenshots', 'portal-app');
mkdirSync(out, { recursive: true });
const [id = 'ZN-00010', password = 'Zona@2026'] = process.argv.slice(2);
const base = 'http://localhost:5173';
const pages = [['dashboard', '/'], ['live-map', '/live-map'], ['attendance', '/attendance'], ['reviews', '/attendance?tab=reviews'], ['corrections', '/attendance?tab=corrections'], ['leave', '/attendance?tab=leave'], ['employees', '/employees'], ['marketing', '/marketing'], ['reports', '/reports'], ['settings', '/settings']];
const combos = (process.env.COMBOS ?? 'en-light,en-dark,ar-light,ar-dark').split(',');

const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const combo of combos) {
    const [locale, theme] = combo.split('-');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript((p) => localStorage.setItem('sfms.prefs', JSON.stringify(p)), { theme, locale, digits: 'latn', hijri: false });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && !/tile|cartocdn|favicon/.test(m.text()) && errors.push(m.text()));
    await page.goto(base);
    await page.locator('input[autocomplete="username"]').fill(id);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForSelector('main#main', { timeout: 15_000 });
    for (const [name, path] of pages) {
      await page.evaluate((p) => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.waitForTimeout(name.includes('map') || name === 'dashboard' || name === 'settings' ? 2500 : 900);
      await page.screenshot({ path: join(out, `${name}-${combo}.png`) });
    }
    console.log(`✔ ${combo}: ${pages.length} pages${errors.length ? ` — console errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}` : ''}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
