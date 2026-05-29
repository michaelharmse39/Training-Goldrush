"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Role = "admin" | "dept_head" | "staff" | "viewer";
export type PendingStep = "setup-totp" | "verify-totp" | null;

interface AuthContextType {
  user: User | null;
  role: Role | null;
  departmentId: string | null;
  loading: boolean;
  pendingStep: PendingStep;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeTotpStep: () => void;
  sendPasswordReset: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Key that supabase-js uses to store sessions in localStorage
const STORAGE_KEY =
  typeof window !== "undefined"
    ? `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`
    : "sb-auth-token";

interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: User;
}

interface ProfileRow {
  role: string;
  department_id: string | null;
  approved: boolean;
  self_registered: boolean;
  totp_enabled: boolean;
}

async function restFetchProfile(userId: string, accessToken: string): Promise<ProfileRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=role,department_id,approved,self_registered,totp_enabled&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

async function restRefreshSession(refreshToken: string): Promise<StoredSession | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { ...data, expires_at: Math.floor(Date.now() / 1000) + data.expires_in };
}

function writeSession(session: StoredSession) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStep, setPendingStep] = useState<PendingStep>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  async function applyProfile(u: User, accessToken: string) {
    const data = await restFetchProfile(u.id, accessToken);
    if (data) {
      setRole((data.role as Role) ?? "staff");
      setDepartmentId(data.department_id ?? null);
      if (data.self_registered) {
        const sessionKey = `totp_${u.id}`;
        const verified = typeof window !== "undefined" && sessionStorage.getItem(sessionKey) === "1";
        setPendingStep(verified ? null : data.totp_enabled ? "verify-totp" : "setup-totp");
      } else {
        setPendingStep(null);
      }
    }
  }

  useEffect(() => {
    // Bypass supabase.auth.getSession() which hangs — read directly from localStorage
    async function init() {
      const session = readSession();
      if (!session?.access_token || !session?.user) return;

      const now = Math.floor(Date.now() / 1000);

      if ((session.expires_at ?? 0) > now + 60) {
        // Token is fresh
        await applyProfile(session.user, session.access_token);
        setUser(session.user);
        setAccessToken(session.access_token);
        return;
      }

      // Token expired or near expiry — refresh it
      if (session.refresh_token) {
        const refreshed = await restRefreshSession(session.refresh_token);
        if (refreshed) {
          writeSession(refreshed);
          await applyProfile(refreshed.user, refreshed.access_token);
          setUser(refreshed.user);
          setAccessToken(refreshed.access_token);
          return;
        }
      }

      // Could not refresh — clear and treat as logged out
      clearSession();
    }

    init()
      .catch(() => {})
      .finally(() => setLoading(false));

    // Secondary: catch auth events from Supabase client (e.g. PKCE callback, future usage)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && session.access_token) {
        try {
          await applyProfile(session.user, session.access_token);
          setUser(session.user);
        } catch {
          // ignore
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error_description?: string; msg?: string; message?: string };
      const msg = err.error_description ?? err.msg ?? err.message ?? "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
        return "Invalid email or password.";
      }
      return msg || "Sign in failed. Please try again.";
    }

    const data = await res.json();
    const session: StoredSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      token_type: data.token_type ?? "bearer",
      user: data.user,
    };

    const profile = await restFetchProfile(data.user.id, data.access_token);
    if (profile?.approved === false) {
      return "Your account is awaiting approval by an administrator.";
    }

    writeSession(session);

    setUser(data.user);
    setAccessToken(data.access_token);
    if (profile) {
      setRole((profile.role as Role) ?? "staff");
      setDepartmentId(profile.department_id ?? null);
      if (profile.self_registered) {
        const sessionKey = `totp_${data.user.id}`;
        const verified = typeof window !== "undefined" && sessionStorage.getItem(sessionKey) === "1";
        setPendingStep(verified ? null : profile.totp_enabled ? "verify-totp" : "setup-totp");
      } else {
        setPendingStep(null);
      }
    }
    setLoading(false);

    return null;
  };

  const signOut = async () => {
    if (user) sessionStorage.removeItem(`totp_${user.id}`);
    clearSession();
    setUser(null);
    setRole(null);
    setDepartmentId(null);
    setPendingStep(null);
    setAccessToken(null);
    supabase.auth.signOut().catch(() => {});
  };

  const completeTotpStep = useCallback(() => {
    if (user) sessionStorage.setItem(`totp_${user.id}`, "1");
    setPendingStep(null);
  }, [user]);

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/update-password` : "/update-password";

    // GoTrue expects redirect_to as a query param, not in the body
    const url = new URL(`${SUPABASE_URL}/auth/v1/recover`);
    url.searchParams.set("redirect_to", redirectTo);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { msg?: string; message?: string };
      return err.msg ?? err.message ?? "Failed to send reset email.";
    }

    return null;
  };

  return (
    <AuthContext.Provider value={{ user, role, departmentId, loading, pendingStep, accessToken, signIn, signOut, completeTotpStep, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
