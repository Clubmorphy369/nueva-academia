// ============================================================
// Componente Toast para notificaciones emergentes
// ============================================================

import { onUIChange, clearToast } from '../state/ui.js';

let toastContainer = null;
let timeoutId = null;

export function initToast() {
  if (toastContainer) return;
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  `;
  document.body.appendChild(toastContainer);

  onUIChange(state => {
    if (state.toast) {
      renderToast(state.toast);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => clearToast(), state.toast.duration || 3000);
    } else {
      clearToasts();
    }
  });
}

function renderToast(toast) {
  clearToasts();
  const toastEl = document.createElement('div');
  toastEl.className = `toast toast-${toast.type}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.style.cssText = `
    background: ${getToastColor(toast.type)}; color: white;
    padding: 12px 20px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: 'Segoe UI', sans-serif; font-size: 14px;
    min-width: 200px; max-width: 90vw; word-break: break-word;
    pointer-events: auto; display: flex; align-items: center;
    justify-content: space-between;
    animation: slideInRight 0.3s ease-out;
  `;
  const msgSpan = document.createElement('span');
  msgSpan.textContent = toast.message;
  toastEl.appendChild(msgSpan);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Cerrar notificación');
  closeBtn.style.cssText = `
    background: none; border: none; color: white; font-size: 18px;
    margin-left: 10px; cursor: pointer; padding: 0; line-height: 1;
  `;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearToast();
  });
  toastEl.appendChild(closeBtn);
  toastContainer.appendChild(toastEl);
}

function clearToasts() {
  if (toastContainer) toastContainer.innerHTML = '';
}

function getToastColor(type) {
  switch (type) {
    case 'success': return '#2e7d32';
    case 'error': return '#c62828';
    case 'warning': return '#f57c00';
    default: return '#1976d2';
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);