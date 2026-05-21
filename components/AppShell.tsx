"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import LoadingOverlay from "@/components/LoadingOverlay";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/pending-approval"];

// Routes that a logged-in user with a pending TOTP step can access
const TOTP_PATHS = ["/setup-totp", "/verify-totp"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, pendingStep } = useAuth();
  const path = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(path);
  const isTotpPath = TOTP_PATHS.includes(path);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    if (user && path === "/login") {
      router.replace("/");
      return;
    }

    if (user && pendingStep === "setup-totp" && !isTotpPath) {
      router.replace("/setup-totp");
      return;
    }

    if (user && pendingStep === "verify-totp" && !isTotpPath) {
      router.replace("/verify-totp");
      return;
    }
  }, [loading, user, path, pendingStep, isPublic, isTotpPath, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <GraduationCap className="w-10 h-10 text-indigo-400 animate-pulse" />
      </div>
    );
  }

  // Public pages (login, signup, pending-approval)
  if (isPublic) return <>{children}</>;

  // TOTP pages (no sidebar, but user must be logged in)
  if (isTotpPath) {
    if (!user) return null;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  if (!user) return null;

  return (
    <StoreProvider>
      <LoadingOverlay />
      <div className="flex h-screen">
        <div className="print:hidden shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </StoreProvider>
  );
}
