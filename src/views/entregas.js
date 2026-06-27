// ============================================================
// Vista de Entregas (alumno: historial + nueva versión; maestro: calificar)
// ============================================================

import { getCurrentAuthState } from '../state/auth.js';
import { getDataState, loadAllUserData } from '../state/data.js';
import { showToast, showModal, setLoading } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import * as firestore from '../services/firestore.js';
import { uploadFile } from '../services/storage.js';
import { createSubmissionCard } from '../components/submission-card.js';

let currentFilterTaskId = null;

export function renderEntregasView() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = `
    <div class="entregas-view">
      <div style="display:flex; justify-content:space-between;"><h1>📤 Entregas</h1><div id="entregasActions"></div></div>
      <div id="entregasContainer" style="margin-top:20px;"></div>
    </div>
  `;
  updateEntregasActions();
  renderEntregasList();
}

function updateEntregasActions() {
  const actions = document.getElementById('entregasActions');
  if (!actions) return;
  const role = getCurrentAuthState().role;
  if (role === ROLES.INSTRUCTOR || role === ROLES.ADMIN) {
    actions.innerHTML = `<select id="filterTaskSelect" style="padding:10px; border-radius:8px;"><option value="">Todas las tareas</option></select>`;
    populateTaskFilter();
    document.getElementById('filterTaskSelect')?.addEventListener('change', (e) => { currentFilterTaskId = e.target.value || null; renderEntregasList(); });
  }
}

function populateTaskFilter() {
  const authState = getCurrentAuthState();
  const data = getDataState();
  let tasks = [];
  if (authState.role === ROLES.INSTRUCTOR) tasks = data.tasks.filter(t => t.teacherId === authState.user.uid);
  else if (authState.role === ROLES.ADMIN) tasks = data.tasks;
  const select = document.getElementById('filterTaskSelect');
  if (!select) return;
  tasks.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.title; select.appendChild(o); });
}

function renderEntregasList() {
  const container = document.getElementById('entregasContainer');
  if (!container) return;
  let submissions = getDataState().submissions;
  const authState = getCurrentAuthState();
  const userId = authState.user?.uid;
  const role = authState.role;

  if (role === ROLES.STUDENT) submissions = submissions.filter(s => s.studentId === userId);
  else if (role === ROLES.INSTRUCTOR) {
    const myTaskIds = getDataState().tasks.filter(t => t.teacherId === userId).map(t => t.id);
    submissions = submissions.filter(s => myTaskIds.includes(s.taskId));
  }
  if (currentFilterTaskId && (role === ROLES.INSTRUCTOR || role === ROLES.ADMIN)) submissions = submissions.filter(s => s.taskId === currentFilterTaskId);

  submissions.sort((a, b) => (b.submittedAt?.toDate?.()||0) - (a.submittedAt?.toDate?.()||0));
  container.innerHTML = submissions.length === 0 ? '<p style="color:#888;">No hay entregas.</p>' : '';
  submissions.forEach(s => {
    const task = getDataState().tasks.find(t => t.id === s.taskId);
    container.appendChild(createSubmissionCard(s, task, (sub) => onSubmissionClick(sub, task)));
  });
}

function onSubmissionClick(submission, task) {
  const role = getCurrentAuthState().role;
  if (role === ROLES.STUDENT) showStudentDetail(submission, task);
  else openGradeForm(submission);
}

function showStudentDetail(submission, task) {
  const div = document.createElement('div');
  div.innerHTML = `<h3>${task?.title||'Tarea'}</h3><p>Texto: ${submission.text||'Sin texto'}</p>${submission.fileName?`<a href="${submission.fileUrl}" target="_blank">${submission.fileName}</a>`:''}<hr><h4>Calificación</h4>${submission.grade!==undefined?`<p>Nota: ${submission.grade}/10</p><p>Feedback: ${submission.feedback||'Sin comentarios'}</p>`:'<p>Aún no calificado.</p>'}<button id="btnNewVersion" style="margin-top:10px; padding:10px 20px; background:#2196F3; color:white; border:none; border-radius:8px;">Subir nueva versión</button>`;
  showModal('Detalle de Entrega', div, null);
  document.getElementById('btnNewVersion')?.addEventListener('click', () => { openNewVersionForm(task); });
}

function openNewVersionForm(task) {
  const div = document.createElement('div');
  div.innerHTML = `<h3>Nueva versión para: ${task.title}</h3><textarea id="newVersionText" rows="4" style="width:100%;"></textarea><input id="newVersionFile" type="file" style="margin-top:5px;">`;
  showModal('Subir Nueva Versión', div, async () => {
    const text = document.getElementById('newVersionText').value.trim();
    const file = document.getElementById('newVersionFile').files[0];
    if (!text && !file) return showToast('Incluye texto o archivo', 'error');
    if (file && file.size > 5*1024*1024) return showToast('Archivo > 5MB', 'error');
    setLoading(true);
    const authState = getCurrentAuthState();
    let fileUrl = null, fileName = null;
    if (file) { const path = `submissions/${authState.user.uid}/${task.id}/${Date.now()}_${file.name}`; fileUrl = await uploadFile(path, file); fileName = file.name; }
    await firestore.addDocument('submissions', { taskId: task.id, studentId: authState.user.uid, studentName: authState.user.displayName || authState.user.email, text, fileName, fileUrl, submittedAt: firebase.firestore.FieldValue.serverTimestamp(), version: (getDataState().submissions.filter(s => s.taskId===task.id && s.studentId===authState.user.uid).length)+1 });
    showToast('Versión entregada', 'success');
    setLoading(false);
    loadAllUserData(authState.user.uid);
  });
}

function openGradeForm(submission) {
  const div = document.createElement('div');
  div.innerHTML = `<p><strong>Alumno:</strong> ${submission.studentName}</p><label>Nota (0-10):</label><input id="gradeInput" type="number" min="0" max="10" step="0.1" value="${submission.grade||''}" style="width:100%;"><label>Feedback:</label><textarea id="feedbackInput" rows="3" style="width:100%;">${submission.feedback||''}</textarea>`;
  showModal('Calificar', div, async () => {
    const grade = parseFloat(document.getElementById('gradeInput').value);
    const feedback = document.getElementById('feedbackInput').value;
    if (isNaN(grade) || grade<0 || grade>10) return showToast('Nota inválida', 'error');
    await firestore.updateDocument('submissions', submission.id, { grade, feedback });
    showToast('Calificación guardada', 'success');
    loadAllUserData(getCurrentAuthState().user.uid);
    renderEntregasList();
  });
}
