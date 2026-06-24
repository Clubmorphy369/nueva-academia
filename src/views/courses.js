// ============================================================
// Vista de Cursos (pública para autenticados)
// ============================================================

import { onDataChange, getDataState, setCurrentCourse } from '../state/data.js';
import { navigateTo } from '../state/ui.js';

export function renderCoursesView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <h1>📚 Cursos</h1>
    <div id="coursesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;"></div>
  `;

  const grid = document.getElementById('coursesGrid');

  onDataChange(data => {
    grid.innerHTML = '';
    if (!data.courses || data.courses.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-secondary);">No hay cursos disponibles.</p>';
      return;
    }
    data.courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.style.cssText = `
        background: var(--surface-color); border-radius: var(--border-radius, 12px);
        box-shadow: var(--shadow); overflow: hidden; cursor: pointer; transition: transform 0.2s;
      `;
      card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
      card.addEventListener('mouseleave', () => card.style.transform = 'none');

      card.innerHTML = `
        <div style="height: 120px; background: linear-gradient(45deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">
          ${course.icon || '📖'}
        </div>
        <div style="padding: 16px;">
          <h3 style="margin: 0 0 8px;">${course.title}</h3>
          <p style="color: var(--text-secondary); font-size: 14px;">${course.description || 'Sin descripción'}</p>
          <button class="btn-primary" style="margin-top: 10px; width: 100%;">Ver curso</button>
        </div>
      `;

      card.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        setCurrentCourse(course);
        navigateTo('lessons');
      });

      card.addEventListener('click', () => {
        setCurrentCourse(course);
        navigateTo('lessons');
      });

      grid.appendChild(card);
    });
  });
}