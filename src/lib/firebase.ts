import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_APP_ENV === 'production' 
    ? import.meta.env.PUBLIC_FIREBASE_API_KEY 
    : 'dummy-api-key-for-emulator',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db =
  import.meta.env.PUBLIC_APP_ENV !== 'production'
    ? initializeFirestore(app, { experimentalForceLongPolling: true })
    : getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
// Restringe el selector de cuentas de Google al dominio institucional y
// fuerza a elegir cuenta (evita auto-login con una cuenta no institucional).
googleProvider.setCustomParameters({
  hd: 'umss.edu',
  prompt: 'select_account',
});

setPersistence(auth, browserLocalPersistence).catch(() => {});

if (import.meta.env.PUBLIC_APP_ENV === 'production') {
  isSupported().then((yes) => yes && getAnalytics(app));
}

export { app, auth, db, storage, googleProvider };

// Connect to emulators when not in production
// PUBLIC_APP_ENV is set in .env (development or production)
if (import.meta.env.PUBLIC_APP_ENV !== 'production') {
  const firestoreEmulatorHost =
    import.meta.env.PUBLIC_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const firestoreEmulatorPort = Number(
    import.meta.env.PUBLIC_FIRESTORE_EMULATOR_PORT || 8080
  );
  const authEmulatorUrl =
    import.meta.env.PUBLIC_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';

  // Auth emulator (independiente de Firestore: si Firestore falla, Auth igual
  // debe conectar, de lo contrario el cliente emite tokens contra Firebase real
  // y el Admin SDK los rechaza con "Token invalido").
  try {
    // disableWarnings oculta el banner rojo que Firebase inyecta solo;
    // mostramos nuestro propio aviso cerrable (EmulatorBanner).
    connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
    console.log(`Firebase Auth: connected to emulator at ${authEmulatorUrl}`);
  } catch (e) {
    console.warn('Firebase Auth: could not connect to emulator', e);
  }

  // Firestore emulator
  try {
    connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
    console.log(
      `Firebase: connected to emulators (firestore at ${firestoreEmulatorHost}:${firestoreEmulatorPort})`
    );
  } catch (e) {
    console.warn('Firebase: could not connect to firestore emulator', e);
  }
}
