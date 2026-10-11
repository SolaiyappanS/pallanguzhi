import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA9wnNqhECGRFg_OefPMC_RCmKWtmKSoXs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'pallanguzhi-4871c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'pallanguzhi-4871c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'pallanguzhi-4871c.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '706492757994',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:706492757994:web:fa69ac76b0525962342493',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'https://pallanguzhi-4871c-default-rtdb.firebaseio.com/',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const functions = getFunctions(app);
export const authPersistence = setPersistence(auth, browserLocalPersistence);

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(database, '127.0.0.1', 9000);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
