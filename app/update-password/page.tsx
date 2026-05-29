"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));

    // Expired / invalid link
    const hashError = hash.get("error_code") ?? hash.get("error");
    if (hashError) {
      const desc = hash.get("error_description")?.replace(/\+/g, " ") ?? "This reset link is invalid or has expired.";
      setError(desc);
      return;
    }

    // Hash-based recovery or invite: token is right in the URL — no async call needed
    const token = hash.get("access_token");
    const hashType = hash.get("type");
    if (token && (hashType === "recovery" || hashType === "invite" || hashType === "magiclink" || hashType === "signup")) {
      setRecoveryToken(token);
      setReady(true);
      return;
    }

    // PKCE flow: token_hash in query params
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    if (tokenHash && type === "recovery") {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }).then(({ error }) => {
        if (error) setError("This reset link is invalid or has expired.");
        else setReady(true);
      });
      return;
    }

    // Fallback: listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    const timeout = setTimeout(() => {
      setError("This reset link is invalid or has expired.");
    }, 6000);

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError(null);

    if (recoveryToken) {
      // Direct REST call — bypasses Supabase client entirely
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${recoveryToken}`,
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ password }),
      });
      setLoading(false);
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { msg?: string; message?: string };
        setError(err.msg ?? err.message ?? "Failed to update password. Please try again.");
        return;
      }
    } else {
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      await supabase.auth.signOut();
    }

    setDone(true);
    setTimeout(() => router.replace("/login"), 3000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Password updated</h1>
          <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="font-bold text-gray-900">Training Register</p>
            <p className="text-xs text-gray-500">Gold Rush Group</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!ready && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center">
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>
              <button onClick={() => router.replace("/login")} className="text-sm text-indigo-600 hover:underline">
                Back to sign in
              </button>
            </div>
          )}

          {ready && !error && (
            <>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Set new password</h1>
              <p className="text-sm text-gray-500 mb-5">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      autoFocus
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Same password again"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
