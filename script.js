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
    
    // Navigation title is now handled by data attributes
    
    // Update all elements with data attributes
    const elements = document.querySelectorAll('[data-zh][data-en]');
    elements.forEach(element => {
        if (element.textContent) {
            element.textContent = element.getAttribute(`data-${lang}`);
        }
    });
    
    // Update language buttons
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(button => {
        button.classList.remove('active');
        // Check if this button corresponds to the current language
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
    
    console.log('Language switched to:', lang); // Debug log
    
    // Force a re-render to ensure all changes are applied
    setTimeout(() => {
        const elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(element => {
            if (element.textContent) {
                element.textContent = element.getAttribute(`data-${lang}`);
            }
        });
    }, 100);
}

// Auto-detect user language preference
function detectUserLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        return savedLanguage;
    }
    
    const browserLanguage = navigator.language || navigator.userLanguage;
    if (browserLanguage.startsWith('zh')) {
        return 'zh';
    } else {
        return 'en';
    }
}

// Initialize language on page load
function initializeLanguage() {
    const userLanguage = detectUserLanguage();
    switchLanguage(userLanguage);
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language
    initializeLanguage();
    
    // Add event listeners for language switching buttons
    const zhButton = document.querySelector('.lang-btn[onclick*="zh"]');
    const enButton = document.querySelector('.lang-btn[onclick*="en"]');
    
    if (zhButton) {
        zhButton.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage('zh');
        });
    }
    
    if (enButton) {
        enButton.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage('en');
        });
    }
    
    // Mobile navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
    // Add smooth scrolling to all navigation links
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20; // 額外增加 20px 間距
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add active class to navigation links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function updateActiveNavLink() {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const scrollPosition = window.scrollY + headerHeight + 50; // 調整檢測位置
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all nav links
                navLinks.forEach(link => link.classList.remove('active'));
                // Add active class to current nav link
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }
    
    // Listen for scroll events
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Add fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe all sections and cards
    const elementsToAnimate = document.querySelectorAll('section, .project-card, .skill-category, .timeline-item, .education-card, .contact-item');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
    
    // Add hover effects to skill tags
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        tag.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add click-to-copy functionality for contact information
    const contactItems = document.querySelectorAll('.contact-item p');
    contactItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.title = languageData[currentLanguage].copyTooltip;
        
        item.addEventListener('click', function() {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Show temporary feedback
                const originalText = this.textContent;
                this.textContent = languageData[currentLanguage].copyMessage;
                this.style.color = '#27ae60';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '#555';
                }, 2000);
            }).catch(err => {
                console.log(languageData[currentLanguage].copyError + ':', err);
            });
        });
    });
    
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
    
    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});

// PDF viewer function
function openPDF(pdfUrl) {
    // Option 1: Open in new tab
    window.open(pdfUrl, '_blank');
    
    // Option 2: Open in modal (uncomment to use)
    // showPDFModal(pdfUrl);
}

// PDF Modal function (optional)
function showPDFModal(pdfUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.cssText = `
        width: 90%;
        height: 90%;
        border: none;
        border-radius: 8px;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #fff;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        z-index: 10001;
    `;
    
    closeBtn.onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    };
    
    modal.appendChild(iframe);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
}

// Add CSS for active navigation link
const style = document.createElement('style');
style.textContent = `
    .nav-menu a.active {
        color: #3498db;
    }
    
    .nav-menu a.active::after {
        width: 100%;
    }
    
    .loaded {
        opacity: 1;
    }
    
    body {
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);
