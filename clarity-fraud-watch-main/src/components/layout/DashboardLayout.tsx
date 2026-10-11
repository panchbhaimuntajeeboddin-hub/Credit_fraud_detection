import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  BarChart3,
  FileText,
  Activity,
  Bell,
  Settings,
  LogOut,
  Search,
  Sun,
  Moon,
  ChevronsLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/transactions", label: "Transactions", icon: Receipt },
  { to: "/app/predictions", label: "Predictions", icon: Sparkles },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/model-performance", label: "Model", icon: Activity },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Aarav Kapoor";
  const displayRole = user ? `${user.role || "Risk Analyst"} · ${user.company || "Northbank"}` : "Risk Analyst";
  const initials = user
    ? `${user.firstName.charAt(0) || ""}${user.lastName.charAt(0) || ""}`.toUpperCase() || "U"
    : "AK";

  const handleLogout = async () => {
    await logout();
    nav({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col border-r border-border bg-surface-2/80 backdrop-blur-xl transition-[width] duration-300 ${
          collapsed ? "w-[78px]" : "w-[260px]"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={pathname}
          onToggle={() => setCollapsed((c) => !c)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-surface-2 lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
            >
              <SidebarContent
                collapsed={false}
                pathname={pathname}
                onClose={() => setMobileOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="grid h-10 w-10 place-items-center rounded-lg btn-ghost lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden flex-1 max-w-xl sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search transactions, customers, merchants…"
              className="h-10 w-full rounded-lg border border-border bg-secondary/40 pl-9 pr-16 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className="grid h-10 w-10 place-items-center rounded-lg btn-ghost"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/app/notifications"
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-lg btn-ghost"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            </Link>
            <div className="ml-1 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-medium leading-none">{displayName}</div>
                <div className="text-[10px] text-muted-foreground">{displayRole}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  onToggle,
  onClose,
  onLogout,
}: {
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
  onClose?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed ? (
          <Logo />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-500">
            <span className="font-display text-sm font-bold text-white">S</span>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="hidden h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary lg:grid"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
        {!collapsed && (
          <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </div>
        )}
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to === "/app/dashboard" && pathname === "/app");
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {active && <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-primary" />}
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-gradient-to-br from-primary/15 via-violet-500/10 to-transparent p-3">
            <div className="text-xs font-semibold">Model v3.2 • Live</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Detection accuracy 99.41%</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
              <div className="h-full w-[99%] rounded-full bg-gradient-to-r from-success to-primary" />
            </div>
          </div>
        ) : null}
        <button
          onClick={onLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

