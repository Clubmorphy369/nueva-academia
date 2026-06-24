// ============================================================
// Componente Calendario (placeholder funcional)
// ============================================================

export function createCalendarView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div style="text-align:center; color:#888;">Calendario interactivo próximamente</div>`;
}