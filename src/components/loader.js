// ============================================================
// Componente Loader (spinner de carga)
// ============================================================

import { onUIChange } from '../state/ui.js';

let loaderEl = null;

export function initLoader() {
  loaderEl = document.createElement('div');
  loaderEl.id = 'app-loader';
  loaderEl.setAttribute('role', 'status');
  loaderEl.setAttribute('aria-live', 'polite');
  loaderEl.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255,255,255,0.7); z-index: 9999; display: none;
    align-items: center; justify-content: center; flex-direction: column;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 50px; height: 50px; border: 5px solid #e0e0e0;
    border-top: 5px solid var(--primary-color, #1976d2);
    border-radius: 50%; animation: spin 1s linear infinite;
  `;
  loaderEl.appendChild(spinner);

  const text = document.createElement('p');
  text.textContent = 'Cargando...';
  text.style.cssText = 'margin-top: 10px; font-family: var(--font-family, sans-serif);';
  loaderEl.appendChild(text);

  document.body.appendChild(loaderEl);

  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  onUIChange(state => {
    loaderEl.style.display = state.isLoading ? 'flex' : 'none';
  });
}