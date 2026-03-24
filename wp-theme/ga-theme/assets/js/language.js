/**
 * GA Theme - Language Toggle
 * Client-side EN/TR switching with localStorage persistence
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'ga-theme-lang';
  var langToggle = document.getElementById('langToggle');
  var langLabel = document.getElementById('langLabel');

  function setLanguage(lang) {
    var elements = document.querySelectorAll('[data-en][data-tr]');
    elements.forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text) {
        el.textContent = text;
      }
    });

    if (langLabel) {
      langLabel.textContent = lang === 'en' ? 'TR' : 'EN';
    }

    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'tr');

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // localStorage unavailable
    }
  }

  function getStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function toggleLanguage() {
    var current = getStoredLanguage();
    var next = current === 'en' ? 'tr' : 'en';
    setLanguage(next);
  }

  // Initialize
  var storedLang = getStoredLanguage();
  setLanguage(storedLang);

  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }
})();
