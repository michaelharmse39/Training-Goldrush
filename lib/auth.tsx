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
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeTotpStep: () => void;
  sendPasswordReset: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStep, setPendingStep] = useState<PendingStep>(null);

  async function loadProfile(u: User) {
    const { data } = await supabase
      .from("users")
      .select("role, department_id, approved, self_registered, totp_enabled")
      .eq("id", u.id)
      .single();

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          await loadProfile(session.user);
          setUser(session.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          await loadProfile(session.user);
          setUser(session.user);
        } else {
          setUser(null);
          setRole(null);
          setDepartmentId(null);
          setPendingStep(null);
        }
      } catch {
        setUser(null);
        setRole(null);
        setDepartmentId(null);
        setPendingStep(null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials")) {
        return "Invalid email or password.";
      }
      return error.message;
    }
    if (data.user) {
      const { data: profile } = await supabase.from("users").select("approved").eq("id", data.user.id).single();
      if (profile && profile.approved === false) {
        await supabase.auth.signOut();
        return "Your account is awaiting approval by an administrator.";
      }
    }
    return null;
  };

  const signOut = async () => {
    if (user) sessionStorage.removeItem(`totp_${user.id}`);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setDepartmentId(null);
    setPendingStep(null);
  };

  const completeTotpStep = useCallback(() => {
    if (user) sessionStorage.setItem(`totp_${user.id}`, "1");
    setPendingStep(null);
  }, [user]);

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/update-password`,
    });
    return error ? error.message : null;
  };

  return (
    <AuthContext.Provider value={{ user, role, departmentId, loading, pendingStep, signIn, signOut, completeTotpStep, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
