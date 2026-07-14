(() => {
    const DATA_URL = 'data/resume.json';
    let data = null;
    let lang = localStorage.getItem('preferredLanguage') || 'zh';

    const $ = (sel, root = document) => root.querySelector(sel);

    function t(obj) {
        if (obj == null) return '';
        if (typeof obj === 'string') return obj;
        return obj[lang] || obj.zh || obj.en || '';
    }

    function dateRange(start, end) {
        const endStr = typeof end === 'object' ? t(end) : end;
        return `${start} – ${endStr}`;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function bullets(list) {
        if (!list || !list.length) return '';
        return `<ul>${list.map(b => `<li>${escapeHtml(t(b))}</li>`).join('')}</ul>`;
    }

    function render(d) {
        const p = d.profile;
        const nameLine = lang === 'zh'
            ? `${escapeHtml(t(p.name))} · ${escapeHtml(p.englishName)}`
            : `${escapeHtml(p.englishName)} · ${escapeHtml(t(p.name))}`;

        const links = [
            `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>`,
            escapeHtml(p.phone),
            escapeHtml(t(p.location)),
            `<a href="${escapeHtml(p.portfolio)}">${lang === 'zh' ? 'Portfolio' : 'Portfolio'}</a>`,
            `<a href="${escapeHtml(p.github)}">GitHub</a>`
        ].join(' · ');

        const highlights = (d.highlights || []).map(h =>
            `<span><strong>${escapeHtml(h.value)}</strong> ${escapeHtml(t(h.label))}</span>`
        ).join('');

        const skills = (d.skills || []).map(s =>
            `<div class="skill-row"><strong>${escapeHtml(t(s.label))}</strong><span>${escapeHtml(s.items.join(' · '))}</span></div>`
        ).join('');

        const experience = (d.experience || []).map(exp => `
            <article class="item">
                <div class="item-head">
                    <h3>${escapeHtml(t(exp.title))}</h3>
                    <span class="item-meta">${escapeHtml(dateRange(exp.start, exp.end))}</span>
                </div>
                <div class="item-sub">${escapeHtml(t(exp.company))} · ${escapeHtml(t(exp.location))}</div>
                ${bullets(exp.bullets)}
            </article>
        `).join('');

        const projects = (d.projects || []).map(proj => {
            const link = proj.link
                ? ` · <a href="${escapeHtml(proj.link)}" target="_blank" rel="noopener">${lang === 'zh' ? '專案連結' : 'Link'}</a>`
                : '';
            const badge = proj.featured
                ? (lang === 'zh' ? '（主打）' : ' (Featured)')
                : '';
            return `
            <article class="item">
                <div class="item-head">
                    <h3>${escapeHtml(t(proj.name))}${badge}</h3>
                </div>
                <div class="stack">${escapeHtml((proj.stack || []).join(' · '))}${link}</div>
                ${bullets(proj.bullets)}
            </article>`;
        }).join('');

        const education = (d.education || []).map(ed => `
            <article class="item">
                <div class="item-head">
                    <h3>${escapeHtml(t(ed.degree))}</h3>
                    <span class="item-meta">${escapeHtml(dateRange(ed.start, ed.end))}</span>
                </div>
                <div class="item-sub">${escapeHtml(t(ed.school))}</div>
                ${ed.note ? `<ul><li>${escapeHtml(t(ed.note))}</li></ul>` : ''}
            </article>
        `).join('');

        const labels = lang === 'zh'
            ? {
                summary: '專業摘要',
                highlights: '關鍵成果',
                skills: '專業技能',
                experience: '工作經歷',
                projects: '精選專案',
                education: '學歷'
            }
            : {
                summary: 'Professional Summary',
                highlights: 'Key Results',
                skills: 'Technical Skills',
                experience: 'Professional Experience',
                projects: 'Selected Projects',
                education: 'Education'
            };

        $('#resume').innerHTML = `
            <header class="resume-header">
                <h1>${nameLine}</h1>
                <p class="resume-title">${escapeHtml(t(p.title))}</p>
                <p class="resume-links">${links}</p>
            </header>
            <section>
                <h2>${labels.summary}</h2>
                <p class="summary">${escapeHtml(t(p.summary))}</p>
            </section>
            <section>
                <h2>${labels.highlights}</h2>
                <div class="highlights">${highlights}</div>
            </section>
            <section>
                <h2>${labels.skills}</h2>
                <div class="skills-grid">${skills}</div>
            </section>
            <section>
                <h2>${labels.experience}</h2>
                ${experience}
            </section>
            <section>
                <h2>${labels.projects}</h2>
                ${projects}
            </section>
            <section>
                <h2>${labels.education}</h2>
                ${education}
            </section>
        `;

        document.title = lang === 'zh'
            ? '許應良｜一頁式履歷 · Joe Hsu Resume'
            : 'Yingliang Hsu (Joe) · One-Page Resume';
        document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';

        document.querySelectorAll('[data-zh][data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });

        $('#lang-zh')?.classList.toggle('active', lang === 'zh');
        $('#lang-en')?.classList.toggle('active', lang === 'en');
    }

    function setLang(next) {
        lang = next;
        localStorage.setItem('preferredLanguage', lang);
        if (data) render(data);
    }

    async function init() {
        try {
            const res = await fetch(DATA_URL, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            render(data);
        } catch (err) {
            $('#resume').innerHTML = `
                <p class="loading">無法載入履歷資料（${escapeHtml(err.message)}）。
                請確認 <code>data/resume.json</code> 可存取，或以本機伺服器開啟網站。</p>`;
            console.error(err);
        }

        $('#lang-zh')?.addEventListener('click', () => setLang('zh'));
        $('#lang-en')?.addEventListener('click', () => setLang('en'));
        $('#btn-print')?.addEventListener('click', () => window.print());

        // Deep link: resume.html?print=1 opens print dialog after render
        const params = new URLSearchParams(location.search);
        if (params.get('print') === '1') {
            setTimeout(() => window.print(), 400);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
