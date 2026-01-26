// Language switching functionality
let currentLanguage = 'zh';

// Language data
const languageData = {
    zh: {
        title: '許應良 - AI 工程師履歷',
        navTitle: 'AI 工程師',
        copyMessage: '已複製！',
        copyTooltip: '點擊複製',
        copyError: '複製失敗'
    },
    en: {
        title: 'YINGLIANG HSU - AI Engineer Resume',
        navTitle: 'AI Engineer',
        copyMessage: 'Copied!',
        copyTooltip: 'Click to copy',
        copyError: 'Copy failed'
    }
};

// Switch language function
function switchLanguage(lang) {
    currentLanguage = lang;

    // Update HTML lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';

    // Update page title
    document.title = languageData[lang].title;

    // Update all elements with data attributes
    const elements = document.querySelectorAll('[data-zh][data-en]');
    elements.forEach(element => {
        // Find if any child is text or if the element itself has text
        if (element.children.length === 0 || Array.from(element.childNodes).some(node => node.nodeType === 3)) {
            element.textContent = element.getAttribute(`data-${lang}`);
        }
    });

    // Update language buttons
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
        button.classList.remove('active');
        const buttonLang = button.getAttribute('onclick');
        if (buttonLang && buttonLang.includes(`'${lang}'`)) {
            button.classList.add('active');
        }
    });

    // Update contact item tooltips
    const contactItems = document.querySelectorAll('.contact-item p');
    contactItems.forEach(item => {
        item.title = languageData[lang].copyTooltip;
    });

    // Save language preference
    localStorage.setItem('preferredLanguage', lang);

}



// Auto-detect user language preference
function detectUserLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) return savedLanguage;

    const browserLanguage = navigator.language || navigator.userLanguage;
    return browserLanguage.startsWith('zh') ? 'zh' : 'en';
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {


    const userLanguage = detectUserLanguage();

    // Setup Mobile Nav
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth scroll for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return; // Skip top-of-page links if any

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        const headerHeight = document.querySelector('.header').offsetHeight;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });

        // Header blur transition
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.padding = '0.5rem 0';
            header.style.backgroundColor = 'var(--glass-bg)';
        } else {
            header.style.padding = '1rem 0';
            header.style.backgroundColor = 'transparent';
        }
    });

    // Intersection Observer for tactile reveal animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');

                // Trigger staggered children if it has the class
                if (entry.target.classList.contains('stagger-reveal')) {
                    entry.target.classList.add('active');
                }

                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, observerOptions);

    // Elements to observe
    const elementsToWatch = [
        'section',
        '.project-card',
        '.quadrant',
        '.timeline-item',
        '.education-card',
        '.project-features',
        '.radiation-path',
        '.project-actions'
    ];

    document.querySelectorAll(elementsToWatch.join(', ')).forEach(el => {
        observer.observe(el);
    });

    // Click to copy
    document.querySelectorAll('.contact-item p').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function () {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.textContent;
                this.textContent = languageData[currentLanguage].copyMessage;
                const originalColor = this.style.color;
                this.style.color = 'var(--primary)';

                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = originalColor;
                }, 2000);
            });
        });
    });

    // Initial language setup
    switchLanguage(userLanguage);
});

// PDF viewer
function openPDF(pdfUrl) {
    window.open(pdfUrl, '_blank');
}
