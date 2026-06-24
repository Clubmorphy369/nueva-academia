// ============================================================
// Estado de la interfaz de usuario
// ============================================================

let uiState = {
  currentView: 'home',
  sidebarOpen: false,
  isLoading: false,
  toast: null,
  modal: null,
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: window.innerWidth >= 1024
};

const uiListeners = [];

export function onUIChange(callback) {
  uiListeners.push(callback);
  callback(uiState);
  return () => {
    const idx = uiListeners.indexOf(callback);
    if (idx > -1) uiListeners.splice(idx, 1);
  };
}

function updateUIState(newState) {
  uiState = { ...uiState, ...newState };
  uiListeners.forEach(cb => cb(uiState));
}

export function navigateTo(view) {
  updateUIState({ currentView: view, sidebarOpen: false });
  window.location.hash = view;
}

export function toggleSidebar() {
  updateUIState({ sidebarOpen: !uiState.sidebarOpen });
}

export function openSidebar() {
  updateUIState({ sidebarOpen: true });
}

export function closeSidebar() {
  updateUIState({ sidebarOpen: false });
}

export function showToast(message, type = 'info', duration = 3000) {
  updateUIState({ toast: { message, type, duration } });
}

export function clearToast() {
  updateUIState({ toast: null });
}

export function showModal(title, content, onConfirm, onCancel) {
  updateUIState({ modal: { title, content, onConfirm, onCancel } });
}

export function clearModal() {
  updateUIState({ modal: null });
}

export function setLoading(isLoading) {
  updateUIState({ isLoading });
}

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  updateUIState({
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  });
});

export function getUIState() {
  return { ...uiState };
}