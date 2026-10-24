/**
 * Portfolio smoke / E2E: real Chromium, 104 facts, i18n, responsive navigation,
 * no broken local links, and desktop/mobile render snapshots.
 * Requires: npx playwright install chromium; npm run build:resume
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageURL = pathToFileURL(path.join(root, 'index.html')).href;
const outDir = path.join(root, 'artifacts', 'portfolio');
fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const resume = JSON.parse(fs.readFileSync(path.join(root, 'data/resume.json'), 'utf8'));
assert.equal(resume.experience[0].title.zh, 'AI 數據工程師');
assert.equal(resume.experience[1].end, '2026/09');
assert.ok(html.includes('9.2%') && html.includes('7%'));
assert.ok(!html.includes('2023/07 – 至今'));
assert.equal((html.match(/class="career-entry"/g) || []).length, 3);
for (const href of ['resume.html', 'Joe_Hsu_Resume_ZH.pdf', 'Joe_Hsu_Resume_EN.pdf', 'styles.css', 'script.js', 'assets/joe-hsu-profile.webp']) {
  assert.ok(fs.existsSync(path.join(root, href)), 'Missing linked asset: ' + href);
}

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  desktop.on('pageerror', err => errors.push('desktop: ' + err.message));
  await desktop.goto(pageURL, { waitUntil: 'domcontentloaded' });
  await desktop.evaluate(() => document.fonts.ready);
  assert.match(await desktop.locator('#hero-title').innerText(), /AI 價值|measurable AI/);
  assert.equal(await desktop.locator('.metric').count(), 4);
  assert.equal(await desktop.locator('.project-card').count(), 3);
  const avatar = desktop.locator('.visual-avatar img');
  assert.match(await avatar.getAttribute('src'), /assets\/joe-hsu-profile\.webp$/);
  assert.ok(await avatar.evaluate(img => img.complete && img.naturalWidth > 0), 'Updated profile image rendered');
  assert.equal(await desktop.locator('.career-entry').count(), 3);
  assert.equal(await desktop.locator('h1').count(), 1, 'One semantic H1');
  const anchors = await desktop.locator('a[href^="#"]').evaluateAll(nodes =>
    nodes.map(a => a.getAttribute('href')).filter(Boolean));
  for (const anchor of anchors) {
    assert.ok(await desktop.locator('[id="' + anchor.slice(1) + '"]').count(), 'Missing anchor: ' + anchor);
  }
  await desktop.screenshot({ path: path.join(outDir, 'desktop-zh.png'), fullPage: true, animations: 'disabled' });
  await desktop.locator('[data-language="en"]').click();
  assert.equal(await desktop.locator('html').getAttribute('lang'), 'en');
  assert.equal(await desktop.locator('[data-language="en"]').getAttribute('aria-pressed'), 'true');
  assert.match(await desktop.locator('#hero-title').innerText(), /measurable AI/);
  assert.ok((await desktop.locator('#resume-download').getAttribute('href')).endsWith('_EN.pdf'));
  await desktop.locator('[data-language="zh"]').click();
  assert.ok((await desktop.locator('#resume-download').getAttribute('href')).endsWith('_ZH.pdf'));

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  mobile.on('pageerror', err => errors.push('mobile: ' + err.message));
  await mobile.goto(pageURL, { waitUntil: 'domcontentloaded' });
  assert.equal(await mobile.locator('#mobile-menu').isVisible(), false);
  await mobile.locator('#menu-toggle').click();
  assert.equal(await mobile.locator('#menu-toggle').getAttribute('aria-expanded'), 'true');
  assert.equal(await mobile.locator('#mobile-menu').isVisible(), true);
  await mobile.locator('#mobile-menu a[href="#projects"]').click();
  assert.equal(await mobile.locator('#mobile-menu').isVisible(), false);
  await mobile.locator('[data-language="en"]').click();
  assert.match(await mobile.locator('#hero-title').innerText(), /measurable AI/);
  const overflow = await mobile.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
  assert.ok(overflow <= 2, 'Mobile horizontal overflow: ' + overflow + 'px');
  await mobile.screenshot({ path: path.join(outDir, 'mobile-en.png'), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log('Portfolio E2E OK: desktop/mobile, bilingual, navigation, assets, 104 facts, no horizontal overflow.');
} finally {
  await browser.close();
}
