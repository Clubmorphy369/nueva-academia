// ============================================================
// Estado de autenticación
// ============================================================

import { auth, db } from '../config/firebase.js';
import { ROLES } from '../config/roles.js';
import { loadAllUserData } from './data.js';

let authState = {
  user: null,
  role: null,
  isLoggedIn: false,
  loading: true
};

const listeners = [];

export function onAuthStateChange(callback) {
  listeners.push(callback);
  callback(authState);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

function updateAuthState(newState) {
  authState = { ...authState, ...newState };
  listeners.forEach(cb => cb(authState));
}

export function initAuthObserver() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      updateAuthState({ user, isLoggedIn: true, loading: true });
      try {
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          updateAuthState({ role: userData.role || ROLES.STUDENT, loading: false });
        } else {
          await db.collection('usuarios').doc(user.uid).set({
            name: user.displayName || '',
            email: user.email,
            role: ROLES.STUDENT,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            progress: { completadas: [], favoritas: [] }
          });
          updateAuthState({ role: ROLES.STUDENT, loading: false });
        }
        await loadAllUserData(user.uid);
        import('../app.js').then(m => m.renderAll());
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        updateAuthState({ loading: false });
        import('../app.js').then(m => m.renderAll());
      }
    } else {
      updateAuthState({ user: null, role: null, isLoggedIn: false, loading: false });
      import('../app.js').then(m => m.renderAll());
    }
  });
}

export async function login(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function register(name, email, password) {
  try {
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await db.collection('usuarios').doc(user.uid).set({
      name: name,
      email: email,
      role: ROLES.STUDENT,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      progress: { completadas: [], favoritas: [] }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function recoverPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  await auth.signOut();
}

export async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loginWithMicrosoft() {
  const provider = new firebase.auth.OAuthProvider('microsoft.com');
  try {
    const result = await auth.signInWithPopup(provider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function getCurrentAuthState() {
  return { ...authState };
}