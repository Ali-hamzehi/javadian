import React from 'react';
import { OperationalRecord } from '../../types';
import { formatRials, toPersianDigits } from '../../utils/formatters';
import { PersonDisplay } from './PersonDisplay';
import { StatusBadge, PriorityBadge } from './Badges';
import { BlockerPanel, NextActionPanel } from './BlockerAndNextAction';
import { User, UserCheck, Activity, History, AlertTriangle, ArrowRightCircle, Clock, Package } from 'lucide-react';

interface OperationalSevenQuestionsProps {
  record: OperationalRecord;
  onResolveBlocker?: () => void;
  onExecuteNextAction?: () => void;
  onViewFullTimeline?: () => void;
  compact?: boolean;
  className?: string;
}

export const OperationalSevenQuestions: React.FC<OperationalSevenQuestionsProps> = ({
  record,
  onResolveBlocker,
  onExecuteNextAction,
  onViewFullTimeline,
  compact = false,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-none divide-y divide-slate-100 ${className}`}>
      {/* Header with Title and Code */}
      <div className="p-4 bg-slate-50/60 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
              {record.code}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
              {record.typeLabel}
            </span>
            <PriorityBadge priority={record.priority} />
          </div>
          <h3 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">{record.title}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={record.status} label={record.statusLabel} />
        </div>
      </div>

      {/* Grid of the first 4 fundamental questions */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ۱. چه چیزی درخواست شده؟ */}
        <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
            <Package className="w-3.5 h-3.5 text-primary-700" />
            <span>۱. چه چیزی درخواست شده؟</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-900 line-clamp-2">{record.itemSummary}</p>
            {record.quantitySummary && (
              <p className="text-caption text-slate-600">
                مقدار/تعداد: <strong className="text-slate-800">{record.quantitySummary}</strong>
              </p>
            )}
            {record.requestedAmountRials !== undefined && (
              <p className="text-xs font-bold text-primary-900 pt-1">
                ارزش: {formatRials(record.requestedAmountRials)}
              </p>
            )}
          </div>
        </div>

        {/* ۲. چه کسی ایجاد کرده؟ */}
        <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
            <User className="w-3.5 h-3.5 text-primary-700" />
            <span>۲. چه کسی ایجاد کرده؟</span>
          </div>
          <div className="space-y-1.5">
            <PersonDisplay person={record.creator} size="sm" />
            <div className="flex items-center gap-1 text-caption text-slate-500 pt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>زمان ثبت: {record.createdAtJalali}</span>
            </div>
          </div>
        </div>

        {/* ۳. اکنون دست چه کسی است؟ */}
        <div className="bg-primary-50/40 rounded-lg p-3 border border-primary-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-900 mb-1.5">
            <UserCheck className="w-3.5 h-3.5 text-primary-700" />
            <span>۳. اکنون دست چه کسی است؟</span>
          </div>
          <div className="space-y-1.5">
            <PersonDisplay
              person={record.currentOwner}
              size="sm"
              isDelegate={record.currentOwner.isActingDelegate}
              delegatorName={record.currentOwner.delegatorName}
            />
            <div className="flex items-center justify-between text-caption text-primary-800 pt-0.5">
              <span>مدت توقف:</span>
              <span className="font-bold bg-primary-100 px-1.5 py-0.2 rounded">
                {toPersianDigits(record.currentOwner.durationHours)} ساعت
              </span>
            </div>
          </div>
        </div>

        {/* ۴. وضعیت چیست و از چه زمانی؟ */}
        <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-primary-700" />
            <span>۴. وضعیت و زمان تغییر؟</span>
          </div>
          <div className="space-y-1.5">
            <StatusBadge status={record.status} label={record.statusLabel} />
            <div className="text-caption text-slate-600 leading-tight">
              <span>آخرین وضعیت از: </span>
              <strong className="text-slate-800">{record.statusSinceJalali}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ۵. چه اتفاقاتی افتاده؟ (خلاصه آخرین رویداد + دکمه مشاهده تاریخچه) */}
      <div className="px-4 py-3 bg-slate-50/30 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-700">۵. چه اتفاقاتی افتاده؟</span>
          <span className="text-slate-500">
            ({toPersianDigits(record.timeline.length)} اقدام ثبت شده تا کنون)
          </span>
          {record.timeline[0] && (
            <span className="hidden sm:inline text-slate-600 border-r border-slate-200 pr-2">
              آخرین رویداد: «{record.timeline[0].title}» توسط {record.timeline[0].actor.name}
            </span>
          )}
        </div>
        {onViewFullTimeline && (
          <button
            type="button"
            onClick={onViewFullTimeline}
            className="text-primary-700 hover:text-primary-800 font-semibold cursor-pointer underline text-xs"
          >
            مشاهده کامل گزارش رویدادها
          </button>
        )}
      </div>

      {/* ۶. مانع چیست؟ */}
      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>۶. مانع چیست؟</span>
        </div>
        <BlockerPanel
          blocker={record.blocker}
          onResolve={onResolveBlocker}
        />
      </div>

      {/* ۷. اقدام بعدی چیست؟ */}
      <div className="p-4 rounded-b-xl space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary-900 mb-1">
          <ArrowRightCircle className="w-3.5 h-3.5 text-primary-700" />
          <span>۷. اقدام بعدی چیست؟</span>
        </div>
        <NextActionPanel
          nextAction={record.nextAction}
          onExecute={onExecuteNextAction}
        />
      </div>
    </div>
  );
};
