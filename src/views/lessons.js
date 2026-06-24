// ============================================================
// Vista de Lecciones de un Curso
// ============================================================

import { getDataState, setCurrentCourse } from '../state/data.js';
import { navigateTo } from '../state/ui.js';
import { getCollection } from '../services/firestore.js';

export function renderLessonsView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const data = getDataState();
  const course = data.currentCourse;

  if (!course) {
    main.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 40px;">Selecciona un curso primero.</p>';
    return;
  }

  main.innerHTML = `
    <div class="lessons-view">
      <button id="backToCourses" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 16px; margin-bottom: 20px;">
        ← Volver a cursos
      </button>
      <h1>📖 ${course.title}</h1>
      <p style="color: var(--text-secondary);">${course.description || ''}</p>
      <div id="lessonsList" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
        <p style="color: var(--text-secondary);">Cargando lecciones...</p>
      </div>
    </div>
  `;

  document.getElementById('backToCourses').addEventListener('click', () => {
    setCurrentCourse(null);
    navigateTo('courses');
  });

  loadLessons(course.id);
}

async function loadLessons(courseId) {
  const container = document.getElementById('lessonsList');
  if (!container) return;

  try {
    const lessons = await getCollection(`courses/${courseId}/lessons`);
    container.innerHTML = '';

    if (lessons.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No hay lecciones en este curso todavía.</p>';
      return;
    }

    lessons.forEach((lesson, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: var(--surface-color);
        border-radius: var(--border-radius, 8px);
        padding: 16px;
        box-shadow: var(--shadow);
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      item.addEventListener('mouseenter', () => item.style.transform = 'translateX(4px)');
      item.addEventListener('mouseleave', () => item.style.transform = 'none');

      item.innerHTML = `
        <div style="background: var(--primary-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
          ${index + 1}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0;">${lesson.title}</h3>
          <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 14px;">${lesson.description || 'Sin descripción'}</p>
        </div>
        <span style="color: var(--text-secondary);">▶️</span>
      `;

      item.addEventListener('click', () => {
        // Aquí se podría integrar un reproductor de video/contenido
        alert(`Lección: ${lesson.title}\n\nContenido: ${lesson.content || 'No disponible'}`);
        // En una implementación real, se navegaría a un reproductor embebido
      });

      container.appendChild(item);
    });
  } catch (error) {
    console.error('Error al cargar lecciones:', error);
    container.innerHTML = '<p style="color: red;">Error al cargar las lecciones.</p>';
  }
}