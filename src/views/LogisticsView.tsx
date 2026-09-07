import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { Truck, Search, Clock, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, ExternalLink, ChevronRight, Filter, Plus, LayoutGrid, List } from 'lucide-react';
import {
  LogisticsRecord,
  LogisticsCoordinationStatus,
  LogisticsType,
  MockPersona,
} from '../types';
import { mockSupplyReceiptStore } from '../runtime/workflow';
import { Button } from '../components/design-system/Button';
import { Drawer, ModalDialog } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { toPersianDigits, formatRials } from '../utils/formatters';
import { IranianPlate } from '../components/design-system/IranianPlate';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import {
  EnterpriseCard,
  EnterpriseCardHeader,
  EnterpriseCardBody,
  EnterpriseCardFooter,
  EnterpriseKeyValue,
} from '../components/design-system/EnterpriseCard';

interface LogisticsViewProps {
  activePersona: MockPersona;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  activePersona,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  const [logisticsList, setLogisticsList] = useState<LogisticsRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<LogisticsRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Logistics form state
  const [newType, setNewType] = useState<LogisticsType>('inbound');
  const [newTitle, setNewTitle] = useState('');
  const [newOriginCity, setNewOriginCity] = useState('اصفهان');
  const [newOriginName, setNewOriginName] = useState('کارخانه روغن‌کشی گلبهار');
  const [newOriginAddress, setNewOriginAddress] = useState('شهرک صنعتی مورچه‌خورت، خیابان کارآفرینان');
  const [newDestCity, setNewDestCity] = useState('تهران');
  const [newDestName, setNewDestName] = useState('انبار مرکزی کهریزک جوادیان');
  const [newDestAddress, setNewDestAddress] = useState('کهریزک، جاده قدیم قم، بلوار صنعت، سوله شماره ۴');
  const [newDriverName, setNewDriverName] = useState('اکبر قلی‌پور');
  const [newDriverPhone, setNewDriverPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [newPlate, setNewPlate] = useState('۲۲ ع ۴۵۶ ایران ۳۳');
  const [newVehicleType, setNewVehicleType] = useState('تریلی کفی با چادر ترانزیتی');
  const [newCapacityTons, setNewCapacityTons] = useState(24);
  const [newWaybillNumber, setNewWaybillNumber] = useState('WB-1403-99812');
  const [newFreightAmount, setNewFreightAmount] = useState(145000000);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'پیش‌کرایه' | 'پس‌کرایه' | 'تسویه باربری اعتباری'>('پس‌کرایه');
  const [newPayer, setNewPayer] = useState<'شرکت جوادیان' | 'مشتری' | 'تأمین‌کننده'>('شرکت جوادیان');
  const [newStatus, setNewStatus] = useState<LogisticsCoordinationStatus>('driver_assigned');

  // Load from reactive store
  useEffect(() => {
    setLogisticsList(mockSupplyReceiptStore.getLogisticsRecords());
    const unsubscribe = mockSupplyReceiptStore.subscribe(() => {
      const all = mockSupplyReceiptStore.getLogisticsRecords();
      setLogisticsList(all);
      if (selectedRecord) {
        const updated = all.find((r) => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
    });
    return unsubscribe;
  }, [selectedRecord?.id]);

  // Filter Logic
  const filteredList = logisticsList.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.coordinationStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDriver = item.driver.name.toLowerCase().includes(q);
      const matchWaybill = item.waybill.number.toLowerCase().includes(q);
      const matchPlate = item.driver.licensePlate.toLowerCase().includes(q);
      const matchOrigin = item.origin.city.toLowerCase().includes(q);
      const matchDest = item.destination.city.toLowerCase().includes(q);
      if (
        !matchCode &&
        !matchTitle &&
        !matchDriver &&
        !matchWaybill &&
        !matchPlate &&
        !matchOrigin &&
        !matchDest
      ) {
        return false;
      }
    }
    return true;
  });

