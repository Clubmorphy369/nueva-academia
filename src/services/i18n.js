// ============================================================
// Servicio de internacionalización (i18n)
// ============================================================

let currentLang = 'es';
const translations = {};
let listeners = [];

export async function loadLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    notifyListeners();
    return translations[lang];
  }
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) throw new Error('Idioma no encontrado');
    translations[lang] = await response.json();
    currentLang = lang;
    notifyListeners();
    return translations[lang];
  } catch (e) {
    console.warn(`No se pudo cargar el idioma ${lang}, usando español`);
    if (lang !== 'es') return loadLanguage('es');
    return {};
  }
}

export function t(key, fallback = '') {
  return translations[currentLang]?.[key] || fallback || key;
}

export function getCurrentLang() {
  return currentLang;
}

export function onLangChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  listeners.forEach(cb => cb(currentLang));
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });
}