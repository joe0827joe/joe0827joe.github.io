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

  // OS accessibility preferences control *automatic* animation by default.
  // Visitors can explicitly opt in on desktop without changing Windows/Edge.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionStorageKey = 'joe-portfolio-motion';
  let motionOverride = null; // null = OS default, 'on'/'off' = deliberate choice
  try {
    const saved = localStorage.getItem(motionStorageKey);
    if (saved === 'on' || saved === 'off') motionOverride = saved;
  } catch (_) { /* storage is optional */ }
  const motionIsEnabled = () =>
    motionOverride === 'on' || (motionOverride !== 'off' && !motionPreference.matches);

  const motionTargets = [...document.querySelectorAll(
    '.section-heading, .case-main, .case-diagram, .project-card, ' +
    '.career-entry, .experience-aside, .contact-layout'
  )];
  const revealObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' })
    : null;

  for (const target of motionTargets) {
    target.classList.add('motion-reveal');
    const siblings = target.matches('.project-card, .career-entry')
      ? [...target.parentElement.children].filter(el => el.matches('.project-card, .career-entry'))
      : [];
    const stagger = siblings.length ? siblings.indexOf(target) % 3 : 0;
    target.style.setProperty('--reveal-delay', (stagger * 90) + 'ms');
  }

  function syncMotionStyles() {
    const enabled = motionIsEnabled();
    const root = document.documentElement;
    root.classList.toggle('motion-opt-in', motionOverride === 'on');
    root.classList.toggle('motion-forced-off', !enabled);
    root.classList.toggle('motion-enabled', enabled && !!revealObserver);

    for (const target of motionTargets) {
      if (!enabled || !revealObserver) {
        target.classList.add('is-visible');
        if (revealObserver) revealObserver.unobserve(target);
        continue;
      }
      const bounds = target.getBoundingClientRect();
      if (bounds.top < window.innerHeight * .92 || bounds.bottom <= 0) {
        target.classList.add('is-visible');
        revealObserver.unobserve(target);
      } else {
        target.classList.remove('is-visible');
        revealObserver.observe(target);
      }
    }
  }

  const replayButton = document.getElementById('motion-replay');
  const motionToggle = document.getElementById('motion-toggle');
  const motionNote = document.getElementById('motion-preference-note');
  const hero = document.querySelector('.hero');
  const replayTargets = [...document.querySelectorAll(
    '.hero .eyebrow, .hero h1, .hero-lead, .hero-identity, ' +
    '.hero-buttons, .portrait-showcase'
  )];
  const replayLabel = replayButton?.querySelector('[data-zh][data-en]');
  const toggleLabel = motionToggle?.querySelector('[data-zh][data-en]');

  function syncMotionControls() {
    const enabled = motionIsEnabled();
    if (replayButton) {
      replayButton.hidden = false;
      if (replayLabel) {
        replayLabel.dataset.zh = enabled ? '重播動態' : '播放動態';
        replayLabel.dataset.en = enabled ? 'Replay animation' : 'Play animation';
        replayLabel.textContent = replayLabel.dataset[language];
      }
      replayButton.setAttribute('aria-label', language === 'zh'
        ? (enabled ? '重播首頁進場動畫' : '手動播放一次動畫')
        : (enabled ? 'Replay entrance animation' : 'Play entrance animation once'));
    }
    if (motionToggle) {
      motionToggle.hidden = false;
      motionToggle.setAttribute('aria-pressed', String(enabled));
      if (toggleLabel) {
        toggleLabel.dataset.zh = enabled ? '關閉動態' : '開啟動態';
        toggleLabel.dataset.en = enabled ? 'Disable motion' : 'Enable motion';
        toggleLabel.textContent = toggleLabel.dataset[language];
      }
    }
    if (motionNote) {
      const systemReduced = motionPreference.matches;
      motionNote.hidden = !(systemReduced && motionOverride === null);
      motionNote.dataset.zh = '電腦目前設定為減少動態，可按「開啟動態」啟用';
      motionNote.dataset.en = 'Your system prefers reduced motion. Choose “Enable motion” to opt in.';
      motionNote.textContent = motionNote.dataset[language];
    }
  }

  const refreshMotion = () => {
    syncMotionStyles();
    syncMotionControls();
  };

  function replayHero() {
    if (!hero || !replayTargets.length || typeof Element.prototype.animate !== 'function') return;
    hero.classList.add('manual-replay');
    for (const el of replayTargets) {
      for (const animation of el.getAnimations()) animation.cancel();
    }
    for (const [i, el] of replayTargets.entries()) {
      const animation = el.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 32px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ],
        {
          duration: 1000,
          delay: i * 125,
          easing: 'cubic-bezier(.22, 1, .36, 1)',
          fill: 'both'
        }
      );
      animation.finished.then(() => animation.cancel()).catch(() => {});
    }
  }

  if (replayButton) replayButton.addEventListener('click', replayHero);
  if (motionToggle) motionToggle.addEventListener('click', () => {
    motionOverride = motionIsEnabled() ? 'off' : 'on';
    try { localStorage.setItem(motionStorageKey, motionOverride); } catch (_) {}
    // CSS entrance animation may have been suppressed on first load; play once
    // when the visitor explicitly enables it.
    refreshMotion();
    if (motionOverride === 'on') replayHero();
    else if (hero) {
      hero.classList.remove('manual-replay');
      for (const el of replayTargets) for (const a of el.getAnimations()) a.cancel();
    }
  });
  if (typeof motionPreference.addEventListener === 'function') {
    motionPreference.addEventListener('change', refreshMotion);
  }
  for (const btn of langButtons) btn.addEventListener('click', syncMotionControls);
  refreshMotion();

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  setLanguage(preferredLanguage());
  closeMobile();
})();
