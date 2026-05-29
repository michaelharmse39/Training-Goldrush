"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Mail, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_KEY =
  typeof window !== "undefined"
    ? `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`
    : "sb-auth-token";

interface Dept { id: string; name: string; }

type Step = "form" | "otp" | "creating";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetch(
      `${SUPABASE_URL}/rest/v1/departments?select=id,name&order=name.asc`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    )
      .then((r) => r.json())
      .then((rows: Dept[]) => setDepartments(rows))
      .catch(() => {});
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Failed to send verification code."); return; }
    setStep("otp");
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Verify OTP
    const verifyRes = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      setError(verifyData.error ?? "Invalid verification code.");
      setLoading(false);
      return;
    }

    // Create Supabase auth account via direct REST
    const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const signupData = await signupRes.json() as { access_token?: string; id?: string; msg?: string; message?: string };

    if (!signupRes.ok) {
      const msg = signupData.msg ?? signupData.message ?? "Failed to create account.";
      setError(msg.toLowerCase().includes("already") ? "An account with this email already exists." : msg);
      setLoading(false);
      return;
    }

    // Get access token — present when email confirmation is disabled
    let token = signupData.access_token;

    // If no token (email confirmation enabled), sign in immediately to obtain one
    if (!token && signupData.id) {
      const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password }),
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json() as { access_token?: string };
        token = loginData.access_token;
      }
    }

    if (!token) {
      setError("Account created but could not obtain session. Please contact an administrator.");
      setLoading(false);
      return;
    }

    // Create user profile record via API
    const completeRes = await fetch("/api/auth/complete-signup", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: departmentId || null }),
    });
    const completeData = await completeRes.json() as { error?: string };
    if (!completeRes.ok && completeData.error !== "Account already registered") {
      setError(completeData.error ?? "Failed to complete registration.");
      setLoading(false);
      return;
    }

    // Sign out — user must wait for approval before logging in
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` },
    }).catch(() => {});
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);

    setLoading(false);
    router.replace("/pending-approval");
  };

  const resendOtp = async () => {
    setError(null);
    setLoading(true);
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
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
          {step === "form" && (
            <>
              <Link href="/login" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Create account</h1>
              <p className="text-sm text-gray-500 mb-5">Use your work email. A verification code will be sent to confirm it.</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@goldrushgroup.co.za" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Same password again" className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">— select your department —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? "Sending code…" : "Send verification code"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button onClick={() => { setStep("form"); setError(null); setOtp(""); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Verify your email</h1>
              <p className="text-sm text-gray-500 mb-5">Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span></p>
              <form onSubmit={handleVerifyAndCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required placeholder="6-digit code" autoFocus className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading || otp.length < 6} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {loading ? "Creating account…" : "Verify & Create Account"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-500 mt-4">
                Didn&apos;t receive it?{" "}
                <button onClick={resendOtp} disabled={loading} className="text-indigo-600 hover:underline disabled:opacity-50">Resend code</button>
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className={`w-2 h-2 rounded-full ${step === "form" ? "bg-indigo-600" : "bg-indigo-300"}`} />
          <div className={`w-2 h-2 rounded-full ${step === "otp" ? "bg-indigo-600" : "bg-gray-200"}`} />
          <div className="w-2 h-2 rounded-full bg-gray-200" />
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">{step === "form" ? "Enter your details" : "Verify email"}</p>

        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700">After registration, your account will require approval from your department head or administrator before you can log in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
