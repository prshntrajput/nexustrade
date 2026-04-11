import { Construction } from 'lucide-react';

export const metadata = { title: 'AI Reports — NexusTrade' };

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gemini-powered analysis of your watchlist symbols.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Construction size={26} className="text-blue-400" />
        </div>
        <h2 className="text-base font-semibold text-white mb-2">
          Coming in Phase 8
        </h2>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
          AI analysis reports with sentiment, key risks, opportunities, and
          technical outlook will be available in Phase 8.
        </p>
      </div>
    </div>
  );
}