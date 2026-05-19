import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
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
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence).catch(() => {});

isSupported().then((yes) => yes && getAnalytics(app));

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

  // Firestore emulator
  try {
    connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
    // Connect auth emulator as well
    try {
      connectAuthEmulator(auth, authEmulatorUrl);
      console.log(`Firebase Auth: connected to emulator at ${authEmulatorUrl}`);
    } catch (e) {
      console.warn('Firebase Auth: could not connect to emulator', e);
    }
    console.log(
      `Firebase: connected to emulators (firestore at ${firestoreEmulatorHost}:${firestoreEmulatorPort})`
    );
  } catch (e) {
    console.warn('Firebase: could not connect to emulators', e);
  }
}
