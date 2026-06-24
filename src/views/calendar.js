// ============================================================
// Vista de Calendario de Eventos
// ============================================================

import { getCurrentAuthState } from '../state/auth.js';
import { getDataState, loadAllUserData } from '../state/data.js';
import { showToast, showModal, setLoading } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { addDocument, deleteDocument } from '../services/firestore.js';

let currentMateriaFilter = null;

export function renderCalendarView() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = `
    <h1>📅 Calendario de Eventos</h1>
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
      <div id="calendarActions"></div>
      <select id="materiaFilter" style="padding:10px; border-radius:8px;"><option value="">Todas las materias</option></select>
    </div>
    <div id="eventsList"></div>
  `;
  updateCalendarActions();
  populateMateriaFilter();
  renderEventsList();
  document.getElementById('materiaFilter').addEventListener('change', (e) => { currentMateriaFilter = e.target.value || null; renderEventsList(); });
}

function updateCalendarActions() {
  const actions = document.getElementById('calendarActions');
  if (!actions) return;
  if ([ROLES.INSTRUCTOR, ROLES.ADMIN].includes(getCurrentAuthState().role)) {
    actions.innerHTML = `<button id="btnNewEvent" style="padding:12px 20px; background:#4caf50; color:white; border:none; border-radius:8px;">➕ Nuevo Evento</button>`;
    document.getElementById('btnNewEvent')?.addEventListener('click', openNewEventForm);
  }
}

function populateMateriaFilter() {
  const select = document.getElementById('materiaFilter');
  if (!select) return;
  select.innerHTML = '<option value="">Todas las materias</option>';
  (getDataState().materias||[]).forEach(m => { const o = document.createElement('option'); o.value = m.nombre; o.textContent = m.nombre; select.appendChild(o); });
}

function renderEventsList() {
  const container = document.getElementById('eventsList');
  if (!container) return;
  let events = getDataState().events || [];
  if (currentMateriaFilter) events = events.filter(e => e.class === currentMateriaFilter);
  events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  container.innerHTML = events.length === 0 ? '<p style="color:#888;">No hay eventos.</p>' : '';
  events.forEach(e => container.appendChild(createEventCard(e)));
}

function createEventCard(event) {
  const now = new Date();
  const start = new Date(event.startDate);
  const isUpcoming = (start - now) > 0 && (start - now) < 86400000;
  const authState = getCurrentAuthState();
  const isOwner = authState.user?.uid === event.createdBy;
  const isAdmin = authState.role === ROLES.ADMIN;
  const card = document.createElement('div');
  card.style.cssText = `background:white; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-bottom:12px; border-left:5px solid ${isUpcoming?'#f44336':'#2196F3'};`;
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between;"><h3>${event.title}</h3>${isUpcoming?'<span style="background:#ffebee; color:#c62828; padding:4px 10px; border-radius:20px;">Próximo</span>':''}</div>
    <span style="background:#e0e0e0; padding:2px 8px; border-radius:12px;">${event.class||'Sin materia'}</span>
    <div style="margin-top:10px;"><span>📅 ${start.toLocaleDateString('es-ES')}</span> <span>🕒 ${start.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} - ${new Date(event.endDate).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div>
    ${(isOwner||isAdmin)?`<button class="btn-delete-event" data-id="${event.id}" style="margin-top:10px; background:none; border:1px solid #ddd; border-radius:6px; padding:6px 10px; cursor:pointer;">🗑️</button>`:''}
  `;
  card.querySelector('.btn-delete-event')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showModal('Eliminar evento', '<p>¿Seguro?</p>', async () => { await deleteDocument('events', event.id); showToast('Evento eliminado', 'success'); loadAllUserData(authState.user.uid); renderEventsList(); });
  });
  return card;
}

function openNewEventForm() {
  const div = document.createElement('div');
  div.innerHTML = `
    <label>Título:</label><input id="eventTitle" required style="width:100%; padding:8px;">
    <label>Materia:</label><select id="eventClass" style="width:100%; padding:8px;">${getDataState().materias?.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('')||''}</select>
    <div style="display:flex; gap:10px;"><div><label>Inicio:</label><input id="eventStart" type="datetime-local" required></div><div><label>Fin:</label><input id="eventEnd" type="datetime-local" required></div></div>
    <label><input type="checkbox" id="createRoom"> Crear sala de videollamada</label>
  `;
  showModal('Nuevo Evento', div, async () => {
    const title = document.getElementById('eventTitle').value.trim();
    const startDate = document.getElementById('eventStart').value;
    const endDate = document.getElementById('eventEnd').value;
    if (!title || !startDate || !endDate) return showToast('Completa los campos', 'error');
    if (new Date(endDate) <= new Date(startDate)) return showToast('Fin debe ser posterior', 'error');
    const authState = getCurrentAuthState();
    await addDocument('events', { title, class: document.getElementById('eventClass').value, startDate, endDate, createdBy: authState.user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    if (document.getElementById('createRoom').checked) {
      const roomName = `event-${Date.now()}-${title.replace(/\s/g,'_')}`;
      await addDocument('rooms', { materia: document.getElementById('eventClass').value, roomName, url: `https://meet.jit.si/${roomName}`, createdBy: authState.user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    showToast('Evento creado', 'success');
    loadAllUserData(authState.user.uid);
    renderEventsList();
  });
}