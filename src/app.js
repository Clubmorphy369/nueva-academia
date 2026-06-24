// ============================================================
// Aplicación principal - Router SPA y orquestación
// ============================================================

import { initAuthObserver, onAuthStateChange, getCurrentAuthState } from './state/auth.js';
import { initToast } from './components/toast.js';
import { initSidebar } from './components/sidebar.js';
import { initModal } from './components/modal.js';
import { initLoader } from './components/loader.js';
import { initNotificationCenter } from './components/notification-center.js';
import { renderAuthView } from './views/auth.js';
import { renderHomeView } from './views/home.js';
import { onUIChange, navigateTo } from './state/ui.js';
import { loadTheme } from './services/theme.js';
import { loadLanguage, applyTranslations } from './services/i18n.js';
import { requestFCMPermission, loadSoundSettings } from './services/notifications.js';

// Mapa de vistas con lazy loading
const viewRenderers = {
  home: () => import('./views/home.js').then(m => m.renderHomeView()),
  courses: () => import('./views/courses.js').then(m => m.renderCoursesView()),
  lessons: () => import('./views/lessons.js').then(m => m.renderLessonsView()),
  tasks: () => import('./views/tasks.js').then(m => m.renderTasksView()),
  entregas: () => import('./views/entregas.js').then(m => m.renderEntregasView()),
  forum: () => import('./views/forum.js').then(m => m.renderForumView()),
  progress: () => import('./views/progress.js').then(m => m.renderProgressView()),
  calendar: () => import('./views/calendar.js').then(m => m.renderCalendarView()),
  admin: () => import('./views/admin.js').then(m => m.renderAdminView()),
  leaderboard: () => import('./views/leaderboard.js').then(m => m.renderLeaderboardView())
};

// Inicializar aplicación
async function initApp() {
  console.log('🚀 Inicializando Academia Virtual...');

  // Cargar tema y traducciones antes de mostrar nada
  await loadTheme();
  const savedLang = localStorage.getItem('lang') || 'es';
  await loadLanguage(savedLang);
  applyTranslations();

  // Inicializar componentes globales
  initToast();
  initSidebar();
  initModal();
  initLoader();
  initNotificationCenter();

  // Observador de autenticación
  initAuthObserver();

  // Solicitar permisos de notificación cuando haya usuario
  onAuthStateChange(async (state) => {
    if (state.isLoggedIn && !state.loading) {
      await requestFCMPermission();
      await loadSoundSettings();
    }
  });

  // Router por hash
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange(); // inicial

  // Escuchar cambios de vista para renderizar
  onUIChange(state => {
    if (state.currentView && getCurrentAuthState().isLoggedIn) {
      renderCurrentView(state.currentView);
    }
  });
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'home';
  navigateTo(hash);
}

// Renderizar según autenticación
export function renderAll() {
  const authState = getCurrentAuthState();
  const authContainer = document.getElementById('authContainer');
  const app = document.getElementById('app');

  if (!authState.isLoggedIn && !authState.loading) {
    // Mostrar pantalla de auth
    if (authContainer) authContainer.style.display = 'block';
    if (app) app.style.display = 'none';
    renderAuthView();
  } else if (authState.isLoggedIn) {
    // Mostrar aplicación
    if (authContainer) authContainer.style.display = 'none';
    if (app) {
      app.style.display = 'flex';
      app.style.minHeight = '100vh';
      // Crear main si no existe
      if (!document.getElementById('main-content')) {
        const main = document.createElement('main');
        main.id = 'main-content';
        main.setAttribute('role', 'main');
        main.style.cssText = 'flex: 1; margin-left: 0; transition: margin-left 0.3s ease, opacity 0.2s ease; padding: 20px; max-width: 100%; overflow-y: auto;';
        app.appendChild(main);
        onUIChange(state => {
          main.style.marginLeft = state.isDesktop ? '280px' : '0';
        });
      }
      const currentView = window.location.hash.slice(1) || 'home';
      renderCurrentView(currentView);
    }
  }
}

async function renderCurrentView(viewName) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Animación de transición
  mainContent.style.opacity = '0';
  mainContent.style.transition = 'opacity 0.15s ease';

  await new Promise(resolve => setTimeout(resolve, 150));

  // Limpiar y mostrar loader local
  mainContent.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; height:200px;">
      <div style="width:40px; height:40px; border:4px solid var(--border-color, #e0e0e0); border-top:4px solid var(--primary-color, #1976d2); border-radius:50%; animation: spin 1s linear infinite;"></div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>
  `;

  const renderer = viewRenderers[viewName];
  if (renderer) {
    try {
      await renderer();
      addBreadcrumb(viewName);
    } catch (err) {
      console.error(`Error al cargar vista ${viewName}:`, err);
      mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${err.message}</p>`;
    }
  } else {
    window.location.hash = 'home';
  }

  // Aparecer
  requestAnimationFrame(() => {
    mainContent.style.opacity = '1';
  });
}

function addBreadcrumb(viewName) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const oldBread = document.getElementById('breadcrumb');
  if (oldBread) oldBread.remove();

  const viewLabels = {
    home: 'Inicio', courses: 'Cursos', lessons: 'Lección', tasks: 'Tareas',
    entregas: 'Entregas', forum: 'Foro', progress: 'Progreso',
    calendar: 'Calendario', admin: 'Administración', leaderboard: 'Ranking'
  };

  const breadcrumb = document.createElement('nav');
  breadcrumb.id = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Rastro de navegación');
  breadcrumb.style.cssText = `
    padding: 10px 0; font-size: 14px; color: var(--text-secondary);
    margin-bottom: 10px; border-bottom: 1px solid var(--border-color);
  `;
  breadcrumb.innerHTML = `<a href="#home" style="color:var(--primary-color); text-decoration:none;">Inicio</a> / <span style="color:var(--text-color);">${viewLabels[viewName] || viewName}</span>`;
  mainContent.insertBefore(breadcrumb, mainContent.firstChild);
}

// Arrancar al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);