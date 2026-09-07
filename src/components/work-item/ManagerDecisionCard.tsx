import React from 'react';
import { OperationalRecord, MockPersona } from '../../types';
import { Button } from '../design-system/Button';
import { Badge, PriorityBadge } from '../design-system/Badges';
import { CurrencyAmount } from '../design-system/CurrencyAmount';
import { computeAllowedActions } from '../../utils/workItemAuthorization';
import { isJalaliOverdue } from '../../utils/formatters';
import {
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Check,
  XCircle,
  Eye,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getDisplayPersonaName } from '../../runtime/documentBasedPersonas';

interface ManagerDecisionCardProps {
  record: OperationalRecord;
  activePersona: MockPersona;
  mode: 'decisions' | 'team_tracking' | 'personal';
  onOpenDrawer: (recordId: string) => void;
  onApprove?: (recordId: string) => void;
  onReturn?: (recordId: string) => void;
  onReject?: (recordId: string) => void;
}

export const getStatusDisplayBadge = (status: string, customLabel?: string) => {
  const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
    waiting: { label: 'در انتظار', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    blocked: { label: 'مسدود', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    overdue: { label: 'معوق', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    urgent: { label: 'فوری', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    approved: { label: 'تأیید شده', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    returned: { label: 'عودت داده شده', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    rejected: { label: 'رد شده', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    completed: { label: 'تکمیل شده', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
    in_progress: { label: 'در حال انجام', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    draft: { label: 'پیش‌نویس', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    submitted: { label: 'ارسال شده', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    under_review: { label: 'در حال بررسی', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    pending_approval: { label: 'در انتظار تأیید', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    pending_commercial_approval: { label: 'در انتظار تأیید بازرگانی', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    needs_price_approval: { label: 'نیازمند تأیید قیمت', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    needs_commercial_approval: { label: 'نیازمند تأیید بازرگانی', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    ready: { label: 'آماده اقدام', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    ready_for_payment: { label: 'آماده پرداخت', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    paid: { label: 'پرداخت شده', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    dispatched: { label: 'ترخیص و ارسال شده', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    delivered: { label: 'تحویل شده', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    cancelled: { label: 'لغو شده', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    NOT_CONNECTED: { label: 'متصل نیست', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    NOT_CONFIGURED: { label: 'پیکربندی نشده', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    NOT_POSTED: { label: 'ثبت رسمی نشده', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    PROTOTYPE_ONLY: { label: 'نمایشی', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const item = map[status] || {
    label: customLabel || status,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const finalLabel = customLabel && !map[customLabel] ? customLabel : item.label;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-bold border ${item.bg} ${item.text} ${item.border}`}>
      {finalLabel}
    </span>
  );
};

export const ManagerDecisionCard: React.FC<ManagerDecisionCardProps> = ({
  record,
  activePersona,
  mode,
  onOpenDrawer,
  onApprove,
  onReturn,
  onReject,
}) => {
  const allowed = computeAllowedActions(activePersona, record);
  const currentAssignee = record.currentAssignee || record.currentOwner;
  const hasBlocker = record.status === 'blocked' || Boolean(record.blocker?.exists);
  const isReturned = record.status === 'returned';
  const isTerminal = record.status === 'completed' || record.status === 'rejected' || record.status === 'cancelled';
  const isOverdue = isJalaliOverdue(record.dueDateJalali) && !isTerminal;

  const isCreatorSelf = record.creator.id === activePersona.id;
  const cannotSelfApprove = isCreatorSelf && !allowed.can_approve;

  return (
    <div
      className={`bg-white rounded-xl border p-4.5 space-y-3.5 transition-all hover:border-slate-300 ${
        hasBlocker
          ? 'border-rose-300 bg-rose-50/15'
          : isReturned
          ? 'border-amber-300 bg-amber-50/15'
          : isOverdue
          ? 'border-rose-200'
          : 'border-slate-200'
      }`}
    >
      {/* Top Header: Code, Priority, Due Date */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
            {record.code}
          </span>
          {getStatusDisplayBadge(record.status, record.statusLabel)}
          <PriorityBadge priority={record.priority} />
          {cannotSelfApprove && (
            <span className="text-caption font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              ثبت‌کننده نمی‌تواند درخواست خود را تأیید کند
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-caption text-slate-500">
          {isOverdue && (
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              معوق
            </span>
          )}
          {record.dueDateJalali && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>مهلت: {record.dueDateJalali}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Title & Details */}
      <div className="space-y-1">
        <h3
          onClick={() => onOpenDrawer(record.id)}
          className="card-title font-extrabold text-slate-900 text-base hover:text-primary-700 cursor-pointer transition-colors leading-snug"
        >
          {record.title}
        </h3>
        {record.itemSummary && (
          <p className="text-xs text-slate-600 line-clamp-1">{record.itemSummary}</p>
        )}
      </div>

      {/* Key Financial / Quantity Data if applicable */}
      {record.requestedAmountRials != null && record.requestedAmountRials > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <span className="text-caption text-slate-500 font-semibold">مبلغ:</span>
          <CurrencyAmount amountRials={record.requestedAmountRials} layout="inline" size="sm" tone="primary" />
        </div>
      )}

      {/* Next Action Box */}
      {record.nextAction?.title && (
        <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-950">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-800 shrink-0">اقدام بعدی:</span>
            <span className="font-medium text-slate-800">{record.nextAction.title}</span>
          </div>
          {record.nextAction.responsiblePersonName && (
            <span className="text-caption text-blue-700 font-medium">
              مسئول اقدام: {getDisplayPersonaName(record.nextAction.responsiblePersonName)}
            </span>
          )}
        </div>
      )}

      {/* Blocker alert if present */}
      {hasBlocker && record.blocker && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>علت توقف (مانع): {record.blocker.reason}</span>
          </div>
          {record.blocker.resolutionPlan && (
            <p className="text-caption text-rose-800 pr-6">
              طرح رفع مانع: {record.blocker.resolutionPlan}
            </p>
          )}
        </div>
      )}

      {/* Decision / Responsibility Row */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Parties involved */}
        <div className="flex flex-wrap items-center gap-3 text-caption text-slate-600">
          <div className="flex items-center gap-1">
            <span className="text-slate-600 font-medium">ثبت‌کننده:</span>
            <span className="font-semibold text-slate-800">{getDisplayPersonaName(record.creator)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-600 font-medium">مسئول فعلی:</span>
            <span className="font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
              {getDisplayPersonaName(currentAssignee) || 'نامشخص'}
            </span>
            {(currentAssignee as any)?.heldSinceJalali && (
              <span className="text-caption text-slate-500 mr-1 font-mono">
                (از {(currentAssignee as any).heldSinceJalali})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons for Manager */}
        <div className="flex items-center gap-2 mr-auto">
          {mode === 'decisions' && allowed.can_approve && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => (onApprove ? onApprove(record.id) : onOpenDrawer(record.id))}
                leftIcon={<Check className="w-4 h-4" />}
              >
                تأیید
              </Button>
              {allowed.can_return && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => (onReturn ? onReturn(record.id) : onOpenDrawer(record.id))}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  عودت
                </Button>
              )}
              {allowed.can_reject && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => (onReject ? onReject(record.id) : onOpenDrawer(record.id))}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  رد
                </Button>
              )}
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenDrawer(record.id)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            مشاهده جزئیات
          </Button>
        </div>
      </div>
    </div>
  );
};
