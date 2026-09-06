import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from './PWAContext';

export const PWAOfflineBanner: React.FC = () => {
  const { isOnline, offlineMessage } = usePWA();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-warning text-white text-xs px-4 py-2 flex items-center justify-between shadow-none relative z-40 animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <span className="flex h-2 w-2 relative">
          <span className=" absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <WifiOff className="w-4 h-4 shrink-0 text-amber-100" />
        <span className="font-bold tracking-tight text-caption sm:text-xs">
          {offlineMessage}
        </span>
      </div>
    </div>
  );
};
