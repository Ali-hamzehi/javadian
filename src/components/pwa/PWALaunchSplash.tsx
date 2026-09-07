import React, { useEffect, useState } from 'react';

export const PWALaunchSplash: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const removeTimer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 350);
      return () => clearTimeout(removeTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-100 bg-slate-950 flex flex-col items-center justify-center p-4 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ direction: 'rtl' }}
    >
      <div className="flex flex-col items-center text-center max-w-xs animate-in  duration-200">
        <div className="w-20 h-20 rounded-2xl bg-primary-700 flex items-center justify-center text-white text-3xl font-black shadow-none mb-4">
          ج
        </div>
        <h1 className="text-lg font-black text-white tracking-tight">
          سامانه عملیات جوادیان
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          مدیریت عملیات، زنجیره تأمین و لجستیک
        </p>

        <div className="w-32 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full  w-full" />
        </div>

        <span className="text-caption text-slate-300 mt-3 font-medium">
          سامانه عملیات سازمانی
        </span>
      </div>
    </div>
  );
};
