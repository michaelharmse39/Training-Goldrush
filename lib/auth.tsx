"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword, signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

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

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setRole((data.role as Role) ?? "staff");
            setDepartmentId(data.departmentId ?? null);

            // Self-registered users must go through TOTP
            if (data.selfRegistered) {
              const sessionKey = `totp_${u.uid}`;
              const verified =
                typeof window !== "undefined" &&
                sessionStorage.getItem(sessionKey) === "1";
              if (!verified) {
                setPendingStep(data.totpEnabled ? "verify-totp" : "setup-totp");
              } else {
                setPendingStep(null);
              }
            } else {
              setPendingStep(null);
            }
          } else {
            // Bootstrap: first user becomes admin
            await setDoc(doc(db, "users", u.uid), {
              role: "admin",
              email: u.email,
              approved: true,
            });
            setRole("admin");
            setDepartmentId(null);
            setPendingStep(null);
          }
          setUser(u);
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
    return unsub;
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Check approval before allowing in
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists() && snap.data().approved === false) {
        await firebaseSignOut(auth);
        return "Your account is awaiting approval by an administrator.";
      }
      return null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      if (
        msg.includes("invalid-credential") ||
        msg.includes("wrong-password") ||
        msg.includes("user-not-found") ||
        msg.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        return "Invalid email or password.";
      }
      return msg;
    }
  };

  const signOut = async () => {
    if (user) sessionStorage.removeItem(`totp_${user.uid}`);
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    setDepartmentId(null);
    setPendingStep(null);
  };

  const completeTotpStep = useCallback(() => {
    if (user) sessionStorage.setItem(`totp_${user.uid}`, "1");
    setPendingStep(null);
  }, [user]);

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Failed to send reset email";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, role, departmentId, loading, pendingStep, signIn, signOut, completeTotpStep, sendPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
