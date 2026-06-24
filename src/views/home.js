// ============================================================
// Vista de Dashboard (Inicio) personalizada por rol
// ============================================================

import { onAuthStateChange, getCurrentAuthState } from '../state/auth.js';
import { onDataChange, getDataState } from '../state/data.js';
import { navigateTo, showToast, showModal } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { formatDate } from '../utils/formatters.js';
import { loadStudents } from '../state/data.js';

export function renderHomeView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="dashboard-view">
      <h1 class="dashboard-title" style="font-size: 28px; margin-bottom: 10px;">👋 Bienvenido, <span id="userNameSpan"></span></h1>
      <p id="roleSubtitle" style="color: #666; margin-bottom: 30px;"></p>
      <div id="dashboardContent"></div>
    </div>
  `;

  onAuthStateChange(state => {
    if (state.user) {
      document.getElementById('userNameSpan').textContent = state.user.displayName || state.user.email;
      const roleLabels = { [ROLES.STUDENT]: 'Alumno', [ROLES.INSTRUCTOR]: 'Maestro', [ROLES.ADMIN]: 'Administrador' };
      document.getElementById('roleSubtitle').textContent = `Panel de ${roleLabels[state.role]}`;
    }
    renderDashboardByRole(state.role);
  });

  onDataChange(data => {
    const authState = getCurrentAuthState();
    if (authState.role) renderDashboardByRole(authState.role, data);
  });
}

function renderDashboardByRole(role, data = getDataState()) {
  const container = document.getElementById('dashboardContent');
  if (!container) return;
  switch (role) {
    case ROLES.STUDENT: renderStudentDashboard(container, data); break;
    case ROLES.INSTRUCTOR: renderTeacherDashboard(container, data); break;
    case ROLES.ADMIN: renderAdminDashboard(container, data); break;
  }
}

function renderStudentDashboard(container, data) {
  const now = new Date();
  const userId = getCurrentAuthState().user?.uid;

  const myTasks = data.tasks.filter(task => {
    if (task.status !== 'published') return false;
    if (task.visibility === 'restricted') return task.assignedStudents?.includes(userId);
    return true;
  });

  const pendingTasks = myTasks.filter(task => {
    if (!task.due) return true;
    return new Date(task.due) >= now;
  }).sort((a, b) => new Date(a.due) - new Date(b.due));

  const completadas = data.userProgress?.completadas?.length || 0;
  const totalMaterias = data.materias?.length || 5;
  const porcentaje = Math.round((completadas / totalMaterias) * 100) || 0;

  container.innerHTML = `
    <div class="student-dashboard">
      <div class="card progress-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h2 style="margin: 0 0 15px;">📊 Mi Progreso General</h2>
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <div style="background: #eee; border-radius: 10px; height: 20px; overflow: hidden;">
              <div style="width: ${porcentaje}%; height: 100%; background: linear-gradient(90deg, #4caf50, #81c784); border-radius: 10px; transition: width 0.5s;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px;">
              <span>${porcentaje}% completado</span><span>${completadas}/${totalMaterias} materias</span>
            </div>
          </div>
        </div>
      </div>

      <h2 style="margin: 20px 0 10px;">📝 Tareas Pendientes</h2>
      <div id="pendingTasksContainer" style="display: grid; gap: 15px;">
        ${pendingTasks.length === 0 ? '<p style="color: #888;">No tienes tareas pendientes. ¡Buen trabajo!</p>' :
          pendingTasks.slice(0, 5).map(task => {
            const dueDate = task.due ? formatDate(task.due) : 'Sin fecha';
            const isUrgent = task.due && (new Date(task.due) - new Date()) < 86400000;
            return `<div class="task-card" style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${isUrgent ? '#f44336' : '#2196F3'};">
              <div style="display: flex; justify-content: space-between;"><h3 style="margin: 0;">${task.title}</h3>${isUrgent ? '<span style="background:#ffebee; color:#c62828; padding:2px 8px; border-radius:12px;">Próxima</span>' : ''}</div>
              <p style="color: #666;">${task.class || ''}</p><span>📅 ${dueDate}</span></div>`;
          }).join('')
        }
      </div>
    </div>
  `;
}

function renderTeacherDashboard(container, data) {
  const userId = getCurrentAuthState().user?.uid;
  const myTasks = data.tasks.filter(task => task.teacherId === userId);
  const pendingSubmissions = data.submissions.filter(sub => {
    const task = data.tasks.find(t => t.id === sub.taskId);
    return task && task.teacherId === userId && (sub.grade === undefined || sub.grade === null);
  });

  container.innerHTML = `
    <div class="teacher-dashboard">
      <div style="margin-bottom: 20px;">
        <button id="btnCreateTask" style="padding: 14px 24px; background: #4caf50; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; min-height: 44px;">➕ Crear Nueva Tarea</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div class="stat-card" style="background: #e3f2fd; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 32px; font-weight: bold;">${myTasks.length}</div><div>Tareas creadas</div></div>
        <div class="stat-card" style="background: #fff3e0; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 32px; font-weight: bold;">${pendingSubmissions.length}</div><div>Entregas por calificar</div></div>
      </div>
      <h2>📥 Entregas pendientes de calificar</h2>
      <div id="pendingSubmissionsList">
        ${pendingSubmissions.length === 0 ? '<p>No hay entregas pendientes.</p>' :
          pendingSubmissions.slice(0, 5).map(sub => `
            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between;">
              <span><strong>${sub.studentName || 'Alumno'}</strong> - ${data.tasks.find(t=>t.id===sub.taskId)?.title || 'Tarea'}</span>
              <button class="btn-grade" data-subid="${sub.id}" style="padding: 8px 15px; background: #ff9800; color: white; border: none; border-radius: 6px;">Calificar</button>
            </div>`).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('btnCreateTask')?.addEventListener('click', () => navigateTo('tasks'));
  container.querySelectorAll('.btn-grade').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subId = e.target.dataset.subid;
      const sub = data.submissions.find(s => s.id === subId);
      if (sub) showGradeModal(sub);
    });
  });
}

