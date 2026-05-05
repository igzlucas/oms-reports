// Las credenciales de Firebase se cargarán automáticamente desde las variables de entorno
// en un entorno de Firebase App Hosting. Para el desarrollo local, estas credenciales
// deben ser proporcionadas en un archivo .env.local.
// La importación de 'dotenv/config' se ha movido a un punto de entrada del servidor 
// para asegurar que las variables se carguen antes de la inicialización de Firebase.

const sanitizeString = (str: string | undefined): string | undefined => {
    if (!str) return undefined;
    // Elimina espacios en blanco y comillas (' o ") al principio/final
    return str.trim().replace(/^["']|["']$/g, '');
};

export const firebaseConfig = {
  projectId: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  appId: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  storageBucket: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  apiKey: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  messagingSenderId: sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
};