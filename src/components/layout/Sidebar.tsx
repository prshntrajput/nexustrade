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
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/watchlist', label: 'Watchlist', icon: LayoutDashboard },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/reports', label: 'AI Reports', icon: FileText },
] as const;

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
  onClick?: React.MouseEventHandler<HTMLAnchorElement>; // ← precise type
}) {
  return (
    <Link
      href={href}
      {...(onClick && { onClick })} // ← only pass onClick when defined
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800',
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
        <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <TrendingUp size={14} className="text-emerald-400" />
        </div>
        <span className="font-bold text-white text-[15px] tracking-tight">
          NexusTrade
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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
      <div className="px-3 pb-5 border-t border-gray-800 pt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile: hamburger button ─────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile: drawer ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col bg-gray-900 border-r border-gray-800">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X size={16} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}