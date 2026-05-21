"use client";
import { useStore } from "@/lib/store";
import { GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";

function Step({ n, text, done }: { n: number; text: string; done?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          done ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
      </span>
      <span className="text-gray-600">{text}</span>
    </li>
  );
}

export default function LoadingOverlay() {
  const { loading, error } = useStore();

  if (error) {
    const permissionError =
      error.includes("permission") ||
      error.includes("PERMISSION_DENIED") ||
      error.includes("unauthorized");
    const badConfig =
      error.includes("invalid-api-key") ||
      error.includes("app-not-initialized") ||
      error.includes("projectId") ||
      error.includes("invalid-argument") ||
      error.includes("400") ||
      error.includes("401") ||
      error.includes("403");

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-7 h-7 text-red-500 shrink-0" />
            <h2 className="text-lg font-bold text-gray-800">Database connection failed</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-700 text-xs font-mono break-all">{error}</p>
          </div>

          {(permissionError || badConfig) ? (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {permissionError
                  ? "Firestore security rules are blocking access."
                  : "Your Firebase config values look incorrect."}
              </p>
              <ol className="space-y-2.5">
                {permissionError && (
                  <>
                    <Step n={1} text="Open Firebase Console → Firestore Database → Rules" />
                    <Step n={2} text='Set rules to allow read, write: if true; (for development) and click Publish' />
                    <Step n={3} text="Restart the dev server (Ctrl+C → npm run dev)" />
                  </>
                )}
                {badConfig && (
                  <>
                    <Step n={1} text="Open Firebase Console → Project Settings → Your apps" />
                    <Step n={2} text="Copy the firebaseConfig values (apiKey, projectId, etc.)" />
                    <Step n={3} text="Paste each value into .env.local, save, then restart the dev server" />
                  </>
                )}
              </ol>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-sm text-gray-600 mb-3">Check the following in order:</p>
              <ol className="space-y-2.5">
                <Step n={1} text="Make sure .env.local has all six NEXT_PUBLIC_FIREBASE_* values filled in" />
                <Step n={2} text="Ensure Firestore is enabled in Firebase Console → Build → Firestore Database" />
                <Step n={3} text="Restart the dev server after saving .env.local" />
              </ol>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-3">
      <GraduationCap className="w-10 h-10 text-indigo-400 animate-pulse" />
      <p className="text-gray-500 text-sm">Loading Training Register…</p>
    </div>
  );
}
