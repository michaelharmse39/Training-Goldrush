"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Smartphone } from "lucide-react";

export default function VerifyTotpPage() {
  const { user, accessToken, completeTotpStep, signOut } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accessToken) return;
    setLoading(true);
    setError(null);

    const token = accessToken;
    const res = await fetch("/api/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      return;
    }

    completeTotpStep();
  };

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Two-Factor Verification</h1>
            <p className="text-xs text-gray-500">Open Microsoft Authenticator to get your code</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          Enter the 6-digit code from <span className="font-medium text-gray-800">Microsoft Authenticator</span> for{" "}
          <span className="font-medium text-gray-800">Training Register – Gold Rush Group</span>.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <button
          onClick={signOut}
          className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign in with a different account
        </button>
      </div>
    </div>
  );
}
