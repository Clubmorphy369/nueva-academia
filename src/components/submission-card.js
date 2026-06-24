// ============================================================
// Tarjeta de Entrega
// ============================================================

import { formatDate } from '../utils/formatters.js';

export function createSubmissionCard(submission, task, onClick) {
  const card = document.createElement('div');
  card.className = 'submission-card';
  card.style.cssText = `
    background: white; border-radius: 12px; padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;
    transition: transform 0.2s; margin-bottom: 12px;
    display: flex; justify-content: space-between; align-items: center;
  `;
  card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
  card.addEventListener('mouseleave', () => card.style.transform = 'none');

  const submittedDate = submission.submittedAt ? formatDate(submission.submittedAt) : 'Fecha desconocida';
  const gradeText = submission.grade !== undefined ? `${submission.grade}/10` : 'Sin calificar';
  const gradeColor = submission.grade !== undefined ? (submission.grade >= 7 ? '#2e7d32' : '#c62828') : '#888';

  card.innerHTML = `
    <div style="flex: 1;">
      <h3 style="margin: 0 0 4px;">${task?.title || 'Tarea'}</h3>
      <p style="margin: 0; color: #666;">${submission.studentName}</p>
      <small style="color: #888;">📅 ${submittedDate}</small>
      ${submission.fileName ? `<div style="font-size:12px; color:#1976d2;">📎 ${submission.fileName}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 20px; color: ${gradeColor};">${gradeText}</div>
      ${submission.feedback ? `<p style="margin:4px 0 0; font-size:12px; color:#555;">“${submission.feedback.substring(0, 50)}...”</p>` : ''}
    </div>
  `;

  card.addEventListener('click', () => onClick(submission));
  return card;
}