// ============================================================
// Tarjeta de comentario del foro
// ============================================================

import { timeAgo } from '../utils/formatters.js';

export function createCommentCard(comment, currentUser, onDelete) {
  const card = document.createElement('div');
  card.style.cssText = `background:white; border-radius:12px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.08); margin-bottom:12px;`;
  const isOwner = currentUser && currentUser.uid === comment.userId;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const textWithMentions = comment.text.replace(/@(\w+)/g, '<span style="background:#e3f2fd; color:#1976d2; padding:2px 6px; border-radius:4px;">@$1</span>');
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between;">
      <div><strong>${comment.userName}</strong> <small>${timeAgo(comment.createdAt)}</small> <span style="background:#f0f0f0; padding:2px 8px; border-radius:10px;">${comment.materiaName}</span></div>
      ${(isOwner||isAdmin)?`<button class="btn-delete-comment" data-id="${comment.id}" style="background:none; border:1px solid #ddd; border-radius:6px; padding:4px 8px;">🗑️</button>`:''}
    </div>
    <div style="margin-top:8px;">${textWithMentions}</div>
  `;
  card.querySelector('.btn-delete-comment')?.addEventListener('click', (e) => { e.stopPropagation(); if (onDelete) onDelete(comment.id); });
  return card;
}