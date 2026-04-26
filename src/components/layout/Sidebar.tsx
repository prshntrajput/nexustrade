'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import {
  LayoutDashboard,
  Bell,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  X,
  BarChart2,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Cast hrefs to Route — typed routes are re-generated on each `next build`.
// New routes require a build before their type is available in the union.
const NAV_ITEMS: Array<{ href: Route; label: string; icon: React.ElementType }> = [
  { href: '/market'    as Route, label: 'Market Pulse', icon: Activity },
  { href: '/watchlist' as Route, label: 'Watchlist',    icon: LayoutDashboard },
  { href: '/portfolio' as Route, label: 'Portfolio',    icon: BarChart2 },
  { href: '/alerts'    as Route, label: 'Alerts',       icon: Bell },
  { href: '/reports'   as Route, label: 'AI Reports',   icon: FileText },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: Route;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      {...(onClick && { onClick })}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary/15 text-primary border-l-2 border-primary pl-[10px]'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
      )}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={14} className="text-primary" />
        </div>
        <span className="font-bold text-foreground text-[15px] tracking-tight truncate">
          NexusTrade
        </span>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-0 py-3 space-y-0.5"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={
              pathname === item.href ||
              pathname.startsWith(item.href + '/')
            }
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-sidebar-border pt-4">
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150',
            'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          )}
        >
          <LogOut size={15} className="flex-shrink-0" />
          <span className="truncate">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* ── Mobile: hamburger ───────────────────────────────────────────── */}
      {/*
        z-30 keeps it above the page content (z-0) and the header (z-20)
        so it's always tappable. Vertically centered inside the 56px
        header (top-0 h-14 = 56px → top-[11px] centers a 34px button).
      */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className={cn(
          'md:hidden fixed top-[11px] left-3 z-30 p-2',
          'bg-card border border-border text-muted-foreground',
          'hover:text-foreground hover:bg-secondary transition-all duration-150',
        )}
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile: backdrop ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: drawer ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col',
          'bg-sidebar border-r border-sidebar-border overflow-y-auto',
          'transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className={cn(
            'absolute top-4 right-4 p-1.5 z-10',
            'text-muted-foreground hover:text-foreground hover:bg-secondary transition-all',
          )}
        >
          <X size={16} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
