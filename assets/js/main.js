// ===========================
// Language Switcher
// ===========================
const translations = {
  currentLang: 'en'
};

function switchLanguage() {
  const newLang = translations.currentLang === 'en' ? 'tr' : 'en';
  translations.currentLang = newLang;

  // Update all elements with data-en and data-tr attributes
  document.querySelectorAll('[data-en][data-tr]').forEach(el => {
    el.textContent = el.getAttribute(`data-${newLang}`);
  });

  // Update language toggle label
  const langLabel = document.getElementById('langLabel');
  langLabel.textContent = newLang === 'en' ? 'TR' : 'EN';

  // Update html lang attribute
  document.documentElement.lang = newLang;

  // Save preference
  localStorage.setItem('preferredLang', newLang);
}

// ===========================
// Navigation
// ===========================
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll handler for navbar background
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Update active nav link
    updateActiveLink();
  });

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
  });

  // Close menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
    });
  });
}

function updateActiveLink() {
  const sections = document.querySelectorAll('.section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollPos = window.scrollY + 150;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// ===========================
// Scroll Animations
// ===========================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add fade-in class to elements
  const animateElements = document.querySelectorAll(
    '.highlight-card, .timeline-item, .project-card, .opendata-card, .pillar, .contact-item, .about-text p, .mission-card, .milestone, .credential-item'
  );

  animateElements.forEach((el, index) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${index % 4 * 0.1}s`;
    observer.observe(el);
  });
}

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Language toggle
  const langToggle = document.getElementById('langToggle');
  langToggle.addEventListener('click', switchLanguage);

  // Restore saved language preference
  const savedLang = localStorage.getItem('preferredLang');
  if (savedLang && savedLang !== 'en') {
    switchLanguage();
  }

  // Initialize components
  initNavigation();
  initScrollAnimations();
});
