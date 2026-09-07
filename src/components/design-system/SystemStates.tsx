import React from 'react';
import {
  ShieldX,
  FileQuestion,
  AlertTriangle,
  WifiOff,
  Inbox,
  RefreshCw,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './Button';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200">
      <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl mb-3">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="sm" variant="primary" onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const OfflineBanner: React.FC<{ onReconnect?: () => void }> = ({ onReconnect }) => {
  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between flex-wrap gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="font-semibold">اتصال با سرور مرکزی قطع است. در حال کار در وضعیت آفلاین هستید.</span>
      </div>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors"
        >
          تلاش مجدد برای اتصال
        </button>
      )}
    </div>
  );
};

export const Forbidden403: React.FC<{
  missingCapabilities?: string[];
  onSwitchPersona?: () => void;
  onNavigateToInbox?: () => void;
}> = ({ missingCapabilities = ['access.manage'], onSwitchPersona, onNavigateToInbox }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-white rounded-2xl border border-slate-200 shadow-none">
      <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl mb-3 ring-8 ring-amber-50/50">
        <ShieldX className="w-10 h-10" />
      </div>
      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
        دسترسی غیرمجاز (خطای ۴۰۳)
      </span>
      <h3 className="mt-2 text-base font-extrabold text-slate-900">شما مجوز دسترسی به این بخش عملیاتی را ندارید</h3>
      <p className="mt-1.5 text-xs text-slate-600 max-w-md leading-relaxed">
        پست و مسئولیت سازمانی شما برای مشاهده یا اقدام در این بخش تعریف نشده است. داده‌های این صفحه برای حفظ محرمانگی و تفکیک وظایف بارگذاری نشد.
      </p>

      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-right w-full max-w-sm space-y-1.5">
        <div className="text-slate-600 text-caption">
          جهت بازنگری در حدود اختیارات یا درخواست تفویض جانشینی، با <strong>مدیر سیستم و عملیات</strong> تماس بگیرید.
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5">
        {onNavigateToInbox && (
          <Button
            size="sm"
            variant="primary"
            onClick={onNavigateToInbox}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            بازگشت به کارهای من
          </Button>
        )}

        {onSwitchPersona && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSwitchPersona}
          >
            تغییر نقش (حالت آزمایشی دمو)
          </Button>
        )}
      </div>
    </div>
  );
};

export const NotFound404: React.FC<{ onBackHome?: () => void }> = ({ onBackHome }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-white rounded-xl border border-slate-200">
      <div className="p-4 bg-slate-100 text-slate-500 rounded-2xl mb-3">
        <FileQuestion className="w-10 h-10" />
      </div>
      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
        خطای ۴۰۴
      </span>
      <h3 className="mt-2 text-base font-bold text-slate-900">پرونده یا صفحه مورد نظر یافت نشد</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
        ممکن است شناسه سند اشتباه باشد، به آرشیو منتقل شده باشد یا دسترسی آن تغییر کرده باشد.
      </p>
      {onBackHome && (
        <Button size="sm" variant="outline" onClick={onBackHome} className="mt-4">
          بازگشت به کارهای من
        </Button>
      )}
    </div>
  );
};

export const ConflictState: React.FC<{
  currentValue: string;
  serverValue: string;
  modifiedBy: string;
  onResolve: (action: 'overwrite' | 'reload') => void;
}> = ({ currentValue, serverValue, modifiedBy, onResolve }) => {
  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-200 text-amber-800 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900">هشدار تداخل همزمان (Concurrency Conflict 409)</h4>
          <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
            این رکورد لحظاتی پیش توسط همکار شما <strong>«{modifiedBy}»</strong> بروزرسانی شده است. تغییرات شما با داده‌های جدید سرور تداخل دارد.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
        <div className="p-3 bg-white rounded-lg border border-amber-200">
          <span className="font-bold text-slate-600 block mb-1">نسخه ثبت‌شده روی سرور:</span>
          <p className="text-slate-900 font-medium">{serverValue}</p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-primary-200">
          <span className="font-bold text-primary-700 block mb-1">تغییرات محلی شما:</span>
          <p className="text-slate-900 font-medium">{currentValue}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
        <Button size="sm" variant="outline" onClick={() => onResolve('reload')}>
          بارگذاری مجدد نسخه سرور (صرف‌نظر از تغییرات من)
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onResolve('overwrite')}>
          اعمال تغییرات من (بازنویسی نسخه سرور)
        </Button>
      </div>
    </div>
  );
};

export const UnavailableIntegrationState: React.FC<{
  systemName: string;
  errorCode?: string;
  errorMessage?: string;
  lastSuccessfulSync?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({
  systemName,
  errorCode = 'EXT_503_UNAVAILABLE',
  errorMessage = 'سرویس سامانه ثالث در حال حاضر پاسخگو نیست یا به علت عملیات دوره‌ای از دسترس خارج شده است.',
  lastSuccessfulSync = 'امروز - ۰۸:۳۰',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="p-5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">عدم دسترسی به سامانه یکپارچه‌ساز خارجی</h4>
              <span className="font-mono text-caption bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                {errorCode}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              ارتباط با <strong>«{systemName}»</strong> برقرار نشد. آخرین وضعیت پایدار محلی نمایش داده شده است.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span>شرح خطای سیستمی:</span>
          <span className="font-mono text-slate-700 text-caption">{errorMessage}</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
          <span>آخرین همگام‌سازی موفق:</span>
          <span className="font-medium text-emerald-700">{lastSuccessfulSync}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-caption text-slate-500">
          داده‌های عملیاتی در صف محلی امن نگهداری شده و پس از رفع قطعی خودکار ارسال خواهند شد.
        </span>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />}
          >
            {isRetrying ? 'در حال اتصال مجدد...' : 'تلاش مجدد برای استعلام'}
          </Button>
        )}
      </div>
    </div>
  );
};
