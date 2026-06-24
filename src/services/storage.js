// ============================================================
// Servicio de Storage - Subida/descarga de archivos
// ============================================================

import { storage } from '../config/firebase.js';

export async function uploadFile(path, file) {
  const storageRef = storage.ref().child(path);
  const snapshot = await storageRef.put(file);
  const downloadURL = await snapshot.ref.getDownloadURL();
  return downloadURL;
}

export async function getFileURL(path) {
  const storageRef = storage.ref().child(path);
  return await storageRef.getDownloadURL();
}

export async function deleteFile(path) {
  const storageRef = storage.ref().child(path);
  await storageRef.delete();
}