(() => {
    const $ = (sel) => document.querySelector(sel);

    function applyLang(lang) {
        document.documentElement.lang = lang === 'en' ? 'en' : 'zh-TW';
        localStorage.setItem('preferredLanguage', lang === 'en' ? 'en' : 'zh');
        $('#lang-zh')?.classList.toggle('active', lang !== 'en');
        $('#lang-en')?.classList.toggle('active', lang === 'en');

        // Toolbar button labels
        document.querySelectorAll('[data-zh][data-en]').forEach((el) => {
            el.textContent = el.getAttribute(lang === 'en' ? 'data-en' : 'data-zh');
        });

        document.title = lang === 'en'
            ? 'Yingliang Hsu (Joe) · One-Page Resume'
            : '許應良｜一頁式履歷 · Joe Hsu Resume';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const saved = localStorage.getItem('preferredLanguage') || 'zh';
        applyLang(saved === 'en' ? 'en' : 'zh');

        $('#lang-zh')?.addEventListener('click', () => applyLang('zh'));
        $('#lang-en')?.addEventListener('click', () => applyLang('en'));
    });
})();
