import { MetricStrip, AmountInWords } from '../components/design-system/WorkspaceTools';
import { validRials } from '../utils/financial';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { MockPersona, SalesOrderDetails, SalesOrderItem } from '../types';
import { MOCK_SALES_ORDERS } from '../data/mockSalesData';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../data/mockMasterData';
import { mockSalesWarehouseStore } from '../runtime/workflow';
import { getDisplayPersonaName, getPersonaDisplayName } from '../runtime/documentBasedPersonas';
import { getChannelDisplayName } from '../utils/channelMapper';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Chip, Badge } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { formatRials, formatNumber, toPersianDigits } from '../utils/formatters';
import { Plus, Search, Phone, MapPin, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, History, FileText, CreditCard, Building2, Trash2, Send, ShieldAlert, User, RotateCcw, XCircle, LayoutGrid, List, Download, Eye } from 'lucide-react';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import {
  EnterpriseCard,
  EnterpriseCardHeader,
  EnterpriseCardBody,
  EnterpriseCardFooter,
  EnterpriseKeyValue,
} from '../components/design-system/EnterpriseCard';

interface SalesViewProps {
  subRoute: 'sales_orders' | 'pricing' | 'sales_calls';
  activePersona: MockPersona;
  selectedRecordId?: string;
  onNavigateToRoute?: (route: string) => void;
  onNavigateToInboxRecord?: (code: string) => void;
  initialCreateModalOpen?: boolean;
  initialStep?: 1 | 2 | 3 | 4;
}

type SavedView = 'all' | 'mine' | 'pending_approval' | 'urgent' | 'needs_action';

const getPersianChannelLabel = (channel?: string, rawLabel?: string): string => {
  return getChannelDisplayName(channel, rawLabel);
};

