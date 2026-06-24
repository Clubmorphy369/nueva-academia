// ============================================================
// Servicio de temas - Variables CSS y persistencia
// ============================================================

import { db } from '../config/firebase.js';
import DEFAULTS from '../config/defaultSettings.js';
import { showToast } from '../state/ui.js';

const CSS_VARS = {
  primaryColor: '--primary-color',
  secondaryColor: '--secondary-color',
  backgroundColor: '--bg-color',
  surfaceColor: '--surface-color',
  textColor: '--text-color',
  textSecondary: '--text-secondary',
  borderColor: '--border-color',
  borderRadius: '--border-radius',
  shadow: '--shadow',
  fontFamily: '--font-family',
  baseFontSize: '--base-font-size',
};

const DARK_MODE_OVERRIDES = {
  backgroundColor: '#121212',
  surfaceColor: '#1e1e2d',
  textColor: '#e0e0e0',
  textSecondary: '#aaaaaa',
  borderColor: '#333333',
  shadow: '0 2px 8px rgba(0,0,0,0.3)',
};

let currentTheme = { ...DEFAULTS.THEME };

export function applyTheme(theme) {
  currentTheme = { ...currentTheme, ...theme };
  const root = document.documentElement;

  Object.entries(CSS_VARS).forEach(([key, varName]) => {
    root.style.setProperty(varName, currentTheme[key]);
  });

  document.body.style.fontFamily = currentTheme.fontFamily;
  document.body.style.fontSize = currentTheme.baseFontSize;
  document.body.style.backgroundColor = currentTheme.backgroundColor;
  document.body.style.color = currentTheme.textColor;

  if (currentTheme.mode === 'dark') {
    Object.entries(DARK_MODE_OVERRIDES).forEach(([key, value]) => {
      root.style.setProperty(CSS_VARS[key], value);
    });
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', currentTheme.mode === 'dark' ? '#121212' : currentTheme.primaryColor);
  }
}

export async function loadTheme() {
  try {
    const doc = await db.collection('settings').doc('theme').get();
    if (doc.exists) {
      applyTheme(doc.data());
    } else {
      applyTheme(DEFAULTS.THEME);
    }
  } catch (e) {
    console.warn('No se pudo cargar el tema, usando por defecto');
    applyTheme(DEFAULTS.THEME);
  }
}

export async function saveTheme(themeUpdates) {
  try {
    const newTheme = { ...currentTheme, ...themeUpdates };
    await db.collection('settings').doc('theme').set(newTheme, { merge: true });
    applyTheme(newTheme);
    showToast('Tema actualizado', 'success');
    return true;
  } catch (error) {
    showToast('Error al guardar tema: ' + error.message, 'error');
    return false;
  }
}

export async function toggleDarkMode() {
  const newMode = currentTheme.mode === 'dark' ? 'light' : 'dark';
  await saveTheme({ mode: newMode });
}

export function getCurrentTheme() {
  return { ...currentTheme };
}

export async function updateLogo(url) {
  await saveTheme({ logoURL: url });
}