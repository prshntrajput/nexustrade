import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-5">
        <Icon size={22} className="text-gray-600" />
      </div>
      <h3 className="text-white font-semibold text-[15px] mb-2">{title}</h3>
      <p className="text-gray-600 text-sm max-w-[280px] leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}