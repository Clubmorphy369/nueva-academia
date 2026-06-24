// ============================================================
// Vista de Tareas (lista, creación, entrega, calificación)
// ============================================================

import { onAuthStateChange, getCurrentAuthState } from '../state/auth.js';
import { onDataChange, getDataState, loadAllUserData } from '../state/data.js';
import { showToast, showModal, navigateTo, setLoading } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { createTaskCard } from '../components/task-card.js';
import { createBlockEditor } from '../components/block-editor.js';
import { addDocument, updateDocument } from '../services/firestore.js';
import { formatDate } from '../utils/formatters.js';

let currentFilter = 'all';
let currentTaskId = null;

export function renderTasksView() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = `
    <div class="tasks-view">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
        <h1>📝 Tareas</h1>
        <div id="taskActions"></div>
      </div>
      <div class="task-filters" style="display:flex; gap:8px; margin-bottom:20px;">
        ${['all','pending','published','draft'].map(f => `<button class="filter-btn" data-filter="${f}" style="padding:10px 16px; border:1px solid #ddd; background:white; border-radius:20px; cursor:pointer; min-height:44px;">${f==='all'?'Todas':f==='pending'?'Pendientes':f==='published'?'Publicadas':'Borradores'}</button>`).join('')}
      </div>
      <div id="tasksListContainer"></div>
    </div>
  `;
  setupFilters();
  updateTaskActions();
  renderTaskList();
}

function updateTaskActions() {
  const actionsDiv = document.getElementById('taskActions');
  if (!actionsDiv) return;
  const role = getCurrentAuthState().role;
  if (role === ROLES.INSTRUCTOR || role === ROLES.ADMIN) {
    actionsDiv.innerHTML = `<button id="btnNewTask" style="padding:12px 20px; background:#4caf50; color:white; border:none; border-radius:8px; cursor:pointer;">➕ Nueva Tarea</button>`;
    document.getElementById('btnNewTask')?.addEventListener('click', () => openTaskForm());
  } else { actionsDiv.innerHTML = ''; }
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.style.background='white');
    btn.style.background='#1976d2'; btn.style.color='white';
    currentFilter = btn.dataset.filter;
    renderTaskList();
  }));
}

function renderTaskList() {
  const container = document.getElementById('tasksListContainer');
  if (!container) return;
  const data = getDataState();
  const authState = getCurrentAuthState();
  const userId = authState.user?.uid;
  const role = authState.role;

  let visibleTasks = [];
  if (role === ROLES.STUDENT) visibleTasks = data.tasks.filter(t => t.status === 'published' && (t.visibility !== 'restricted' || t.assignedStudents?.includes(userId)));
  else if (role === ROLES.INSTRUCTOR) visibleTasks = data.tasks.filter(t => t.teacherId === userId);
  else if (role === ROLES.ADMIN) visibleTasks = data.tasks;

  if (currentFilter === 'pending') visibleTasks = visibleTasks.filter(t => new Date(t.due) >= new Date());
  else if (currentFilter === 'published') visibleTasks = visibleTasks.filter(t => t.status === 'published');
  else if (currentFilter === 'draft') visibleTasks = visibleTasks.filter(t => t.status === 'draft');

  container.innerHTML = visibleTasks.length === 0 ? '<p style="color:#888;">No hay tareas.</p>' : '';
  visibleTasks.forEach(task => container.appendChild(createTaskCard(task, onTaskClick)));
}

function onTaskClick(task) {
  const role = getCurrentAuthState().role;
  if (role === ROLES.STUDENT) openSubmissionForm(task);
  else openTaskDetail(task);
}

