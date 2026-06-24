// ============================================================
// Configuración central de Firebase
// NUNCA usar las claves directamente fuera de este archivo.
// ============================================================

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging();

db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia múltiple, solo una pestaña activa');
  } else if (err.code == 'unimplemented') {
    console.warn('Navegador no soporta persistencia');
  }
});

export { auth, db, storage, messaging, firebase };