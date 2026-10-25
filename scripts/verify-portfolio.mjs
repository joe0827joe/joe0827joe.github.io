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
assert.ok(html.includes('<body id="top">') && !html.includes('<header class="site-header" id="top">'), 'Return-to-top target must not be the sticky header');
assert.ok(html.includes('styles.css?v=20261025-motion-v4') &&
  html.includes('script.js?v=20261025-motion-v4'), 'New styles and scripts must bypass previously cached asset URLs');
assert.ok(html.includes('id="motion-replay"') && html.includes('class="scroll-cue"'),
  'A discoverable visual cue and motion replay control are required');
assert.ok(!html.includes('id="motion-replay" class="motion-replay" hidden'),
  'Replay must not be hidden by default in HTML');
assert.ok(html.includes('id="motion-preference-note"'),
  'Reduced motion preference must be explained on page');


const portraitAsset = path.join(root, 'assets/joe-hsu-profile.webp');
assert.ok(fs.statSync(portraitAsset).size >= 65000, 'Portrait was overcompressed: expected at least 65 KB');
assert.equal((html.match(/class="career-entry"/g) || []).length, 3);
assert.ok(!html.includes('id="impact"') && !html.includes('id="approach"'), 'Duplicate page sections removed');
for (const token of ['−9.2%', '−7%']) {
  assert.equal(html.split(token).length - 1, 1, token + ' must appear once on the homepage');
}
for (const token of ['9.2%', '7%', '15%', '10%']) {
  assert.equal((JSON.stringify(resume).match(new RegExp('"' + token.replace('.', '\\.') + '"', 'g')) || []).length, 1, token + ' belongs only in résumé highlights');
}
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
  // Motion should feel subtle on normal devices, without hiding page content.
  await desktop.waitForFunction(() => document.documentElement.classList.contains('motion-enabled'));
  assert.match(
    await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).animationName),
    /hero-arrive/,
    'Hero has a real CSS entrance animation'
  );
  assert.equal(await desktop.locator('.project-card.motion-reveal').count(), 3);
  assert.equal(await desktop.locator('.scroll-cue').count(), 1);
  assert.ok(await desktop.locator('#motion-replay').isVisible(), 'Replay must be discoverable without scrolling');
  assert.equal(
    await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'arrow-travel', 'There must be a repeating motion hint visible after the entrance is over');
  const cueBefore = await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).transform);
  await desktop.waitForTimeout(250);
  const cueAfter = await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(cueBefore, cueAfter, 'Scroll cue should visibly move over time');
  await desktop.locator('#motion-replay').click();
  const titleStart = await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).transform);
  await desktop.waitForTimeout(280);
  const titleLater = await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(titleStart, titleLater, 'Replay must restart a measurable hero entrance');

  const diagramFlow = await desktop.locator('.diagram-connector').first().evaluate(el =>
    getComputedStyle(el, '::before').animationName
  );
  assert.equal(diagramFlow, 'data-travel', 'Research diagram must show moving signal flow');
  await desktop.locator('.project-card').first().scrollIntoViewIfNeeded();
  await desktop.waitForFunction(() => document.querySelector('.project-card')?.classList.contains('is-visible'));
  await desktop.waitForFunction(() => Number(getComputedStyle(document.querySelector('.project-card')).opacity) >= 0.98);
  assert.ok(await desktop.locator('.project-card').first().isVisible(), 'Revealed project remains readable');

  const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const internalLabel of ['HOW I CREATE VALUE', 'METHOD / 01—04', '沒有把研究模擬與正式導入混為一談', '職務名稱及期間依 2026 年']) {
    assert.ok(!htmlSource.includes(internalLabel), 'Internal-facing copy leaked into portfolio: ' + internalLabel);
  }
  assert.ok(htmlSource.includes('SIMULATION') && htmlSource.includes('−9.2%'), 'Research shows the simulated outcome');
  assert.ok(htmlSource.includes('FIELD VALIDATION') && htmlSource.includes('−7%'), 'Research shows the field-verified outcome');
  assert.match(await desktop.locator('#contact').innerText(), /工程與 AI 經驗|engineering and AI work/i);
  assert.equal(await desktop.locator('.case-result').count(), 2, 'Research contains the two validated outcome figures');
  assert.equal(await desktop.locator('#impact').count(), 0, 'Remove duplicated metric section');
  assert.equal(await desktop.locator('#approach').count(), 0, 'Remove repeated capability cards');
  assert.equal(await desktop.locator('.project-card').count(), 3);
  assert.equal(await desktop.locator('.portrait-caption').count(), 0, 'No repeated portrait identity labels');
  assert.equal(await desktop.locator('.hero-mini').count(), 0, 'No second skills list in the hero');
  assert.equal(await desktop.locator('.case-method').count(), 0, 'Diagram is the single model pipeline illustration');
  assert.equal(await desktop.locator('.project-card').nth(1).locator('a').count(), 0, 'Private project must not link to repository');
  const portrait = desktop.locator('.portrait-showcase .portrait-photo');
  assert.equal(await portrait.count(), 1, 'Prominent hero portrait required');
  assert.ok(await portrait.evaluate(img => img.complete && img.naturalWidth >= 1100 && img.naturalHeight >= 1300), 'High-resolution original portrait must load');
  const portraitRect = await portrait.boundingBox();
  assert.ok(portraitRect.width >= 260 && portraitRect.height >= 260, 'Portrait must be prominently displayed on desktop');

  assert.equal(await desktop.locator('.career-entry').count(), 3);
  assert.equal(await desktop.locator('h1').count(), 1, 'One semantic H1');
  await desktop.emulateMedia({ reducedMotion: 'reduce' });
  // Accessible reduced motion must immediately remove animation and never
  // leave lower-page elements translucent or offset offscreen.
  assert.equal(
    await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).animationName),
    'none', 'No hero animation when reduced-motion is requested'
  );
  assert.equal(await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'none', 'Repeating scroll cue must respect reduced-motion');
  assert.equal(await desktop.locator('.diagram-connector').first().evaluate(el => getComputedStyle(el, '::before').display),
    'none', 'Research signal animation must respect reduced-motion');

  assert.ok(await desktop.locator('#motion-toggle').isVisible(),
    'A PC with reduced motion must offer an opt-in control');
  assert.equal(await desktop.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
  assert.match(await desktop.locator('#motion-toggle').innerText(), /開啟動態|Enable motion/);
  assert.equal(
    await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'none', 'OS reduced-motion preference must disable ambient loops by default');

  assert.ok(await desktop.locator('#motion-replay').isVisible(),
    'Motion replay must remain visible when OS prefers reduced motion');
  assert.match(await desktop.locator('#motion-replay').innerText(), /播放動態|Play animation/,
    'Replay should switch to manual-play label with reduced motion');
  assert.ok(await desktop.locator('#motion-preference-note').isVisible(),
    'Explain why automatic animation is disabled');
  await desktop.locator('#motion-replay').click();
  const manualActive = await desktop.locator('.hero h1').evaluate(el =>
    el.getAnimations().some(a => a.playState === 'running')
  );
  assert.ok(manualActive, 'Manual Web Animations API playback must run even with reduced motion');
  const reducedManualBefore = await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).transform);
  await desktop.waitForTimeout(260);
  const reducedManualAfter = await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(reducedManualBefore, reducedManualAfter,
    'Explicitly requested motion must visibly change the hero over time');
  await desktop.waitForTimeout(950);
  assert.equal(await desktop.locator('.hero h1').evaluate(el => getComputedStyle(el).opacity), '1');

  // Desktop opt-in: emulate Windows/Edge reduced motion, not just mobile defaults.
  await desktop.locator('#motion-toggle').click();
  assert.equal(await desktop.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.ok(await desktop.locator('html').evaluate(el => el.classList.contains('motion-opt-in')));
  assert.equal(
    await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'opted-arrow-travel', 'Explicit opt-in should restore continuous desktop effects');
  const optedBefore = await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).transform);
  await desktop.waitForTimeout(270);
  const optedAfter = await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(optedBefore, optedAfter, 'Desktop opt-in must produce observable animation');
  await desktop.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await desktop.locator('#motion-toggle').getAttribute('aria-pressed'), 'true',
    'User motion opt-in must survive a page reload');
  assert.equal(await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'opted-arrow-travel', 'Reloaded desktop must retain motion');
  await desktop.locator('#motion-toggle').click();
  assert.equal(await desktop.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
  assert.equal(await desktop.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'none', 'User must be able to turn motion off again');



  const reducedRevealStyles = await desktop.locator('.motion-reveal').evaluateAll(nodes =>
    nodes.map(el => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))
  );
  assert.ok(reducedRevealStyles.every(s => s.opacity === '1' && s.transform === 'none'),
    'Reduced-motion content should be fully visible and stationary');

  await desktop.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await desktop.waitForFunction(() => window.scrollY > 500);
  await desktop.locator('.site-footer .back-to-top').click();
  await desktop.waitForFunction(() => window.scrollY <= 2);
  assert.ok(await desktop.evaluate(() => window.scrollY <= 2), 'Footer return-to-top must scroll to document origin');
  await desktop.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
  await desktop.locator('.brand').click();
  await desktop.waitForFunction(() => window.scrollY <= 2);
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

  const noJavaScript = await browser.newPage({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
  await noJavaScript.goto(pageURL, { waitUntil: 'load' });
  assert.equal(await noJavaScript.locator('.project-card').first().evaluate(el => getComputedStyle(el).opacity),
    '1', 'Content stays visible without JavaScript');
  assert.equal(await noJavaScript.locator('#motion-replay').isVisible(), false,
    'Replay control must not be inert when scripting is disabled');
  assert.equal(await noJavaScript.locator('#motion-toggle').isVisible(), false,
    'Motion opt-in must not be a dead button without JavaScript');
  await noJavaScript.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  mobile.on('pageerror', err => errors.push('mobile: ' + err.message));
  await mobile.goto(pageURL, { waitUntil: 'domcontentloaded' });
  assert.ok(await mobile.locator('#motion-toggle').isVisible(), 'Mobile retains motion controls');
  assert.equal(await mobile.locator('.scroll-cue-arrow').evaluate(el => getComputedStyle(el).animationName),
    'arrow-travel', 'Mobile motion remains enabled under its normal setting');

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
  await mobile.emulateMedia({ reducedMotion: 'reduce' });
  await mobile.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await mobile.waitForFunction(() => window.scrollY > 500);
  await mobile.locator('.site-footer .back-to-top').click();
  await mobile.waitForFunction(() => window.scrollY <= 2);
  assert.ok(await mobile.evaluate(() => window.scrollY <= 2), 'Mobile return-to-top must reach zero');
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log('Portfolio E2E OK: desktop/mobile, bilingual, navigation, assets, 104 facts, no horizontal overflow.');
} finally {
  await browser.close();
}