function openTaskForm(task = null) {
  const isEdit = !!task;
  const formDiv = document.createElement('div');
  formDiv.innerHTML = `
    <label>Título:</label><input id="taskTitle" value="${task?.title||''}" style="width:100%; padding:8px;">
    <label>Descripción:</label><textarea id="taskDesc" rows="3" style="width:100%; padding:8px;">${task?.desc||''}</textarea>
    <div style="display:flex; gap:10px;">
      <div><label>Fecha:</label><input id="taskDue" type="datetime-local" value="${task?.due?.slice(0,16)||''}"></div>
      <div><label>Materia:</label><select id="taskClass">${getDataState().materias?.map(m => `<option value="${m.nombre}" ${task?.class===m.nombre?'selected':''}>${m.nombre}</option>`).join('')||''}</select></div>
    </div>
    <div><label>Estado:</label><select id="taskStatus"><option value="draft" ${task?.status==='draft'?'selected':''}>Borrador</option><option value="published" ${task?.status==='published'?'selected':''}>Publicado</option></select>
    <label>Visibilidad:</label><select id="taskVisibility"><option value="public" ${task?.visibility==='public'?'selected':''}>Público</option><option value="restricted" ${task?.visibility==='restricted'?'selected':''}>Restringido</option></select></div>
    <div id="restrictedStudentsSection" style="display:${task?.visibility==='restricted'?'block':'none'};"><label>Alumnos (UIDs separados por coma):</label><input id="assignedStudents" value="${task?.assignedStudents?.join(',')||''}"></div>
    <div><label>Contenido:</label><div id="blockEditorContainer" style="border:1px solid #ddd; border-radius:8px; padding:12px; background:#fafafa;"></div></div>
  `;

  showModal(isEdit ? 'Editar Tarea' : 'Nueva Tarea', formDiv, async () => {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return showToast('Título obligatorio', 'error');
    const taskData = {
      title, desc: document.getElementById('taskDesc').value, due: document.getElementById('taskDue').value || null,
      class: document.getElementById('taskClass').value, status: document.getElementById('taskStatus').value,
      visibility: document.getElementById('taskVisibility').value,
      assignedStudents: document.getElementById('taskVisibility').value === 'restricted' ? document.getElementById('assignedStudents').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      teacherId: getCurrentAuthState().user.uid,
      blocks: window._currentBlockEditor?.getBlocks() || [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (isEdit) await updateDocument('tasks', task.id, taskData);
    else await addDocument('tasks', { ...taskData, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    showToast(isEdit ? 'Actualizada' : 'Creada', 'success');
    loadAllUserData(getCurrentAuthState().user.uid);
    renderTaskList();
  });

  setTimeout(() => {
    const editorContainer = document.getElementById('blockEditorContainer');
    if (editorContainer) window._currentBlockEditor = createBlockEditor(editorContainer, task?.blocks || []);
  }, 100);
}

function openTaskDetail(task) {
  const submissions = getDataState().submissions.filter(s => s.taskId === task.id);
  const detailDiv = document.createElement('div');
  detailDiv.innerHTML = `<h3>${task.title}</h3><p>${task.desc||''}</p><h4>Entregas (${submissions.length})</h4>${submissions.length===0?'<p>No hay entregas.</p>':submissions.map(s => `<div style="background:#f5f5f5; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between;"><span><strong>${s.studentName}</strong> - ${s.submittedAt?formatDate(s.submittedAt):''}</span><span>Nota: ${s.grade!==undefined?s.grade:'Sin calificar'}</span><button class="btn-grade-sub" data-subid="${s.id}" style="background:#ff9800; color:white; border:none; border-radius:6px;">Calificar</button></div>`).join('')}`;
  showModal('Detalle de Tarea', detailDiv, null);
  detailDiv.querySelectorAll('.btn-grade-sub').forEach(btn => btn.addEventListener('click', (e) => {
    const sub = getDataState().submissions.find(s => s.id === e.target.dataset.subid);
    if (sub) openGradeForm(sub);
  }));
}

function openGradeForm(submission) {
  const div = document.createElement('div');
  div.innerHTML = `<label>Nota (0-10):</label><input id="gradeInput" type="number" min="0" max="10" step="0.1" value="${submission.grade||''}" style="width:100%;"><label>Feedback:</label><textarea id="feedbackInput" rows="3" style="width:100%;">${submission.feedback||''}</textarea>`;
  showModal('Calificar', div, async () => {
    const grade = parseFloat(document.getElementById('gradeInput').value);
    const feedback = document.getElementById('feedbackInput').value;
    if (isNaN(grade) || grade<0 || grade>10) return showToast('Nota inválida', 'error');
    await updateDocument('submissions', submission.id, { grade, feedback });
    showToast('Calificación guardada', 'success');
    loadAllUserData(getCurrentAuthState().user.uid);
  });
}

function openSubmissionForm(task) {
  const div = document.createElement('div');
  div.innerHTML = `<h3>${task.title}</h3><textarea id="submissionText" rows="5" placeholder="Tu respuesta..." style="width:100%;"></textarea><input id="submissionFile" type="file" accept=".pdf,.doc,.docx,.jpg,.png" style="margin-top:10px;">`;
  showModal('Entregar Tarea', div, async () => {
    const text = document.getElementById('submissionText').value.trim();
    const file = document.getElementById('submissionFile').files[0];
    if (!text && !file) return showToast('Incluye texto o archivo', 'error');
    if (file && file.size > 5*1024*1024) return showToast('Archivo > 5MB', 'error');
    const authState = getCurrentAuthState();
    await addDocument('submissions', {
      taskId: task.id, studentId: authState.user.uid, studentName: authState.user.displayName || authState.user.email,
      text, fileName: file?.name || null, fileUrl: file?.name ? URL.createObjectURL(file) : null,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Tarea entregada', 'success');
    loadAllUserData(authState.user.uid);
  });
}