// ============================================================
// Panel de Administración
// ============================================================

import { getCurrentAuthState } from '../state/auth.js';
import { getDataState, loadAllUserData } from '../state/data.js';
import { showToast, showModal, setLoading } from '../state/ui.js';
import { ROLES } from '../config/roles.js';
import { getCollection, addDocument, updateDocument, deleteDocument, setDocument, getDocument } from '../services/firestore.js';
import { uploadFile } from '../services/storage.js';
import { getCurrentTheme } from '../services/theme.js';
import { formatDate } from '../utils/formatters.js';

let currentTab = 'usuarios';

export function renderAdminView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="admin-view">
      <h1>⚙️ Panel de Administración</h1>
      <nav class="admin-tabs" style="display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">
        ${getTabs().map(tab => `
          <button class="admin-tab-btn" data-tab="${tab.id}" style="
            padding: 10px 16px; border: none; background: none; cursor: pointer;
            border-radius: 8px 8px 0 0; min-height: 44px;
            ${tab.id === currentTab ? 'background: var(--primary-color); color: white;' : 'color: #555;'}
          ">${tab.icon} ${tab.label}</button>
        `).join('')}
      </nav>
      <div id="adminTabContent" style="background: var(--surface-color); padding: 20px; border-radius: 0 0 12px 12px; box-shadow: var(--shadow);"></div>
    </div>
  `;

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-btn').forEach(b => { b.style.background = 'none'; b.style.color = '#555'; });
      btn.style.background = 'var(--primary-color)';
      btn.style.color = 'white';
      renderCurrentTab();
    });
  });

  renderCurrentTab();
}

function getTabs() {
  return [
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'materias', label: 'Materias', icon: '📚' },
    { id: 'limites', label: 'Límites', icon: '📏' },
    { id: 'asignaciones', label: 'Asignaciones', icon: '🔗' },
    { id: 'visibilidad', label: 'Visibilidad', icon: '👁️' },
    { id: 'anuncios', label: 'Anuncios', icon: '📢' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'analiticas', label: 'Analíticas', icon: '📊' },
    { id: 'backup', label: 'Backup', icon: '💾' },
    { id: 'apariencia', label: 'Apariencia', icon: '🎨' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' }
  ];
}

function renderCurrentTab() {
  const container = document.getElementById('adminTabContent');
  if (!container) return;
  switch (currentTab) {
    case 'usuarios': renderUsuariosTab(container); break;
    case 'materias': renderMateriasTab(container); break;
    case 'limites': renderLimitesTab(container); break;
    case 'asignaciones': container.innerHTML = '<h2>🔗 Asignaciones Alumno-Maestro</h2><p>Funcionalidad en sección de usuarios.</p>'; break;
    case 'visibilidad': container.innerHTML = '<h2>👁️ Visibilidad de módulos</h2><p>Configuración de checkboxes por rol.</p>'; break;
    case 'anuncios': renderAnunciosTab(container); break;
    case 'logs': container.innerHTML = '<h2>📋 Registro de Actividad</h2><p>Logs próximamente.</p>'; break;
    case 'analiticas': renderAnaliticasTab(container); break;
    case 'backup': renderBackupTab(container); break;
    case 'apariencia': renderAparienciaTab(container); break;
    case 'notificaciones': renderNotificacionesTab(container); break;
  }
}

// ─── USUARIOS ───
async function renderUsuariosTab(container) {
  container.innerHTML = '<p>Cargando usuarios...</p>';
  const usuarios = await getCollection('usuarios');
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2>👥 Gestión de Usuarios (${usuarios.length})</h2>
      <button id="btnAddUser" style="padding:10px 20px; background:#4caf50; color:white; border:none; border-radius:8px; cursor:pointer;">➕ Agregar Usuario</button>
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <thead><tr style="background:#f5f5f5;"><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
      <tbody id="usersTableBody">
        ${usuarios.map(u => `
          <tr style="border-bottom:1px solid #eee;">
            <td>${u.name || 'Sin nombre'}</td><td>${u.email}</td>
            <td><select class="role-select" data-uid="${u.id}" style="padding:6px;border-radius:4px;">
              <option value="student" ${u.role==='student'?'selected':''}>Alumno</option>
              <option value="teacher" ${u.role==='teacher'?'selected':''}>Maestro</option>
              <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
            </select></td>
            <td><button class="btn-delete-user" data-uid="${u.id}" style="background:#f44336;color:white;border:none;padding:6px 12px;border-radius:6px;">🗑️</button></td>
          </tr>`).join('')
        }
      </tbody>
    </table>
  `;

  container.querySelectorAll('.role-select').forEach(sel => sel.addEventListener('change', async (e) => {
    await updateDocument('usuarios', e.target.dataset.uid, { role: e.target.value });
    showToast('Rol actualizado', 'success');
  }));
  container.querySelectorAll('.btn-delete-user').forEach(btn => btn.addEventListener('click', (e) => {
    const uid = e.target.dataset.uid;
    showModal('Eliminar usuario', '<p>¿Estás seguro?</p>', async () => {
      await deleteDocument('usuarios', uid);
      showToast('Usuario eliminado', 'success');
      renderUsuariosTab(container);
    });
  }));
  document.getElementById('btnAddUser').addEventListener('click', () => showAddUserModal(container));
}

