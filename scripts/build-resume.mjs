/**
 * Build static resume.html from data/resume.json and export one-page PDFs.
 * Usage: npm run build:resume
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'resume.json');
const HTML_OUT = path.join(ROOT, 'resume.html');
const PDF_ZH = path.join(ROOT, 'Joe_Hsu_Resume_ZH.pdf');
const PDF_EN = path.join(ROOT, 'Joe_Hsu_Resume_EN.pdf');

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bi(obj) {
  if (obj == null) return { zh: '', en: '' };
  if (typeof obj === 'string') return { zh: obj, en: obj };
  return { zh: obj.zh ?? obj.en ?? '', en: obj.en ?? obj.zh ?? '' };
}

function span(obj) {
  const { zh, en } = bi(obj);
  return `<span class="i18n" data-lang="zh">${esc(zh)}</span><span class="i18n" data-lang="en">${esc(en)}</span>`;
}

function dateRange(start, end) {
  const endBi = typeof end === 'object' ? end : { zh: end, en: end };
  return `<span class="i18n" data-lang="zh">${esc(start)} – ${esc(bi(endBi).zh)}</span>` +
    `<span class="i18n" data-lang="en">${esc(start)} – ${esc(bi(endBi).en)}</span>`;
}

function bullets(list) {
  if (!list?.length) return '';
  return `<ul>${list.map((b) => `<li>${span(b)}</li>`).join('')}</ul>`;
}

function renderBody(data, { includePhone }) {
  const p = data.profile;
  const nameZh = `${esc(bi(p.name).zh)} · ${esc(p.englishName)}`;
  const nameEn = `${esc(p.englishName)} · ${esc(bi(p.name).en)}`;

  const linkPartsZh = [
    `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`,
    ...(includePhone ? [esc(p.phone)] : []),
    esc(bi(p.location).zh),
    `<a href="${esc(p.portfolio)}">Portfolio</a>`,
    `<a href="${esc(p.github)}">GitHub</a>`,
  ];
  const linkPartsEn = [
    `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`,
    ...(includePhone ? [esc(p.phone)] : []),
    esc(bi(p.location).en),
    `<a href="${esc(p.portfolio)}">Portfolio</a>`,
    `<a href="${esc(p.github)}">GitHub</a>`,
  ];

  const highlights = (data.highlights || [])
    .map((h) => `<span><strong>${esc(h.value)}</strong> ${span(h.label)}</span>`)
    .join('');

  const skills = (data.skills || [])
    .map(
      (s) =>
        `<div class="skill-row"><strong>${span(s.label)}</strong><span>${esc(s.items.join(' · '))}</span></div>`
    )
    .join('');

  const experience = (data.experience || [])
    .map(
      (exp) => `
      <article class="item">
        <div class="item-head">
          <h3>${span(exp.title)}</h3>
          <span class="item-meta">${dateRange(exp.start, exp.end)}</span>
        </div>
        <div class="item-sub">${span(exp.company)} · ${span(exp.location)}</div>
        ${bullets(exp.bullets)}
      </article>`
    )
    .join('');

  const projects = (data.projects || [])
    .map((proj) => {
      const link = proj.link
        ? ` · <a href="${esc(proj.link)}" target="_blank" rel="noopener"><span class="i18n" data-lang="zh">專案連結</span><span class="i18n" data-lang="en">Link</span></a>`
        : '';
      const badge = proj.featured
        ? `<span class="i18n" data-lang="zh">（主打）</span><span class="i18n" data-lang="en"> (Featured)</span>`
        : '';
      return `
      <article class="item">
        <div class="item-head"><h3>${span(proj.name)}${badge}</h3></div>
        <div class="stack">${esc((proj.stack || []).join(' · '))}${link}</div>
        ${bullets(proj.bullets)}
      </article>`;
    })
    .join('');

  const education = (data.education || [])
    .map(
      (ed) => `
      <article class="item">
        <div class="item-head">
          <h3>${span(ed.degree)}</h3>
          <span class="item-meta">${dateRange(ed.start, ed.end)}</span>
        </div>
        <div class="item-sub">${span(ed.school)}</div>
        ${ed.note ? `<ul><li>${span(ed.note)}</li></ul>` : ''}
      </article>`
    )
    .join('');

  return `
    <header class="resume-header">
      <h1><span class="i18n" data-lang="zh">${nameZh}</span><span class="i18n" data-lang="en">${nameEn}</span></h1>
      <p class="resume-title">${span(p.title)}</p>
      <p class="resume-links">
        <span class="i18n" data-lang="zh">${linkPartsZh.join(' · ')}</span>
        <span class="i18n" data-lang="en">${linkPartsEn.join(' · ')}</span>
      </p>
    </header>
    <section>
      <h2><span class="i18n" data-lang="zh">專業摘要</span><span class="i18n" data-lang="en">Professional Summary</span></h2>
      <p class="summary">${span(p.summary)}</p>
    </section>
    <section>
      <h2><span class="i18n" data-lang="zh">關鍵成果</span><span class="i18n" data-lang="en">Key Results</span></h2>
      <div class="highlights">${highlights}</div>
    </section>
    <section>
      <h2><span class="i18n" data-lang="zh">專業技能</span><span class="i18n" data-lang="en">Technical Skills</span></h2>
      <div class="skills-grid">${skills}</div>
    </section>
    <section>
      <h2><span class="i18n" data-lang="zh">工作經歷</span><span class="i18n" data-lang="en">Professional Experience</span></h2>
      ${experience}
    </section>
    <section>
      <h2><span class="i18n" data-lang="zh">精選專案</span><span class="i18n" data-lang="en">Selected Projects</span></h2>
      ${projects}
    </section>
    <section>
      <h2><span class="i18n" data-lang="zh">學歷</span><span class="i18n" data-lang="en">Education</span></h2>
      ${education}
    </section>`;
}

function writeResumeHtml(data) {
  const body = renderBody(data, { includePhone: false });
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>許應良｜一頁式履歷 · Joe Hsu Resume</title>
  <meta name="description" content="許應良 (Joe Hsu) ATS-friendly one-page resume — AI / Computer Vision / Automation Engineer.">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="https://joe0827joe.github.io/resume.html">
  <link rel="stylesheet" href="resume.css">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="toolbar no-print">
    <a class="toolbar-link" href="./">← Portfolio</a>
    <div class="toolbar-actions">
      <button type="button" class="btn" id="lang-zh" data-lang="zh">中文</button>
      <button type="button" class="btn" id="lang-en" data-lang="en">EN</button>
      <a class="btn btn-primary" id="btn-pdf-zh" href="Joe_Hsu_Resume_ZH.pdf" download data-zh="下載中文 PDF" data-en="Download ZH PDF">下載中文 PDF</a>
      <a class="btn" id="btn-pdf-en" href="Joe_Hsu_Resume_EN.pdf" download data-zh="Download EN PDF" data-en="Download EN PDF">Download EN PDF</a>
    </div>
  </div>

  <main class="resume" id="resume">
${body}
  </main>

  <script src="resume.js"></script>
</body>
</html>
`;
  fs.writeFileSync(HTML_OUT, html, 'utf8');
  console.log('Wrote', path.relative(ROOT, HTML_OUT));
}

function writePrintHtml(data, lang) {
  const body = renderBody(data, { includePhone: true });
  const htmlLang = lang === 'zh' ? 'zh-TW' : 'en';
  const file = path.join(ROOT, `.tmp-resume-${lang}.html`);
  const html = `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="resume.css">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    .toolbar, .no-print { display: none !important; }
    body { background: #fff !important; }
    .resume { margin: 0 !important; box-shadow: none !important; width: auto !important; padding: 0 !important; }
  </style>
</head>
<body class="pdf-export">
  <main class="resume">${body}</main>
</body>
</html>`;
  fs.writeFileSync(file, html, 'utf8');
  return file;
}

async function exportPdf(browser, lang, outPath, data) {
  const tmp = writePrintHtml(data, lang);
  const page = await browser.newPage();
  try {
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '10mm', right: '12mm', bottom: '10mm', left: '12mm' },
    });
  } finally {
    await page.close();
    fs.unlinkSync(tmp);
  }

  const pdf = await PDFDocument.load(fs.readFileSync(outPath));
  const pages = pdf.getPageCount();
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${pages} page)`);
  if (pages !== 1) {
    throw new Error(`${path.basename(outPath)} is ${pages} pages; expected exactly 1. Tighten resume.css or shorten content.`);
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  writeResumeHtml(data);

  const browser = await chromium.launch();
  try {
    await exportPdf(browser, 'zh', PDF_ZH, data);
    await exportPdf(browser, 'en', PDF_EN, data);
  } finally {
    await browser.close();
  }
  console.log('Resume build OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
