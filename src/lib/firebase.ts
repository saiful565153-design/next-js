import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBZ-pyOMrgT-pNwcHoS6fUCjCcmG1bEtUM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "steam-park-6xnr0.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "steam-park-6xnr0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "steam-park-6xnr0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "122339358999",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:122339358999:web:eb0f58dc25266a7c3c1f52"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DB_ID || "ai-studio-nextjsbengaliweb-329971b7-f5cb-4d7c-ae8a-5a9ebf70fa6e";
const db = getFirestore(app, dbId);

export { app, auth, db };