  const getTypeBadge = (type: LogisticsType) => {
    switch (type) {
      case 'inbound':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            ورودی (تأمین کارخانه)
          </span>
        );
      case 'outbound':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            خروجی (ارسال به مشتری)
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
            انتقال بین‌انباری
          </span>
        );
    }
  };

  const getStatusBadge = (status: LogisticsCoordinationStatus) => {
    switch (status) {
      case 'vehicle_search':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-slate-100 text-slate-700 border border-slate-300">
            جستجوی ناوگان / اعلام بار
          </span>
        );
      case 'driver_assigned':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-primary-50 text-primary-700 border border-primary-200">
            راننده تخصیص یافت
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-amber-50 text-amber-700 border border-amber-200">
            در حال بارگیری در مبدأ
          </span>
        );
      case 'on_the_way':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-teal-50 text-teal-700 border border-teal-200">
            در مسیر حمل جاده‌ای
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            رسیده به مقصد / تحویل شده
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-rose-50 text-rose-700 border border-rose-300">
            دارای تأخیر / توقف جاده‌ای
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-slate-100 text-slate-500 line-through border border-slate-200">
            کنسل شده
          </span>
        );
    }
  };

  const handleUpdateStatus = (newStatusVal: LogisticsCoordinationStatus, note: string) => {
    if (!selectedRecord) return;
    mockSupplyReceiptStore.updateLogisticsStatus(
      selectedRecord.id,
      newStatusVal,
      note,
      activePersona.name
    );

    addToast({
      id: `toast-${Date.now()}`,
      title: 'وضعیت ترابری به‌روز شد',
      description: note,
      tone: 'info',
    });
  };

  const handleCreateLogistics = () => {
    if (!newTitle.trim() || !newDriverName.trim() || !newWaybillNumber.trim()) {
      addToast({
        id: `err-${Date.now()}`,
        title: 'خطای اعتبارسنجی',
        description: 'لطفاً عنوان عملیات، نام راننده و شماره بارنامه را وارد فرمایید.',
        tone: 'danger',
      });
      return;
    }

    const created = mockSupplyReceiptStore.createLogisticsRecord({
      type: newType,
      title: newTitle,
      originCity: newOriginCity,
      originName: newOriginName,
      originAddress: newOriginAddress,
      destinationCity: newDestCity,
      destinationName: newDestName,
      destinationAddress: newDestAddress,
      driverName: newDriverName,
      driverPhone: newDriverPhone,
      driverLicensePlate: newPlate,
      vehicleType: newVehicleType,
      vehicleCapacityTons: Number(newCapacityTons),
      waybillNumber: newWaybillNumber,
      freightAmountRials: Number(newFreightAmount),
      paymentMethod: newPaymentMethod,
      payer: newPayer,
      coordinationStatus: newStatus,
      creatorPersona: activePersona,
    });

    setIsCreateModalOpen(false);
    setSelectedRecord(created);

    addToast({
      id: `toast-${Date.now()}`,
      title: 'هماهنگی لجستیک ثبت شد',
      description: `محموله با کد ${created.code} و شماره بارنامه ${created.waybill.number} با موفقیت ثبت گردید.`,
      tone: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-none">
        <div>
          <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            مرکز هماهنگی ترابری و لجستیک (Logistics & Fleet Coordination)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            پایش بارنامه‌ها، رانندگان، محموله‌های ورودی، خروجی و انتقالات بین‌انباری در چرخه عملیات بدون جی‌پی‌اس نمایشی
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setNewTitle('حمل روغن خوراکی تانکری به انبار مرکزی کهریزک');
            setIsCreateModalOpen(true);
          }}
          className="shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          ثبت هماهنگی لجستیک جدید
        </Button>
      </div>

      {/* Filters & Type Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        {/* Logistics Type Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          {[
            { id: 'all', label: 'همه محموله‌ها' },
            { id: 'inbound', label: 'ورودی به انبارها' },
            { id: 'outbound', label: 'خروجی به مشتریان' },
            { id: 'transfer', label: 'انتقال بین‌انباری' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                typeFilter === tab.id
                  ? 'bg-teal-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="mr-1.5 text-caption opacity-80">
                  ({logisticsList.filter((l) => l.type === tab.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Status Filters & View Mode */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو بر اساس راننده، بارنامه، پلاک، مبدأ، مقصد یا کد محموله..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="vehicle_search">اعلام بار / جستجو</option>
                <option value="driver_assigned">راننده تخصیص یافته</option>
                <option value="loading">در حال بارگیری</option>
                <option value="on_the_way">در مسیر حمل</option>
                <option value="arrived">رسیده به مقصد</option>
                <option value="delayed">دارای توقف / تأخیر</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-teal-800 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمای کارت‌های سازمانی"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline">کارت‌ها</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-teal-800 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمای جدولی فشرده"
              >
                <List className="w-4 h-4" />
                <span className="hidden md:inline">جدول</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Card View vs Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              محموله‌ای با مشخصات جستجو یافت نشد.
            </div>
          ) : (
            filteredList.map((item) => (
              <EnterpriseCard
                key={item.id}
                onClick={() => setSelectedRecord(item)}
                accent={
                  item.coordinationStatus === 'arrived'
                    ? 'emerald'
                    : item.coordinationStatus === 'delayed'
                    ? 'rose'
                    : item.coordinationStatus === 'on_the_way'
                    ? 'teal'
                    : 'amber'
                }
              >
                <EnterpriseCardHeader
                  badge={
                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(item.type)}
                      {getStatusBadge(item.coordinationStatus)}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-800 text-sm">{item.code}</span>
                    </div>
                  }
                  subtitle={
                    <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {item.title}
                    </div>
                  }
                />

                <EnterpriseCardBody className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-slate-500">مسیر ترابری:</span>
                      <span className="font-bold text-slate-800">
                        {item.origin.city} ← {item.destination.city}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      مقصد: {item.destination.name}
                    </div>
                  </div>

                  {/* Driver and Plate */}
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-caption">
                      <span className="font-bold text-slate-900">{item.driver.name}</span>
                      <span className="font-mono text-slate-500">{item.driver.phone}</span>
                    </div>
                    <div className="flex justify-center pt-0.5">
                      <IranianPlate plateString={item.driver.licensePlate} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 text-center">
                      {item.vehicle.type} ({toPersianDigits(item.vehicle.capacityTons)} تن)
                    </div>
                  </div>

                  {/* Waybill & Freight */}
                  <div className="flex items-center justify-between text-caption px-1">
                    <div>
                      <span className="text-slate-500 block">بارنامه:</span>
                      <span className="font-mono font-bold text-slate-800">{item.waybill.number}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-500 block">کرایه حمل:</span>
                      <CurrencyAmount amountRials={item.freight.amountRials} layout="compact" />
                    </div>
                  </div>
                </EnterpriseCardBody>

                <EnterpriseCardFooter className="flex items-center justify-between">
                  <span className="text-caption text-slate-500">
                    مسئول: {item.currentOwner.name}
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(item);
                    }}
                    className="cursor-pointer"
                  >
                    کنترل پرونده
                  </Button>
                </EnterpriseCardFooter>
              </EnterpriseCard>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <AdaptiveTable className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">کد و نوع محموله</th>
                  <th className="p-3">مسیر (مبدأ ← مقصد)</th>
                  <th className="p-3">مشخصات راننده و ناوگان</th>
                  <th className="p-3">شماره بارنامه دولتی</th>
                  <th className="p-3">کرایه حمل</th>
                  <th className="p-3">وضعیت هماهنگی</th>
                  <th className="p-3">مسئول هماهنگی</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      محموله‌ای با مشخصات جستجو یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRecord(item)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-teal-800">{item.code}</div>
                        <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">{item.title}</div>
                        <div className="mt-1">{getTypeBadge(item.type)}</div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <span>{item.origin.city}</span>
                          <span className="text-slate-500 text-caption">←</span>
                          <span>{item.destination.city}</span>
                        </div>
                        <div className="text-caption text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                          مقصد: {item.destination.name}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 mb-1">{item.driver.name}</div>
                        <IranianPlate plateString={item.driver.licensePlate} size="sm" />
                        <div className="text-caption text-slate-500 font-mono mt-1">
                          {item.driver.phone}
                        </div>
                        <div className="text-caption text-slate-500 mt-0.5">
                          {item.vehicle.type} ({toPersianDigits(item.vehicle.capacityTons)} تن)
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-800">{item.waybill.number}</span>
                        <span className="text-caption text-slate-500 block">{item.waybill.issuedBy}</span>
                      </td>

                      <td className="p-3">
                        <CurrencyAmount amountRials={item.freight.amountRials} layout="inline" />
                        <div className="text-caption text-slate-500 mt-1">
                          {item.freight.paymentMethod} ({item.freight.payer})
                        </div>
                      </td>

                      <td className="p-3">{getStatusBadge(item.coordinationStatus)}</td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{item.currentOwner.name}</span>
                        <span className="text-caption text-slate-500 block">{item.currentOwner.role}</span>
                      </td>

                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="cursor-pointer"
                        >
                          کنترل پرونده
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdaptiveTable>
          </div>

          {/* Mobile View: Adaptive Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">محموله‌ای یافت نشد.</div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-800">{item.code}</span>
                    {getTypeBadge(item.type)}
                  </div>

                  <div className="font-bold text-slate-900 text-xs leading-snug">{item.title}</div>

                  <div className="grid grid-cols-2 gap-2 text-caption bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 block">مسیر:</span>
                      <span className="font-bold text-slate-800">
                        {item.origin.city} به {item.destination.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">راننده:</span>
                      <span className="font-bold text-slate-800">{item.driver.name}</span>
                    </div>
                    <div className="col-span-2 py-1">
                      <span className="text-slate-500 block text-xs mb-1">پلاک ناوگان:</span>
                      <IranianPlate plateString={item.driver.licensePlate} size="sm" />
                    </div>
                    <div>
                      <span className="text-slate-500 block">شماره بارنامه:</span>
                      <span className="font-mono font-bold text-slate-800">{item.waybill.number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">کرایه حمل:</span>
                      <CurrencyAmount amountRials={item.freight.amountRials} layout="compact" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-caption">
                    <div>{getStatusBadge(item.coordinationStatus)}</div>
                    <span className="text-teal-700 font-bold flex items-center gap-1">
                      مشاهده پرونده
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Drawer: Detail & Timeline Tracking */}
      {selectedRecord && (
        <Drawer
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`پرونده ترابری و هماهنگی لجستیک: ${selectedRecord.code}`}
          subtitle={selectedRecord.title}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {selectedRecord.coordinationStatus === 'driver_assigned' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleUpdateStatus('loading', 'راننده وارد مبدأ بارگیری شد و فرآیند بارگیری پالت‌ها آغاز گردید.')
                    }
                    className="cursor-pointer"
                  >
                    ثبت شروع بارگیری
                  </Button>
                )}

                {selectedRecord.coordinationStatus === 'loading' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleUpdateStatus('on_the_way', 'بارگیری تکمیل، باسکول مبدأ انجام و بارنامه رسمی جاده‌ای صادر شد.')
                    }
                    className="cursor-pointer"
                  >
                    صدور بارنامه و خروج جاده‌ای
                  </Button>
                )}

                {selectedRecord.coordinationStatus === 'on_the_way' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      handleUpdateStatus('arrived', 'ناوگان به مقصد انبار رسید و در نوبت باسکول و تخلیه قرار گرفت.')
                    }
                    className="cursor-pointer"
                  >
                    اعلام ورود به مقصد و تخلیه
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
                className="cursor-pointer"
              >
                بستن
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">مشخصات اصلی عملیات حمل</span>
                {getTypeBadge(selectedRecord.type)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-caption">مبدأ بارگیری:</span>
                  <strong className="text-slate-900 block">{selectedRecord.origin.name}</strong>
                  <span className="text-caption text-slate-500">{selectedRecord.origin.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">مقصد تخلیه:</span>
                  <strong className="text-slate-900 block">{selectedRecord.destination.name}</strong>
                  <span className="text-caption text-slate-500">{selectedRecord.destination.address}</span>
                </div>
              </div>
            </div>

            {/* Driver & Freight Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <span className="font-bold text-slate-800 block">راننده، ناوگان و هزینه ترابری</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-caption">مشخصات ناوگان:</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedRecord.driver.name}</div>
                  <div className="text-caption text-slate-600 font-mono mt-0.5">
                    تلفن: {selectedRecord.driver.phone}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-caption text-slate-500 block mb-1">پلاک ناوگان:</span>
                    <IranianPlate plateString={selectedRecord.driver.licensePlate} size="sm" />
                  </div>
                  <span className="text-caption text-slate-500 block mt-1.5">
                    نوع خودرو: {selectedRecord.vehicle.type} (ظرفیت {toPersianDigits(selectedRecord.vehicle.capacityTons)} تن)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-caption">بارنامه و کرایه حمل:</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">{selectedRecord.waybill.number}</div>
                  <span className="text-caption text-slate-500 block">{selectedRecord.waybill.issuedBy}</span>
                  <div className="mt-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-500 text-caption block mb-0.5">مبلغ کرایه حمل:</span>
                    <CurrencyAmount amountRials={selectedRecord.freight.amountRials} layout="inline" />
                  </div>
                  <span className="text-caption text-slate-500 block mt-1">
                    نحوه تسویه: {selectedRecord.freight.paymentMethod} (پرداخت‌کننده: {selectedRecord.freight.payer})
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline of Events (Operational, no fake GPS) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-700" />
                سوابق زمانی رویدادهای ترابری (Timeline)
              </span>

              <div className="space-y-3 relative before:absolute before:right-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pr-5">
                {selectedRecord.timeline.map((event) => (
                  <div key={event.id} className="relative space-y-0.5">
                    <div className="absolute -right-5 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-50" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{event.title}</span>
                      <span className="font-mono text-caption text-slate-500">{event.timestampJalali}</span>
                    </div>
                    <p className="text-caption text-slate-600">{event.description}</p>
                    <span className="text-caption text-slate-500 block">ثبت‌کننده: {event.actorName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross Links */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">اسناد متصل به ترابری</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedRecord.linkedRecords.supplyRequestId && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-caption text-slate-500 block">پرونده تأمین:</span>
                    <strong className="font-mono text-primary-700 block">
                      {selectedRecord.linkedRecords.supplyRequestId}
                    </strong>
                    {onNavigateToRoute && (
                      <Button
                        size="xs"
                        variant="outline"
                        className="mt-1.5 w-full flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() =>
                          onNavigateToRoute('supply_requests', selectedRecord.linkedRecords.supplyRequestId)
                        }
                      >
                        مشاهده تأمین
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}

                {selectedRecord.linkedRecords.receiptId && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-caption text-slate-500 block">رسید انبار تخلیه:</span>
                    <strong className="font-mono text-teal-700 block">
                      {selectedRecord.linkedRecords.receiptId}
                    </strong>
                    {onNavigateToRoute && (
                      <Button
                        size="xs"
                        variant="outline"
                        className="mt-1.5 w-full flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() =>
                          onNavigateToRoute('inventory_receipts', selectedRecord.linkedRecords.receiptId)
                        }
                      >
                        مشاهده رسید
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}

                {selectedRecord.linkedRecords.salesOrderId && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-caption text-slate-500 block">سفارش فروش:</span>
                    <strong className="font-mono text-amber-700 block">
                      {selectedRecord.linkedRecords.salesOrderId}
                    </strong>
                    {onNavigateToRoute && (
                      <Button
                        size="xs"
                        variant="outline"
                        className="mt-1.5 w-full flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() =>
                          onNavigateToRoute('sales_orders', selectedRecord.linkedRecords.salesOrderId)
                        }
                      >
                        مشاهده سفارش
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Logistics Modal */}
      {isCreateModalOpen && (
        <ModalDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="ثبت هماهنگی لجستیک و اعزام ناوگان حمل"
          maxWidth="lg"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateLogistics}
                className="cursor-pointer"
              >
                ثبت و آغاز پایش لجستیک
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">نوع عملیات حمل</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as LogisticsType)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                >
                  <option value="inbound">ورودی به انبار (خرید / تأمین)</option>
                  <option value="outbound">خروجی به مشتری (فروش قطعی)</option>
                  <option value="transfer">انتقال بین‌انباری (کهریزک / البرز / اصفهان)</option>
                </select>
              </FieldGroup>

              <FieldGroup className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">
                  عنوان عملیات ترابری <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: حمل روغن خام سویا از مجتمع گلبهار اصفهان به کهریزک"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FieldGroup>
            </div>

            {/* Origin and Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-caption">مشخصات مبدأ</span>
                <input
                  type="text"
                  placeholder="شهر مبدأ (مثلاً: اصفهان)"
                  value={newOriginCity}
                  onChange={(e) => setNewOriginCity(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="نام کارخانه یا بارانداز مبدأ"
                  value={newOriginName}
                  onChange={(e) => setNewOriginName(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-caption">مشخصات مقصد</span>
                <input
                  type="text"
                  placeholder="شهر مقصد (مثلاً: تهران)"
                  value={newDestCity}
                  onChange={(e) => setNewDestCity(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="نام انبار مقصد"
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            {/* Driver & Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">
                  نام راننده <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="مثال: اکبر قلی‌پور"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">شماره تلفن راننده</label>
                <input
                  type="text"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">شماره پلاک انتظامی</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="۲۲ ع ۴۵۶ ایران ۳۳"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
                <div className="mt-1.5 flex justify-center bg-white p-1 rounded border border-slate-200">
                  <IranianPlate plateString={newPlate} size="sm" />
                </div>
              </FieldGroup>
            </div>

            {/* Vehicle Type & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">نوع ناوگان باربری</label>
                <select
                  value={newVehicleType}
                  onChange={(e) => setNewVehicleType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                >
                  <option value="تانکر استیل مخصوص حمل روغن خوراکی ۳۰ تنی">تانکر استیل مخصوص روغن خوراکی (۳۰ تن)</option>
                  <option value="تریلی لبه‌دار کفی با چادر ترانزیتی">تریلی کفی با چادر ترانزیتی (۲۴ تن)</option>
                  <option value="کامیون تک ۱۰ تن مسقف">کامیون تک ۱۰ تن مسقف</option>
                  <option value="خاور ۵ تن چادری مخصوص پخش">خاور ۵ تن چادری مخصوص پخش مویرگی</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">ظرفیت بارگیری (تن)</label>
                <input
                  type="number"
                  value={newCapacityTons}
                  onChange={(e) => setNewCapacityTons(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>
            </div>

            {/* Waybill & Freight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">
                  شماره بارنامه دولتی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWaybillNumber}
                  onChange={(e) => setNewWaybillNumber(e.target.value)}
                  placeholder="مثال: WB-1403-99812"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">مبلغ کرایه حمل (ریال)</label>
                <input
                  type="number"
                  value={newFreightAmount}
                  onChange={(e) => setNewFreightAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
                <div className="mt-1">
                  <CurrencyAmount amountRials={newFreightAmount} layout="compact" />
                </div>
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">پرداخت‌کننده کرایه</label>
                <select
                  value={newPayer}
                  onChange={(e) => setNewPayer(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                >
                  <option value="شرکت جوادیان">شرکت جوادیان (پس‌کرایه)</option>
                  <option value="تأمین‌کننده">تأمین‌کننده (پیش‌کرایه)</option>
                  <option value="مشتری">مشتری</option>
                </select>
              </FieldGroup>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
