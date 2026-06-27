// ============================================================
// Componente Sidebar: Drawer en móvil, fijo en escritorio
// Menú dinámico por rol, marca de vista activa, swipe
// ============================================================

import { onAuthStateChange, logout } from '../state/auth.js';
import { onUIChange, navigateTo, closeSidebar, toggleSidebar, getUIState } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { getCurrentTheme } from '../services/theme.js';

let sidebarEl = null;
let navEl = null;
let touchStartX = 0;
let touchStartY = 0;

const menuOptions = {
  [ROLES.STUDENT]: [
    { icon: '🏠', label: 'Inicio', view: 'home' },
    { icon: '📚', label: 'Mis Cursos', view: 'courses' },
    { icon: '📝', label: 'Mis Tareas', view: 'tasks' },
    { icon: '📊', label: 'Mi Progreso', view: 'progress' },
    { icon: '📅', label: 'Calendario', view: 'calendar' },
    { icon: '💬', label: 'Foro', view: 'forum' }
  ],
  [ROLES.INSTRUCTOR]: [
    { icon: '🏠', label: 'Inicio', view: 'home' },
    { icon: '📚', label: 'Mis Cursos', view: 'courses' },
    { icon: '📝', label: 'Tareas', view: 'tasks' },
    { icon: '📊', label: 'Progreso Alumnos', view: 'progress' },
    { icon: '📅', label: 'Calendario', view: 'calendar' },
    { icon: '💬', label: 'Foro', view: 'forum' },
    { icon: '⚙️', label: 'Administración', view: 'admin' }
  ],
  [ROLES.ADMIN]: [
    { icon: '🏠', label: 'Dashboard', view: 'home' },
    { icon: '📚', label: 'Cursos', view: 'courses' },
    { icon: '👥', label: 'Usuarios', view: 'admin' },
    { icon: '📝', label: 'Tareas', view: 'tasks' },
    { icon: '📊', label: 'Estadísticas', view: 'progress' },
    { icon: '📅', label: 'Calendario', view: 'calendar' },
    { icon: '💬', label: 'Foro', view: 'forum' }
  ]
};

