# Academia Virtual

Plataforma educativa SPA con Firebase, Vanilla JS y diseño mobile-first.

## Características
- Autenticación con email, Google y Microsoft
- Roles: Alumno, Maestro, Administrador
- Tareas con editor de bloques multimedia
- Foro por materia, calendario de eventos, videollamadas Jitsi
- Gamificación (insignias y leaderboard)
- PWA instalable y notificaciones push
- Personalización visual completa (temas, colores, logo)

## Configuración
1. Copia `.env.example` a `.env` y completa con tus credenciales de Firebase.
2. Ejecuta `npm install` y luego `node scripts/build.js` para generar la configuración de Firebase.
3. Despliega con `firebase deploy` o mediante GitHub Actions.

## Licencia
MIT