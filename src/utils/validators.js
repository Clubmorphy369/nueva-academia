// ============================================================
// Validadores de formularios
// ============================================================

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateName(name) {
  return name && name.trim().length > 0;
}

export async function sanitizeHTML(dirty) {
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(dirty);
  }
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
}

export function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}