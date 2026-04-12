'use client';

import { Bell } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AlertCard } from './AlertCard';
import { AlertBuilder } from './AlertBuilder';

function SkeletonRow() {
  return (
    <div className="h-[76px] bg-card border border-border animate-pulse" />
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 sm:px-8 text-center bg-card border border-border">
      <div className="w-12 h-12 bg-secondary flex items-center justify-center mb-4">
        <Bell size={20} className="text-muted-foreground" />
      </div>
      <h3 className="text-foreground font-semibold text-[15px] mb-1.5">
        No alerts yet
      </h3>
      <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed">
        Create your first alert using the form to get notified when conditions
        are triggered.
      </p>
    </div>
  );
}

export function AlertsView() {
  const { alerts, isLoading, toggleAlert, deleteAlert, mutate } = useAlerts();

  const {
    items: watchlistItems = [],
    isLoading: watchlistLoading,
  } = useWatchlist();

  const activeAlerts = alerts.filter((a) => a.isActive);
  const pausedAlerts = alerts.filter((a) => !a.isActive);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8 border-b border-border pb-5">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get notified when your watchlist symbols hit your target conditions
          </p>
          {alerts.length > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-primary font-medium">
                {activeAlerts.length} active
              </span>
              {pausedAlerts.length > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  {pausedAlerts.length} paused
                </span>
              )}
            </div>
          )}
        </div>

        {/* Layout grid — stacks on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 sm:gap-6 items-start">

          {/* Left — Alert builder */}
          <div className="lg:sticky lg:top-6 w-full">
            {watchlistLoading ? (
              <div className="h-[460px] bg-card border border-border animate-pulse" />
            ) : (
              <AlertBuilder
                watchlistItems={watchlistItems}
                onCreated={() => void mutate()}
              />
            )}
          </div>

          {/* Right — Alert list */}
          <div className="space-y-2 sm:space-y-3 min-w-0">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : alerts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Active alerts */}
                {activeAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onToggle={toggleAlert}
                    onDelete={deleteAlert}
                  />
                ))}

                {/* Divider — only when both groups exist */}
                {activeAlerts.length > 0 && pausedAlerts.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-muted-foreground/50 font-semibold tracking-widest">
                      PAUSED
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                {/* Paused alerts */}
                {pausedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onToggle={toggleAlert}
                    onDelete={deleteAlert}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
