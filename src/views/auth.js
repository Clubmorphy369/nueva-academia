// ============================================================
// Vista de autenticación: Login, Registro, Recuperación
// ============================================================

import { login, register, recoverPassword, loginWithGoogle, loginWithMicrosoft } from '../state/auth.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

let currentForm = 'login';

export function renderAuthView() {
  const container = document.getElementById('authContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="auth-wrapper" style="
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px; font-family: var(--font-family, 'Segoe UI', sans-serif);
    ">
      <div class="auth-card" style="
        background: white; border-radius: 16px; padding: 30px;
        width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">🎓 Academia Virtual</h1>
          <p style="color: #666; margin: 5px 0 0;">Tu futuro comienza aquí</p>
        </div>

        <div id="authAlert" style="padding: 10px; border-radius: 8px; margin-bottom: 15px; display: none;"></div>

        <form id="loginForm" class="auth-form">
          <div style="margin-bottom: 15px;">
            <label for="loginEmail" style="display: block; margin-bottom: 5px; font-weight: 500;">Correo electrónico</label>
            <input type="email" id="loginEmail" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label for="loginPassword" style="display: block; margin-bottom: 5px; font-weight: 500;">Contraseña</label>
            <input type="password" id="loginPassword" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: #4caf50; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; min-height: 44px;">Iniciar Sesión</button>
          <div style="margin-top: 15px; text-align: center; display: flex; flex-direction: column; gap: 10px;">
            <a href="#" id="goToRegister" style="color: #1976d2; text-decoration: none;">Crear cuenta</a>
            <a href="#" id="goToRecovery" style="color: #1976d2; text-decoration: none;">Olvidé mi contraseña</a>
          </div>
          <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
            <button type="button" id="btnGoogleLogin" style="padding: 12px; background: white; color: #444; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; min-height: 44px;">🔵 Iniciar sesión con Google</button>
            <button type="button" id="btnMicrosoftLogin" style="padding: 12px; background: white; color: #444; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; min-height: 44px;">🟦 Iniciar sesión con Microsoft</button>
          </div>
        </form>

        <form id="registerForm" class="auth-form" style="display: none;">
          <div style="margin-bottom: 15px;">
            <label for="regName" style="display: block; margin-bottom: 5px; font-weight: 500;">Nombre completo</label>
            <input type="text" id="regName" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label for="regEmail" style="display: block; margin-bottom: 5px; font-weight: 500;">Correo electrónico</label>
            <input type="email" id="regEmail" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label for="regPassword" style="display: block; margin-bottom: 5px; font-weight: 500;">Contraseña</label>
            <input type="password" id="regPassword" required minlength="6" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
            <small style="color: #666;">Mínimo 6 caracteres. Te registrarás como Alumno.</small>
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: #2196F3; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; min-height: 44px;">Registrarse</button>
          <div style="margin-top: 15px; text-align: center;">
            <a href="#" id="goToLoginFromReg" style="color: #1976d2; text-decoration: none;">← Volver al inicio de sesión</a>
          </div>
        </form>

        <form id="recoveryForm" class="auth-form" style="display: none;">
          <div style="margin-bottom: 20px;">
            <label for="recoveryEmail" style="display: block; margin-bottom: 5px; font-weight: 500;">Correo electrónico</label>
            <input type="email" id="recoveryEmail" required style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
          </div>
          <button type="submit" style="width: 100%; padding: 14px; background: #ff9800; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; min-height: 44px;">Enviar enlace</button>
          <div style="margin-top: 15px; text-align: center;">
            <a href="#" id="goToLoginFromRec" style="color: #1976d2; text-decoration: none;">← Volver al inicio de sesión</a>
          </div>
        </form>
      </div>
    </div>
  `;

  setupAuthEvents();
}

function setupAuthEvents() {
  document.getElementById('goToRegister')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('register'); });
  document.getElementById('goToRecovery')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('recovery'); });
  document.getElementById('goToLoginFromReg')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('login'); });
  document.getElementById('goToLoginFromRec')?.addEventListener('click', (e) => { e.preventDefault(); toggleForm('login'); });

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!validateEmail(email)) { showAuthAlert('Correo electrónico no válido', 'error'); return; }
    const result = await login(email, password);
    if (!result.success) showAuthAlert(result.error, 'error');
  });

  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!name) { showAuthAlert('El nombre es obligatorio', 'error'); return; }
    if (!validateEmail(email)) { showAuthAlert('Correo electrónico no válido', 'error'); return; }
    if (!validatePassword(password)) { showAuthAlert('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    const result = await register(name, email, password);
    if (result.success) { showAuthAlert('Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'success'); toggleForm('login'); }
    else showAuthAlert(result.error, 'error');
  });

  document.getElementById('recoveryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recoveryEmail').value.trim();
    if (!validateEmail(email)) { showAuthAlert('Correo electrónico no válido', 'error'); return; }
    const result = await recoverPassword(email);
    if (result.success) showAuthAlert('Enlace de recuperación enviado. Revisa tu correo.', 'success');
    else showAuthAlert(result.error, 'error');
  });

  document.getElementById('btnGoogleLogin')?.addEventListener('click', async () => {
    const result = await loginWithGoogle();
    if (!result.success) showAuthAlert(result.error, 'error');
  });
  document.getElementById('btnMicrosoftLogin')?.addEventListener('click', async () => {
    const result = await loginWithMicrosoft();
    if (!result.success) showAuthAlert(result.error, 'error');
  });
}

function toggleForm(form) {
  currentForm = form;
  document.getElementById('loginForm').style.display = form === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = form === 'register' ? 'block' : 'none';
  document.getElementById('recoveryForm').style.display = form === 'recovery' ? 'block' : 'none';
  const alert = document.getElementById('authAlert');
  alert.style.display = 'none';
  alert.textContent = '';
}

function showAuthAlert(message, type) {
  const alert = document.getElementById('authAlert');
  alert.textContent = message;
  alert.style.display = 'block';
  alert.style.background = type === 'error' ? '#ffebee' : '#e8f5e9';
  alert.style.color = type === 'error' ? '#b71c1c' : '#2e7d32';
  alert.style.border = `1px solid ${type === 'error' ? '#ef9a9a' : '#a5d6a7'}`;
}