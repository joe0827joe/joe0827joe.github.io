// Language switching functionality
let currentLanguage = 'zh';

const languageData = {
    zh: {
        title: '許應良 - 演算法工程師履歷',
        copyMessage: '已複製！',
        copyTooltip: '點擊複製',
        copyError: '複製失敗'
    },
    en: {
        title: 'YINGLIANG HSU - Algorithm Engineer Resume',
        copyMessage: 'Copied!',
        copyTooltip: 'Click to copy',
        copyError: 'Copy failed'
    }
};

function switchLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
    document.title = languageData[lang].title;

    const elements = document.querySelectorAll('[data-zh][data-en]');
    elements.forEach(element => {
        if (element.id === 'about-toggle') {
            updateAboutToggleLabel();
            return;
        }
        if (element.children.length === 0 || Array.from(element.childNodes).some(node => node.nodeType === 3)) {
            element.textContent = element.getAttribute(`data-${lang}`);
        }
    });

    document.querySelectorAll('.lang-btn').forEach(button => {
        button.classList.remove('active');
        const buttonLang = button.getAttribute('onclick');
        if (buttonLang && buttonLang.includes(`'${lang}'`)) {
            button.classList.add('active');
        }
    });

    document.querySelectorAll('.contact-item p').forEach(item => {
        item.title = languageData[lang].copyTooltip;
    });

    localStorage.setItem('preferredLanguage', lang);
}

function updateAboutToggleLabel() {
    const toggle = document.getElementById('about-toggle');
    const aboutText = document.getElementById('about-text');
    if (!toggle || !aboutText) return;

    const expanded = aboutText.classList.contains('is-expanded');
    if (expanded) {
        toggle.textContent = toggle.getAttribute(`data-${currentLanguage}-expanded`);
    } else {
        toggle.textContent = toggle.getAttribute(`data-${currentLanguage}`);
    }
}

function detectUserLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) return savedLanguage;

    const browserLanguage = navigator.language || navigator.userLanguage;
    return browserLanguage.startsWith('zh') ? 'zh' : 'en';
}

document.addEventListener('DOMContentLoaded', function () {
    // Only enable animation initial state after JS is confirmed running
    document.documentElement.classList.add('js');

    const userLanguage = detectUserLanguage();

    // Mobile nav
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    function closeNav() {
        if (!navToggle || !navMenu) return;
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const willOpen = !navMenu.classList.contains('active');
            navToggle.classList.toggle('active', willOpen);
            navMenu.classList.toggle('active', willOpen);
            navToggle.setAttribute('aria-expanded', String(willOpen));
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeNav);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeNav();
        });
    }

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            const headerHeight = document.querySelector('.header').offsetHeight;
            window.scrollTo({
                top: target.offsetTop - headerHeight,
                behavior: 'smooth'
            });
        });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        const headerHeight = document.querySelector('.header').offsetHeight;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 80;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (current && link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // Progressive reveal: only when .js is present and motion is allowed
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.reveal-item, .stagger-reveal').forEach(el => {
            observer.observe(el);
        });
    } else {
        document.querySelectorAll('.reveal-item, .stagger-reveal').forEach(el => {
            el.classList.add('is-visible');
        });
    }

    // About expand / collapse
    const aboutToggle = document.getElementById('about-toggle');
    const aboutText = document.getElementById('about-text');
    if (aboutToggle && aboutText) {
        aboutToggle.addEventListener('click', () => {
            aboutText.classList.toggle('is-expanded');
            updateAboutToggleLabel();
        });
    }

    // Click to copy contact text (skip anchors)
    document.querySelectorAll('.contact-item p').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function (e) {
            if (e.target.closest('a')) return;
            const text = this.textContent.trim();
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.innerHTML;
                this.textContent = languageData[currentLanguage].copyMessage;
                this.style.color = 'var(--primary)';
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.color = '';
                }, 2000);
            }).catch(() => {
                // no-op
            });
        });
    });

    switchLanguage(userLanguage);
    updateAboutToggleLabel();
});

function openPDF(pdfUrl) {
    window.open(pdfUrl, '_blank');
}
