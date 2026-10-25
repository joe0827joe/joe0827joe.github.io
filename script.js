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

  // Lightweight, one-time entry animation. Content remains visible when JS,
  // IntersectionObserver or animation support is unavailable.
  // Respect reduced-motion at startup and when the setting changes.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionTargets = [
    ...document.querySelectorAll(
      '.section-heading, .case-main, .case-diagram, .project-card, ' +
      '.career-entry, .experience-aside, .contact-layout'
    )
  ];
  const canReveal = 'IntersectionObserver' in window && !motionPreference.matches;
  if (canReveal && motionTargets.length) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    for (const [index, target] of motionTargets.entries()) {
      target.classList.add('motion-reveal');
      const siblings = target.matches('.project-card, .career-entry')
        ? [...target.parentElement.children].filter(el => el.matches('.project-card, .career-entry'))
        : [];
      const stagger = siblings.length ? siblings.indexOf(target) % 3 : 0;
      target.style.setProperty('--reveal-delay', (stagger * 90) + 'ms');
      revealObserver.observe(target);
    }
    document.documentElement.classList.add('motion-enabled');

    const revealAll = () => {
      if (!motionPreference.matches) return;
      for (const target of motionTargets) {
        target.classList.add('is-visible');
        revealObserver.unobserve(target);
      }
      document.documentElement.classList.remove('motion-enabled');
    };
    if (typeof motionPreference.addEventListener === 'function') {
      motionPreference.addEventListener('change', revealAll);
    }
    // Initial navigation may open the page at an anchor rather than at the top.
    requestAnimationFrame(() => {
      for (const target of motionTargets) {
        const bounds = target.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          target.classList.add('is-visible');
          revealObserver.unobserve(target);
        }
      }
    });
  }

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  setLanguage(preferredLanguage());
  closeMobile();
})();
