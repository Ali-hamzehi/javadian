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
  ArrowLeft,
  User,
  Play,
  FileCheck,
  Eye,
} from 'lucide-react';
import { getDisplayPersonaName } from '../../runtime/documentBasedPersonas';

interface EmployeeWorkCardProps {
  record: OperationalRecord;
  activePersona: MockPersona;
  activeTab: 'to_do' | 'tracking' | 'history';
  onOpenDrawer: (recordId: string) => void;
  onStartWork?: (recordId: string) => void;
}

export const EmployeeWorkCard: React.FC<EmployeeWorkCardProps> = ({
  record,
  activePersona,
  activeTab,
  onOpenDrawer,
  onStartWork,
}) => {
  const allowed = computeAllowedActions(activePersona, record);
  const currentAssignee = record.currentAssignee || record.currentOwner;
  const hasBlocker = record.status === 'blocked' || Boolean(record.blocker?.exists);
  const isReturned = record.status === 'returned';
  const isTerminal = record.status === 'completed' || record.status === 'rejected' || record.status === 'cancelled';
  const isOverdue = isJalaliOverdue(record.dueDateJalali) && !isTerminal;

  // Status Presentation tailored to plain Persian
  const getSemanticStatus = () => {
    if (hasBlocker) {
      return <Badge variant="danger">مسدود (دارای مانع)</Badge>;
    }
    if (isReturned) {
      return <Badge variant="warning">عودت جهت اصلاح</Badge>;
    }
    if (record.status === 'completed') {
      return <Badge variant="success">تکمیل‌شده</Badge>;
    }
    if (record.status === 'rejected') {
      return <Badge variant="danger">رد شده</Badge>;
    }
    if (record.status === 'cancelled') {
      return <Badge variant="neutral">لغو شده</Badge>;
    }
    if (record.status === 'pending_approval' || record.type === 'approval' || record.workItemType === 'approval_review') {
      return <Badge variant="accent">در انتظار تصمیم و تأیید</Badge>;
    }
    if (record.status === 'in_progress' || record.status === 'in_review') {
      return <Badge variant="primary">در دست اقدام</Badge>;
    }
    return <Badge variant="neutral">آماده شروع</Badge>;
  };

  // Determine Primary Action
  const renderPrimaryAction = () => {
    if (activeTab === 'tracking') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          مشاهده وضعیت و پیگیری
        </Button>
      );
    }

    if (activeTab === 'history') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          مشاهده سابقه و نتیجه
        </Button>
      );
    }

    // In 'to_do' tab
    if (hasBlocker && allowed.can_resolve_blocker) {
      return (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<AlertTriangle className="w-4 h-4" />}
        >
          بررسی و رفع مانع
        </Button>
      );
    }

    if (isReturned && allowed.can_submit_result) {
      return (
        <Button
          variant="warning"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          اصلاح درخواست و ارسال
        </Button>
      );
    }

    if (allowed.can_start) {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => (onStartWork ? onStartWork(record.id) : onOpenDrawer(record.id))}
          leftIcon={<Play className="w-4 h-4 fill-current" />}
        >
          شروع به کار
        </Button>
      );
    }

    if (allowed.can_submit_result) {
      return (
        <Button
          variant="success"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<FileCheck className="w-4 h-4" />}
        >
          ثبت نتیجه و تکمیل
        </Button>
      );
    }

    if (allowed.can_approve) {
      return (
        <Button
          variant="success"
          size="sm"
          onClick={() => onOpenDrawer(record.id)}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          بررسی و تصمیم‌گیری
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onOpenDrawer(record.id)}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        مشاهده جزئیات و اقدام
      </Button>
    );
  };

  // Amount display only if vital for active role in a genuine payment task
  const isFinanceRelevant =
    (activePersona.capabilities.includes('finance.read') ||
      activePersona.capabilities.includes('finance.payment_request.create') ||
      activePersona.capabilities.includes('finance.payment_request.approve')) &&
    (record.linkedBusinessRecord?.category === 'payment_request' || record.type === 'payment_request');

  return (
    <div
      className={`bg-white rounded-xl border transition-all hover:border-slate-300 p-4 space-y-2.5 ${
        hasBlocker
          ? 'border-rose-300 bg-rose-50/15'
          : isReturned
          ? 'border-amber-300 bg-amber-50/15'
          : isOverdue
          ? 'border-rose-200'
          : 'border-slate-200'
      }`}
    >
      {/* 1. وضعیت و اولویت */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {record.code}
          </span>
          {getSemanticStatus()}
          <PriorityBadge priority={record.priority} />
        </div>
      </div>

      {/* 2. عنوان کار */}
      <div>
        <h3
          onClick={() => onOpenDrawer(record.id)}
          className="card-title font-extrabold text-slate-900 text-base hover:text-primary-700 cursor-pointer transition-colors leading-snug"
        >
          {record.title}
        </h3>
      </div>

      {/* 3. توضیح یک‌خطی */}
      {record.itemSummary && (
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-1">{record.itemSummary}</p>
      )}

      {/* 4. مهلت */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>مهلت:</span>
          <strong className="text-slate-800">{record.dueDateJalali || 'تعیین نشده'}</strong>
        </span>
        {isOverdue && (
          <span className="font-bold text-caption text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            سررسید گذشته (تأخیر)
          </span>
        )}

        {/* Amount Display strictly only when relevant to this role */}
        {isFinanceRelevant && record.requestedAmountRials != null && record.requestedAmountRials > 0 && (
          <div className="inline-flex items-center gap-1.5 mr-auto px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-caption">
            <span className="text-slate-500">مبلغ:</span>
            <CurrencyAmount amountRials={record.requestedAmountRials} layout="inline" size="sm" tone="primary" />
          </div>
        )}
      </div>

      {/* 5. مانع، در صورت وجود */}
      {hasBlocker && record.blocker && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold shrink-0">مانع کاری:</span>
            <span className="truncate">{record.blocker.reason}</span>
          </div>
        </div>
      )}

      {isReturned && record.returnedReason && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold shrink-0">علت بازگشت:</span>
            <span className="truncate">{record.returnedReason}</span>
          </div>
        </div>
      )}

      {/* 6. قدم بعدی و 7. دکمه اصلی */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Next Step & Current Owner */}
        <div className="flex flex-wrap items-center gap-3 text-caption text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">مسئول فعلی:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {getDisplayPersonaName(currentAssignee) || 'نامشخص'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">قدم بعدی:</span>
            <span className="font-semibold text-slate-800">
              {record.nextAction?.title || 'بررسی و اقدام متناسب'}
            </span>
          </div>
        </div>

        {/* 7. دکمه اصلی */}
        <div className="flex items-center gap-2 mr-auto">
          {renderPrimaryAction()}
        </div>
      </div>
    </div>
  );
};
