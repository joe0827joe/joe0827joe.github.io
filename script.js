/* Portfolio interactions: language, navigation, progress. Content remains readable without JS. */
(() => {
  'use strict';
  const validLanguages = new Set(['zh', 'en']);
  const titles = {
    zh: '許應良 Joe Hsu｜AI / Machine Learning Engineer',
    en: 'Joe Hsu | AI / Machine Learning Engineer'
  };
  const langButtons = Array.from(document.querySelectorAll('[data-language]'));
  const translatable = Array.from(document.querySelectorAll('[data-zh][data-en]'));
  const menuButton = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const downloadLink = document.getElementById('resume-download');
  let language = 'zh';

  function preferredLanguage() {
    try {
      const stored = localStorage.getItem('joe-portfolio-language');
      if (validLanguages.has(stored)) return stored;
    } catch (_) { /* local storage unavailable */ }
    return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function setLanguage(next) {
    if (!validLanguages.has(next)) return;
    language = next;
    document.documentElement.lang = next === 'zh' ? 'zh-TW' : 'en';
    document.title = titles[next];
    for (const element of translatable) {
      const copy = element.getAttribute('data-' + next);
      if (copy !== null) element.textContent = copy;
    }
    for (const button of langButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.language === next));
    }
    if (downloadLink) {
      downloadLink.href = next === 'zh' ? 'Joe_Hsu_Resume_ZH.pdf' : 'Joe_Hsu_Resume_EN.pdf';
    }
    try { localStorage.setItem('joe-portfolio-language', next); } catch (_) { /* ignore */ }
  }

  for (const button of langButtons) {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  }

  function closeMobile() {
    if (!menuButton || !mobileMenu) return;
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', language === 'zh' ? '開啟導覽選單' : 'Open navigation');
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const opening = mobileMenu.hidden;
      mobileMenu.hidden = !opening;
      menuButton.setAttribute('aria-expanded', String(opening));
      menuButton.setAttribute('aria-label', opening
        ? (language === 'zh' ? '關閉導覽選單' : 'Close navigation')
        : (language === 'zh' ? '開啟導覽選單' : 'Open navigation'));
    });

    for (const link of mobileMenu.querySelectorAll('a')) {
      link.addEventListener('click', closeMobile);
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !mobileMenu.hidden) {
        closeMobile();
        menuButton.focus();
      }
    });

    document.addEventListener('click', event => {
      if (mobileMenu.hidden || mobileMenu.contains(event.target) || menuButton.contains(event.target)) return;
      closeMobile();
    });

    const breakpoint = window.matchMedia('(min-width: 921px)');
    if (typeof breakpoint.addEventListener === 'function') {
      breakpoint.addEventListener('change', e => { if (e.matches) closeMobile(); });
    }
  }

  // The header is sticky: native #top navigation to the header may report it
  // already visible instead of scrolling the document to position 0.
  // Keep a real body#top fallback for browsers with JavaScript disabled.
  for (const link of document.querySelectorAll('a[href="#top"]')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      closeMobile();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    });
  }

  const progress = document.getElementById('reading-progress');
  let ticking = false;
  function updateProgress() {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0;
    progress.style.width = percent.toFixed(2) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  const anchors = Array.from(document.querySelectorAll('.desktop-nav a[href^="#"]'));
  const sections = anchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (typeof IntersectionObserver === 'function' && sections.length) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of anchors) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-25% 0px -60% 0px' });
    for (const section of sections) observer.observe(section);
  }

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  setLanguage(preferredLanguage());
  closeMobile();
})();