function showGradeModal(submission) {
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = `
    <p><strong>Alumno:</strong> ${submission.studentName}</p>
    <p><strong>Texto:</strong> ${submission.text || 'Sin texto'}</p>
    <label>Nota (0-10):</label><input id="gradeInput" type="number" min="0" max="10" step="0.1" value="${submission.grade || ''}" style="width:100%; padding:8px; margin:8px 0;">
    <label>Retroalimentación:</label><textarea id="feedbackInput" rows="3" style="width:100%; padding:8px;">${submission.feedback || ''}</textarea>
  `;
  showModal('Calificar Entrega', modalDiv, async () => {
    const grade = parseFloat(document.getElementById('gradeInput').value);
    const feedback = document.getElementById('feedbackInput').value;
    if (isNaN(grade) || grade < 0 || grade > 10) { showToast('Nota inválida', 'error'); return; }
    const { updateDocument } = await import('../services/firestore.js');
    await updateDocument('submissions', submission.id, { grade, feedback });
    showToast('Calificación guardada', 'success');
  });
}

function renderAdminDashboard(container, data) {
  const stats = data.stats;
  container.innerHTML = `
    <div class="admin-dashboard">
      <h2>📈 Estadísticas Generales</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div class="stat-card" style="background: #e8f5e9; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 36px;">${stats.totalUsers}</div><div>👥 Usuarios</div></div>
        <div class="stat-card" style="background: #e3f2fd; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 36px;">${stats.totalTasks}</div><div>📝 Tareas</div></div>
        <div class="stat-card" style="background: #fff3e0; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 36px;">${stats.totalSubmissions}</div><div>📤 Entregas</div></div>
        <div class="stat-card" style="background: #f3e5f5; padding: 20px; border-radius: 12px; text-align: center;"><div style="font-size: 36px;">${stats.totalComments}</div><div>💬 Comentarios</div></div>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button id="btnAdminUsers" style="padding: 12px 20px; background: #1976d2; color: white; border: none; border-radius: 8px; cursor: pointer;">👥 Gestionar Usuarios</button>
        <button id="btnAdminTasks" style="padding: 12px 20px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer;">📝 Gestionar Tareas</button>
        <button id="btnAdminSettings" style="padding: 12px 20px; background: #ff9800; color: white; border: none; border-radius: 8px; cursor: pointer;">⚙️ Configuración</button>
      </div>
    </div>
  `;
  document.getElementById('btnAdminUsers')?.addEventListener('click', () => navigateTo('admin'));
  document.getElementById('btnAdminTasks')?.addEventListener('click', () => navigateTo('tasks'));
  document.getElementById('btnAdminSettings')?.addEventListener('click', () => navigateTo('admin'));
}