// ============================================================
// Vista del Foro por Materia
// ============================================================

import { getCurrentAuthState } from '../state/auth.js';
import { getDataState, loadAllUserData } from '../state/data.js';
import { showToast, showModal, setLoading } from '../state/ui.js';
import { addDocument, deleteDocument } from '../services/firestore.js';
import { createCommentCard } from '../components/comment-card.js';

let currentMateriaFilter = null;

export function renderForumView() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = `
    <div class="forum-view">
      <div style="display:flex; justify-content:space-between;"><h1>💬 Foro</h1><button id="btnNewPost" style="padding:12px 20px; background:#4caf50; color:white; border:none; border-radius:8px;">➕ Nuevo comentario</button></div>
      <select id="materiaFilter" style="margin:15px 0; padding:10px; border-radius:8px;"><option value="">Todas las materias</option></select>
      <div id="commentsContainer"></div>
    </div>
  `;
  populateMateriaFilter();
  renderComments();
  document.getElementById('btnNewPost').addEventListener('click', openNewPostForm);
  document.getElementById('materiaFilter').addEventListener('change', (e) => { currentMateriaFilter = e.target.value || null; renderComments(); });
}

function populateMateriaFilter() {
  const select = document.getElementById('materiaFilter');
  if (!select) return;
  select.innerHTML = '<option value="">Todas las materias</option>';
  (getDataState().materias||[]).forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = m.nombre; select.appendChild(o); });
}

function renderComments() {
  const container = document.getElementById('commentsContainer');
  if (!container) return;
  let comentarios = getDataState().comentarios || [];
  if (currentMateriaFilter) comentarios = comentarios.filter(c => c.materiaId === currentMateriaFilter);
  container.innerHTML = comentarios.length === 0 ? '<p style="color:#888;">No hay comentarios.</p>' : '';
  const authState = getCurrentAuthState();
  comentarios.forEach(c => container.appendChild(createCommentCard(c, { uid: authState.user?.uid, role: authState.role }, onDeleteComment)));
}

async function onDeleteComment(commentId) {
  showModal('Eliminar', '<p>¿Eliminar comentario?</p>', async () => {
    await deleteDocument('comentarios', commentId);
    showToast('Comentario eliminado', 'success');
    loadAllUserData(getCurrentAuthState().user.uid);
    renderComments();
  });
}

function openNewPostForm() {
  const materias = getDataState().materias || [];
  const div = document.createElement('div');
  div.innerHTML = `<label>Materia:</label><select id="newPostMateria">${materias.map(m => `<option value="${m.id}" data-nombre="${m.nombre}">${m.nombre}</option>`).join('')}</select><label>Comentario:</label><textarea id="newPostText" rows="4" placeholder="Usa @nombre para mencionar"></textarea>`;
  showModal('Nuevo comentario', div, async () => {
    const text = document.getElementById('newPostText').value.trim();
    if (!text) return showToast('El comentario no puede estar vacío', 'error');
    const authState = getCurrentAuthState();
    const select = document.getElementById('newPostMateria');
    await addDocument('comentarios', {
      materiaId: select.value, materiaName: select.options[select.selectedIndex].dataset.nombre,
      userId: authState.user.uid, userName: authState.user.displayName || authState.user.email,
      text, mentions: [...text.matchAll(/@(\w+)/g)].map(m => m[1]),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Comentario publicado', 'success');
    loadAllUserData(authState.user.uid);
    renderComments();
  });
}