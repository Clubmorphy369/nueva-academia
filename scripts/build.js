// ============================================================
// Script para generar src/config/firebase-config.js a partir de .env
// Ejecutar con: node scripts/build.js
// Requiere: npm install dotenv
// ============================================================

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
};

const fileContent = `// ============================================================
// Configuración de Firebase generada automáticamente
// NO MODIFICAR MANUALMENTE
// ============================================================
export default ${JSON.stringify(config, null, 2)};
`;

const outputPath = path.join(__dirname, '..', 'src', 'config', 'firebase-config.js');
fs.writeFileSync(outputPath, fileContent);
console.log('✅ firebase-config.js generado correctamente.');