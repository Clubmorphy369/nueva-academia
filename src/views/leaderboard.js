// ============================================================
// Vista de Leaderboard (Tabla de clasificación)
// ============================================================

import { db } from '../config/firebase.js';
import { getCurrentAuthState } from '../state/auth.js';

export async function renderLeaderboardView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = '<p style="text-align: center; margin-top: 40px;">Cargando ranking...</p>';

  try {
    const usersSnap = await db.collection('usuarios').where('role', '==', 'student').get();
    const users = [];

    for (const userDoc of usersSnap.docs) {
      const badgesSnap = await db.collection('usuarios').doc(userDoc.id).collection('badges').get();
      const userData = userDoc.data();
      users.push({
        name: userData.name || userData.email,
        points: badgesSnap.size,
        badges: badgesSnap.docs.map(d => d.data().name)
      });
    }

    users.sort((a, b) => b.points - a.points);

    main.innerHTML = `
      <div class="leaderboard-view">
        <h1>🏆 Tabla de Clasificación</h1>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Ranking basado en insignias obtenidas</p>
        <div id="leaderboardList" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;

    const list = document.getElementById('leaderboardList');

    if (users.length === 0) {
      list.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No hay alumnos registrados.</p>';
      return;
    }

    users.forEach((user, index) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--surface-color);
        border-radius: var(--border-radius, 12px);
        padding: 16px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        gap: 15px;
        border-left: 5px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : 'var(--primary-color)'};
      `;

      const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

      card.innerHTML = `
        <div style="font-size: 24px; font-weight: bold; min-width: 40px; text-align: center;">
          ${medalEmoji || `#${index + 1}`}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0;">${user.name}</h3>
          <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 14px;">
            ${user.badges.length > 0 ? user.badges.slice(0, 3).join(', ') + (user.badges.length > 3 ? '...' : '') : 'Sin insignias aún'}
          </p>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: var(--primary-color);">${user.points}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">insignias</div>
        </div>
      `;

      list.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar leaderboard:', error);
    main.innerHTML = '<p style="color: red; text-align: center;">Error al cargar el ranking.</p>';
  }
}