function showAddUserModal(container) {
  const div = document.createElement('div');
  div.innerHTML = `
    <label>Nombre:</label><input id="newUserName" required style="width:100%;padding:8px;">
    <label>Email:</label><input id="newUserEmail" type="email" required style="width:100%;padding:8px;">
    <label>Contraseña:</label><input id="newUserPassword" type="password" required minlength="6" style="width:100%;padding:8px;">
    <label>Rol:</label><select id="newUserRole" style="width:100%;padding:8px;"><option value="student">Alumno</option><option value="teacher">Maestro</option><option value="admin">Admin</option></select>
  `;
  showModal('Agregar Usuario', div, async () => {
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    if (!name || !email || !password) return showToast('Completa todos los campos', 'error');
    const { auth } = await import('../config/firebase.js');
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await setDocument('usuarios', userCred.user.uid, { name, email, role, createdAt: firebase.firestore.FieldValue.serverTimestamp(), progress: { completadas: [], favoritas: [] } });
    showToast('Usuario creado', 'success');
    renderUsuariosTab(document.getElementById('adminTabContent'));
  });
}

// ─── MATERIAS ───
function renderMateriasTab(container) {
  const materias = getDataState().materias || [];
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between;"><h2>📚 Materias (${materias.length})</h2><button id="btnAddMateria" style="padding:10px 20px; background:#4caf50; color:white; border:none; border-radius:8px;">➕ Nueva Materia</button></div>
    <ul id="materiasList" style="list-style:none; padding:0; margin-top:20px;">
      ${materias.map(m => `<li style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;"><span>${m.nombre}</span><div><button class="btn-edit-materia" data-id="${m.id}" data-nombre="${m.nombre}" style="margin-right:8px; background:#2196F3; color:white; border:none; padding:6px 12px; border-radius:6px;">✏️</button><button class="btn-delete-materia" data-id="${m.id}" style="background:#f44336; color:white; border:none; padding:6px 12px; border-radius:6px;">🗑️</button></div></li>`).join('')}
    </ul>
  `;
  document.getElementById('btnAddMateria')?.addEventListener('click', () => showMateriaForm(null, container));
  container.querySelectorAll('.btn-edit-materia').forEach(b => b.addEventListener('click', () => showMateriaForm({ id: b.dataset.id, nombre: b.dataset.nombre }, container)));
  container.querySelectorAll('.btn-delete-materia').forEach(b => b.addEventListener('click', async () => {
    showModal('Eliminar', '<p>¿Eliminar materia?</p>', async () => {
      await deleteDocument('materias', b.dataset.id);
      showToast('Materia eliminada', 'success');
      loadAllUserData(getCurrentAuthState().user.uid);
      renderMateriasTab(container);
    });
  }));
}

function showMateriaForm(materia, container) {
  const div = document.createElement('div');
  div.innerHTML = `<label>Nombre:</label><input id="materiaNombre" value="${materia?.nombre || ''}" style="width:100%;padding:8px;">`;
  showModal(materia ? 'Editar Materia' : 'Nueva Materia', div, async () => {
    const nombre = document.getElementById('materiaNombre').value.trim();
    if (!nombre) return showToast('Nombre requerido', 'error');
    if (materia) await updateDocument('materias', materia.id, { nombre });
    else await addDocument('materias', { nombre });
    showToast(materia ? 'Actualizada' : 'Creada', 'success');
    loadAllUserData(getCurrentAuthState().user.uid);
    renderMateriasTab(container);
  });
}

// ─── OTRAS PESTAÑAS ───
function renderLimitesTab(container) {
  const s = getDataState().settings || {};
  container.innerHTML = `<h2>📏 Límites</h2><label>Máx clases/maestro:</label><input id="maxClases" type="number" value="${s.maxClases||5}" style="width:100px;margin:10px;"><label>Máx alumnos/maestro:</label><input id="maxAlumnos" type="number" value="${s.maxAlumnos||30}" style="width:100px;margin:10px;"><button id="saveLimites" style="padding:10px 20px; background:var(--primary-color); color:white; border:none; border-radius:8px;">Guardar</button>`;
  document.getElementById('saveLimites').addEventListener('click', async () => {
    await setDocument('settings', 'config', { maxClases: +document.getElementById('maxClases').value, maxAlumnos: +document.getElementById('maxAlumnos').value }, true);
    showToast('Guardado', 'success');
  });
}

function renderAnunciosTab(container) {
  const anuncio = getDataState().anuncioGlobal || '';
  container.innerHTML = `<h2>📢 Anuncio Global</h2><textarea id="anuncioText" rows="4" style="width:100%;padding:10px;">${anuncio}</textarea><button id="saveAnuncio" style="margin-top:10px; padding:10px 20px; background:var(--primary-color); color:white; border:none; border-radius:8px;">Guardar</button>`;
  document.getElementById('saveAnuncio').addEventListener('click', async () => {
    await setDocument('settings', 'anuncio', { texto: document.getElementById('anuncioText').value }, true);
    showToast('Anuncio guardado', 'success');
  });
}

function renderAnaliticasTab(container) {
  const stats = getDataState().stats;
  container.innerHTML = `<h2>📊 Analíticas</h2><p>Usuarios: ${stats.totalUsers} | Tareas: ${stats.totalTasks} | Entregas: ${stats.totalSubmissions} | Comentarios: ${stats.totalComments}</p>`;
}

function renderBackupTab(container) {
  container.innerHTML = `<h2>💾 Respaldo</h2><button id="btnExport" style="padding:10px 20px; background:#4caf50; color:white; border:none; border-radius:8px;">Exportar JSON</button><button id="btnImport" style="margin-left:10px; padding:10px 20px; background:#ff9800; color:white; border:none; border-radius:8px;">Importar JSON</button>`;
  document.getElementById('btnExport').addEventListener('click', () => {
    const data = getDataState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup.json'; a.click();
  });
  document.getElementById('btnImport').addEventListener('click', () => showToast('Importación en desarrollo', 'info'));
}

async function renderAparienciaTab(container) {
  const theme = getCurrentTheme();
  container.innerHTML = `
    <h2>🎨 Personalización Visual</h2>
    <div style="margin-bottom:20px;"><h3>Modo</h3><button id="toggleDarkMode" style="padding:10px 20px; border-radius:8px;">${theme.mode==='dark'?'☀️ Claro':'🌙 Oscuro'}</button></div>
    <div style="margin-bottom:20px;"><h3>Logo</h3><img id="logoPreview" src="${theme.logoURL||''}" style="max-width:200px; display:${theme.logoURL?'block':'none'}; margin:10px 0;"><input type="file" id="logoFile" accept="image/*"><button id="uploadLogoBtn" style="padding:8px 15px; background:var(--primary-color); color:white; border:none; border-radius:6px;">Subir</button>${theme.logoURL?`<button id="removeLogoBtn" style="margin-left:10px; padding:8px 15px; background:#f44336; color:white; border:none; border-radius:6px;">Eliminar</button>`:''}</div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:20px;">
      ${['primaryColor','secondaryColor','backgroundColor','surfaceColor','textColor','textSecondary','borderColor'].map(c => `<div><label>${c}:</label><input id="${c}" type="color" value="${theme[c]}" style="width:100%;height:40px;"></div>`).join('')}
    </div>
    <div style="display:flex; gap:20px; margin-top:20px;">
      <div><label>Fuente:</label><select id="fontFamilySelect"><option ${theme.fontFamily.includes('Segoe')?'selected':''}>'Segoe UI', sans-serif</option><option ${theme.fontFamily.includes('Arial')?'selected':''}>Arial, sans-serif</option><option ${theme.fontFamily.includes('Roboto')?'selected':''}>'Roboto', sans-serif</option></select></div>
      <div><label>Tamaño:</label><input id="baseFontSize" type="number" value="${parseInt(theme.baseFontSize)}" min="12" max="24" style="width:80px;"></div>
      <div><label>Bordes:</label><select id="borderRadiusSelect"><option value="4px" ${theme.borderRadius==='4px'?'selected':''}>4px</option><option value="8px" ${theme.borderRadius==='8px'?'selected':''}>8px</option><option value="12px" ${theme.borderRadius==='12px'?'selected':''}>12px</option></select></div>
    </div>
    <button id="saveAppearance" style="margin-top:20px; padding:12px 24px; background:var(--primary-color); color:white; border:none; border-radius:8px;">Aplicar</button>
  `;

  document.getElementById('toggleDarkMode').addEventListener('click', async () => { const { toggleDarkMode } = await import('../services/theme.js'); await toggleDarkMode(); renderAparienciaTab(container); });
  document.getElementById('uploadLogoBtn').addEventListener('click', async () => {
    const file = document.getElementById('logoFile').files[0];
    if (!file) return showToast('Selecciona imagen', 'warning');
    const url = await uploadFile(`logos/logo_${Date.now()}.${file.name.split('.').pop()}`, file);
    const { updateLogo } = await import('../services/theme.js'); await updateLogo(url);
    document.getElementById('logoPreview').src = url; document.getElementById('logoPreview').style.display = 'block';
  });
  document.getElementById('removeLogoBtn')?.addEventListener('click', async () => { const { updateLogo } = await import('../services/theme.js'); await updateLogo(''); document.getElementById('logoPreview').style.display = 'none'; });
  document.getElementById('saveAppearance').addEventListener('click', async () => {
    const { saveTheme } = await import('../services/theme.js');
    await saveTheme({
      primaryColor: document.getElementById('primaryColor').value, secondaryColor: document.getElementById('secondaryColor').value,
      backgroundColor: document.getElementById('backgroundColor').value, surfaceColor: document.getElementById('surfaceColor').value,
      textColor: document.getElementById('textColor').value, textSecondary: document.getElementById('textSecondary').value,
      borderColor: document.getElementById('borderColor').value, fontFamily: document.getElementById('fontFamilySelect').value,
      baseFontSize: document.getElementById('baseFontSize').value + 'px', borderRadius: document.getElementById('borderRadiusSelect').value
    });
  });
}

async function renderNotificacionesTab(container) {
  const authState = getCurrentAuthState();
  const userDoc = await getDocument('usuarios', authState.user.uid);
  const soundSettings = userDoc?.soundSettings || { enabled: true, file: '/sounds/notification.mp3' };
  container.innerHTML = `
    <h2>🔔 Notificaciones</h2>
    <label><input type="checkbox" id="soundEnabled" ${soundSettings.enabled?'checked':''}> Sonidos</label>
    <input type="text" id="soundFile" value="${soundSettings.file}" style="width:100%; margin:10px 0;">
    <button id="testSoundBtn">🔊 Probar</button>
    <button id="saveSoundSettings" style="margin-left:10px; padding:10px 20px; background:var(--primary-color); color:white; border:none; border-radius:8px;">Guardar</button>
    <hr><p>Push: ${Notification.permission==='granted'?'✅ Activadas':'❌ Desactivadas'}</p>
    <button id="requestPushPermission" style="padding:10px 20px; background:#ff9800; color:white; border:none; border-radius:8px;">${Notification.permission==='granted'?'Reenviar token':'Activar push'}</button>
  `;
  document.getElementById('testSoundBtn').addEventListener('click', () => { const { setSoundSettings, playNotificationSound } = await import('../services/notifications.js'); setSoundSettings(true, document.getElementById('soundFile').value); playNotificationSound(); });
  document.getElementById('saveSoundSettings').addEventListener('click', async () => { const { saveSoundSettings } = await import('../services/notifications.js'); await saveSoundSettings(document.getElementById('soundEnabled').checked, document.getElementById('soundFile').value); });
  document.getElementById('requestPushPermission').addEventListener('click', async () => { const { requestFCMPermission } = await import('../services/notifications.js'); const token = await requestFCMPermission(); if (token) showToast('Push activado', 'success'); });
}