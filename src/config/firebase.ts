// ============================================================
// NetForge — Firebase Configuration
// JS SDK with explicit browserLocalPersistence for WebView
// Wiring pass (2026-10-19): structure follows CloudForge's
// Phase 1 config (Auth + Firestore with a persistent local
// cache, exported as `db`), which NetForge's sync service
// (src/services/sync.ts) consumes.
//
// Values below are NetForge's own, from its Firebase project
// "netforge-805d8" (created 2026-10-18; Anonymous Auth enabled,
// Firestore created in nam5, Spark plan). The web app's SDK
// config is used here, matching the family convention. Every
// value is project-specific — do NOT copy a sibling's values.
// ============================================================

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  type Firestore,
} from "firebase/firestore";

// IMPORTANT: These are client-side Firebase config values.
// They are NOT secrets — they identify the project to Firebase.
// Security is enforced by Firebase Security Rules, not by hiding these.
const firebaseConfig = {
  apiKey: "AIzaSyDPwBtprwzIV64Wsy2O1BBUZitDODiMMg8",
  authDomain: "netforge-805d8.firebaseapp.com",
  projectId: "netforge-805d8",
  storageBucket: "netforge-805d8.firebasestorage.app",
  messagingSenderId: "654704572424",
  appId: "1:654704572424:web:3293bebbc4c97d7604b9bd",
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

// Firestore with a persistent local cache: reads stay fast and writes
// queue automatically while offline, syncing when connectivity returns.
// Must be initialized here (before any other Firestore usage).
// Consumed by the Phase 1 sync service (users/{uid} progress doc +
// users/{uid}/events analytics), same as CloudForge.
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export { app, auth, db };
