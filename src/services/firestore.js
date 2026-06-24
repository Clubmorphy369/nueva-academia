// ============================================================
// Configuraciones por defecto de la plataforma
// ============================================================

const DEFAULTS = {
  PROGRESS_SAVE_INTERVAL_MS: 5000,
  MIN_TOUCH_TARGET_SIZE: 44,
  BREAKPOINTS: { mobile: 0, tablet: 768, desktop: 1024 },
  RATE_LIMIT: { MAX_CREATIONS_PER_MINUTE: 5, WINDOW_MS: 60000 },
  COLLECTIONS: {
    USERS: 'usuarios', COURSES: 'courses', LESSONS: 'lessons',
    ENROLLMENTS: 'enrollments', PROGRESS: 'progress', TESTS: 'tests'
  },
  THEME: {
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#4caf50',
    backgroundColor: '#f5f5f5',
    surfaceColor: '#ffffff',
    textColor: '#333333',
    textSecondary: '#666666',
    borderColor: '#dddddd',
    borderRadius: '8px',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    baseFontSize: '16px',
    logoURL: ''
  }
};

export default DEFAULTS;