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
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded border border-primary-200">
            {record.code}
          </span>
          <Badge variant={mode === 'decisions' ? 'accent' : 'neutral'}>
            {record.typeLabel || 'پرونده عملیاتی'}
          </Badge>
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
              سررسید گذشته
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
          className="font-extrabold text-slate-900 text-sm hover:text-primary-700 cursor-pointer transition-colors leading-snug"
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

      {/* Blocker alert if present */}
      {hasBlocker && record.blocker && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>مانع: {record.blocker.reason}</span>
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
            <span className="text-slate-400">ثبت‌کننده:</span>
            <span className="font-semibold text-slate-800">{getDisplayPersonaName(record.creator)}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">مسئول فعلی:</span>
            <span className="font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
              {getDisplayPersonaName(currentAssignee) || 'نامشخص'}
            </span>
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
            شناسنامه و سوابق
          </Button>
        </div>
      </div>
    </div>
  );
};
