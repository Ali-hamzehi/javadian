import { DialogSurface } from '../design-system/DialogSurface';
import { canAccessRoute } from '../../routes/routesConfig';
import React, { useState } from 'react';
import { Search, X, ArrowRight, Package, Truck, CreditCard, ShoppingBag, MapPin, MessageSquare, BarChart3, Server } from 'lucide-react';
import { mockRepository } from '../../runtime/workflow';
import { OperationalRecord, MockPersona } from '../../types';
import { StatusBadge } from '../design-system/Badges';
import { MOCK_FIELD_VISITS, MOCK_MANUAL_INTAKES, MOCK_OPERATIONAL_DRILL_RECORDS } from '../../data/mockOperationsPrompt4';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord: (record: OperationalRecord) => void;
  onNavigateRoute: (routeKey: string) => void;
  activePersona?: MockPersona | null;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectRecord,
  onNavigateRoute,
  activePersona,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const records = mockRepository.filterRecords({ query }, activePersona || undefined);

  const matchedVisits = q
    ? MOCK_FIELD_VISITS.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          v.customerName.toLowerCase().includes(q) ||
          (v.customerTradeName && v.customerTradeName.toLowerCase().includes(q)) ||
          v.address.toLowerCase().includes(q)
      )
    : [];

  const matchedIntakes = q
    ? MOCK_MANUAL_INTAKES.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.senderName.toLowerCase().includes(q) ||
          (i.senderCompany && i.senderCompany.toLowerCase().includes(q)) ||
          i.summary.toLowerCase().includes(q)
      )
    : [];

  const matchedDrill = q
    ? MOCK_OPERATIONAL_DRILL_RECORDS.filter(
        (d) =>
          d.code.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.customerOrParty.toLowerCase().includes(q) ||
          d.ownerName.toLowerCase().includes(q)
      )
    : [];

  const totalMatches = records.length + matchedVisits.length + matchedIntakes.length + matchedDrill.length;

  const quickRoutes = [
    { title: 'کارتابل من و اقدامات جاری', routeKey: 'inbox', icon: <Package className="w-4 h-4 text-primary-700" /> },
    { title: 'برنامه ویزیت میدانی و فروش', routeKey: 'visit_plans', icon: <MapPin className="w-4 h-4 text-emerald-600" /> },
    { title: 'درگاه ثبت دستی تماس و پیام (Intake)', routeKey: 'sales_calls', icon: <MessageSquare className="w-4 h-4 text-sky-600" /> },
    { title: 'دیده‌بان عملیاتی و پایش گلوگاه‌ها', routeKey: 'ops_view', icon: <BarChart3 className="w-4 h-4 text-amber-600" /> },
    { title: 'خطاهای یکپارچه‌سازی و سامانه‌ها', routeKey: 'integration_errors', icon: <Server className="w-4 h-4 text-slate-600" /> },
    { title: 'سفارش‌های فروش', routeKey: 'sales_orders', icon: <ShoppingBag className="w-4 h-4 text-primary-700" /> },
    { title: 'درخواست‌های تأمین و لجستیک', routeKey: 'supply_requests', icon: <Truck className="w-4 h-4 text-amber-600" /> },
    { title: 'درخواست‌های پرداخت مالی', routeKey: 'payment_requests', icon: <CreditCard className="w-4 h-4 text-sky-600" /> },
  ];

  return (
    <DialogSurface isOpen={isOpen} onClose={onClose} title="جستجو در سامانه">
      <div className="dialog-panel max-w-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-4 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-primary-700 shrink-0" />
          <input
            aria-label="جستجوی اسناد و اطلاعات سامانه"
            autoFocus
            type="text"
            placeholder="جستجوی شماره سفارش، عنوان کالا، نام مشتری، پرسنل یا شماره بارنامه..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
           aria-label="بستن">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="dialog-body p-3 divide-y divide-slate-100">
          {query.trim() === '' ? (
            <div className="py-2">
              <span className="text-caption font-bold text-slate-500 px-3 block mb-1.5 uppercase">
                بخش‌های پرکاربرد سامانه
              </span>
              <div className="space-y-1">
                {quickRoutes.filter(route => !activePersona || canAccessRoute(route.routeKey, activePersona)).map((r) => (
                  <button
                    key={r.routeKey}
                    onClick={() => {
                      onNavigateRoute(r.routeKey);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 text-right text-xs text-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {r.icon}
                      <span className="font-semibold text-slate-800">{r.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              هیچ نتیجه‌ای مطابق عبارت «{query}» پیدا نشد.
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {/* Core Operational Records */}
              {records.length > 0 && (
                <div className="space-y-1">
                  <span className="text-caption font-bold text-slate-500 px-2 block mb-1">
                    پرونده‌ها و اسناد کارتابل ({records.length})
                  </span>
                  {records.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        onSelectRecord(rec);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-primary-50/60 text-right cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary-700">{rec.code}</span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{rec.title}</span>
                        </div>
                        <span className="text-caption text-slate-500 line-clamp-1 mt-0.5">
                          {rec.itemSummary} • مسئول فعلی: {rec.currentOwner.name}
                        </span>
                      </div>
                      <div className="shrink-0 mr-2">
                        <StatusBadge status={rec.status} label={rec.statusLabel} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Field Visits */}
              {matchedVisits.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-caption font-bold text-slate-500 px-2 block mb-1">
                    برنامه ویزیت میدانی ({matchedVisits.length})
                  </span>
                  {matchedVisits.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        onNavigateRoute('visit_plans');
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50/60 text-right cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700">{v.code}</span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{v.customerName}</span>
                          {v.customerTradeName && (
                            <span className="text-caption text-slate-500">({v.customerTradeName})</span>
                          )}
                        </div>
                        <span className="text-caption text-slate-500 line-clamp-1 mt-0.5">{v.address}</span>
                      </div>
                      <span className="text-caption font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        ویزیت میدانی
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Intake */}
              {matchedIntakes.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-caption font-bold text-slate-500 px-2 block mb-1">
                    پیام‌ها و تماس‌های ورودی (Intake) ({matchedIntakes.length})
                  </span>
                  {matchedIntakes.map((i) => (
                    <div
                      key={i.id}
                      onClick={() => {
                        onNavigateRoute('sales_calls');
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-sky-50/60 text-right cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-700">{i.code}</span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{i.senderName}</span>
                          {i.senderCompany && (
                            <span className="text-caption text-slate-500">({i.senderCompany})</span>
                          )}
                        </div>
                        <span className="text-caption text-slate-500 line-clamp-1 mt-0.5">{i.summary}</span>
                      </div>
                      <span className="text-caption font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                        {i.channel}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Operational Drill */}
              {matchedDrill.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-caption font-bold text-slate-500 px-2 block mb-1">
                    دیده‌بان عملیاتی و گلوگاه‌ها ({matchedDrill.length})
                  </span>
                  {matchedDrill.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        onNavigateRoute(d.routeKey);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50/60 text-right cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">{d.code}</span>
                          <span className="text-xs font-semibold text-slate-900 truncate">{d.title}</span>
                        </div>
                        <span className="text-caption text-slate-500 line-clamp-1 mt-0.5">
                          {d.statusDescription} • مسئول: {d.ownerName}
                        </span>
                      </div>
                      <span className="text-caption font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {d.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-caption text-slate-500">
          <span>برای خروج دکمه Esc را فشار دهید</span>
          <span>سامانه عملیات جوادیان</span>
        </div>
      </div>
    </DialogSurface>
  );
};
