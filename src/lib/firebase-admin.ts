import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const serviceAccountJson = import.meta.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const useEmulators = import.meta.env.PUBLIC_APP_ENV !== 'production';

if (useEmulators) {
  // Usar 127.0.0.1 (IPv4) en vez de 'localhost': Node resuelve 'localhost' a
  // ::1 (IPv6) primero, pero los emuladores escuchan solo en IPv4 → ECONNREFUSED.
  process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
}

function getCredential() {
  if (useEmulators) {
    return undefined;
  }

  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return applicationDefault();
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        ...(getCredential() ? { credential: getCredential() } : {}),
        projectId,
      });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
