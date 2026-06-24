// ============================================================
// Formateadores de datos (fechas, números, etc.)
// ============================================================

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(date);
}

export function timeAgo(timestamp) {
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'hace unos segundos';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return formatDate(date);
}

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '...';
}