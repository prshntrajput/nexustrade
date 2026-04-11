import { Construction } from 'lucide-react';

export const metadata = { title: 'Alerts — NexusTrade' };

export default function AlertsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure price, RSI, and volume spike alerts.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Construction size={26} className="text-yellow-500" />
        </div>
        <h2 className="text-base font-semibold text-white mb-2">
          Coming in Phase 5
        </h2>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
          Alert builder, condition evaluation, and Inngest integration will be
          implemented in Phase 5.
        </p>
      </div>
    </div>
  );
}