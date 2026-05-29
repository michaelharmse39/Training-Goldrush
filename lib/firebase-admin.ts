import { initializeApp, getApps, cert } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;

  return (
    getApps().find((a) => a.name === "admin") ||
    initializeApp(
      { credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") }) },
      "admin"
    )
  );
}

const _app = getAdminApp();
export const adminAuth = (_app ? getAuth(_app) : null) as Auth;
export const adminDb = (_app ? getFirestore(_app) : null) as Firestore;
