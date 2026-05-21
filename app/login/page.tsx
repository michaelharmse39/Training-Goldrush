"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

type Mode = "login" | "forgot";

export default function LoginPage() {
  const { signIn, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.replace("/");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await sendPasswordReset(email);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setResetSent(true);
    }
  };

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
          {/* ── Login form ── */}
          {mode === "login" && (
            <>
              <h1 className="text-lg font-semibold text-gray-900 mb-5">Sign in</h1>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(null); setResetSent(false); }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-500 mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
                  Register
                </Link>
              </p>
            </>
          )}

          {/* ── Forgot password form ── */}
          {mode === "forgot" && (
            <>
              <button
                onClick={() => { setMode("login"); setError(null); setResetSent(false); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Reset password</h1>
              <p className="text-sm text-gray-500 mb-5">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
              {resetSent ? (
                <div className="text-center py-4">
                  <p className="text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    Reset link sent! Check your inbox.
                  </p>
                  <button
                    onClick={() => { setMode("login"); setResetSent(false); }}
                    className="mt-4 text-xs text-indigo-600 hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {error && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
