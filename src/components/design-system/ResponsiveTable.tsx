import { AdaptiveTable } from './AdaptiveTable';
import React from 'react';
import { OperationalRecord } from '../../types';
import { formatRials, toPersianDigits } from '../../utils/formatters';
import { StatusBadge, PriorityBadge, OwnershipBadge } from './Badges';
import { PersonDisplay } from './PersonDisplay';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { Button } from './Button';

interface ResponsiveTableProps {
  records: OperationalRecord[];
  onSelectRecord: (record: OperationalRecord) => void;
  isLoading?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  records,
  onSelectRecord,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white animate-pulse rounded-lg border border-slate-200" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
        موردی با فیلترهای جاری یافت نشد.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ================= DESKTOP TABLE VIEW (Visible md and above) ================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-[#e6e8ef] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <AdaptiveTable className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-[#fbfbfd] border-b border-[#e6e8ef] text-[#697082] font-bold">
              <th className="py-3 px-4 w-28">کد رهگیری</th>
              <th className="py-3 px-4">عنوان و شرح درخواست</th>
              <th className="py-3 px-4 w-40">ایجادکننده</th>
              <th className="py-3 px-4 w-48">اکنون دست چه کسی است؟</th>
              <th className="py-3 px-4 w-36">وضعیت</th>
              <th className="py-3 px-4 w-36 text-left">مبلغ / ارزش</th>
              <th className="py-3 px-3 w-16 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e8ef]">
            {records.map((rec) => (
              <tr
                key={rec.id}
                onClick={() => onSelectRecord(rec)}
                className="hover:bg-[#f8f8fd] transition-colors cursor-pointer group"
              >
                {/* کد رهگیری و اولویت */}
                <td className="py-4 px-4 font-mono font-bold text-slate-700">
                  <div className="flex flex-col gap-1">
                    <bdi dir="ltr">{rec.code}</bdi>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                </td>

                {/* عنوان و مانع */}
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors text-sm">
                      {rec.title}
                    </span>
                    <span className="text-slate-500 line-clamp-1">{rec.itemSummary}</span>
                    {rec.blocker?.exists && (
                      <span className="inline-flex items-center gap-1 text-caption font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>مانع: {rec.blocker.reason}</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* ایجادکننده */}
                <td className="py-4 px-4">
                  <PersonDisplay person={rec.creator} size="sm" showDetails={false} />
                  <span className="text-caption text-slate-500 block mt-0.5">
                    {rec.createdAtJalali.split('-')[0]}
                  </span>
                </td>

                {/* اکنون دست چه کسی است؟ */}
                <td className="py-4 px-4">
                  <OwnershipBadge
                    ownerName={rec.currentOwner.name}
                    durationHours={rec.currentOwner.durationHours}
                    isDelegated={rec.currentOwner.isActingDelegate}
                    delegatorName={rec.currentOwner.delegatorName}
                  />
                </td>

                {/* وضعیت */}
                <td className="py-4 px-4">
                  <StatusBadge status={rec.status} label={rec.statusLabel} />
                </td>

                {/* ارزش / مبلغ */}
                <td className="py-4 px-4 text-left font-bold text-slate-900">
                  {rec.requestedAmountRials !== undefined ? (
                    formatRials(rec.requestedAmountRials)
                  ) : (
                    <span className="text-slate-500 font-normal">—</span>
                  )}
                </td>

                {/* دکمه اقدام */}
                <td className="py-4 px-3 text-center">
                  <button type="button" aria-label={`مشاهده ${rec.code}`} onClick={(event) => { event.stopPropagation(); onSelectRecord(rec); }} className="p-2 rounded-lg text-[#697082] hover:text-[#6558d9] hover:bg-[#f0eeff] inline-flex items-center justify-center transition-colors">
                    <ChevronLeft aria-hidden="true" className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdaptiveTable>
      </div>

      {/* ================= MOBILE PURPOSE-BUILT CARD LIST (< md) ================= */}
      <div className="md:hidden space-y-3">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-xl border border-[#e6e8ef] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:bg-[#fbfbfd] transition-colors space-y-3"
          >
            {/* Top row: Code + Status Badge */}
            <div className="mobile-record-heading flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-[#f5f6fa] border border-[#e6e8ef] px-2 py-0.5 rounded-lg">
                  {rec.code}
                </span>
                <PriorityBadge priority={rec.priority} />
              </div>
              <StatusBadge status={rec.status} label={rec.statusLabel} />
            </div>

            <Button variant="ghost" fullWidth onClick={() => onSelectRecord(rec)} aria-label={`مشاهده ${rec.code}`}>
              مشاهده و اقدام
            </Button>
            {/* Title & summary */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{rec.title}</h4>
              <p className="text-xs text-[#697082] mt-1 line-clamp-2">{rec.itemSummary}</p>
            </div>

            {/* Blocker alert on mobile if exists */}
            {rec.blocker?.exists && (
              <div className="p-2 rounded-lg bg-[#fff0f1] border border-[#ffd0d4] text-[#c74b55] text-xs flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#c74b55] shrink-0 mt-0.5" />
                <span className="font-medium text-caption leading-tight">
                  <strong>مانع:</strong> {rec.blocker.reason}
                </span>
              </div>
            )}

            {/* Bottom info: Owner & Amount */}
            <div className="mobile-record-meta pt-2 border-t border-[#e6e8ef] flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1 text-slate-700 truncate">
                <span className="text-[#697082]">دست:</span>
                <strong className="text-[#6558d9] truncate">{rec.currentOwner.name}</strong>
                <span className="text-caption text-[#697082]">
                  ({toPersianDigits(rec.currentOwner.durationHours)}ساعت)
                </span>
              </div>

              {rec.requestedAmountRials !== undefined && (
                <span className="font-bold text-slate-900 shrink-0 text-xs">
                  {formatRials(rec.requestedAmountRials)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
