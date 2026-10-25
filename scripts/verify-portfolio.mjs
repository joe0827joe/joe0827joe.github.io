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
assert.ok(!html.includes('github.com/ematchorganization/WMS_Center'), 'Never expose private WMS source URL in portfolio');
assert.ok(!(JSON.stringify(resume).includes('github.com/ematchorganization/WMS_Center')), 'Private WMS URL must not appear in resume PDF source');
assert.ok(html.includes('class="project-private-note"'), 'Internal software case study should remain visible without a source link');

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
  assert.match(await desktop.locator('#hero-title').innerText(), /以數據驗證成果|Measure the outcome/);
  const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const internalLabel of ['HOW I CREATE VALUE', 'METHOD / 01—04', '沒有把研究模擬與正式導入混為一談', '職務名稱及期間依 2026 年']) {
    assert.ok(!htmlSource.includes(internalLabel), 'Internal-facing copy leaked into portfolio: ' + internalLabel);
  }
  assert.ok(htmlSource.includes('模擬可用能損耗降低'), 'Simulation result must retain context');
  assert.ok(htmlSource.includes('實際場域 PUE 降低'), 'Field test must retain context');
  assert.match(await desktop.locator('#contact').innerText(), /工程與 AI 經驗|engineering and AI work/i);
  assert.equal(await desktop.locator('.metric').count(), 4);
  assert.equal(await desktop.locator('.project-card').count(), 3);
  assert.equal(await desktop.locator('.project-card').nth(1).locator('a').count(), 0, 'Private project must not link to repository');
  const portrait = desktop.locator('.portrait-showcase .portrait-photo');
  assert.equal(await portrait.count(), 1, 'Prominent hero portrait required');
  assert.ok(await portrait.evaluate(img => img.complete && img.naturalWidth > 0), 'Portrait must load');
  const portraitRect = await portrait.boundingBox();
  assert.ok(portraitRect.width >= 260 && portraitRect.height >= 260, 'Portrait must be prominently displayed on desktop');

  assert.equal(await desktop.locator('.career-entry').count(), 3);
  assert.equal(await desktop.locator('h1').count(), 1, 'One semantic H1');
  const anchors = await desktop.locator('a[href^="#"]').evaluateAll(nodes =>
    nodes.map(a => a.getAttribute('href')).filter(Boolean));
  for (const anchor of anchors) {
    assert.ok(await desktop.locator('[id="' + anchor.slice(1) + '"]').count(), 'Missing anchor: ' + anchor);
  }
  await desktop.locator('[data-language="zh"]').click();
  await desktop.screenshot({ path: path.join(outDir, 'desktop-zh.png'), fullPage: true, animations: 'disabled' });
  await desktop.locator('[data-language="en"]').click();
  assert.equal(await desktop.locator('html').getAttribute('lang'), 'en');
  assert.equal(await desktop.locator('[data-language="en"]').getAttribute('aria-pressed'), 'true');
  assert.match(await desktop.locator('#hero-title').innerText(), /Measure the outcome/);
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
  assert.match(await mobile.locator('#hero-title').innerText(), /Measure the outcome/);
  // Test more than one iPhone width, languages, and the smallest 320px viewport.
  // Global overflow:hidden can hide a bug; inspect visible text/card bounds, not just scrollWidth.
  for (const width of [320, 360, 375, 390, 430, 768, 1024]) {
    await mobile.setViewportSize({ width, height: 844 });
    for (const language of ['zh', 'en']) {
      await mobile.locator('[data-language="' + language + '"]').click();
      const layout = await mobile.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const selectors = [
          '.brand','.header-actions','.hero-main','.hero h1','.hero-line',
          '.hero-lead','.hero-buttons','.portrait-showcase','.portrait-frame',
          '.portrait-caption','.metric','.metric-label','.section-heading',
          '.value-card','.value-card h3','.case-grid','.case-main',
          '.case-diagram','.diagram-block','.case-result','.case-method',
          '.project-card','.project-card h3','.career-entry','.career-details',
          '.contact-email','.contact-email strong','.footer-inner'
        ];
        const outliers = [];
        for (const selector of selectors) {
          for (const node of document.querySelectorAll(selector)) {
            const css = getComputedStyle(node);
            if (css.display === 'none' || css.visibility === 'hidden') continue;
            const rect = node.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.left < -2 || rect.right > vw + 2) {
              outliers.push(selector + ': left=' + rect.left.toFixed(1) + ', right=' + rect.right.toFixed(1));
            }
          }
        }
        const brand = document.querySelector('.brand')?.getBoundingClientRect();
        const actions = document.querySelector('.header-actions')?.getBoundingClientRect();
        return {
          width: vw,
          viewport: window.innerWidth,
          htmlWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          outliers,
          headerOverlap: brand && actions ? brand.right > actions.left + 1 : false
        };
      });
      assert.ok(layout.htmlWidth <= layout.width + 2, width + '/' + language + ': document overflows by ' + (layout.htmlWidth - layout.width));
      assert.deepEqual(layout.outliers, [], width + '/' + language + ': clipped page elements');
      assert.equal(layout.headerOverlap, false, width + '/' + language + ': navigation controls overlap');
    }
  }
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.locator('[data-language="en"]').click();
  await mobile.evaluate(() => scrollTo(0, 0));
  await mobile.screenshot({ path: path.join(outDir, 'mobile-en.png'), fullPage: true, animations: 'disabled' });
  await mobile.locator('[data-language="zh"]').click();
  await mobile.screenshot({ path: path.join(outDir, 'mobile-zh.png'), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log('Portfolio E2E OK: desktop/mobile, bilingual, navigation, assets, 104 facts, no horizontal overflow.');
} finally {
  await browser.close();
}
