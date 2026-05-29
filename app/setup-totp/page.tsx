"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Smartphone, ShieldCheck, Copy, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function SetupTotpPage() {
  const { user, completeTotpStep } = useAuth();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!user) return;
    const setup = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/totp/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        setError(data.error ?? "Failed to generate setup code.");
      }
      setInitializing(false);
    };
    setup();
  }, [user]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/totp/confirm", {
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

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (initializing) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Set up Authenticator</h1>
            <p className="text-xs text-gray-500">Required for account security</p>
          </div>
        </div>

        <ol className="space-y-4 mb-5">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
            <p className="text-sm text-gray-600">
              Install <span className="font-medium text-gray-800">Microsoft Authenticator</span> on your phone from the App Store or Google Play.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
            <p className="text-sm text-gray-600">Open the app, tap <span className="font-medium text-gray-800">+</span>, choose <span className="font-medium text-gray-800">Other account</span>, then scan the QR code below.</p>
          </li>
        </ol>

        {qrCode && (
          <div className="flex flex-col items-center mb-5">
            <div className="border-2 border-gray-200 rounded-xl p-3 bg-white inline-block">
              <Image src={qrCode} alt="TOTP QR Code" width={160} height={160} />
            </div>
            {secret && (
              <div className="mt-3 w-full">
                <p className="text-xs text-gray-500 text-center mb-1">Can&apos;t scan? Enter this key manually:</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <code className="text-xs text-gray-700 flex-1 font-mono break-all">{secret}</code>
                  <button onClick={copySecret} className="text-gray-400 hover:text-indigo-600 shrink-0">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <li className="flex items-start gap-3 list-none mb-5">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
          <p className="text-sm text-gray-600">Enter the <span className="font-medium text-gray-800">6-digit code</span> shown in the app to confirm setup.</p>
        </li>

        <form onSubmit={handleConfirm} className="space-y-3">
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
            {loading ? "Verifying…" : "Confirm & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
