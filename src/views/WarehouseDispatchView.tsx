import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { PackageCheck, Search, MapPin, Clock, ShieldAlert, CheckCircle2, AlertCircle, ExternalLink, ChevronRight, Database, Printer, Plus, ShieldCheck, Building2, LayoutGrid, List, Truck } from 'lucide-react';
import {
  WarehouseExitRecord,
  WarehouseDispatchStatus,
  MockPersona,
} from '../types';
import { mockSalesWarehouseStore } from '../runtime/workflow';
import { getDisplayPersonaName } from '../runtime/documentBasedPersonas';
import { Button } from '../components/design-system/Button';
import { Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { toPersianDigits, formatRials, formatNumber } from '../utils/formatters';
import { CreateWarehouseExitModal } from '../components/warehouse/CreateWarehouseExitModal';
import { RecordDispatchModal } from '../components/warehouse/RecordDispatchModal';
import { WarehouseManifestModal } from '../components/warehouse/WarehouseManifestModal';
import { IranianPlate } from '../components/design-system/IranianPlate';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import {
  EnterpriseCard,
  EnterpriseCardHeader,
  EnterpriseCardBody,
  EnterpriseCardFooter,
  EnterpriseKeyValue,
} from '../components/design-system/EnterpriseCard';

interface WarehouseDispatchViewProps {
  activePersona: MockPersona;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const WarehouseDispatchView: React.FC<WarehouseDispatchViewProps> = ({
  activePersona,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  
  // Store subscription
  const [exits, setExits] = useState<WarehouseExitRecord[]>(() =>
    mockSalesWarehouseStore.getWarehouseExits()
  );

  const [selectedExit, setSelectedExit] = useState<WarehouseExitRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    const unsub = mockSalesWarehouseStore.subscribe(() => {
      setExits(mockSalesWarehouseStore.getWarehouseExits());
      if (selectedExit) {
        const refreshed = mockSalesWarehouseStore.getWarehouseExitById(selectedExit.id);
        if (refreshed) setSelectedExit(refreshed);
      }
    });
    return unsub;
  }, [selectedExit]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecordDispatchOpen, setIsRecordDispatchOpen] = useState(false);
  const [isPrintManifestOpen, setIsPrintManifestOpen] = useState(false);

  // Filter exits
  const filteredExits = exits.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = e.code.toLowerCase().includes(q);
      const matchCustomer = e.linkedSalesOrder?.customerName?.toLowerCase().includes(q) || false;
      const matchOrderCode = e.linkedSalesOrder?.code?.toLowerCase().includes(q) || false;
      const matchBuyer = e.buyer.name.toLowerCase().includes(q);
      const matchWh = e.warehouse.name.toLowerCase().includes(q);
      const matchDriver = e.logistics.driverName.toLowerCase().includes(q);
      const matchItem = e.items.some((it) => it.productName.toLowerCase().includes(q));
      if (!matchCode && !matchCustomer && !matchOrderCode && !matchBuyer && !matchWh && !matchDriver && !matchItem) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: WarehouseDispatchStatus) => {
    switch (status) {
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            مسدود (کسری موجودی انبار)
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            در حال جمع‌آوری و بسته‌بندی
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
            آماده بارگیری و خروج
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            ارسال جزئی (پارت ۱)
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            خروج نهایی و تحویل به باربری
          </span>
        );
    }
  };

  const handleConfirmDispatch = () => {
    if (!selectedExit) return;

    const dispatches = selectedExit.items.map((it) => ({
      itemId: it.id,
      dispatchedQuantity: it.dispatchedQuantity || it.requestedQuantity,
      dispatchedCartons: it.dispatchedCartons || it.requestedCartons || Math.round(it.requestedQuantity / 12),
      notes: it.notes,
    }));

    const success = mockSalesWarehouseStore.updateDispatchQuantities(
      selectedExit.id,
      dispatches,
      activePersona,
      'dispatched'
    );

    if (success) {
      const refreshed = mockSalesWarehouseStore.getWarehouseExitById(selectedExit.id);
      if (refreshed) setSelectedExit(refreshed);

      addToast('خروج نهایی انبار ثبت شد', {
        description: `حواله ${selectedExit.code} با موفقیت ترخیص و تحویل راننده حامل گردید.`,
        tone: 'success',
      });
    }
  };

  const handleSign = (roleKey: 'sales_responsible' | 'management' | 'ceo') => {
    if (!selectedExit) return;
    const success = mockSalesWarehouseStore.signWarehouseExit(
      selectedExit.id,
      roleKey,
      activePersona,
      `امضا و تأیید دیجیتال توسط ${activePersona.name} (${activePersona.jobTitle})`
    );

    if (success) {
      const refreshed = mockSalesWarehouseStore.getWarehouseExitById(selectedExit.id);
      if (refreshed) setSelectedExit(refreshed);

      addToast('امضای دیجیتال با موفقیت ثبت شد', {
        description: `امضای نقش ${roleKey === 'sales_responsible' ? 'مسئول فروش' : roleKey === 'management' ? 'مدیریت بازرگانی' : 'مدیرعامل'} ذخیره گردید.`,
        tone: 'success',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-none">
        <div>
          <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary-700" />
            خروج از انبار و تحویل سفارش‌ها
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            ارتباط مستقیم با سفارش‌های فروش تأییدشده، تطبیق مقادیر درخواستی و ارسالی، استعلام لحظه‌ای موجودی و ترخیص کالا
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 font-bold shadow-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            صدور حواله خروج
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar border-b border-slate-100">
          {[
            { id: 'all', label: 'همه حواله‌ها' },
            { id: 'ready', label: 'آماده بارگیری' },
            { id: 'preparing', label: 'در حال بسته‌بندی' },
            { id: 'partial', label: 'ارسال جزئی' },
            { id: 'dispatched', label: 'خروج یافته' },
            { id: 'blocked', label: 'مسدود (کسری)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-primary-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="mr-1.5 text-caption opacity-80">
                  ({exits.filter((e) => e.status === tab.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در کد حواله، نام خریدار، شماره سفارش فروش، انبار یا راننده..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-primary-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمای کارت‌های سازمانی"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">کارت‌ها</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-primary-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمای جدولی فشرده"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exits Content: Card View vs Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExits.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              حواله خروجی با این فیلترها یافت نشد.
            </div>
          ) : (
            filteredExits.map((e) => {
              const totalQty = e.items.reduce((sum, item) => sum + (item.quantityRequestedKg || 0), 0);
              return (
                <EnterpriseCard
                  key={e.id}
                  onClick={() => setSelectedExit(e)}
                  accent={
                    e.status === 'dispatched'
                      ? 'emerald'
                      : e.status === 'blocked'
                      ? 'rose'
                      : e.status === 'ready'
                      ? 'primary'
                      : 'amber'
                  }
                >
                  <EnterpriseCardHeader
                    badge={getStatusBadge(e.status)}
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-800 text-sm">{e.code}</span>
                        <span className="text-caption text-slate-500">({e.dateJalali})</span>
                      </div>
                    }
                    subtitle={
                      <div className="text-caption text-slate-600">
                        سفارش مبنا: <span className="font-mono font-bold text-slate-800">{e.linkedSalesOrder?.code || 'حواله مستقیم'}</span>
                      </div>
                    }
                  />

                  <EnterpriseCardBody className="space-y-3 text-xs">
                    <div>
                      <div className="text-caption text-slate-500">خریدار و مقصد تحویل:</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{e.buyer.name}</div>
                      <div className="text-caption text-slate-500 line-clamp-1 mt-0.5">{e.deliveryAddress}</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-caption">
                        <span className="text-slate-500">انبار مبدأ:</span>
                        <span className="font-semibold text-slate-800">{e.warehouse.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-caption">
                        <span className="text-slate-500">استعلام موجودی:</span>
                        <span className={e.externalInventorySnapshot.isSufficient ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {e.externalInventorySnapshot.isSufficient ? 'کافی' : 'کسری انبار'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-caption">
                        <span className="text-slate-500">اقلام و حجم:</span>
                        <span className="font-bold text-slate-800">
                          {toPersianDigits(e.items.length)} ردیف ({toPersianDigits(formatNumber(totalQty))} کیلو)
                        </span>
                      </div>
                    </div>

                    {/* Logistics & Plate */}
                    <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-caption">
                        <span className="font-medium text-slate-800">راننده: {e.logistics.driverName}</span>
                        <span className="font-mono text-slate-500">بارنامه: {e.logistics.waybillNumber}</span>
                      </div>
                      <div className="flex justify-center pt-0.5">
                        <IranianPlate plateString={e.logistics.vehiclePlate} size="sm" />
                      </div>
                    </div>
                  </EnterpriseCardBody>

                  <EnterpriseCardFooter className="flex items-center justify-between">
                    <div>
                      <CurrencyAmount
                        amountRials={e.freightAmountRials || e.logistics.freightAmountRials || 0}
                        layout="compact"
                      />
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedExit(e);
                      }}
                    >
                      بررسی حواله
                    </Button>
                  </EnterpriseCardFooter>
                </EnterpriseCard>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <AdaptiveTable className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">کد حواله و تاریخ</th>
                  <th className="p-3">سفارش فروش متناظر</th>
                  <th className="p-3">خریدار و آدرس تحویل</th>
                  <th className="p-3">انبار مبدأ</th>
                  <th className="p-3">استعلام موجودی</th>
                  <th className="p-3">وضعیت خروج</th>
                  <th className="p-3">راننده و بارنامه</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      حواله خروجی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredExits.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedExit(e)}
                      className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-primary-700">{e.code}</div>
                        <div className="text-caption text-slate-500 mt-0.5">{e.dateJalali}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{e.linkedSalesOrder?.code || '---'}</div>
                        <div className="text-caption text-slate-500 line-clamp-1 max-w-[200px]">
                          {e.linkedSalesOrder?.customerName || e.buyer.name}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{e.buyer.name}</div>
                        <div className="text-caption text-slate-500 line-clamp-1 max-w-[180px]">
                          {e.deliveryAddress}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{e.warehouse.name}</div>
                        <div className="font-mono text-caption text-slate-500">{e.warehouse.code}</div>
                      </td>

                      <td className="p-3">
                        {e.externalInventorySnapshot.isSufficient ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-bold text-caption">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>کافی ({toPersianDigits(e.externalInventorySnapshot.availableStockKg)} کیلو)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-700 font-bold text-caption">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>کسری موجودی</span>
                          </div>
                        )}
                        <div className="text-caption text-slate-500 mt-0.5 font-mono">
                          {e.externalInventorySnapshot.sourceSystem}
                        </div>
                      </td>

                      <td className="p-3">{getStatusBadge(e.status)}</td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800 mb-1">{e.logistics.driverName}</div>
                        <IranianPlate plateString={e.logistics.vehiclePlate} size="sm" />
                        <div className="font-mono text-caption text-slate-500 mt-1">
                          بارنامه: {e.logistics.waybillNumber}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedExit(e);
                          }}
                        >
                          بررسی حواله
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdaptiveTable>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredExits.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">حواله خروجی یافت نشد.</div>
            ) : (
              filteredExits.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedExit(e)}
                  className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary-700">{e.code}</span>
                    {getStatusBadge(e.status)}
                  </div>

                  <div className="font-bold text-slate-900 text-xs">
                    {e.buyer.name} ({e.linkedSalesOrder?.code || 'حواله مستقیم'})
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-caption">
                    <div className="flex justify-between">
                      <span className="text-slate-500">انبار مبدأ:</span>
                      <span className="font-semibold text-slate-800">{e.warehouse.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">راننده:</span>
                      <span className="font-medium text-slate-800">{e.logistics.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">پلاک خودرو:</span>
                      <IranianPlate plateString={e.logistics.vehiclePlate} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت موجودی:</span>
                      <span className={e.externalInventorySnapshot.isSufficient ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {e.externalInventorySnapshot.isSufficient ? 'موجودی کافی' : 'کسری موجودی انبار'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-caption text-slate-500 pt-1">
                    <span>تاریخ: {e.dateJalali}</span>
                    <span className="text-primary-700 font-bold flex items-center gap-1">
                      مشاهده حواله خروج
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Warehouse Exit Detail Drawer */}
      {selectedExit && (
        <Drawer
          isOpen={Boolean(selectedExit)}
          onClose={() => setSelectedExit(null)}
          title={`حواله خروج از انبار: ${selectedExit.code}`}
          subtitle={`مربوط به سفارش فروش ${selectedExit.linkedSalesOrder?.code || 'حواله مستقیم فروش'}`}
          width="xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                {selectedExit.status === 'ready' && (
                  <Button size="sm" variant="primary" onClick={handleConfirmDispatch}>
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    ثبت خروج قطعی و ترخیص به ناوگان حمل
                  </Button>
                )}
                {selectedExit.status === 'blocked' && (
                  <span className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                    امکان ترخیص وجود ندارد: موجودی انبار پاسخگوی کل سفارش نیست.
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrintManifestOpen(true)}
                  className="flex items-center gap-1 text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 ml-1" />
                  پیش‌نمایش و چاپ حواله رسمی
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedExit(null)}>
                بستن
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Status & National Reference Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-primary-700 font-bold text-sm">{selectedExit.code}</span>
                {getStatusBadge(selectedExit.status)}
              </div>

              {/* National external systems badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-caption">
                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-700" />
                    سامانه جامع تجارت:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedExit.externalTradeReference || 'TRD-1403-90881'}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    سامانه جامع انبارها:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedExit.externalWarehouseReference || 'WHS-KHZ-77341'}
                  </span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between sm:col-span-2">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    وضعیت ثبت مالی (ERP):
                  </span>
                  <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ثبت نشده در سیستم مالی (اتصال وب‌سرویس فعال نیست)
                  </span>
                </div>
              </div>

              {selectedExit.blockedReason && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-3 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">مانع خروج و بارگیری (Blocker):</span>
                    <p className="text-caption leading-relaxed mt-0.5">{selectedExit.blockedReason}</p>
                  </div>
                </div>
              )}

              {selectedExit.dispatchActor && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
                  <div>
                    <span className="font-bold block text-xs">ترخیص‌کننده رسمی انبار:</span>
                    <span className="text-caption">
                      {selectedExit.dispatchActor.person.name} ({selectedExit.dispatchActor.person.role})
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    زمان ترخیص: {selectedExit.dispatchActor.dispatchedAtJalali} - ساعت {selectedExit.dispatchActor.dispatchedAtTime}
                  </div>
                </div>
              )}
            </div>

            {/* External Inventory Snapshot */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary-700" />
                  استعلام موجودی لحظه‌ای انبار (External Inventory Snapshot)
                </span>
                <span className="text-slate-500 font-mono text-caption">
                  زمان استعلام: {selectedExit.externalInventorySnapshot.sourceTimestamp}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 text-caption block">منبع استعلام داده:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedExit.externalInventorySnapshot.sourceSystem}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-slate-500 text-caption block">موجودی آزاد فیزیکی:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {toPersianDigits(selectedExit.externalInventorySnapshot.availableStockKg)} کیلوگرم
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison: Requested vs Dispatched Quantities */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-1">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  تطبیق مقادیر درخواستی در سفارش با مقادیر ارسالی
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsRecordDispatchOpen(true)}
                  className="text-caption"
                >
                  ویرایش مقادیر واقعی ترخیص
                </Button>
              </div>

              <div className="overflow-x-auto">
                <AdaptiveTable className="w-full text-right text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-3">نام و کد کالا</th>
                      <th className="p-3">کارتن درخواستی</th>
                      <th className="p-3">مقدار سفارش‌شده</th>
                      <th className="p-3">کارتن ارسالی</th>
                      <th className="p-3">مقدار ارسالی (حواله)</th>
                      <th className="p-3">وضعیت تطابق</th>
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedExit.items.map((item) => {
                      const dispatchedCartons = item.dispatchedCartons || (selectedExit.status === 'dispatched' ? item.requestedCartons : 0);
                      const dispatchedQty = item.dispatchedQuantity || (selectedExit.status === 'dispatched' ? item.requestedQuantity : 0);

                      return (
                        <tr key={item.id}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="font-mono text-caption text-slate-500">{item.productCode}</div>
                          </td>

                          <td className="p-3 font-mono font-bold text-slate-700">
                            {toPersianDigits(item.requestedCartons || Math.round(item.requestedQuantity / 12))} کارتن
                          </td>

                          <td className="p-3 font-mono font-bold text-slate-700">
                            {toPersianDigits(item.requestedQuantity)} {item.unit}
                          </td>

                          <td className="p-3 font-mono font-bold text-primary-900">
                            {toPersianDigits(dispatchedCartons)} کارتن
                          </td>

                          <td className="p-3 font-mono font-bold text-primary-900">
                            {toPersianDigits(dispatchedQty)} {item.unit}
                          </td>

                          <td className="p-3">
                            {dispatchedQty === item.requestedQuantity ? (
                              <span className="text-emerald-700 font-bold text-caption">تطابق کامل (۱۰۰٪)</span>
                            ) : dispatchedQty === 0 ? (
                              <span className="text-rose-700 font-bold text-caption">ارسال نشده (کسری)</span>
                            ) : (
                              <span className="text-amber-700 font-bold text-caption">
                                ارسال جزئی (
                                {toPersianDigits(
                                  Math.round((dispatchedQty / item.requestedQuantity) * 100)
                                )}
                                ٪)
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-slate-500 text-caption">{item.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </AdaptiveTable>
              </div>
            </div>

            {/* 3 Official Signatures Block */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  امضاها و تأییدیه‌های رسمی ۳ گانه حواله خروج
                </span>
                <span className="text-slate-500 text-caption">زنجیره تأیید معتبر و قابل استناد</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    roleKey: 'sales_responsible' as const,
                    roleLabel: 'مسئول فروش',
                    defaultName: getDisplayPersonaName(selectedExit.salesResponsible?.name) || 'کارشناس فروش — نقش نمونه',
                  },
                  {
                    roleKey: 'management' as const,
                    roleLabel: 'مدیریت بازرگانی',
                    defaultName: 'تأییدکننده بازرگانی — نقش نمونه',
                  },
                  {
                    roleKey: 'ceo' as const,
                    roleLabel: 'مدیریت عامل (اختیاری)',
                    defaultName: 'آقای منتظری',
                  },
                ].map((slot) => {
                  const sig = selectedExit.approvalSignatures?.find((s) => s.roleKey === slot.roleKey);
                  const isSigned = sig?.isSigned;

                  return (
                    <div
                      key={slot.roleKey}
                      className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                        isSigned
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{slot.roleLabel}</span>
                          <span
                            className={`text-caption px-1.5 py-0.5 rounded font-bold ${
                              isSigned
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isSigned ? 'امضا شده' : 'در انتظار امضا'}
                          </span>
                        </div>

                        <div className="text-caption text-slate-600 mt-1">
                          نام امضاکننده: <strong className="text-slate-800">{sig?.signerName || slot.defaultName}</strong>
                        </div>
                        {isSigned && sig?.signedAtJalali && (
                          <div className="text-caption text-slate-500 font-mono mt-0.5">
                            تاریخ: {sig.signedAtJalali}
                          </div>
                        )}
                      </div>

                      {!isSigned && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleSign(slot.roleKey)}
                          className="w-full text-caption"
                        >
                          ثبت امضا به عنوان {activePersona.name}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buyer, Delivery & Logistics Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Buyer & Address */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">خریدار و آدرس تحویل کالا</span>
                <div className="space-y-1 text-caption">
                  <div className="font-bold text-slate-900">{selectedExit.buyer.name}</div>
                  <div className="text-slate-500 font-mono">شناسه کارفرما: {selectedExit.buyer.nationalId}</div>
                  {selectedExit.buyer.economicCode && (
                    <div className="text-slate-500 font-mono">کد اقتصادی: {selectedExit.buyer.economicCode}</div>
                  )}
                  <div className="text-slate-500 font-mono">تماس: {selectedExit.buyer.phone}</div>
                  <div className="text-slate-700 mt-2 p-2 bg-slate-50 rounded border border-slate-100 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{selectedExit.deliveryAddress}</span>
                  </div>
                  {selectedExit.postalCode && (
                    <div className="text-slate-500 font-mono">کد پستی: {selectedExit.postalCode}</div>
                  )}
                  <div className="text-slate-600 mt-1">شرایط پرداخت: {selectedExit.salesConditions}</div>
                </div>
              </div>

              {/* Driver & Transport */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">راننده، خودرو و بارنامه خروجی</span>
                <div className="space-y-2 text-caption">
                  <div>
                    <div className="font-bold text-slate-900">{selectedExit.logistics.driverName}</div>
                    <div className="text-slate-500 font-mono text-xs">تماس: {selectedExit.logistics.driverPhone}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">پلاک ناوگان ({selectedExit.logistics.vehicleType}):</span>
                    <IranianPlate plateString={selectedExit.logistics.vehiclePlate} size="sm" />
                  </div>
                  <div className="font-mono text-slate-600">بارنامه: {selectedExit.logistics.waybillNumber}</div>
                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-slate-500 text-xs block mb-0.5">کرایه حمل:</span>
                    <CurrencyAmount
                      amountRials={selectedExit.freightAmountRials || selectedExit.logistics.freightAmountRials || 0}
                      layout="inline"
                    />
                  </div>
                  <div className="text-slate-500 text-caption">
                    نحوه حمل: {selectedExit.deliveryMode}
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Navigation Link to Sales Order */}
            {selectedExit.linkedSalesOrder?.id && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-caption text-slate-500 block">سفارش فروش مبنای خروج:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedExit.linkedSalesOrder.code} - {selectedExit.linkedSalesOrder.customerName}
                  </span>
                </div>
                {onNavigateToRoute && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      onNavigateToRoute('sales_orders', selectedExit.linkedSalesOrder.id)
                    }
                    className="flex items-center gap-1"
                  >
                    مشاهده پرونده سفارش فروش
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* New Exit Creation Modal */}
      {isCreateModalOpen && (
        <CreateWarehouseExitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          activePersona={activePersona}
          onCreated={(newExit) => {
            setSelectedExit(newExit);
          }}
        />
      )}

      {/* Record Physical Dispatch Modal */}
      {isRecordDispatchOpen && selectedExit && (
        <RecordDispatchModal
          isOpen={isRecordDispatchOpen}
          onClose={() => setIsRecordDispatchOpen(false)}
          exitRecord={selectedExit}
          activePersona={activePersona}
          onUpdated={(updated) => {
            setSelectedExit(updated);
          }}
        />
      )}

      {/* Official Manifest Print Preview Modal */}
      {isPrintManifestOpen && selectedExit && (
        <WarehouseManifestModal
          isOpen={isPrintManifestOpen}
          onClose={() => setIsPrintManifestOpen(false)}
          exitRecord={selectedExit}
        />
      )}
    </div>
  );
};
