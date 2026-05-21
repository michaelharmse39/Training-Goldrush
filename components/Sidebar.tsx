"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  LogOut,
  UserCog,
  ClipboardCheck,
  FileText,
  TrendingUp,
  HelpCircle,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const adminNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/topics", label: "All Topics", icon: BookOpen },
  { href: "/register", label: "Training Register", icon: ClipboardList },
  { href: "/attendees", label: "Attendees", icon: Users },
  { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/manuals", label: "Manuals", icon: FileText },
  { href: "/training-sessions", label: "Training Sessions", icon: CalendarDays },
  { href: "/users", label: "Users", icon: UserCog },
];

const deptHeadNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/register", label: "Training Register", icon: ClipboardList },
  { href: "/questions", label: "Questions", icon: HelpCircle },
  { href: "/manuals", label: "Manuals", icon: FileText },
  { href: "/training-sessions", label: "Training Sessions", icon: CalendarDays },
  { href: "/my-progress", label: "Department Progress", icon: TrendingUp },
  { href: "/my-staff", label: "My Staff", icon: UserCog },
];

const staffNav = [
  { href: "/my-progress", label: "My Progress", icon: TrendingUp },
  { href: "/questions", label: "Questions", icon: HelpCircle },
  { href: "/manuals", label: "Manuals", icon: FileText },
  { href: "/training-sessions", label: "Training Sessions", icon: CalendarDays },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const { user, role, signOut } = useAuth();

  const nav =
    role === "admin" ? adminNav :
    role === "dept_head" ? deptHeadNav :
    staffNav;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const roleLabel =
    role === "admin" ? "Admin" :
    role === "dept_head" ? "Department Head" :
    "Staff";

  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <GraduationCap className="w-7 h-7 text-indigo-400" />
        <div>
          <p className="font-bold text-sm leading-tight">Training Register</p>
          <p className="text-xs text-gray-400">Gold Rush Group</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        <p className="text-xs text-gray-600 mb-3">{roleLabel}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
