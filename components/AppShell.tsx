"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import LoadingOverlay from "@/components/LoadingOverlay";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/signup", "/pending-approval", "/update-password"];

// Routes that a logged-in user with a pending TOTP step can access
const TOTP_PATHS = ["/setup-totp", "/verify-totp"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, pendingStep } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile tap nav link)
  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

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
        {/* Mobile top bar */}
        <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-gray-900 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <span className="text-white text-sm font-bold">Training Register</span>
        </div>

        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`print:hidden shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 overflow-auto pt-14 lg:pt-0">{children}</main>
      </div>
    </StoreProvider>
  );
}
