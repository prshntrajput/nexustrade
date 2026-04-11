import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-gray-800 border rounded-lg px-3 h-9 text-sm text-white',
            'placeholder-gray-500 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            error ? 'border-red-500/50' : 'border-gray-700 hover:border-gray-600',
            className,
          )}
          {...props}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {hint && !error && <p className="text-gray-500 text-xs">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';