export function initSidebar() {
  if (sidebarEl) return;

  sidebarEl = document.createElement('aside');
  sidebarEl.id = 'app-sidebar';
  sidebarEl.setAttribute('aria-label', 'Menú principal');
  sidebarEl.style.cssText = `
    position: fixed; top: 0; left: 0; height: 100%; width: 280px;
    background: #1e1e2d; color: #fff; z-index: 1000;
    transform: translateX(-100%); transition: transform 0.3s ease;
    display: flex; flex-direction: column; overflow-y: auto;
    box-shadow: 2px 0 8px rgba(0,0,0,0.2); will-change: transform;
  `;

  const headerDiv = document.createElement('div');
  headerDiv.className = 'sidebar-header';
  headerDiv.style.cssText = `
    padding: 20px; display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.1); position: relative;
  `;

  const logoImg = document.createElement('img');
  logoImg.id = 'sidebar-logo';
  logoImg.style.cssText = 'max-width: 100%; max-height: 40px; margin-right: 8px; display: none;';
  headerDiv.appendChild(logoImg);

  const avatar = document.createElement('div');
  avatar.id = 'sidebar-avatar';
  avatar.style.cssText = `
    width: 44px; height: 44px; min-width: 44px;
    border-radius: 50%; background: #4caf50;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: bold; color: white;
  `;
  headerDiv.appendChild(avatar);

  const userInfoDiv = document.createElement('div');
  userInfoDiv.style.flex = '1';
  const userName = document.createElement('div');
  userName.id = 'sidebar-username';
  userName.style.cssText = 'font-weight: bold; font-size: 16px;';
  const userRole = document.createElement('div');
  userRole.id = 'sidebar-userrole';
  userRole.style.cssText = 'font-size: 12px; opacity: 0.8;';
  userInfoDiv.appendChild(userName);
  userInfoDiv.appendChild(userRole);
  headerDiv.appendChild(userInfoDiv);

  const bellContainer = document.createElement('div');
  bellContainer.id = 'sidebar-bell-container';
  bellContainer.style.marginLeft = 'auto';
  headerDiv.appendChild(bellContainer);

  sidebarEl.appendChild(headerDiv);

  navEl = document.createElement('nav');
  navEl.style.cssText = 'flex: 1; padding: 10px 0;';
  sidebarEl.appendChild(navEl);

  const separator = document.createElement('div');
  separator.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;';
  sidebarEl.appendChild(separator);

  const themeDiv = document.createElement('div');
  themeDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px 20px;';
  themeDiv.innerHTML = `
    <span style="color: #ccc; font-size: 14px;">🌓 Modo oscuro</span>
    <label class="theme-toggle" style="position: relative; display: inline-block; width: 44px; height: 24px;">
      <input type="checkbox" id="darkModeToggle" style="opacity:0; width:0; height:0;">
      <span style="position: absolute; cursor: pointer; top:0; left:0; right:0; bottom:0; background:#555; border-radius: 24px; transition: 0.3s;"></span>
    </label>
  `;
  sidebarEl.appendChild(themeDiv);

  const footerDiv = document.createElement('div');
  footerDiv.style.cssText = 'padding: 15px 20px; border-top: 1px solid rgba(255,255,255,0.1);';
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = '🚪 Cerrar Sesión';
  logoutBtn.style.cssText = `
    width: 100%; padding: 12px; background: #d32f2f; border: none;
    color: white; border-radius: 8px; font-size: 16px; cursor: pointer; min-height: 44px;
  `;
  logoutBtn.addEventListener('click', logout);
  footerDiv.appendChild(logoutBtn);
  sidebarEl.appendChild(footerDiv);

  document.body.appendChild(sidebarEl);

  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 999; display: none;
  `;
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);

  onUIChange(state => {
    if (state.isDesktop) {
      sidebarEl.classList.add('open');
      overlay.classList.remove('visible');
    } else {
      if (state.sidebarOpen) {
        sidebarEl.classList.add('open');
        overlay.classList.add('visible');
      } else {
        sidebarEl.classList.remove('open');
        overlay.classList.remove('visible');
      }
    }
    updateActiveView(state.currentView);
  });

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && touchStartX < 30) {
        import('../state/ui.js').then(m => m.openSidebar());
      } else if (deltaX < 0 && sidebarEl.contains(e.target)) {
        closeSidebar();
      }
    }
  });

  onAuthStateChange(state => {
    updateUserInfo(state);
    buildMenu(state.role);
  });

  document.getElementById('darkModeToggle')?.addEventListener('change', async () => {
    const { toggleDarkMode } = await import('../services/theme.js');
    await toggleDarkMode();
  });

 setTimeout(async () => {
    const { initNotificationCenter, mountBell } = await import('./notification-center.js');
    initNotificationCenter();
    const bellContainer = document.getElementById('sidebar-bell-container');
    if (bellContainer) mountBell(bellContainer);
}, 200);
}

function updateUserInfo(authState) {
  const avatar = document.getElementById('sidebar-avatar');
  const userName = document.getElementById('sidebar-username');
  const userRole = document.getElementById('sidebar-userrole');
  const logoImg = document.getElementById('sidebar-logo');
  const theme = getCurrentTheme();

  if (authState.user) {
    const name = authState.user.displayName || authState.user.email;
    if (userName) userName.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    if (userRole) {
      const roleLabels = {
        [ROLES.ADMIN]: 'Administrador',
        [ROLES.INSTRUCTOR]: 'Maestro',
        [ROLES.STUDENT]: 'Alumno'
      };
      userRole.textContent = roleLabels[authState.role] || 'Usuario';
    }
    if (theme.logoURL) {
      logoImg.src = theme.logoURL;
      logoImg.style.display = 'block';
      avatar.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      avatar.style.display = 'flex';
    }
  }
}

function buildMenu(role) {
  if (!navEl) return;
  navEl.innerHTML = '';
  const items = menuOptions[role] || menuOptions[ROLES.STUDENT];

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-nav-btn';
    btn.dataset.view = item.view;
    btn.setAttribute('aria-current', 'false');
    btn.innerHTML = `<span style="margin-right:8px;">${item.icon}</span> ${item.label}`;
    btn.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 14px 20px; background: none; border: none;
      color: #ccc; font-size: 16px; cursor: pointer; text-align: left;
      transition: background 0.2s, color 0.2s;
      min-height: 44px;
      border-left: 4px solid transparent;
    `;
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) btn.style.background = 'rgba(255,255,255,0.08)';
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) btn.style.background = 'none';
    });
    btn.addEventListener('click', () => {
      navigateTo(item.view);
      if (window.innerWidth < 1024) closeSidebar();
    });
    navEl.appendChild(btn);
  });

  const currentView = getUIState().currentView;
  updateActiveView(currentView);
}

function updateActiveView(viewName) {
  if (!navEl) return;
  const buttons = navEl.querySelectorAll('.sidebar-nav-btn');
  buttons.forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    if (isActive) {
      btn.style.background = 'rgba(76, 175, 80, 0.2)';
      btn.style.color = '#fff';
      btn.style.borderLeftColor = '#4caf50';
      btn.style.fontWeight = '600';
    } else {
      btn.style.background = 'none';
      btn.style.color = '#ccc';
      btn.style.borderLeftColor = 'transparent';
      btn.style.fontWeight = 'normal';
    }
  });
}

export { updateActiveView };
