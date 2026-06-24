// ============================================================
// Servicio de notificaciones push (FCM) y sonidos
// ============================================================

import { messaging, db } from '../config/firebase.js';
import { getCurrentAuthState } from '../state/auth.js';
import { showToast } from '../state/ui.js';

let currentSoundEnabled = true;
let currentSoundFile = '/sounds/notification.mp3';
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer = null;

async function loadSound(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.warn('No se pudo cargar el sonido:', url);
  }
}
loadSound('/sounds/notification.mp3');

export async function requestFCMPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificación denegado');
      return null;
    }
    const token = await messaging.getToken({ vapidKey: 'TU_VAPID_KEY_AQUI' });
    const authState = getCurrentAuthState();
    if (authState.user) {
      await db.collection('usuarios').doc(authState.user.uid).update({
        fcmToken: token,
        fcmTokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    return token;
  } catch (error) {
    console.error('Error al solicitar permiso FCM:', error);
    showToast('No se pudo activar notificaciones push', 'error');
    return null;
  }
}

export function onMessageListener(callback) {
  return messaging.onMessage((payload) => {
    if (callback) callback(payload);
    playNotificationSound();
  });
}

export function playNotificationSound() {
  if (!currentSoundEnabled || !audioBuffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0);
}

export function setSoundSettings(enabled, soundFile) {
  currentSoundEnabled = enabled;
  if (soundFile) {
    currentSoundFile = soundFile;
    loadSound(soundFile);
  }
}

export async function saveSoundSettings(enabled, soundFile) {
  const authState = getCurrentAuthState();
  if (!authState.user) return;
  try {
    await db.collection('usuarios').doc(authState.user.uid).update({
      'soundSettings.enabled': enabled,
      'soundSettings.file': soundFile || currentSoundFile
    });
    setSoundSettings(enabled, soundFile);
    showToast('Configuración de sonido guardada', 'success');
  } catch (error) {
    showToast('Error al guardar configuración', 'error');
  }
}

export async function loadSoundSettings() {
  const authState = getCurrentAuthState();
  if (!authState.user) return;
  try {
    const doc = await db.collection('usuarios').doc(authState.user.uid).get();
    const data = doc.data();
    if (data?.soundSettings) {
      setSoundSettings(data.soundSettings.enabled, data.soundSettings.file);
    } else {
      setSoundSettings(true, '/sounds/notification.mp3');
    }
  } catch (e) {
    console.warn('Error al cargar preferencias de sonido');
  }
}