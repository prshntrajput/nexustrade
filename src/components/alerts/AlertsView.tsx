'use client';

import { Bell } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AlertCard } from './AlertCard';
import { AlertBuilder } from './AlertBuilder';

function SkeletonRow() {
  return (
    <div className="h-[76px] bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
        <Bell size={20} className="text-gray-600" />
      </div>
      <h3 className="text-white font-semibold text-[15px] mb-1.5">No alerts yet</h3>
      <p className="text-gray-600 text-sm max-w-[240px] leading-relaxed">
        Create your first alert using the form to get notified when conditions are
        triggered.
      </p>
    </div>
  );
}

export function AlertsView() {
  const { alerts, isLoading, toggleAlert, deleteAlert, mutate } = useAlerts();
 const { items: watchlistItems = [], isLoading: watchlistLoading } = useWatchlist();

  const activeAlerts = alerts.filter((a) => a.isActive);
  const pausedAlerts = alerts.filter((a) => !a.isActive);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Get notified when your watchlist symbols hit your target conditions
          </p>
          {alerts.length > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-emerald-500 font-medium">
                {activeAlerts.length} active
              </span>
              {pausedAlerts.length > 0 && (
                <span className="text-xs text-gray-600">
                  {pausedAlerts.length} paused
                </span>
              )}
            </div>
          )}
        </div>

        {/* Two-column layout: builder left, list right */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Left — Alert builder (sticky on desktop) */}
          <div className="lg:sticky lg:top-6">
            {watchlistLoading ? (
              <div className="h-[460px] bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
            ) : (
              <AlertBuilder
                watchlistItems={watchlistItems}
                onCreated={() => void mutate()}
              />
            )}
          </div>

          {/* Right — Alert list */}
          <div className="space-y-3">
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

                {/* Divider between active and paused */}
                {activeAlerts.length > 0 && pausedAlerts.length > 0 && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-gray-800" />
                    <span className="text-[11px] text-gray-700 font-semibold tracking-widest">
                      PAUSED
                    </span>
                    <div className="h-px flex-1 bg-gray-800" />
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