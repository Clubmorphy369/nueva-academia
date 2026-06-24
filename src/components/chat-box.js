// ============================================================
// Componente de Chat en tiempo real por materia
// ============================================================

import { db } from '../config/firebase.js';
import { getCurrentAuthState } from '../state/auth.js';

export function createChatBox(container, materiaId) {
  const chatDiv = document.createElement('div');
  chatDiv.innerHTML = `
    <div id="messages-${materiaId}" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;"></div>
    <input id="chatInput-${materiaId}" type="text" placeholder="Escribe un mensaje..." style="width: 100%; padding: 8px;">
  `;
  container.appendChild(chatDiv);

  const messagesContainer = document.getElementById(`messages-${materiaId}`);
  const input = document.getElementById(`chatInput-${materiaId}`);

  db.collection('chat').doc(materiaId).collection('messages')
    .orderBy('timestamp')
    .onSnapshot(snapshot => {
      messagesContainer.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        messagesContainer.innerHTML += `<div><strong>${msg.userName}:</strong> ${msg.text}</div>`;
      });
    });

  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const user = getCurrentAuthState().user;
      await db.collection('chat').doc(materiaId).collection('messages').add({
        userId: user.uid,
        userName: user.displayName || user.email,
        text: input.value.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      input.value = '';
    }
  });
}