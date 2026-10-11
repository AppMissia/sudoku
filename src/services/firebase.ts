// src/services/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAsEAKGa3IGqHBp9SrDlucqpPo2Vj3Q1dw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "sudoke-8cc5c.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "sudoke-8cc5c",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "sudoke-8cc5c.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "626560038568",
  appId: env.VITE_FIREBASE_APP_ID || "1:626560038568:web:dd18a696e670c22ae8749d",
};

/** Cloud features are enabled when valid keys are configured */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      // Offline support: writes are queued and synced when network is available
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch (err) {
    console.error("Firebase init failed:", err);
    app = null;
    auth = null;
    db = null;
  }
}

export const googleProvider = new GoogleAuthProvider();
