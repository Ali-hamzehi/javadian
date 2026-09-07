import { IranianPlate } from '../design-system/IranianPlate';
import { AdaptiveTable } from '../design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { Truck, Building2, Package, CheckCircle2, Database, Trash2 } from 'lucide-react';
import {
  MockPersona,
  SalesOrderDetails,
  CustomerRecord,
  WarehouseExitRecord,
} from '../../types';
import { mockSalesWarehouseStore, CreateWarehouseExitPayload } from '../../runtime/workflow';
import { ModalDialog } from '../design-system/ModalAndDrawer';
import { Button } from '../design-system/Button';
import { TextInput, SelectInput, FormField } from '../design-system/FormControls';
import { useToast } from '../design-system/ToastContext';
import { formatRials, toPersianDigits, formatNumber } from '../../utils/formatters';

interface CreateWarehouseExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: MockPersona;
  onCreated: (createdExit: WarehouseExitRecord) => void;
}

export const CreateWarehouseExitModal: React.FC<CreateWarehouseExitModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onCreated,
}) => {
  const { addToast } = useToast();
  const [sourceType, setSourceType] = useState<'sales_order' | 'manual'>('sales_order');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  
  // Available data from store
  const approvedOrders = mockSalesWarehouseStore
    .getSalesOrders()
    .filter((o) => o.status === 'approved');
  const customers = mockSalesWarehouseStore.getCustomers();

  // Form Fields
  const [dateJalali, setDateJalali] = useState('۱۴۰۴/۰۶/۱۲');
  const [buyerName, setBuyerName] = useState('');
  const [buyerNationalId, setBuyerNationalId] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEconomicCode, setBuyerEconomicCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [salesConditions, setSalesConditions] = useState('چک صیادی ۴۵ روزه با ضمانت');
  const [salesResponsibleName, setSalesResponsibleName] = useState(activePersona.name);
  const [freightAmountRials, setFreightAmountRials] = useState(45000000);
  const [deliveryMode, setDeliveryMode] = useState('تحویل با ناوگان هماهنگ‌شده انبار مرکزی کهریزک (DAP)');
  const [warehouseId, setWarehouseId] = useState('wh-01');
  const [warehouseName, setWarehouseName] = useState('انبار مرکزی کهریزک');
  
  // Logistics
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('خاور مسقف چادری ۶ چرخ');
  const [waybillNumber, setWaybillNumber] = useState(`WB-TEH-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // National references
  const [externalTradeReference, setExternalTradeReference] = useState(
    `TRD-1403-90${Math.floor(100 + Math.random() * 900)}`
  );
  const [externalWarehouseReference, setExternalWarehouseReference] = useState(
    `WHS-KHZ-77${Math.floor(100 + Math.random() * 900)}`
  );

  // Items
  const [items, setItems] = useState<
    Array<{
      productId: string;
      productCode: string;
      productName: string;
      requestedCartons: number;
      requestedQuantity: number;
      unit: string;
      salePriceRials: number;
      unitWeightKg: number;
      notes: string;
    }>
  >([
    {
      productId: 'prod-01',
      productCode: 'PRD-OIL-101',
      productName: 'روغن سرخ‌کردنی شفاف ۱.۵ لیتری پت جوادیان',
      requestedCartons: 100,
      requestedQuantity: 1200,
      unit: 'بطری ۱.۵ لیتری',
      salePriceRials: 1250000,
      unitWeightKg: 16.5,
      notes: 'بسته‌بندی شرینک ۱۲ عددی استاندارد کارخانه',
    },
  ]);

  // When selected order changes, pre-fill form
  useEffect(() => {
    if (sourceType === 'sales_order' && selectedOrderId) {
      const order = approvedOrders.find((o) => o.id === selectedOrderId);
      if (order) {
        setBuyerName(order.customerName);
        setDeliveryAddress(order.deliveryAddress);
        setSalesConditions(order.paymentTerms);
        setSalesResponsibleName(order.salesResponsibleName);
        
        const cust = customers.find((c) => c.id === order.customerId);
        if (cust) {
          setBuyerNationalId(cust.nationalId);
          setBuyerPhone(cust.mobile || cust.phone || '');
          setBuyerEconomicCode(cust.economicCode || '');
          if (cust.locations && cust.locations.length > 0) {
            setPostalCode(cust.locations[0].postalCode || '');
          }
        }

        if (order.items && order.items.length > 0) {
          setItems(
            order.items.map((it) => ({
              productId: it.productId,
              productCode: it.productId === 'prod-01' ? 'PRD-OIL-101' : 'PRD-OIL-102',
              productName: it.productName,
              requestedCartons: it.cartons,
              requestedQuantity: it.pieces,
              unit: it.unit || 'بطری',
              salePriceRials: it.agreedUnitPriceRials,
              unitWeightKg: it.weightKg ? Math.round(it.weightKg / (it.cartons || 1)) : 16.5,
              notes: `ارجاع به ردیف سفارش مصوب ${order.code}`,
            }))
          );
        }
      }
    }
  }, [selectedOrderId, sourceType]);

  // If approved orders exist and none selected, auto-select first
  useEffect(() => {
    if (approvedOrders.length > 0 && !selectedOrderId && sourceType === 'sales_order') {
      setSelectedOrderId(approvedOrders[0].id);
    }
  }, [approvedOrders.length, sourceType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      addToast('نام خریدار الزامی است', { tone: 'danger' });
      return;
    }

    if (!deliveryAddress.trim()) {
      addToast('آدرس تحویل الزامی است', { tone: 'danger' });
      return;
    }

    if (items.length === 0 || items.some((i) => i.requestedQuantity <= 0)) {
      addToast('حداقل یک قلم کالا با تعداد معتبر مورد نیاز است', { tone: 'danger' });
      return;
    }

    const payload: CreateWarehouseExitPayload = {
      dateJalali,
      linkedSalesOrderId: sourceType === 'sales_order' ? selectedOrderId : undefined,
      buyer: {
        name: buyerName,
        nationalId: buyerNationalId || '۱۰۱۰۲۸۴۷۱۵۰',
        phone: buyerPhone || '۰۹۱۲-۱۱۴-۵۵۲۱',
        economicCode: buyerEconomicCode || undefined,
      },
      postalCode,
      deliveryAddress,
      salesConditions,
      salesResponsible: {
        id: activePersona.id,
        name: salesResponsibleName,
        role: 'مسئول فروش و صدور حواله خروج',
      },
      freightAmountRials: Number(freightAmountRials) || 0,
      deliveryMode,
      externalTradeReference,
      externalWarehouseReference,
      warehouseId,
      warehouseName,
      driverName: driverName || 'در انتظار تخصیص راننده بارانداز',
      driverPhone: driverPhone || '---',
      vehiclePlate: vehiclePlate || '---',
      vehicleType,
      waybillNumber,
      items,
      creatorPersona: activePersona,
    };

    const newExit = mockSalesWarehouseStore.createWarehouseExit(payload);
    addToast('حواله خروج با موفقیت صادر شد', {
      description: `حواله خروج ${newExit.code} برای ${buyerName} ایجاد شد و در ترخیص انبار قرار گرفت.`,
      tone: 'success',
    });

    onCreated(newExit);
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="صدور پیش‌نویس و حواله خروج از انبار (Warehouse Exit Dispatch)"
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            <CheckCircle2 className="w-4 h-4 ml-1" />
            تأیید و صدور نهایی حواله خروج
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Source Switcher */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-2 text-xs">
            <Package className="w-4 h-4 text-primary-700" />
            <span>مبنای صدور حواله خروج انبار:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSourceType('sales_order')}
              className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                sourceType === 'sales_order'
                  ? 'bg-primary-50/80 border-primary-400 text-primary-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>بر مبنای سفارش فروش مصوب</span>
                <span className="text-caption px-2 py-0.5 rounded bg-primary-100 text-primary-800 font-mono">
                  {toPersianDigits(approvedOrders.length)} سفارش مصوب
                </span>
              </div>
              <p className="text-caption font-normal text-slate-500 mt-1">
                انتقال خودکار اقلام، نرخ‌های تأییدشده و آدرس‌های پرونده مشتری
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType('manual');
                setSelectedOrderId('');
              }}
              className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                sourceType === 'manual'
                  ? 'bg-primary-50/80 border-primary-400 text-primary-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>صدور مستقیم حواله فروش / فوری</span>
                <span className="text-caption px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  دستی
                </span>
              </div>
              <p className="text-caption font-normal text-slate-500 mt-1">
                صدور سریع برای مشتریان عمده یا ترخیص‌های خاص بدون پرونده قبلی
              </p>
            </button>
          </div>

          {sourceType === 'sales_order' && (
            <div className="pt-2">
              <FormField label="انتخاب سفارش فروش تأییدشده بازرگانی" required>
                <SelectInput
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  options={
                    approvedOrders.length === 0
                      ? [{ label: 'هیچ سفارش تأییدشده‌ای در انتظار انبار نیست', value: '' }]
                      : approvedOrders.map((o) => ({
                          label: `${o.code} - ${o.customerName} (${formatRials(o.totalAmountRials)})`,
                          value: o.id,
                        }))
                  }
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Buyer & Customer Information */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>اطلاعات طرف حساب / خریدار و شرایط فروش</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <FormField label="نام یا عنوان تجاری خریدار" required>
              <TextInput
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="مثال: فروشگاه‌های زنجیره‌ای اتکا"
              />
            </FormField>

            <FormField label="شناسه ملی خریدار">
              <TextInput
                value={buyerNationalId}
                onChange={(e) => setBuyerNationalId(e.target.value)}
                placeholder="۱۰۱۰۲۸۴۷۱۵۰"
              />
            </FormField>

            <FormField label="کد اقتصادی">
              <TextInput
                value={buyerEconomicCode}
                onChange={(e) => setBuyerEconomicCode(e.target.value)}
                placeholder="۴۱۱۵..."
              />
            </FormField>

            <FormField label="شماره تماس خریدار">
              <TextInput
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="۰۹۱۲-..."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FormField label="آدرس دقیق محل تخلیه بار" required>
                <TextInput
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="تهران، کیلومتر ۱۴ جاده مخصوص کرج..."
                />
              </FormField>
            </div>

            <FormField label="کد پستی محل تخلیه">
              <TextInput
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="۱۹۹۱۸۴۷۱۲۳"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="شرایط تسویه و فروش">
              <TextInput
                value={salesConditions}
                onChange={(e) => setSalesConditions(e.target.value)}
                placeholder="چک صیادی ۴۵ روزه..."
              />
            </FormField>

            <FormField label="کارشناس مسئول فروش">
              <TextInput
                value={salesResponsibleName}
                onChange={(e) => setSalesResponsibleName(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Warehouse & National Systems */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-700" />
            <span>انبار مبدأ و شناسه‌های استعلام سامانه‌های ملی</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="انبار مبدأ ترخیص">
              <SelectInput
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setWarehouseName(
                    e.target.value === 'wh-01' ? 'انبار مرکزی کهریزک' : 'انبار کارخانه شکوهیه قم'
                  );
                }}
                options={[
                  { label: 'انبار مرکزی کهریزک (تهران)', value: 'wh-01' },
                  { label: 'انبار کارخانه روغن نباتی شکوهیه (قم)', value: 'wh-02' },
                ]}
              />
            </FormField>

            <FormField label="شماره رهگیری سامانه جامع تجارت">
              <TextInput
                value={externalTradeReference}
                onChange={(e) => setExternalTradeReference(e.target.value)}
                placeholder="TRD-1403-..."
              />
            </FormField>

            <FormField label="شناسه قبض انبار (سامانه جامع انبارها)">
              <TextInput
                value={externalWarehouseReference}
                onChange={(e) => setExternalWarehouseReference(e.target.value)}
                placeholder="WHS-KHZ-..."
              />
            </FormField>
          </div>
        </div>

        {/* Logistics & Driver Details */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" />
            <span>مشخصات راننده، خودروی حامل و بارنامه</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="نام راننده حامل">
              <TextInput
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="مثال: مراد جهان‌بخش"
              />
            </FormField>

            <FormField label="شماره همراه راننده">
              <TextInput
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="۰۹۱۹-۲۲۳-۴۴۱۱"
              />
            </FormField>

            <FormField label="پلاک خودروی حامل">
              <TextInput
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="ایران ۳۳ - ۲۲۱ ع ۵۵"
              />
              <IranianPlate plateString={vehiclePlate} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="نوع وسیله نقلیه">
              <SelectInput
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                options={[
                  { label: 'خاور مسقف چادری ۶ چرخ', value: 'خاور مسقف چادری ۶ چرخ' },
                  { label: 'وانت نیسان کفی', value: 'وانت نیسان کفی' },
                  { label: 'کامیون تک ۱۰ تن', value: 'کامیون تک ۱۰ تن' },
                  { label: 'کامیون جفت ۱۵ تن', value: 'کامیون جفت ۱۵ تن' },
                  { label: 'تریلی ترانزیت چادری ۲۲ تن', value: 'تریلی ترانزیت چادری ۲۲ تن' },
                ]}
              />
            </FormField>

            <FormField label="شماره بارنامه دولتی">
              <TextInput
                value={waybillNumber}
                onChange={(e) => setWaybillNumber(e.target.value)}
                placeholder="WB-TEH-..."
              />
            </FormField>

            <FormField label="مبلغ کرایه حمل (ریال)">
              <TextInput
                type="number"
                value={freightAmountRials}
                onChange={(e) => setFreightAmountRials(Number(e.target.value) || 0)}
              />
            </FormField>
          </div>
        </div>

        {/* Products / Exit Items Table */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">
              اقلام و مقادیر درخواستی خروج از انبار
            </span>
            <span className="text-caption text-slate-500">
              تعداد اقلام: {toPersianDigits(items.length)} ردیف
            </span>
          </div>

          <div className="overflow-x-auto">
            <AdaptiveTable className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2">نام محصول</th>
                  <th className="p-2">تعداد کارتن</th>
                  <th className="p-2">تعداد کل</th>
                  <th className="p-2">واحد</th>
                  <th className="p-2">نرخ واحد (ریال)</th>
                  <th className="p-2">ملاحظات</th>
                  <th className="p-2 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <div className="font-bold text-slate-800">{item.productName}</div>
                      <div className="font-mono text-caption text-slate-500">{item.productCode}</div>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.requestedCartons}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setItems(
                            items.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    requestedCartons: val,
                                    requestedQuantity: val * 12,
                                  }
                                : it
                            )
                          );
                        }}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono text-xs"
                      />
                    </td>
                    <td className="p-2 font-mono font-bold text-primary-900">
                      {toPersianDigits(item.requestedQuantity)}
                    </td>
                    <td className="p-2 text-slate-600">{item.unit}</td>
                    <td className="p-2 font-mono">{formatRials(item.salePriceRials)}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems(
                            items.map((it, i) => (i === idx ? { ...it, notes: val } : it))
                          );
                        }}
                        placeholder="ملاحظات ردیف..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-caption"
                      />
                    </td>
                    <td className="p-2 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-500 hover:text-rose-600 transition-colors"
                         aria-label="حذف مورد">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdaptiveTable>
          </div>
        </div>
      </form>
    </ModalDialog>
  );
};
