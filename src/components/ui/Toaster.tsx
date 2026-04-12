'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      richColors
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1c1b19',
          border: '1px solid #393836',
          color: '#cdccca',
        },
        classNames: {
          title: 'text-white font-semibold text-sm',
          description: 'text-gray-500 text-xs',
          success: 'border-emerald-500/30',
          error: 'border-red-500/30',
          warning: 'border-amber-500/30',
          info: 'border-blue-500/30',
        },
      }}
      closeButton
    />
  );
}