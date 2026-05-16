"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  FolderOpen,
  ListChecks,
  FileText,
  ShieldCheck,
  Bell,
  Building2,
  Settings,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  Upload,
  Users,
  LineChart,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const navGroups = [
  {
    label: "Pilotage",
    items: [
      { href: "/app", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
      { href: "/app/onboarding", label: "Onboarding", icon: Compass },
      { href: "/app/referentiel", label: "Référentiel RNQ", icon: BookOpen },
      { href: "/app/formations", label: "Formations", icon: Layers },
      { href: "/app/preuves", label: "Preuves", icon: FolderOpen },
      { href: "/app/import", label: "Import CSV", icon: Upload },
      { href: "/app/actions", label: "Plan d'actions", icon: ListChecks },
      { href: "/app/documents", label: "Documents", icon: FileText },
      { href: "/app/assistant", label: "Assistant IA", icon: Sparkles },
    ],
  },
  {
    label: "Audit",
    items: [
      { href: "/app/audit", label: "Cockpit audit", icon: ShieldCheck },
    ],
  },
  {
    label: "Compte",
    items: [
      { href: "/app/rappels", label: "Rappels", icon: Bell },
      { href: "/app/historique", label: "Historique score", icon: LineChart },
      { href: "/app/cabinet", label: "Cabinet", icon: Building2 },
      { href: "/app/team", label: "Equipe", icon: Users },
      { href: "/app/billing", label: "Facturation", icon: CreditCard },
      { href: "/app/settings", label: "Réglages", icon: Settings },
      { href: "/app/account", label: "Mon compte", icon: User },
    ],
  },
];

interface NavItemsProps {
  pathname: string;
  onNavigate: () => void;
}

function NavItems({ pathname, onNavigate }: NavItemsProps) {
  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(250,249,245,0.35)" }}>
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={
                      active
                        ? "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white"
                        : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    }
                    style={
                      active
                        ? { background: "rgba(250,249,245,0.1)" }
                        : { color: "#a8a49c" }
                    }
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(250,249,245,0.05)";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "#faf9f5";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "#a8a49c";
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? "#faf9f5" : "#706f6a" }}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface UserFooterProps {
  userName: string;
  userEmail: string;
  emailVerified: boolean;
  onNavigate: () => void;
}

function UserFooter({ userName, userEmail, emailVerified, onNavigate }: UserFooterProps) {
  return (
    <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(250,249,245,0.08)" }}>
      {!emailVerified && (
        <div className="mb-3 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "rgba(245,158,11,0.15)", color: "#fde68a" }}>
          ⚠ Email non vérifié —{" "}
          <Link href="/verify-email" className="underline" onClick={onNavigate}>
            Vérifier
          </Link>
        </div>
      )}
      <div className="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm" style={{ color: "#a8a49c" }}>
        <User className="h-4 w-4 shrink-0" style={{ color: "#706f6a" }} />
        <span className="truncate">{userName || userEmail}</span>
      </div>
      <ThemeToggle />
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: "#a8a49c" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(250,249,245,0.05)";
            (e.currentTarget as HTMLElement).style.color = "#faf9f5";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.color = "#a8a49c";
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" style={{ color: "#706f6a" }} />
          Déconnexion
        </button>
      </form>
    </div>
  );
}

interface NavSidebarProps {
  userName: string;
  userEmail: string;
  emailVerified: boolean;
}

export function NavSidebar({ userName, userEmail, emailVerified }: NavSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleNavigate = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-nav-bg lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5" style={{ borderBottom: "1px solid rgba(250,249,245,0.08)" }}>
          <Link href="/app" className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
          </Link>
        </div>
        <NavItems pathname={pathname} onNavigate={handleNavigate} />
        <UserFooter
          userName={userName}
          userEmail={userEmail}
          emailVerified={emailVerified}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* ── Mobile topbar ── */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-nav-bg px-4 lg:hidden" style={{ borderBottom: "1px solid rgba(250,249,245,0.08)" }}>
        <Link href="/app" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: "#a8a49c" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#faf9f5"; (e.currentTarget as HTMLElement).style.background = "rgba(250,249,245,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a8a49c"; (e.currentTarget as HTMLElement).style.background = ""; }}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-nav-bg shadow-2xl">
            <div className="flex h-14 items-center justify-between px-4" style={{ borderBottom: "1px solid rgba(250,249,245,0.08)" }}>
              <Link href="/app" className="flex items-center gap-2" onClick={handleNavigate}>
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span className="text-[15px] font-bold tracking-tight text-white">QualiPilot</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: "#a8a49c" }}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems pathname={pathname} onNavigate={handleNavigate} />
            <UserFooter
              userName={userName}
              userEmail={userEmail}
              emailVerified={emailVerified}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}
    </>
  );
}
