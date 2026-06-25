// ============================================================
// Configuración central de Firebase
// NUNCA usar las claves directamente fuera de este archivo.
// ============================================================

const firebase = window.firebase;

const firebaseConfig = {

  apiKey: "AIzaSyCfBqdYlZY3ELO2ti0tiPrzau6JccAfRtM",
  authDomain: "plataformaeducativa-8d5ac.firebaseapp.com",
  projectId: "plataformaeducativa-8d5ac",
  storageBucket: "plataformaeducativa-8d5ac.firebasestorage.app",
  messagingSenderId: "358052040473",
  appId: "1:358052040473:web:b5a476c7d3bb10c9b7bf88"
};

// Inicializar Firebase solo si no está ya inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Referencias a servicios para usar en toda la app
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const messaging = firebase.messaging();

// Configuración de Firestore para offline y caché
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Persistencia múltiple, solo una pestaña activa');
  } else if (err.code == 'unimplemented') {
    console.warn('Navegador no soporta persistencia');
  }
});

// Exportar instancias
export { auth, db, storage, messaging, firebase };
