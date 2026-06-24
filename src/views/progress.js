// ============================================================
// Vista de Progreso (Alumno y Maestro/Admin)
// ============================================================

import { onAuthStateChange, getCurrentAuthState } from '../state/auth.js';
import { onDataChange, getDataState, loadAllUserData, loadStudents } from '../state/data.js';
import { showToast } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { updateDocument } from '../services/firestore.js';

export function renderProgressView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const authState = getCurrentAuthState();
  const role = authState.role;

  main.innerHTML = `
    <div class="progress-view">
      <h1>📊 ${role === ROLES.STUDENT ? 'Mi Progreso' : 'Progreso de Alumnos'}</h1>
      <div id="progressContent"></div>
    </div>
  `;

  if (role === ROLES.STUDENT) {
    renderStudentProgress();
  } else if (role === ROLES.INSTRUCTOR || role === ROLES.ADMIN) {
    renderTeacherProgress();
  }
}

// ─── Progreso del Alumno ───
function renderStudentProgress() {
  const container = document.getElementById('progressContent');
  if (!container) return;
  const data = getDataState();
  const userProgress = data.userProgress || { completadas: [], favoritas: [] };
  const materias = data.materias || [];
  const completadas = userProgress.completadas?.length || 0;
  const total = materias.length || 1;
  const porcentaje = Math.round((completadas / total) * 100);

  container.innerHTML = `
    <div style="margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Progreso General</h2>
        <span style="font-size: 24px; font-weight: bold;">${porcentaje}%</span>
      </div>
      <div style="background: #eee; border-radius: 10px; height: 20px; margin: 10px 0; overflow: hidden;">
        <div style="width: ${porcentaje}%; height: 100%; background: linear-gradient(90deg, #4caf50, #81c784); border-radius: 10px; transition: width 0.5s;"></div>
      </div>
      <p style="color: #666;">${completadas} de ${total} materias completadas</p>
    </div>

    <h2>Mis Materias</h2>
    <div id="materiasList"></div>

    <h2 style="margin-top: 30px;">💡 Recomendaciones</h2>
    <div id="recomendaciones"></div>
  `;

  renderMateriasList(userProgress, materias);
  renderRecomendaciones(userProgress, materias);
}

function renderMateriasList(userProgress, materias) {
  const listContainer = document.getElementById('materiasList');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  materias.forEach(materia => {
    const isCompleted = userProgress.completadas?.includes(materia.nombre);
    const isFavorite = userProgress.favoritas?.includes(materia.nombre);

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      background: var(--surface-color, white); padding: 12px 15px; border-radius: 8px;
      margin-bottom: 8px; box-shadow: var(--shadow, 0 1px 4px rgba(0,0,0,0.05));
    `;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" ${isCompleted ? 'checked' : ''} class="materia-checkbox" data-materia="${materia.nombre}" style="width: 20px; height: 20px; cursor: pointer;">
        <span style="${isCompleted ? 'text-decoration: line-through; color: #888;' : ''}">${materia.nombre}</span>
      </div>
      <button class="favorite-btn" data-materia="${materia.nombre}" style="
        background: none; border: none; font-size: 20px; cursor: pointer;
        min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;
      ">${isFavorite ? '⭐' : '☆'}</button>
    `;
    listContainer.appendChild(row);
  });

  listContainer.querySelectorAll('.materia-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const materia = e.target.dataset.materia;
      const checked = e.target.checked;
      const authState = getCurrentAuthState();
      const userId = authState.user.uid;
      let completadas = [...(getDataState().userProgress?.completadas || [])];
      if (checked) { if (!completadas.includes(materia)) completadas.push(materia); }
      else { completadas = completadas.filter(m => m !== materia); }
      await updateDocument('usuarios', userId, { 'progress.completadas': completadas });
      showToast(checked ? `¡${materia} completada!` : 'Progreso actualizado', 'success');
      loadAllUserData(userId);
    });
  });

  listContainer.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const materia = btn.dataset.materia;
      const authState = getCurrentAuthState();
      const userId = authState.user.uid;
      let favoritas = [...(getDataState().userProgress?.favoritas || [])];
      if (favoritas.includes(materia)) { favoritas = favoritas.filter(m => m !== materia); }
      else { favoritas.push(materia); }
      await updateDocument('usuarios', userId, { 'progress.favoritas': favoritas });
      showToast(favoritas.includes(materia) ? 'Añadido a favoritos' : 'Eliminado de favoritos', 'success');
      loadAllUserData(userId);
    });
  });
}

function renderRecomendaciones(userProgress, materias) {
  const container = document.getElementById('recomendaciones');
  if (!container) return;
  const completadas = userProgress.completadas || [];
  const favoritas = userProgress.favoritas || [];
  const noCompletadas = materias.filter(m => !completadas.includes(m.nombre) && !favoritas.includes(m.nombre));
  if (noCompletadas.length === 0) {
    container.innerHTML = '<p style="color: #888;">¡Has completado todas las materias! 🎉</p>';
    return;
  }
  container.innerHTML = '<p>Te recomendamos continuar con:</p>' +
    noCompletadas.slice(0, 3).map(m => `<div style="background: #e3f2fd; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px;">📘 ${m.nombre}</div>`).join('');
}

// ─── Progreso del Maestro/Admin ───
async function renderTeacherProgress() {
  const container = document.getElementById('progressContent');
  if (!container) return;
  container.innerHTML = '<p>Cargando estudiantes...</p>';

  await loadStudents();
  const data = getDataState();
  const students = data.students || [];
  const materias = data.materias || [];

  if (students.length === 0) {
    container.innerHTML = '<p>No se encontraron alumnos.</p>';
    return;
  }

  container.innerHTML = `
    <div class="teacher-progress-view">
      <p>Progreso general de los alumnos (basado en materias completadas).</p>
      <div id="studentsProgressList"></div>
    </div>
  `;

  const listDiv = document.getElementById('studentsProgressList');
  students.forEach(student => {
    const progress = student.progress || { completadas: [], favoritas: [] };
    const completadas = progress.completadas?.length || 0;
    const total = materias.length || 1;
    const porcentaje = Math.round((completadas / total) * 100);

    const card = document.createElement('div');
    card.style.cssText = `background: var(--surface-color, white); border-radius: 12px; padding: 15px; box-shadow: var(--shadow); margin-bottom: 15px;`;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0;">${student.name || student.email}</h3>
          <small style="color: var(--text-secondary);">${completadas} de ${total} materias</small>
        </div>
        <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${porcentaje}%</div>
      </div>
      <div style="background: #eee; border-radius: 10px; height: 12px; margin-top: 10px; overflow: hidden;">
        <div style="width: ${porcentaje}%; height: 100%; background: #4caf50; border-radius: 10px;"></div>
      </div>
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; color: var(--primary-color);">Ver materias</summary>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          ${materias.map(m => `
            <li style="${progress.completadas?.includes(m.nombre) ? 'text-decoration: line-through; color: green;' : ''}">
              ${m.nombre} ${progress.completadas?.includes(m.nombre) ? '✅' : '⏳'}
              ${progress.favoritas?.includes(m.nombre) ? ' ⭐' : ''}
            </li>
          `).join('')}
        </ul>
      </details>
    `;
    listDiv.appendChild(card);
  });
}