// ============================================================
// Definición de roles y sus permisos
// ============================================================

const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'teacher',
  STUDENT: 'student'
};

const PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_courses', 'manage_content', 'view_all_progress', 'delete_content'],
  [ROLES.INSTRUCTOR]: ['create_courses', 'edit_own_courses', 'manage_own_lessons', 'view_enrolled_students'],
  [ROLES.STUDENT]: ['enroll_courses', 'view_content', 'submit_tasks', 'view_own_progress']
};

function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) || false;
}

export { ROLES, PERMISSIONS, hasPermission };