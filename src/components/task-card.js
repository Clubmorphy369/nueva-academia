// ============================================================
// Componente Tarjeta de Tarea
// ============================================================

export function createTaskCard(task, onClickCallback) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.taskId = task.id;
  card.style.cssText = `
    background: white; border-radius: 12px; padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;
    transition: transform 0.2s; border-left: 5px solid #2196F3; margin-bottom: 12px;
  `;
  card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
  card.addEventListener('mouseleave', () => card.style.transform = 'none');

  const dueDate = task.due ? new Date(task.due).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha';
  const isUrgent = task.due && (new Date(task.due) - new Date()) < 86400000;

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <h3 style="margin: 0 0 8px;">${task.title}</h3>
      ${isUrgent ? '<span style="background: #ffebee; color: #c62828; padding: 4px 10px; border-radius: 20px; font-size: 12px;">Próxima</span>' : ''}
    </div>
    <div style="color: #666; font-size: 14px;">${task.class || ''}</div>
    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #888; margin-top: 10px;">
      <span>📅 ${dueDate}</span>
      <span>${task.status === 'published' ? 'Publicada' : 'Borrador'}</span>
    </div>
  `;
  card.addEventListener('click', (e) => { if (onClickCallback) onClickCallback(task); });
  return card;
}