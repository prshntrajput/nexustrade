import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/Toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        {/* ── Sidebar (desktop sticky + mobile drawer) ── */}
        <Sidebar />

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ── T43 — Global toast notifications (Phase 8) ── */}
      <Toaster />
    </>
  );
}