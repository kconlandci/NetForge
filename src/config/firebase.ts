// ============================================================
// NetForge — Firebase Configuration
// JS SDK with explicit browserLocalPersistence for WebView
// ============================================================

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";

// IMPORTANT: These are client-side Firebase config values.
// They are NOT secrets — they identify the project to Firebase.
// Security is enforced by Firebase Security Rules, not by hiding these.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "netforge-xxxxx.firebaseapp.com",
  projectId: "netforge-xxxxx",
  storageBucket: "netforge-xxxxx.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx",
};

const app = initializeApp(firebaseConfig);

// Use initializeAuth with explicit persistence instead of getAuth().
// getAuth() uses indexedDB by default, which can fail silently in
// Android WebView. browserLocalPersistence uses localStorage, which
// combined with our @capacitor/preferences UID backup, provides
// resilient auth persistence.
const auth: Auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export { app, auth };
