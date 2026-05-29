import { initializeApp, getApps, cert } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  try {
    return (
      getApps().find((a) => a.name === "admin") ||
      initializeApp(
        {
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        },
        "admin"
      )
    );
  } catch {
    return null;
  }
}

const _app = getAdminApp();
export const adminAuth = (_app ? getAuth(_app) : null) as Auth;
export const adminDb = (_app ? getFirestore(_app) : null) as Firestore;
