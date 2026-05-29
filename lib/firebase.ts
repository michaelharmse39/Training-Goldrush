import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";
import { Auth, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createInstances(): { app: FirebaseApp; db: Firestore; auth: Auth } | null {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return { app, db: getFirestore(app), auth: getAuth(app) };
  } catch {
    return null;
  }
}

const _firebase = createInstances();
export const db = _firebase?.db as Firestore;
export const auth = _firebase?.auth as Auth;
