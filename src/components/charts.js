// ============================================================
// Componente de Gráficos (Chart.js)
// ============================================================

export function renderProgressChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (typeof Chart === 'undefined') {
    container.innerHTML = '<div style="text-align:center;">Chart.js no cargado</div>';
    return;
  }
  const ctx = document.createElement('canvas');
  container.innerHTML = '';
  container.appendChild(ctx);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels || [],
      datasets: [{
        label: data.label || 'Progreso',
        data: data.values || [],
        backgroundColor: '#4caf50'
      }]
    }
  });
}