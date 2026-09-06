import React from 'react';
import { RefreshCw, Download, X } from 'lucide-react';
import { usePWA } from './PWAContext';

export const PWAUpdateBanner: React.FC = () => {
  const { hasUpdate, updateApp } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pwa-update-banner fixed bottom-16 lg:bottom-4 left-4 right-4 lg:right-auto lg:max-w-md bg-primary-900/95 text-white border border-primary-700/80 rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between gap-3 backdrop-blur-md animate-in slide-in-from-bottom duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center shrink-0 shadow-none">
          <Download className="w-4 h-4 text-primary-200" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-white">
            نسخه جدید آماده است — بروزرسانی
          </p>
          <p className="text-caption text-primary-200">
            برای اعمال تغییرات و دریافت آخرین نسخه دمو کلیک کنید
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => updateApp()}
          className="px-3 py-1.5 bg-white hover:bg-primary-50 text-primary-900 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>بروزرسانی</span>
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="بستن اعلان بروزرسانی"
          className="p-1.5 text-primary-300 hover:text-white rounded-lg hover:bg-primary-800/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
