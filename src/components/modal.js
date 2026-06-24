// ============================================================
// Componente Modal reutilizable
// ============================================================

import { onUIChange, clearModal } from '../state/ui.js';

let modalEl = null;

export function initModal() {
  if (modalEl) return;
  modalEl = document.createElement('div');
  modalEl.id = 'modal-overlay';
  modalEl.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 5000; display: none;
    align-items: center; justify-content: center;
  `;
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) clearModal();
  });

  const modalBox = document.createElement('div');
  modalBox.id = 'modal-box';
  modalBox.setAttribute('role', 'dialog');
  modalBox.setAttribute('aria-modal', 'true');
  modalBox.style.cssText = `
    background: var(--surface-color, #fff); border-radius: 12px; padding: 20px;
    max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  modalEl.appendChild(modalBox);
  document.body.appendChild(modalEl);

  onUIChange(state => {
    if (state.modal) {
      renderModalContent(state.modal);
      modalEl.style.display = 'flex';
    } else {
      modalEl.style.display = 'none';
    }
  });
}

function renderModalContent(modalData) {
  const box = document.getElementById('modal-box');
  box.innerHTML = '';

  const titleEl = document.createElement('h2');
  titleEl.style.cssText = 'margin: 0 0 15px; font-size: 20px;';
  titleEl.textContent = modalData.title;
  box.appendChild(titleEl);

  const contentEl = document.createElement('div');
  if (typeof modalData.content === 'string') {
    contentEl.innerHTML = modalData.content;
  } else if (modalData.content instanceof HTMLElement) {
    contentEl.appendChild(modalData.content);
  }
  box.appendChild(contentEl);

  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

  if (modalData.onCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = `
      padding: 10px 20px; border: 1px solid var(--border-color, #ccc);
      background: var(--surface-color, #fff); border-radius: 8px;
      cursor: pointer; min-height: 44px;
    `;
    cancelBtn.addEventListener('click', () => {
      modalData.onCancel();
      clearModal();
    });
    actionsDiv.appendChild(cancelBtn);
  }

  if (modalData.onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Aceptar';
    confirmBtn.style.cssText = `
      padding: 10px 20px; background: var(--primary-color, #1976d2);
      color: white; border: none; border-radius: 8px; cursor: pointer; min-height: 44px;
    `;
    confirmBtn.addEventListener('click', () => {
      modalData.onConfirm();
      clearModal();
    });
    actionsDiv.appendChild(confirmBtn);
  }

  if (!modalData.onConfirm && !modalData.onCancel) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.style.cssText = `
      padding: 10px 20px; background: #666; color: white;
      border: none; border-radius: 8px; cursor: pointer; min-height: 44px;
    `;
    closeBtn.addEventListener('click', clearModal);
    actionsDiv.appendChild(closeBtn);
  }

  box.appendChild(actionsDiv);
}