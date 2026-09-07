import React from 'react';
import { DialogSurface } from '../design-system/DialogSurface';
import { Share2, PlusSquare, Smartphone, Monitor, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { usePWA } from './PWAContext';
import { toPersianDigits } from '../../utils/formatters';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isDesktop, platform, triggerInstall, isStandalone } = usePWA();

  if (!isOpen) return null;

  return (
    <DialogSurface isOpen={isOpen} onClose={onClose} title="نصب نسخه اپلیکیشن جوادیان">
      <div className="dialog-panel max-w-md text-right">
        {/* Header */}
        <div className="dialog-header p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center text-white font-black text-base shadow-sm">
              ج
            </div>
            <div>
              <h3 id="pwa-install-title" className="text-sm font-extrabold text-white">
                نصب نسخه اپلیکیشن جوادیان
              </h3>
              <p className="text-caption text-slate-300 mt-0.5">
                دسترسی سریع و تمام‌صفحه به سامانه عملیات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="dialog-body space-y-4">
          {/* Prototype Disclosure */}
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold mb-0.5">نسخه نمایشی قابل نصب — فاقد اتصال عملیاتی به سرور</strong>
              نصب برنامه باعث ذخیره رابط کاربری و اطلاعات دمو روی دستگاه شما می‌شود و عملکرد نمایشی را در پنجره مستقل ارائه می‌دهد.
            </div>
          </div>

          {/* iOS / iPadOS Safari Guide */}
          {isIOS && !isStandalone && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2.5">
                <p className="font-bold text-slate-900">
                  برای نصب برنامه، گزینه اشتراک‌گذاری مرورگر را باز کنید و سپس «Add to Home Screen / افزودن به صفحه اصلی» را انتخاب کنید.
                </p>

                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-caption text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center shrink-0">
                      {toPersianDigits(1)}
                    </span>
                    <span>در نوار پایین مرورگر Safari، دکمه</span>
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-caption text-slate-900">
                      <Share2 className="w-3 h-3 text-primary-700" /> اشتراک‌گذاری (Share)
                    </span>
                    <span>را لمس کنید.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-caption text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center shrink-0">
                      {toPersianDigits(2)}
                    </span>
                    <span>منو را به پایین اسکرول کرده و گزینه</span>
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-bold text-caption text-slate-900">
                      <PlusSquare className="w-3 h-3 text-primary-700" /> Add to Home Screen
                    </span>
                    <span>را بزنید.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-caption text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center shrink-0">
                      {toPersianDigits(3)}
                    </span>
                    <span>در گوشه بالا، دکمه «Add» را فشار دهید تا آیکون روی صفحه اصلی شما قرار گیرد.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chromium Android / Desktop Available */}
          {(platform === 'chromium' || platform === 'desktop_chromium') && (
            <div className="space-y-3">
              <div className="bg-primary-50/70 border border-primary-200 rounded-xl p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary-700 text-white flex items-center justify-center mx-auto mb-2 shadow-none">
                  {isDesktop ? <Monitor className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  نصب روی این دستگاه
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  سامانه به عنوان یک اپلیکیشن مستقل با قابلیت کار با کش آفلاین و آیکون اختصاصی روی سیستم شما قرار می‌گیرد.
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    const result = await triggerInstall();
                    if (result === 'accepted') {
                      onClose();
                    }
                  }}
                  className="w-full py-3 px-4 bg-primary-700 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-none transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>نصب روی این دستگاه</span>
                </button>
              </div>
            </div>
          )}

          {/* Unsupported Browser */}
          {platform === 'unsupported' && !isIOS && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                نصب مستقیم در این مرورگر پشتیبانی نمی‌شود؛ سامانه همچنان از طریق وب قابل استفاده است.
              </p>
              <p className="text-caption text-slate-500 leading-relaxed">
                برای نصب برنامه، می‌توانید این صفحه را در مرورگرهای Chrome، Edge یا Samsung Internet باز فرمایید.
              </p>
            </div>
          )}

          {/* App Status Details */}
          <div className="bg-slate-50 rounded-xl p-3 text-caption text-slate-600 space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span>وضعیت برنامه:</span>
              <strong className="text-slate-800">
                {isStandalone ? 'برنامه نصب‌شده' : 'درحال اجرا در مرورگر'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>سامانه:</span>
              <strong className="text-slate-800">عملیات جوادیان</strong>
            </div>
            <div className="flex justify-between">
              <span>دامنه کش آفلاین:</span>
              <span className="text-emerald-700 font-bold">پوسته و پرونده‌های نمایشی</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dialog-footer bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </DialogSurface>
  );
};
