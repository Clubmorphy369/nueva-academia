// ============================================================
// Estado de los datos de la aplicación
// ============================================================

import { db } from '../config/firebase.js';
import { ROLES } from '../config/roles.js';
import { getCurrentAuthState } from './auth.js';

let dataState = {
  courses: [],
  userProgress: null,
  enrollments: [],
  currentCourse: null,
  currentLesson: null,
  tasks: [],
  submissions: [],
  materias: [],
  comentarios: [],
  events: [],
  notifications: [],
  students: [],
  rooms: [],
  settings: {},
  anuncioGlobal: '',
  stats: { totalUsers: 0, totalTasks: 0, totalSubmissions: 0, totalComments: 0 },
  loading: false
};

const dataListeners = [];

export function onDataChange(callback) {
  dataListeners.push(callback);
  callback(dataState);
  return () => {
    const idx = dataListeners.indexOf(callback);
    if (idx > -1) dataListeners.splice(idx, 1);
  };
}

function updateDataState(newData) {
  dataState = { ...dataState, ...newData };
  dataListeners.forEach(cb => cb(dataState));
}

export async function loadAllUserData(uid) {
  updateDataState({ loading: true });
  try {
    const coursesSnap = await db.collection('courses').get();
    const courses = [];
    coursesSnap.forEach(doc => courses.push({ id: doc.id, ...doc.data() }));

    const enrollmentsSnap = await db.collection('usuarios').doc(uid).collection('enrollments').get();
    const enrollments = [];
    enrollmentsSnap.forEach(doc => enrollments.push({ id: doc.id, ...doc.data() }));

    const userDoc = await db.collection('usuarios').doc(uid).get();
    const userData = userDoc.data();
    const userProgress = userData?.progress || { completadas: [], favoritas: [] };

    const tasksSnap = await db.collection('tasks').orderBy('due', 'asc').get();
    const tasks = [];
    tasksSnap.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

    const submissionsSnap = await db.collection('submissions').get();
    const submissions = [];
    submissionsSnap.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));

    let materias = [];
    try {
      const materiasSnap = await db.collection('materias').get();
      materiasSnap.forEach(doc => materias.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}

    let comentarios = [];
    try {
      const comentariosSnap = await db.collection('comentarios').orderBy('createdAt', 'desc').limit(100).get();
      comentariosSnap.forEach(doc => comentarios.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}

    let events = [];
    try {
      const eventsSnap = await db.collection('events').orderBy('startDate', 'asc').get();
      eventsSnap.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}

    let notifications = [];
    try {
      const notifSnap = await db.collection('usuarios').doc(uid).collection('notifications')
        .orderBy('createdAt', 'desc').limit(50).get();
      notifSnap.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}

    let rooms = [];
    try {
      const roomsSnap = await db.collection('rooms').get();
      roomsSnap.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}

    const usersSnap = await db.collection('usuarios').get();
    const totalUsers = usersSnap.size;
    const totalTasks = tasksSnap.size;
    const totalSubmissions = submissionsSnap.size;
    let totalComments = 0;
    try {
      const commentsSnap = await db.collection('comentarios').get();
      totalComments = commentsSnap.size;
    } catch (e) {}

    let settings = {};
    try {
      const settingsDoc = await db.collection('settings').doc('config').get();
      if (settingsDoc.exists) settings = settingsDoc.data();
    } catch (e) {}

    let anuncioGlobal = '';
    try {
      const anuncioDoc = await db.collection('settings').doc('anuncio').get();
      if (anuncioDoc.exists) anuncioGlobal = anuncioDoc.data().texto;
    } catch (e) {}

    updateDataState({
      courses, enrollments, userProgress, tasks, submissions, materias, comentarios,
      events, notifications, rooms, settings, anuncioGlobal,
      stats: { totalUsers, totalTasks, totalSubmissions, totalComments: totalComments },
      loading: false
    });
  } catch (error) {
    console.error('Error cargando datos:', error);
    updateDataState({ loading: false });
  }
}

export async function loadStudents() {
  const authState = getCurrentAuthState();
  if (!authState.user || (authState.role !== ROLES.INSTRUCTOR && authState.role !== ROLES.ADMIN)) return;
  try {
    const usersSnap = await db.collection('usuarios').where('role', '==', 'student').get();
    const students = [];
    usersSnap.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
    updateDataState({ students });
  } catch (error) {
    console.error('Error cargando estudiantes:', error);
  }
}

export function setCurrentCourse(course) {
  updateDataState({ currentCourse: course });
}

export function getDataState() {
  return { ...dataState };
}