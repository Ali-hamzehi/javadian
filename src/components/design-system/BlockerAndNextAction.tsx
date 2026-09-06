import React from 'react';
import { BlockerInfo, NextActionInfo } from '../../types';
import { AlertOctagon, ArrowLeft, CheckCircle2, Clock, ClipboardCheck } from 'lucide-react';
import { Button } from './Button';

interface BlockerPanelProps {
  blocker: BlockerInfo | null;
  onResolve?: () => void;
  onReport?: () => void;
  canManage?: boolean;
}

export const BlockerPanel: React.FC<BlockerPanelProps> = ({
  blocker,
  onResolve,
  onReport,
  canManage = true,
}) => {
  if (!blocker || !blocker.exists) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">هیچ مانع یا وقفه عملیاتی بر روی این پرونده ثبت نشده است.</span>
        </div>
        {canManage && onReport && (
          <Button variant="ghost" size="sm" onClick={onReport} className="text-emerald-800 hover:bg-emerald-100">
            اعلام مانع جدید
          </Button>
        )}
      </div>
    );
  }

  const isCritical = blocker.severity === 'critical';

  return (
    <div
      className={`rounded-lg p-4 border transition-all ${
        isCritical
          ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-none'
          : 'bg-amber-50/90 border-amber-300 text-amber-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
              isCritical ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs uppercase tracking-wide">
                {isCritical ? 'مانع بحرانی و توقف فرآیند' : 'هشدار مانع عملیاتی'}
              </span>
              {blocker.reportedAtJalali && (
                <span className="text-caption opacity-75 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ثبت شده در: {blocker.reportedAtJalali}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold leading-relaxed">{blocker.reason}</p>
            {blocker.reporter && (
              <p className="mt-1 text-caption opacity-80">
                گزارش‌دهنده: {blocker.reporter.name} ({blocker.reporter.role})
              </p>
            )}
          </div>
        </div>

        {canManage && onResolve && (
          <Button
            size="sm"
            variant={isCritical ? 'destructive' : 'primary'}
            onClick={onResolve}
            className="shrink-0"
          >
            رفع مانع و بازگشایی
          </Button>
        )}
      </div>
    </div>
  );
};

interface NextActionPanelProps {
  nextAction: NextActionInfo;
  onExecute?: () => void;
  canExecute?: boolean;
}

export const NextActionPanel: React.FC<NextActionPanelProps> = ({
  nextAction,
  onExecute,
  canExecute = true,
}) => {
  const getActionBtnTitle = (type: string) => {
    switch (type) {
      case 'approve':
        return 'تأیید و ارسال به مرحله بعد';
      case 'dispatch':
        return 'صدور مجوز خروج انبار';
      case 'pay':
        return 'تأیید و اجرای پرداخت حواله';
      case 'resolve_blocker':
        return 'اقدام جهت رفع مانع';
      case 'review':
        return 'ثبت بررسی و نتیجه';
      default:
        return 'اقدام در کارتابل';
    }
  };

  return (
    <div className="rounded-lg bg-primary-50/80 border border-primary-200 p-4 text-primary-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-md bg-primary-100 text-primary-700 shrink-0 mt-0.5">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-caption font-bold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded">
              اقدام بعدی مشخص شده
            </span>
            <span className="text-xs text-primary-900 font-medium">
              مسئول: <strong className="font-bold">{nextAction.responsibleRole}</strong>
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-primary-950">{nextAction.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-primary-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-primary-700" />
            <span>مهلت اقدام: {nextAction.dueJalali}</span>
          </div>
        </div>
      </div>

      {canExecute && onExecute && (
        <Button
          size="sm"
          variant="primary"
          onClick={onExecute}
          rightIcon={<ArrowLeft className="w-4 h-4" />}
          className="shrink-0"
        >
          {getActionBtnTitle(nextAction.suggestedAction)}
        </Button>
      )}
    </div>
  );
};
