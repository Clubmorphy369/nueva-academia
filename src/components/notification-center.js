// ============================================================
// Centro de notificaciones: campana con badge y lista desplegable
// ============================================================

import { onDataChange, getDataState } from '../state/data.js';
import { onMessageListener } from '../services/notifications.js';
import { timeAgo } from '../utils/formatters.js';

let notificationBtn = null;
let dropdown = null;
let badge = null;

export function initNotificationCenter() {
  if (notificationBtn) return;

  notificationBtn = document.createElement('button');
  notificationBtn.id = 'notification-bell';
  notificationBtn.setAttribute('aria-label', 'Notificaciones');
  notificationBtn.style.cssText = `
    position: relative; background: none; border: none; font-size: 24px;
    cursor: pointer; min-width: 44px; min-height: 44px;
    display: flex; align-items: center; justify-content: center; color: #ccc;
  `;
  notificationBtn.innerHTML = '🔔';

  badge = document.createElement('span');
  badge.id = 'notification-badge';
  badge.style.cssText = `
    position: absolute; top: 2px; right: 2px; background: #f44336; color: white;
    font-size: 10px; font-weight: bold; min-width: 18px; height: 18px;
    border-radius: 9px; display: none; align-items: center; justify-content: center;
    line-height: 1; padding: 0 4px;
  `;
  notificationBtn.appendChild(badge);

  dropdown = document.createElement('div');
  dropdown.id = 'notification-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.style.cssText = `
    position: fixed; top: 60px; right: 10px;
    background: var(--surface-color, white);
    border: 1px solid var(--border-color, #ddd);
    border-radius: var(--border-radius, 8px);
    box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.2));
    width: 320px; max-width: 90vw; max-height: 400px; overflow-y: auto;
    z-index: 10000; display: none;
  `;

  document.body.appendChild(notificationBtn);
  document.body.appendChild(dropdown);

  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) renderNotificationList();
  });

  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });

  onMessageListener(() => {
    renderNotificationList();
    updateBadge();
  });

  onDataChange(() => updateBadge());

  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.notification-item');
    if (item) {
      const action = item.dataset.action;
      if (action) {
        window.location.hash = action;
        dropdown.style.display = 'none';
      }
    }
  });
}

function renderNotificationList() {
  if (!dropdown) return;
  const notifications = getDataState().notifications || [];
  if (notifications.length === 0) {
    dropdown.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No tienes notificaciones</div>';
    return;
  }
  const sorted = [...notifications].sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
  dropdown.innerHTML = sorted.slice(0, 20).map(n => `
    <div class="notification-item" data-action="${n.action || ''}" style="
      padding: 12px 16px; border-bottom: 1px solid var(--border-color);
      cursor: pointer; ${n.read ? 'opacity: 0.6;' : ''}
    " onmouseenter="this.style.background='var(--bg-color)'" onmouseleave="this.style.background='none'">
      <div style="display:flex; justify-content:space-between;">
        <strong style="font-size:14px;">${n.title}</strong>
        <small style="color:var(--text-secondary);">${timeAgo(n.createdAt)}</small>
      </div>
      <p style="margin:4px 0 0; font-size:13px; color:var(--text-secondary);">${n.body}</p>
    </div>
  `).join('');
}

function updateBadge() {
  if (!badge) return;
  const notifications = getDataState().notifications || [];
  const unread = notifications.filter(n => !n.read).length;
  badge.textContent = unread > 99 ? '99+' : unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

export function mountBell(container) {
  if (notificationBtn && container) {
    container.appendChild(notificationBtn);
  }
}