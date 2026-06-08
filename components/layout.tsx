"use client";
// App shells + role theming. Student -> mobile (bottom tab bar); teacher/admin -> desktop (sidebar).
import { useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { Avatar, Badge } from "@/components/ui";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const studentNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Classes", href: "/classes", icon: GraduationCap },
  { label: "Modules", href: "/modules", icon: BookOpen },
  { label: "Submissions", href: "/submissions", icon: ClipboardList },
  { label: "Me", href: "/profile", icon: UserIcon },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Classes", href: "/classes", icon: Users },
  { label: "Modules", href: "/modules", icon: BookOpen },
  { label: "Submissions", href: "/submissions", icon: ClipboardList },
  { label: "Profile", href: "/profile", icon: UserIcon },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  useEffect(() => {
    document.documentElement.dataset.role = role ?? "student";
  }, [role]);
  return <>{children}</>;
}

function MobileShell({ children, nav }: { children: ReactNode; nav: NavItem[] }) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      <header className="flex items-center justify-between border-b-2 border-accent px-4 py-3">
        <span className="text-lg font-bold">engl.app</span>
        <div className="flex items-center gap-2">
          {role && <Badge kind={role}>{role}</Badge>}
          <Avatar name={user?.full_name} size={28} />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
      <nav className="flex items-center justify-around border-t border-zinc-200 py-2">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 text-xs",
                active ? "text-accent" : "text-zinc-500",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DesktopShell({ children, nav }: { children: ReactNode; nav: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b-2 border-accent bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">engl.app</span>
          {role && <Badge kind={role}>{role}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{user?.full_name}</span>
          <Avatar name={user?.full_name} size={30} />
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="text-zinc-400 transition hover:text-zinc-700"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white p-3">
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-accent/10 font-semibold text-accent"
                      : "text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  if (role === "student") return <MobileShell nav={studentNav}>{children}</MobileShell>;
  return <DesktopShell nav={teacherNav}>{children}</DesktopShell>;
}