const getPersianOrderStatusBadge = (status: string, customLabel?: string) => {
  const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
    waiting: { label: 'در انتظار', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    blocked: { label: 'مسدود', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    overdue: { label: 'معوق', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    urgent: { label: 'فوری', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    approved: { label: 'تأیید شده', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    returned: { label: 'عودت داده شده', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    rejected: { label: 'رد شده', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    pending_approval: { label: 'در انتظار تأیید', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    pending_commercial_approval: { label: 'در انتظار تأیید بازرگانی', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    needs_price_approval: { label: 'نیاز به تأیید نرخ', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    under_review: { label: 'در حال بررسی', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    submitted: { label: 'ثبت شده', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  };

  const info = statusMap[status] || {
    label: customLabel || status,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const label =
    customLabel && !['phone', 'waiting', 'blocked', 'approved', 'rejected', 'returned', 'overdue', 'urgent'].includes(customLabel)
      ? customLabel
      : info.label;

  return (
    <span className={`px-2 py-0.5 rounded text-caption font-bold border ${info.bg} ${info.text} ${info.border}`}>
      {label}
    </span>
  );
};

export const SalesView: React.FC<SalesViewProps> = ({
  subRoute,
  activePersona,
  selectedRecordId,
  onNavigateToRoute,
  onNavigateToInboxRecord,
  initialCreateModalOpen,
  initialStep,
}) => {
  const { addToast } = useToast();

  const [orders, setOrders] = useState<SalesOrderDetails[]>(() => mockSalesWarehouseStore.getSalesOrders());
  const [customers, setCustomers] = useState(() => mockSalesWarehouseStore.getCustomers());
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [orderViewMode, setOrderViewMode] = useState<'cards' | 'table'>('table');

  const availableOwners = React.useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.createdByName) set.add(o.createdByName);
      if (o.salesResponsibleName) set.add(o.salesResponsibleName);
    });
    return Array.from(set);
  }, [orders]);

  const getSalesStatusPill = (status: string, customLabel?: string) => {
    let tone = 'neutral';
    let label = customLabel || status;
    if (status === 'draft' || status === 'submitted') {
      tone = 'neutral';
      label = 'پیش‌نویس';
    } else if (['pending', 'pending_approval', 'pending_commercial_approval', 'under_review', 'needs_price_approval'].includes(status)) {
      tone = 'warning';
      label = customLabel || 'در انتظار تأیید';
    } else if (status === 'approved') {
      tone = 'success';
      label = 'تأییدشده';
    } else if (status === 'returned') {
      tone = 'danger';
      label = 'برگشت‌خورده';
    } else if (status === 'rejected') {
      tone = 'danger';
      label = 'ردشده';
    } else if (['closed', 'dispatched', 'delivered'].includes(status)) {
      tone = 'info';
      label = customLabel || 'بسته‌شده';
    }

    return (
      <span className={`pill ${tone}`}>
        <span className="dot" />
        {label}
      </span>
    );
  };

  // Active Order Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderDetails | null>(null);
  useEffect(() => { if (selectedRecordId) setSelectedOrder(orders.find(r => r.id === selectedRecordId || r.code === selectedRecordId) || null); }, [selectedRecordId, orders]);

  // Sync with store
  useEffect(() => {
    const unsub = mockSalesWarehouseStore.subscribe(() => {
      setOrders(mockSalesWarehouseStore.getSalesOrders());
      setCustomers(mockSalesWarehouseStore.getCustomers());
      if (selectedOrder) {
        const refreshed = mockSalesWarehouseStore.getSalesOrderById(selectedOrder.id);
        if (refreshed) {
          setSelectedOrder(refreshed);
        }
      }
    });
    return unsub;
  }, [selectedOrder]);

  // Revision Comparison Modal
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  // Approval Decision Modals in SalesView
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('نیاز به بازنگری در شرایط پرداخت و تخفیف سفارش');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('عدم توجیه اقتصادی نرخ و ریسک بالای سقف اعتباری مشتری');

  // New Order Form Modal & Step-Based Mobile Wizard
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateModalOpen || false);
  // Sales-order creation: sales.create only
  const canCreateOrder = activePersona.capabilities.includes('sales.create');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(initialStep || 1);

  // Form State
  const initialCust = customers[0] || MOCK_CUSTOMERS[0];
  const [formCustomerId, setFormCustomerId] = useState(initialCust?.id || '');
  const [formChannel, setFormChannel] = useState<'phone' | 'visit' | 'whatsapp' | 'telegram' | 'in_person' | 'other'>('phone');
  const [formDeliveryAddress, setFormDeliveryAddress] = useState(
    initialCust?.locations?.length > 0
      ? initialCust.locations[0].address
      : 'تهران، انبار کارفرما'
  );
  const [formSalesResponsible, setFormSalesResponsible] = useState('تأییدکننده بازرگانی');
  const [formPaymentTerms, setFormPaymentTerms] = useState('۳۰٪ نقد + ۷۰٪ چک صیادی ۳۰ روزه');
  const [formDeliveryTerms, setFormDeliveryTerms] = useState('تحویل درب انبار مرکزی کهریزک با ناوگان خریدار');
  const [formItems, setFormItems] = useState<{
    productId: string;
    cartons: number;
    agreedPrice: number;
  }[]>([
    {
      productId: MOCK_PRODUCTS[0].id,
      cartons: 1,
      agreedPrice: MOCK_PRODUCTS[0].currentPriceRials || MOCK_PRODUCTS[0].referencePriceRials || 1250000,
    },
  ]);

  // Clean reset & open handler for new order creation modal
  const handleOpenCreateModal = () => {
    setCurrentStep(1);
    const initialCustomer = customers[0] || MOCK_CUSTOMERS[0];
    setFormCustomerId(initialCustomer?.id || '');
    setFormChannel('phone');
    setFormDeliveryAddress(
      initialCustomer?.locations?.length > 0
        ? initialCustomer.locations[0].address
        : 'تهران، انبار کارفرما'
    );
    setFormSalesResponsible('تأییدکننده بازرگانی');
    setFormPaymentTerms('۳۰٪ نقد + ۷۰٪ چک صیادی ۳۰ روزه');
    setFormDeliveryTerms('تحویل درب انبار مرکزی کهریزک با ناوگان خریدار');
    const firstProduct = MOCK_PRODUCTS[0];
    setFormItems([
      {
        productId: firstProduct.id,
        cartons: 1,
        agreedPrice: firstProduct.currentPriceRials || firstProduct.referencePriceRials || 1250000,
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // Price revision drawer modal state
  const [isPriceRevisionModalOpen, setIsPriceRevisionModalOpen] = useState(false);
  const [revisionNewPrice, setRevisionNewPrice] = useState<number>(0);
  const [revisionChangeReason, setRevisionChangeReason] = useState<string>('تعدیل قیمت بر اساس مذاکره مجدد با مشتری');

  // Autosave indicator mock
  const [autosaveTime, setAutosaveTime] = useState('۱ دقیقه پیش');

  // Calculate totals for step 2 & step 4 with full edible oil conversion & price thresholds
  const calculatedItems = formItems.map((item, idx) => {
    const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId) || MOCK_PRODUCTS[0];
    const piecesPerCarton = prod.cartonConversion?.piecesPerCarton || prod.conversionRatio || 12;
    const kgPerCarton = prod.cartonConversion?.kgPerCarton || 16.5;
    const validCartons = (!item.cartons || item.cartons <= 0 || !Number.isSafeInteger(item.cartons) || isNaN(item.cartons)) ? 0 : item.cartons;
    const pieces = validCartons * piecesPerCarton;
    const weightKg = Number((validCartons * kgPerCarton).toFixed(1));
    const officialPrice = prod.currentPriceRials || prod.referencePriceRials || 0;
    const minPermittedPrice = prod.minAllowedPriceRials || Math.round(officialPrice * 0.95);

    const hasMissingPrice = !officialPrice || officialPrice <= 0;
    const isBelowMinimum = !hasMissingPrice && item.agreedPrice < minPermittedPrice;
    const isNormalPrice = !hasMissingPrice && !isBelowMinimum;
    const priceDiff = officialPrice - item.agreedPrice;
    const discountPercent =
      hasMissingPrice || officialPrice === 0
        ? 0
        : Math.max(0, Number(((priceDiff / officialPrice) * 100).toFixed(1)));

    // Total line: total units (bottles/cans) * agreed unit price
    const totalRials = pieces * item.agreedPrice;

    return {
      id: `itm-${idx}`,
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      cartons: item.cartons,
      validCartons,
      pieces,
      weightKg,
      baseUnit: prod.baseUnit,
      secondaryUnit: prod.secondaryUnit || 'کارتن',
      conversionRatio: piecesPerCarton,
      officialSnapshotPriceRials: officialPrice,
      minPermittedPriceRials: minPermittedPrice,
      agreedUnitPriceRials: item.agreedPrice,
      discountPercent,
      priceDiff,
      totalRials,
      hasMissingPrice,
      isBelowMinimum,
      isNormalPrice,
    };
  });

  const formTotalAmount = calculatedItems.reduce((acc, curr) => acc + curr.totalRials, 0);
  const formTotalWeightKg = calculatedItems.reduce((acc, curr) => acc + curr.weightKg, 0);
  const formTotalPieces = calculatedItems.reduce((acc, curr) => acc + curr.pieces, 0);
  const formTotalCartons = calculatedItems.reduce((acc, curr) => acc + curr.cartons, 0);

  const hasAnyMissingPrice = calculatedItems.some((it) => it.hasMissingPrice);
  const hasAnyPriceBelowMinimum = calculatedItems.some((it) => it.isBelowMinimum);
  const hasAnyInvalidQuantity = formItems.some(
    (it) => !it.cartons || it.cartons <= 0 || !Number.isSafeInteger(it.cartons) || isNaN(it.cartons)
  );

  // Filter orders by prototype tabs (salesFilter), owner and query
  const filteredOrders = orders.filter((ord) => {
    if (salesFilter === 'draft') {
      if (ord.status !== 'draft' && ord.status !== 'submitted') return false;
    } else if (salesFilter === 'pending') {
      if (!['submitted', 'under_review', 'needs_price_approval', 'pending_approval', 'pending_commercial_approval'].includes(ord.status)) return false;
    } else if (salesFilter === 'approved') {
      if (ord.status !== 'approved') return false;
    } else if (salesFilter === 'returned') {
      if (ord.status !== 'returned') return false;
    } else if (salesFilter === 'closed') {
      if (!['closed', 'dispatched', 'delivered'].includes(ord.status)) return false;
    }

    if (ownerFilter !== 'all') {
      if (ord.createdByName !== ownerFilter && ord.salesResponsibleName !== ownerFilter) return false;
    }

    if (channelFilter !== 'all' && ord.channel !== channelFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        ord.title.toLowerCase().includes(q) ||
        ord.code.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.createdByName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleCreateSubmit = () => {
    if (!canCreateOrder || !customers.some(c => c.id === formCustomerId) || !calculatedItems.length || calculatedItems.some(it => !Number.isSafeInteger(it.cartons) || it.cartons <= 0 || !validRials(it.agreedUnitPriceRials) || !validRials(it.totalRials)) || !validRials(formTotalAmount)) { addToast('مشتری، تعداد صحیح مثبت کارتن و مبلغ معتبر برای همه اقلام لازم است.', 'danger'); return; }
    if (hasAnyMissingPrice) {
      addToast('خطای قیمت‌گذاری کاتالوگ', {
        description: 'برای یک یا چند قلم انتخابی نرخ معتبر روز ثبت نشده است. لطفاً ابتدا در کاتالوگ محصولات نرخ‌گذاری نمایید.',
        tone: 'danger',
      });
      return;
    }

    const selectedCust = customers.find((c) => c.id === formCustomerId) || customers[0] || MOCK_CUSTOMERS[0];
    const hasBelowThreshold = calculatedItems.some((it) => it.isBelowMinimum);

    const createdOrder = mockSalesWarehouseStore.createSalesOrder({
      customerId: selectedCust.id,
      channel: formChannel,
      creatorPersona: activePersona,
      salesResponsibleId:
        formSalesResponsible.includes('سهراب') || formSalesResponsible.includes('تأییدکننده')
          ? 'p-comm-approver'
          : 'p-sales',
      salesResponsibleName: formSalesResponsible,
      deliveryAddress: formDeliveryAddress,
      paymentTerms: formPaymentTerms,
      deliveryTerms: formDeliveryTerms,
      items: calculatedItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        productCode: it.productCode,
        unit: it.baseUnit,
        conversionFactor: it.conversionRatio,
        cartons: it.cartons,
        pieces: it.pieces,
        weightKg: it.weightKg,
        baseUnit: it.baseUnit,
        secondaryUnit: it.secondaryUnit,
        dailyReferencePriceRials: it.officialSnapshotPriceRials,
        minPermittedPriceRials: it.minPermittedPriceRials,
        offeredPriceRials: it.officialSnapshotPriceRials,
        agreedUnitPriceRials: it.agreedUnitPriceRials,
        discountPercent: it.discountPercent,
      })),
    });

    setIsCreateModalOpen(false);
    setCurrentStep(1);

    if (hasBelowThreshold) {
      addToast('سفارش با اخطار کف قیمت ثبت شد', {
        description: `کد رهگیری: ${createdOrder.code} به دلیل نرخ کمتر از حداقل مجاز، با وضعیت «مشروط — نیازمند تأیید بازرگانی» در سیستم ثبت شد و کالا تا قبل از تأیید از انبار ترخیص نخواهد شد.`,
        tone: 'warning',
      });
    } else {
      addToast('سفارش جدید با موفقیت ثبت شد', {
        description: `کد رهگیری: ${createdOrder.code} به تأییدهای من ارسال گردید.`,
        tone: 'success',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Subroute Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-slate-900">
              {subRoute === 'pricing'
                ? 'نرخ‌نامه، قیمت‌های مصوب و سقف اختیارات تخفیف'
                : subRoute === 'sales_calls'
                ? 'ثبت و پیگیری تعاملات، تماس‌ها و پیام‌های مشتریان'
                : 'مدیریت و ثبت سفارش‌های فروش و توزیع'}
            </h1>
            <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              واحد بازرگانی جوادیان
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {subRoute === 'pricing'
              ? 'قیمت‌های روز بر مبنای بورس کالا، ضرایب تبدیل کارتن به عدد/وزن و تاریخچه تعدیل نرخ‌ها'
              : subRoute === 'sales_calls'
              ? 'ثبت تعاملات ورودی از کلیه کانال‌های تلفنی، پیام‌رسان‌ها و جلسات حضوری'
              : 'ثبت سفارش با تفکیک ایجادکننده از مسئول، فرم گام‌به‌گام و مقایسه تغییرات نگارش'}
          </p>
        </div>

        {subRoute === 'sales_orders' && canCreateOrder && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            ثبت سفارش جدید
          </Button>
        )}
      </div>

      {/* ================= VIEW 1: PRICING TAB ================= */}
      {subRoute === 'pricing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-caption font-mono font-bold text-slate-500">{prod.code}</span>
                    <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{prod.name}</h3>
                    <span className="text-caption text-slate-500">{prod.category}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-caption font-bold">
                    فعال
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-caption">قیمت مصوب روز ({prod.baseUnit}):</span>
                    <CurrencyAmount amountRials={prod.currentPriceRials} layout="inline" />
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-200">
                    <span className="text-slate-500 text-caption">کف مجاز کارشناس:</span>
                    <CurrencyAmount amountRials={prod.minAllowedPriceRials} layout="compact" />
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-caption">
                    <span className="text-slate-500">ضریب تبدیل:</span>
                    <span className="text-slate-700">{prod.cartonConversion.description}</span>
                  </div>
                </div>

                {/* Price History */}
                <div>
                  <div className="text-caption font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>تاریخچه تعدیل نرخ</span>
                  </div>
                  <div className="space-y-1 text-caption">
                    {prod.priceHistory.map((ph, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-500">
                        <span>{ph.dateJalali} ({ph.changedBy})</span>
                        <CurrencyAmount amountRials={ph.priceRials} layout="compact" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SALES CALLS TAB ================= */}
      {subRoute === 'sales_calls' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-none space-y-3">
            <h3 className="text-xs font-bold text-slate-800">ثبت تعامل و پیگیری مشتری</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="مشتری">
                <SelectInput
                  options={MOCK_CUSTOMERS.map((c) => ({ label: c.tradeName, value: c.id }))}
                />
              </FormField>
              <FormField label="کانال ارتباطی">
                <SelectInput
                  options={[
                    { label: 'تماس تلفنی ورودی', value: 'phone' },
                    { label: 'جلسه حضوری در دفتر', value: 'in_person' },
                    { label: 'پیام‌رسان واتساپ', value: 'whatsapp' },
                    { label: 'پیام‌رسان تلگرام', value: 'telegram' },
                  ]}
                />
              </FormField>
              <FormField label="نتیجه پیگیری">
                <TextInput placeholder="مثال: توافق بر پیش‌فاکتور ۹۰۲ با تحویل پنج‌شنبه" />
              </FormField>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => addToast('رویداد تماس با مشتری در پرونده ثبت شد', { tone: 'success' })}
            >
              ثبت پیگیری
            </Button>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: SALES ORDERS LIST & WORKSPACE ================= */}
      {subRoute === 'sales_orders' && (
        <div className="space-y-3">
          {/* 1. Page Header matching prototype #page-sales */}
          <div className="page-head">
            <div className="page-title">
              <h1>فروش</h1>
              <p>ثبت و پیگیری سفارش‌های فروش، با دسترسی سریع به جزئیات، وضعیت و تحویل.</p>
            </div>
            <div className="page-actions">
              {canCreateOrder && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn primary cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  سفارش فروش
                </button>
              )}
            </div>
          </div>

          {/* 2. Tabs matching prototype #salesTabs */}
          <div className="tabs">
            <button
              type="button"
              onClick={() => setSalesFilter('all')}
              className={`tab ${salesFilter === 'all' ? 'active' : ''}`}
            >
              همه ({toPersianDigits(orders.length)})
            </button>
            <button
              type="button"
              onClick={() => setSalesFilter('draft')}
              className={`tab ${salesFilter === 'draft' ? 'active' : ''}`}
            >
              پیش‌نویس ({toPersianDigits(orders.filter(o => o.status === 'draft' || o.status === 'submitted').length)})
            </button>
            <button
              type="button"
              onClick={() => setSalesFilter('pending')}
              className={`tab ${salesFilter === 'pending' ? 'active' : ''}`}
            >
              در انتظار تأیید ({toPersianDigits(orders.filter(o => ['submitted', 'under_review', 'needs_price_approval', 'pending_approval', 'pending_commercial_approval'].includes(o.status)).length)})
            </button>
            <button
              type="button"
              onClick={() => setSalesFilter('approved')}
              className={`tab ${salesFilter === 'approved' ? 'active' : ''}`}
            >
              تأییدشده ({toPersianDigits(orders.filter(o => o.status === 'approved').length)})
            </button>
            <button
              type="button"
              onClick={() => setSalesFilter('returned')}
              className={`tab ${salesFilter === 'returned' ? 'active' : ''}`}
            >
              برگشت‌خورده ({toPersianDigits(orders.filter(o => o.status === 'returned').length)})
            </button>
            <button
              type="button"
              onClick={() => setSalesFilter('closed')}
              className={`tab ${salesFilter === 'closed' ? 'active' : ''}`}
            >
              بسته‌شده ({toPersianDigits(orders.filter(o => ['closed', 'dispatched', 'delivered'].includes(o.status)).length)})
            </button>
          </div>

          {/* 3. Toolbar matching prototype */}
          <div className="toolbar">
            <input
              className="input search"
              placeholder="جست‌وجوی مشتری یا شماره سفارش"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="select"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">همه مسئولان</option>
              {availableOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
            <div className="spacer" />
            <button
              type="button"
              className="btn"
              onClick={() => addToast('در حال آماده‌سازی گزارش سفارش‌های فروش...', { tone: 'info' })}
            >
              <Download className="w-4 h-4" />
              گزارش
            </button>
          </div>

          {/* 4. Table matching prototype .table-card > .table-scroll > table.data-table */}
          <div className="table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>شماره</th>
                    <th>مشتری</th>
                    <th>وضعیت</th>
                    <th>مبلغ</th>
                    <th>مسئول</th>
                    <th>تاریخ ثبت</th>
                    <th>موعد تحویل</th>
                    <th className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        سفارش فروشی با این مشخصات یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="cell-main font-mono text-primary-700">{ord.code}</td>
                        <td>
                          <div className="cell-main">{ord.customerName}</div>
                          <div className="cell-sub">{ord.title}</div>
                        </td>
                        <td>{getSalesStatusPill(ord.status, ord.statusLabel)}</td>
                        <td className="font-mono">
                          {toPersianDigits(ord.totalAmountRials.toLocaleString('fa-IR'))} ریال
                        </td>
                        <td>{ord.createdByName}</td>
                        <td className="text-slate-500">{ord.createdAtJalali || ord.creationDateJalali || '—'}</td>
                        <td className="text-slate-500">{ord.deliveryDateJalali || '—'}</td>
                        <td className="text-center">
                          <div className="row-actions justify-center">
                            <button
                              type="button"
                              className="mini-btn"
                              title="مشاهده"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(ord);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Two-column cards matching prototype .two-col */}
          <div className="two-col" style={{ marginTop: '13px' }}>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">تماس‌ها و پیگیری‌های فروش</div>
                  <div className="card-sub">ثبت دستی تماس، پیام و نتیجه پیگیری</div>
                </div>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => onNavigateToRoute ? onNavigateToRoute('sales_calls') : null}
                >
                  <Plus className="w-3.5 h-3.5" />
                  ثبت تماس
                </button>
              </div>
              <div className="card-body">
                <div className="stack">
                  <div className="queue-row">
                    <div className="activity-dot shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="queue-main">
                      <div className="queue-title">فروشگاه زنجیره‌ای سپید</div>
                      <div className="queue-meta">استعلام موجودی روغن و زمان تحویل پارت دوم</div>
                    </div>
                    <span className="pill info">
                      <span className="dot" />
                      تلفنی
                    </span>
                  </div>
                  <div className="queue-row">
                    <div className="activity-dot shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="queue-main">
                      <div className="queue-title">صنایع بسته‌بندی جوپار</div>
                      <div className="queue-meta">توافق نهایی روی تخفیف ۵٪ و اصلاح پیش‌نویس</div>
                    </div>
                    <span className="pill success">
                      <span className="dot" />
                      واتساپ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">فرصت‌ها و پیش‌فاکتورها</div>
                  <div className="card-sub">موارد باز قبل از تبدیل به سفارش قطعی</div>
                </div>
              </div>
              <div className="card-body">
                <div className="stack">
                  {orders
                    .filter((o) => o.status === 'draft' || o.status === 'submitted')
                    .slice(0, 3)
                    .map((draft) => (
                      <div
                        key={draft.id}
                        className="overview-flow-row cursor-pointer"
                        onClick={() => setSelectedOrder(draft)}
                      >
                        <div className="overview-flow-kind shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="queue-main">
                          <div className="queue-title">{draft.customerName}</div>
                          <div className="queue-meta font-mono">{draft.code} • {draft.createdByName}</div>
                        </div>
                        <span className="pill neutral">
                          <span className="dot" />
                          {toPersianDigits(draft.totalAmountRials.toLocaleString('fa-IR'))} ریال
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAIL DRAWER ================= */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `سفارش ${selectedOrder.code}` : ''}
        subtitle={selectedOrder ? `${selectedOrder.customerName} • ${getPersianChannelLabel(selectedOrder.channel, selectedOrder.channelLabel)}` : ''}
        width="md"
        footer={
          selectedOrder && (
            <div className="w-full flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Approval, Return & Reject buttons */}
                {(selectedOrder.status === 'under_review' ||
                  selectedOrder.status === 'needs_price_approval' ||
                  selectedOrder.status === 'pending_approval' ||
                  selectedOrder.status === 'pending_commercial_approval') && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={
                        selectedOrder.createdByName.includes(activePersona.name) ||
                        selectedOrder.createdById === activePersona.id ||
                        !(
                          activePersona.capabilities.includes('sales.approve') ||
                          activePersona.capabilities.includes('pricing.approve') ||
                          activePersona.personaKey === 'commercial_approver'
                        )
                      }
                      title={
                        selectedOrder.createdByName.includes(activePersona.name) || selectedOrder.createdById === activePersona.id
                          ? 'ثبت‌کننده سفارش صلاحیت تأیید آن را ندارد (منع خودتأییدی)'
                          : !(
                              activePersona.capabilities.includes('sales.approve') ||
                              activePersona.capabilities.includes('pricing.approve') ||
                              activePersona.personaKey === 'commercial_approver'
                            )
                          ? 'فقط تأییدکننده بازرگانی صلاحیت تصویب تجاری سفارش را دارد'
                          : undefined
                      }
                      onClick={() => {
                        if (selectedOrder.createdByName.includes(activePersona.name) || selectedOrder.createdById === activePersona.id) {
                          addToast('خطای تفکیک وظایف (تأیید درخواست خودتان مجاز نیست)', {
                            description: 'امکان تأیید سفارش ثبت‌شده توسط خود کاربر وجود ندارد. تأیید باید توسط مقام تجاری مستقل انجام گیرد.',
                            tone: 'danger',
                          });
                          return;
                        }

                        const res = mockSalesWarehouseStore.approveSalesOrder(selectedOrder.id, activePersona);
                        if (!res.success) {
                          addToast('خطا در تأیید سفارش', {
                            description: res.message,
                            tone: 'danger',
                          });
                          return;
                        }

                        const updatedOrder = mockSalesWarehouseStore.getSalesOrderById(selectedOrder.id);
                        if (updatedOrder) {
                          setSelectedOrder(updatedOrder);
                        }

                        addToast('سفارش فروش با موفقیت تأیید شد', {
                          description: res.linkedWarehouseExit
                            ? `سفارش ${selectedOrder.code} تأیید شد و حواله خروج انبار ${res.linkedWarehouseExit.code} به طور خودکار صادر گردید.`
                            : res.message,
                          tone: 'success',
                        });
                      }}
                    >
                      {selectedOrder.hasPriceException || selectedOrder.status === 'needs_price_approval'
                        ? 'تأیید استثنای قیمت'
                        : 'تأیید سفارش'}
                    </Button>

                    <Button
                      size="sm"
                      variant="warning"
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      disabled={
                        selectedOrder.createdByName.includes(activePersona.name) ||
                        selectedOrder.createdById === activePersona.id ||
                        !(
                          activePersona.capabilities.includes('sales.approve') ||
                          activePersona.capabilities.includes('pricing.approve') ||
                          activePersona.personaKey === 'commercial_approver'
                        )
                      }
                      onClick={() => setIsReturnModalOpen(true)}
                    >
                      عودت برای اصلاح
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      disabled={
                        selectedOrder.createdByName.includes(activePersona.name) ||
                        selectedOrder.createdById === activePersona.id ||
                        !(
                          activePersona.capabilities.includes('sales.approve') ||
                          activePersona.capabilities.includes('pricing.approve') ||
                          activePersona.personaKey === 'commercial_approver'
                        )
                      }
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      رد سفارش
                    </Button>
                  </>
                )}

                {/* Edit Price & New Revision Button */}
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<History className="w-4 h-4" />}
                  onClick={() => {
                    const currentUnitPrice = selectedOrder.items[0]?.agreedUnitPriceRials || 1250000;
                    setRevisionNewPrice(currentUnitPrice);
                    setRevisionChangeReason('تعدیل قیمت توافقی بر اساس توافق تجاری جدید با مشتری');
                    setIsPriceRevisionModalOpen(true);
                  }}
                >
                  ویرایش قیمت
                </Button>

                {selectedOrder.revisions.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => setIsRevisionModalOpen(true)}
                  >
                    تاریخچه ({toPersianDigits(selectedOrder.revisions.length)})
                  </Button>
                )}
              </div>

              <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>
                بستن
              </Button>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            {/* 1. Summary Key-Value List matching prototype kv style */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">وضعیت سفارش</span>
                <div>{getSalesStatusPill(selectedOrder.status, selectedOrder.statusLabel)}</div>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">مبلغ کل</span>
                <span className="font-mono font-bold text-slate-900">
                  {toPersianDigits(selectedOrder.totalAmountRials.toLocaleString('fa-IR'))} ریال
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">مسئول فروش</span>
                <span className="font-bold text-primary-700">{selectedOrder.salesResponsibleName}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">ایجادکننده اولیه</span>
                <span className="text-slate-800">{selectedOrder.createdByName}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">تاریخ ثبت</span>
                <span className="text-slate-700">{selectedOrder.createdAtJalali || selectedOrder.creationDateJalali || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-slate-500 text-caption font-bold">موعد تحویل</span>
                <span className="text-slate-700">{selectedOrder.deliveryDateJalali || '—'}</span>
              </div>
              {selectedOrder.deliveryAddress && (
                <div className="flex items-start justify-between p-3 gap-2">
                  <span className="text-slate-500 text-caption font-bold shrink-0">محل تحویل</span>
                  <span className="text-slate-700 text-left">{selectedOrder.deliveryAddress}</span>
                </div>
              )}
              {selectedOrder.paymentTerms && (
                <div className="flex items-start justify-between p-3 gap-2">
                  <span className="text-slate-500 text-caption font-bold shrink-0">شرایط تسویه</span>
                  <span className="text-slate-700 text-left">{selectedOrder.paymentTerms}</span>
                </div>
              )}
            </div>

            {/* 2. Self-approval notice if user is creator */}
            {(selectedOrder.createdByName.includes(activePersona.name) || selectedOrder.createdById === activePersona.id) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-caption leading-relaxed">
                  <span className="font-bold">منع خودتأییدی: </span>
                  شما ثبت‌کننده این سفارش هستید. تأیید تجاری باید صرفاً توسط مقام مستقل انجام شود.
                </div>
              </div>
            )}

            {/* 3. Connected Flow (جریان متصل) matching prototype */}
            <div className="form-section">
              <div className="form-section-title font-bold text-slate-800 mb-2">جریان متصل</div>
              <div className="space-y-2">
                {/* Approval flow item */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">
                      گردش تأیید تجاری {selectedOrder.relatedApprovalId ? `(${selectedOrder.relatedApprovalId})` : ''}
                    </div>
                    <div className="text-caption text-slate-500 mt-0.5">
                      {selectedOrder.statusLabel || 'در انتظار تصمیم تأییدکننده مستقل'}
                    </div>
                  </div>
                  {onNavigateToInboxRecord && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToInboxRecord(selectedOrder.linkedWorkItemId || selectedOrder.code);
                        setSelectedOrder(null);
                      }}
                      className="btn small"
                    >
                      تأییدهای من
                    </button>
                  )}
                </div>

                {/* Warehouse Exit flow item */}
                {(() => {
                  const linkedExit = mockSalesWarehouseStore.getWarehouseExits().find(
                    (e) => e.linkedSalesOrder?.id === selectedOrder.id || e.linkedSalesOrder?.code === selectedOrder.code
                  );
                  if (!linkedExit) return null;
                  return (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>حواله خروج انبار {linkedExit.code}</span>
                        </div>
                        <div className="text-caption text-emerald-800 mt-0.5">
                          {linkedExit.warehouse.name} • {linkedExit.status === 'ready' ? 'آماده بارگیری' : linkedExit.status === 'dispatched' ? 'ترخیص‌شده' : 'در جریان'}
                        </div>
                      </div>
                      {onNavigateToRoute && (
                        <button
                          type="button"
                          onClick={() => onNavigateToRoute('warehouse_dispatch')}
                          className="btn small"
                        >
                          مشاهده
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 4. Compact Items Table */}
            <div className="form-section">
              <div className="form-section-title font-bold text-slate-800 mb-2">اقلام سفارش</div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-caption">
                      <th className="p-2.5 font-bold">کالا</th>
                      <th className="p-2.5 font-bold">تعداد</th>
                      <th className="p-2.5 font-bold">قیمت واحد</th>
                      <th className="p-2.5 font-bold">جمع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {it.productName}
                          {it.discountPercent > 0 && (
                            <span className="text-caption text-amber-700 block font-normal">
                              تخفیف: {toPersianDigits(it.discountPercent)}٪
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-caption">
                          {toPersianDigits(it.cartons)} کارتن ({toPersianDigits(it.pieces)} {it.baseUnit || 'عدد'})
                        </td>
                        <td className="p-2.5 font-mono text-caption">
                          {toPersianDigits(it.agreedUnitPriceRials.toLocaleString('fa-IR'))}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-caption">
                          {toPersianDigits(it.totalRials.toLocaleString('fa-IR'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ================= PRICE REVISION MODAL ================= */}
      <ModalDialog
        isOpen={isPriceRevisionModalOpen}
        onClose={() => setIsPriceRevisionModalOpen(false)}
        title="ویرایش قیمت و ایجاد نگارش جدید"
        width="md"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setIsPriceRevisionModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!selectedOrder) return;
                const oldItem = selectedOrder.items[0];
                const prod = MOCK_PRODUCTS.find((p) => p.id === oldItem?.productId) || MOCK_PRODUCTS[0];
                const minPrice = prod.minAllowedPriceRials || Math.round(prod.currentPriceRials * 0.95);
                const isBelowMin = revisionNewPrice < minPrice;

                const success = mockSalesWarehouseStore.reviseSalesOrder(
                  selectedOrder.id,
                  activePersona,
                  {
                    items: [
                      {
                        productId: oldItem ? oldItem.productId : 'prod-01',
                        cartons: oldItem ? oldItem.cartons : 100,
                        agreedUnitPriceRials: revisionNewPrice,
                      },
                    ],
                  },
                  `${revisionChangeReason} (تغییر نرخ از ${formatRials(oldItem?.agreedUnitPriceRials)} به ${formatRials(revisionNewPrice)})`
                );

                if (success) {
                  const updatedOrder = mockSalesWarehouseStore.getSalesOrderById(selectedOrder.id);
                  if (updatedOrder) setSelectedOrder(updatedOrder);
                  setIsPriceRevisionModalOpen(false);

                  addToast('نگارش جدید با موفقیت در مخزن ثبت شد', {
                    description: `نگارش جدید ذخیره گردید و در صورت لزوم تأییدیه قبلی سفارش باطل شد.`,
                    tone: isBelowMin ? 'warning' : 'info',
                  });
                }
              }}
            >
              ثبت نگارش جدید
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>قاعده بازنگری و گردش کار:</span>
            </div>
            <p className="text-caption leading-relaxed text-amber-800">
              تغییر قیمت پس از ثبت سفارش، نگارش جدید (Revision) ایجاد کرده و <strong>تأییدیه قبلی را باطل می‌نماید</strong>. در صورت پایین‌تر بودن از کف مجاز، پرونده مجدداً با وضعیت «نیازمند تأیید قیمت» در کارهای من معاونت بازرگانی قرار می‌گیرد.
            </p>
          </div>

          <FormField label="قیمت واحد توافقی جدید (ریال برای هر بطری/قوطی)" required>
            <TextInput
              type="number"
              value={revisionNewPrice}
              onChange={(e) => setRevisionNewPrice(Number(e.target.value) || 0)}
            />
          </FormField>

          {/* Real-time warning in revision modal */}
          {selectedOrder && (
            (() => {
              const prod = MOCK_PRODUCTS.find((p) => p.id === selectedOrder.items[0]?.productId) || MOCK_PRODUCTS[0];
              const minPrice = prod.minAllowedPriceRials || Math.round(prod.currentPriceRials * 0.95);
              if (revisionNewPrice < minPrice) {
                return (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-caption space-y-1">
                    <span className="font-bold">هشدار: قیمت واردشده کمتر از حداقل مجاز ({formatRials(minPrice)}) است.</span>
                    <p>این سفارش مجدداً با برچسب «نیازمند تأیید قیمت» نشان‌دار خواهد شد.</p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-caption">
                  قیمت در محدوده مجاز روز قرار دارد.
                </div>
              );
            })()
          )}

          <FormField label="علت و توجیه تعدیل قیمت" required>
            <TextareaInput
              value={revisionChangeReason}
              onChange={(e) => setRevisionChangeReason(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= RETURN FOR AMENDMENT MODAL ================= */}
      <ModalDialog
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="عودت سفارش برای اصلاح"
        width="md"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="warning"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              disabled={!returnReason.trim()}
              onClick={() => {
                if (!selectedOrder) return;
                const res = mockSalesWarehouseStore.returnSalesOrder(selectedOrder.id, activePersona, returnReason);
                if (res.success) {
                  const updatedOrder = mockSalesWarehouseStore.getSalesOrderById(selectedOrder.id);
                  if (updatedOrder) setSelectedOrder(updatedOrder);
                  setIsReturnModalOpen(false);
                  addToast(`سفارش فروش ${selectedOrder.code} جهت اصلاح به کارشناس ثبت برگشت داده شد.`, {
                    tone: 'warning',
                  });
                } else {
                  addToast(res.message, { tone: 'danger' });
                }
              }}
            >
              عودت برای اصلاح
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>قاعده بازگشت سفارش:</span>
            </div>
            <p className="text-caption leading-relaxed text-amber-800">
              با بازگشت سفارش، پرونده در کارهای من «برگشتی‌ها / نیازمند اقدام مجدد» کارشناس ثبت‌کننده قرار گرفته و او موظف است پس از تعدیل نرخ یا شرایط، نگارش جدید را ارسال نماید.
            </p>
          </div>

          <FormField label="دلیل بازگشت و اصلاحات مورد انتظار (الزامی)" required>
            <TextareaInput
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="مثال: نرخ توافقی بسیار پایین‌تر از حاشیه سود مجاز است یا نیازمند دریافت تضامین بیشتر..."
              rows={3}
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= REJECT ORDER MODAL ================= */}
      <ModalDialog
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="رد سفارش"
        width="md"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              disabled={!rejectReason.trim()}
              onClick={() => {
                if (!selectedOrder) return;
                const res = mockSalesWarehouseStore.rejectSalesOrder(selectedOrder.id, activePersona, rejectReason);
                if (res.success) {
                  const updatedOrder = mockSalesWarehouseStore.getSalesOrderById(selectedOrder.id);
                  if (updatedOrder) setSelectedOrder(updatedOrder);
                  setIsRejectModalOpen(false);
                  addToast(`سفارش فروش ${selectedOrder.code} رسماً رد شد.`, {
                    tone: 'danger',
                  });
                } else {
                  addToast(res.message, { tone: 'danger' });
                }
              }}
            >
              رد سفارش
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>اثر رد سفارش:</span>
            </div>
            <p className="text-caption leading-relaxed text-rose-800">
              با رد این سفارش، پرونده مختومه شده و امکان خروج کالا از انبار یا هرگونه اقدام عملیاتی مسدود می‌گردد.
            </p>
          </div>

          <FormField label="دلیل رد سفارش (الزامی)" required>
            <TextareaInput
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: عدم توجیه اقتصادی و ریسک مالی بالا..."
              rows={3}
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= REVISION COMPARISON MODAL ================= */}
      <ModalDialog
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="مقایسه تغییرات نگارش‌های سفارش فروش (Revision Diff)"
        width="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsRevisionModalOpen(false)}>
            بستن
          </Button>
        }
      >
        {selectedOrder && selectedOrder.revisions.length > 0 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 space-y-1">
              <div className="font-bold text-primary-950 flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>نگارش جدید در برابر نگارش قبلی</span>
              </div>
              <p className="text-primary-800 text-caption leading-relaxed">
                {selectedOrder.revisions[0].changeSummary} • اصلاح شده توسط: {selectedOrder.revisions[0].modifiedBy.name} در {selectedOrder.revisions[0].dateJalali}
              </p>
            </div>

            {/* Before vs After Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <AdaptiveTable className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="p-3 font-bold">پارامتر تغییریافته</th>
                    <th className="p-3 font-bold text-slate-500 bg-slate-50">مقدار قبلی</th>
                    <th className="p-3 font-bold text-primary-700 bg-primary-50/50">مقدار جدید</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.revisions[0].itemsDiff.map((df, idx) => (
                    <tr key={idx} className={df.isCritical ? 'bg-rose-50/70' : ''}>
                      <td className="p-3 font-bold text-slate-800">{df.field}</td>
                      <td className="p-3 text-slate-500 font-mono bg-slate-50/50 line-through">
                        {df.before}
                      </td>
                      <td className="p-3 font-bold text-primary-700 font-mono bg-primary-50/30">
                        {df.after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdaptiveTable>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* ================= STEP-BASED MOBILE / DESKTOP CREATE WIZARD ================= */}
      <ModalDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`ثبت سفارش فروش جدید • مرحله ${currentStep} از ۴`}
        width="lg"
        footer={
          <div className="w-full flex items-center justify-between">
            <span className="text-caption text-slate-500 font-mono">
              ذخیره خودکار پیش‌نویس: {autosaveTime}
            </span>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                >
                  مرحله قبل
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  size="sm"
                  variant="primary"
                  rightIcon={<ArrowLeft className="w-4 h-4" />}
                  disabled={currentStep === 2 && (hasAnyMissingPrice || hasAnyInvalidQuantity)}
                  title={
                    currentStep === 2 && hasAnyMissingPrice
                      ? 'برای ادامه باید کالاهای بدون قیمت تعیین تکلیف شوند'
                      : currentStep === 2 && hasAnyInvalidQuantity
                      ? 'تعداد کارتن همه اقلام باید یک عدد صحیح مثبت (حداقل ۱) باشد'
                      : undefined
                  }
                  onClick={() => {
                    if (currentStep === 2 && hasAnyMissingPrice) {
                      addToast('خطای قیمت کاتالوگ', {
                        description: 'برای این کالا نرخ معتبر روز تعریف نشده است و امکان عبور به مرحله بعد وجود ندارد.',
                        tone: 'danger',
                      });
                      return;
                    }
                    if (currentStep === 2 && hasAnyInvalidQuantity) {
                      addToast('خطای تعداد کارتن', {
                        description: 'تعداد کارتن باید یک عدد صحیح مثبت (حداقل ۱) باشد.',
                        tone: 'danger',
                      });
                      return;
                    }
                    setCurrentStep((prev) => (prev + 1) as any);
                  }}
                >
                  مرحله بعد
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={hasAnyPriceBelowMinimum ? 'primary' : 'primary'}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleCreateSubmit}
                >
                  {hasAnyPriceBelowMinimum
                    ? 'ثبت سفارش (نیازمند تأیید نرخ)'
                    : 'ثبت سفارش'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Step Indicators: Condensed on Mobile, 4 columns on Desktop */}
          <div className="sm:hidden flex items-center justify-between p-2.5 bg-primary-50 rounded-xl border border-primary-200 text-xs font-bold text-primary-900">
            <span>مرحله {toPersianDigits(currentStep)} از ۴</span>
            <span className="text-primary-700 font-medium">
              {['۱. مشتری و کانال', '۲. اقلام و نرخ‌گذاری', '۳. تسویه و تحویل', '۴. بازبینی و تأیید'][currentStep - 1]}
            </span>
          </div>
          <div className="hidden sm:grid grid-cols-4 gap-2 text-center text-xs pb-2 border-b border-slate-100">
            <div className={`p-1.5 rounded-lg font-bold ${currentStep === 1 ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}`}>
              ۱. مشتری و کانال
            </div>
            <div className={`p-1.5 rounded-lg font-bold ${currentStep === 2 ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}`}>
              ۲. اقلام و نرخ‌گذاری
            </div>
            <div className={`p-1.5 rounded-lg font-bold ${currentStep === 3 ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}`}>
              ۳. تسویه و تحویل
            </div>
            <div className={`p-1.5 rounded-lg font-bold ${currentStep === 4 ? 'bg-primary-50 text-primary-700' : 'text-slate-500'}`}>
              ۴. بازبینی و تأیید
            </div>
          </div>

          {/* STEP 1: Customer & Channel */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs">
              <FormField label="انتخاب مشتری طرف حساب" required>
                <SelectInput
                  value={formCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setFormCustomerId(cId);
                    const cust = customers.find((c) => c.id === cId);
                    if (cust && cust.locations && cust.locations.length > 0) {
                      setFormDeliveryAddress(cust.locations[0].address);
                    }
                  }}
                  options={customers.map((c) => ({
                    label: `${c.tradeName} (${c.code}) - ${c.officialName}`,
                    value: c.id,
                  }))}
                />
              </FormField>

              {/* Customer 360 Credit Profile Card */}
              {(() => {
                const currentCust = customers.find((c) => c.id === formCustomerId) || customers[0];
                if (!currentCust) return null;
                const availableCredit = (currentCust.creditLimitRials || 0) - (currentCust.openBalanceRials || currentCust.currentBalanceRials || 0);
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>شناسه ملی: <span className="font-mono">{currentCust.nationalId}</span></span>
                        {currentCust.economicCode && (
                          <span className="text-slate-500 font-normal mr-2">کد اقتصادی: <span className="font-mono text-slate-700">{currentCust.economicCode}</span></span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-caption font-bold ${
                        currentCust.creditRating === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        currentCust.creditRating === 'B' ? 'bg-primary-100 text-primary-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        رتبه اعتباری: {currentCust.creditRating}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-caption">
                      <div>
                        <span className="text-slate-500 block">سقف اعتبار مصوب:</span>
                        <span className="font-mono font-bold text-slate-800">{formatRials(currentCust.creditLimitRials || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">مانده بدهی جاری:</span>
                        <span className="font-mono font-bold text-amber-700">{formatRials(currentCust.openBalanceRials || currentCust.currentBalanceRials || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">اعتبار آزاد در دسترس:</span>
                        <span className={`font-mono font-bold ${availableCredit < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {formatRials(Math.max(0, availableCredit))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="کانال ثبت سفارش" required>
                  <SelectInput
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as any)}
                    options={[
                      { label: 'تماس تلفنی مستقیم با کارشناس', value: 'phone' },
                      { label: 'ویزیت میدانی بازاریاب', value: 'visit' },
                      { label: 'پیام‌رسان واتساپ (استعلام قیمت)', value: 'whatsapp' },
                      { label: 'پیام‌رسان تلگرام', value: 'telegram' },
                      { label: 'مراجعه حضوری به دفتر مرکزی', value: 'in_person' },
                      { label: 'سایر کانال‌ها', value: 'other' },
                    ]}
                  />
                </FormField>

                <FormField label="کارشناس مسئول پاسخگوی فروش" required>
                  <SelectInput
                    value={formSalesResponsible}
                    onChange={(e) => setFormSalesResponsible(e.target.value)}
                    options={[
                      { label: 'تأییدکننده بازرگانی', value: 'تأییدکننده بازرگانی' },
                      { label: 'کارشناس فروش', value: 'کارشناس فروش' },
                      { label: 'آقای نادری (مسئول فروش مویرگی استان قم)', value: 'آقای نادری' },
                    ]}
                  />
                </FormField>
              </div>

              {/* Creator Persona Banner */}
              <div className="p-3 bg-primary-50/70 border border-primary-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary-700" />
                  <span>ثبت‌کننده سفارش (کاربر فعلی سیستم):</span>
                  <span className="font-bold text-primary-950">{getPersonaDisplayName(activePersona)}</span>
                </span>
                <span className="text-caption text-primary-700 font-mono">تفکیک وظایف و منع خودتأییدی محفوظ است</span>
              </div>

              {/* Delivery Address selection */}
              <FormField label="محل و آدرس تخلیه بار" required>
                <div className="space-y-2">
                  {(() => {
                    const cust = customers.find((c) => c.id === formCustomerId);
                    if (!cust || !cust.locations || cust.locations.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <span className="text-caption text-slate-500">انتخاب از انبارها و مقاصد ثبت‌شده مشتری:</span>
                        <div className="flex flex-wrap gap-2">
                          {cust.locations.map((loc) => (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => setFormDeliveryAddress(loc.address)}
                              className={`text-caption px-3 py-1 rounded-lg border transition-colors ${
                                formDeliveryAddress === loc.address
                                  ? 'bg-primary-50 border-primary-300 text-primary-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {loc.title}: {loc.city} - {loc.address.slice(0, 30)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <TextInput
                    value={formDeliveryAddress}
                    onChange={(e) => setFormDeliveryAddress(e.target.value)}
                    placeholder="آدرس دقیق تخلیه بار..."
                  />
                </div>
              </FormField>
            </div>
          )}

          {/* STEP 2: Items, Pricing & Conversions */}
          {currentStep === 2 && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 flex justify-between items-center">
                <span>محاسبه خودکار بر مبنای کارتن، بطری و وزن خالص محصولات روغنی:</span>
                <span className="font-bold font-mono">
                  جمع موقت: {formatRials(formTotalAmount)}
                </span>
              </div>

              {formItems.map((item, index) => {
                const itemCalc = calculatedItems[index];
                const prod = MOCK_PRODUCTS.find((p) => p.id === item.productId) || MOCK_PRODUCTS[0];

                return (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FormField label="انتخاب محصول روغنی" required>
                        <SelectInput
                          value={item.productId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newProd = MOCK_PRODUCTS.find((p) => p.id === val);
                            setFormItems((prev) =>
                              prev.map((it, i) =>
                                i === index
                                  ? {
                                      ...it,
                                      productId: val,
                                      agreedPrice: newProd ? newProd.currentPriceRials : it.agreedPrice,
                                    }
                                  : it
                              )
                            );
                          }}
                          options={MOCK_PRODUCTS.map((p) => ({
                            label: `${p.name} (کد: ${p.code})`,
                            value: p.id,
                          }))}
                        />
                      </FormField>

                      <FormField
                        label="تعداد کارتن / بسته"
                        required
                        error={
                          !item.cartons || item.cartons <= 0 || !Number.isSafeInteger(item.cartons)
                            ? 'تعداد کارتن باید یک عدد صحیح مثبت (حداقل ۱) باشد'
                            : undefined
                        }
                      >
                        <TextInput
                          type="number"
                          min={1}
                          step={1}
                          value={isNaN(item.cartons) ? '' : item.cartons}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            const val = raw === '' ? 0 : Number(raw);
                            setFormItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, cartons: val } : it))
                            );
                          }}
                        />
                      </FormField>

                      <FormField label={`قیمت توافقی هر ${itemCalc.baseUnit} (ریال)`} required>
                        <TextInput
                          type="number"
                          value={item.agreedPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setFormItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, agreedPrice: val } : it))
                            );
                          }}
                        />
                      </FormField>
                    </div>

                    <AmountInWords amount={item.agreedPrice} />
                    {/* Price Status Feedback Banner */}
                    {itemCalc.hasMissingPrice ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>برای این کالا نرخ معتبر روز تعریف نشده است.</span>
                        </div>
                        {onNavigateToRoute && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsCreateModalOpen(false);
                              onNavigateToRoute('pricing');
                            }}
                          >
                            تعریف نرخ در کاتالوگ
                          </Button>
                        )}
                      </div>
                    ) : itemCalc.isBelowMinimum ? (
                      <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                        <div className="flex items-center gap-2 font-extrabold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>
                            قیمت واردشده ({formatRials(item.agreedPrice)}) پایین‌تر از حد مجاز ({formatRials(itemCalc.minPermittedPriceRials)}) است و نیازمند تأیید تجاری است.
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-caption border-t border-amber-200">
                          <div>
                            <span className="text-amber-700 block">نرخ مصوب مرجع:</span>
                            <span className="font-mono font-bold">{formatRials(itemCalc.officialSnapshotPriceRials)}</span>
                          </div>
                          <div>
                            <span className="text-amber-700 block">کف مجاز کارشناس:</span>
                            <span className="font-mono font-bold">{formatRials(itemCalc.minPermittedPriceRials)}</span>
                          </div>
                          <div>
                            <span className="text-amber-700 block">اختلاف / تخفیف:</span>
                            <span className="font-mono font-bold text-rose-700">
                              {formatRials(itemCalc.priceDiff)} ({toPersianDigits(itemCalc.discountPercent)}٪)
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-700 block">شرط تصویب:</span>
                            <span className="font-bold text-amber-950">تأییدکننده بازرگانی</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between text-caption">
                        <span className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          قیمت مطابق نرخ معتبر روز است (تأییدیه ویژه نیاز ندارد)
                        </span>
                        <span className="font-mono">
                          نرخ مصوب: {formatRials(itemCalc.officialSnapshotPriceRials)}
                        </span>
                      </div>
                    )}

                    {/* Unit & Carton breakdown */}
                    <div className="text-caption text-slate-500 flex flex-wrap items-center justify-between pt-1 border-t border-slate-200 gap-2">
                      <span>
                        ضریب تبدیل: هر کارتن شامل {prod.cartonConversion.piecesPerCarton} {itemCalc.baseUnit} ({prod.cartonConversion.kgPerCarton} کیلوگرم)
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        مجموع این ردیف: {formatNumber(itemCalc.pieces)} {itemCalc.baseUnit} • {formatNumber(itemCalc.weightKg)} کیلوگرم • {formatRials(itemCalc.totalRials)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    const nextProd = MOCK_PRODUCTS[formItems.length % MOCK_PRODUCTS.length];
                    setFormItems((prev) => [
                      ...prev,
                      { productId: nextProd.id, cartons: 50, agreedPrice: nextProd.currentPriceRials },
                    ]);
                  }}
                >
                  افزودن ردیف کالای دیگر
                </Button>

                {formItems.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => setFormItems((prev) => prev.slice(0, -1))}
                  >
                    حذف ردیف آخر
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Terms & Responsible Distinction */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-800">تفکیک ثبت‌کننده از مسئول فروش:</span>
                <p className="text-slate-500">
                  ثبت‌کننده: «{getPersonaDisplayName(activePersona)}» (شما) • مسئول فروش: فردی که مسئولیت تحقق فروش و پاسخگویی تجاری را بر عهده دارد.
                </p>
              </div>

              <FormField label="کارشناس مسئول فروش">
                <SelectInput
                  value={formSalesResponsible}
                  onChange={(e) => setFormSalesResponsible(e.target.value)}
                  options={[
                    { label: 'تأییدکننده بازرگانی', value: 'تأییدکننده بازرگانی' },
                    { label: 'کارشناس فروش', value: 'کارشناس فروش' },
                    { label: 'آقای نادری (مسئول فروش مویرگی استان قم)', value: 'آقای نادری' },
                  ]}
                />
              </FormField>

              <FormField label="شرایط پرداخت و تسویه">
                <TextInput
                  value={formPaymentTerms}
                  onChange={(e) => setFormPaymentTerms(e.target.value)}
                />
              </FormField>

              <FormField label="شرایط و نحوه حمل و تحویل">
                <TextInput
                  value={formDeliveryTerms}
                  onChange={(e) => setFormDeliveryTerms(e.target.value)}
                />
              </FormField>
            </div>
          )}

          {/* STEP 4: Review & Final Price Validation Audit */}
          {currentStep === 4 && (
            <div className="space-y-3 text-xs">
              {/* Critical Notice if below minimum */}
              {hasAnyPriceBelowMinimum ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-950 space-y-2">
                  <div className="font-extrabold text-sm flex items-center gap-2 text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>هشدار کنترل قیمت: سفارش نیازمند تأیید معاونت بازرگانی است</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    یک یا چند قلم دارای قیمت کمتر از کف مجاز هستند. این سفارش پس از ثبت با وضعیت <strong>«نیازمند تأیید قیمت»</strong> مشخص شده و تا پیش از تأیید <strong>تأییدکننده بازرگانی</strong>، امکان تأیید نهایی یا صدور خروج از انبار را ندارد.
                  </p>

                  <div className="pt-2 border-t border-rose-200">
                    <div className="font-bold text-rose-900 mb-1.5">اقلام مشمول استثنای قیمت:</div>
                    <div className="space-y-1">
                      {calculatedItems
                        .filter((it) => it.isBelowMinimum)
                        .map((it) => (
                          <div
                            key={it.id}
                            className="flex flex-wrap items-center justify-between p-2 bg-white/80 rounded-lg border border-rose-200 font-mono text-caption"
                          >
                            <span className="font-bold text-slate-800">{it.productName}:</span>
                            <span>{it.cartons} کارتن ({it.pieces} {it.baseUnit})</span>
                            <span className="text-slate-500 line-through">
                              مرجع: {formatRials(it.officialSnapshotPriceRials)}
                            </span>
                            <span className="text-rose-700 font-bold">
                              توافقی: {formatRials(it.agreedUnitPriceRials)} (کف: {formatRials(it.minPermittedPriceRials)})
                            </span>
                            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-sans font-bold">
                              نیازمند تأیید معاونت بازرگانی
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>قیمت‌گذاری اقلام سفارش کاملاً منطبق با نرخ مصوب است</span>
                  </div>
                  <p className="text-emerald-800 text-caption">
                    اطلاعات سفارش آماده بازبینی است. پس از ثبت، پرونده جهت بررسی و اقدامات تجاری ارسال می‌شود.
                  </p>
                </div>
              )}

              {/* Order Summary Box */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between font-bold">
                  <span>مشتری:</span>
                  <span>{MOCK_CUSTOMERS.find((c) => c.id === formCustomerId)?.officialName}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>کانال ثبت:</span>
                  <span>{getChannelDisplayName(formChannel)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>حجم کل محموله:</span>
                  <span className="font-mono">
                    {toPersianDigits(formTotalCartons)} کارتن ({formatNumber(formTotalPieces)} بطری/حلب) • {formatNumber(formTotalWeightKg)} کیلوگرم
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                  <span>ارزش کل پیش‌فاکتور:</span>
                  <span className="font-mono text-primary-700 text-sm">{formatRials(formTotalAmount)}</span>
                </div>
              </div>

              {/* Self-Approval Reminder */}
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-caption leading-relaxed">
                <strong>تأیید مستقل:</strong> ثبت‌کننده سفارش ({getPersonaDisplayName(activePersona)}) به دلیل اصل تفکیک وظایف، امکان تأیید نهایی این سفارش را نخواهد داشت.
              </div>
            </div>
          )}
        </div>
      </ModalDialog>
    </div>
  );
};
