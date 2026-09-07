import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState } from 'react';
import { FileText, Search, CheckCircle, AlertTriangle, XCircle, User, ShieldCheck, Building2, Printer, ChevronRight, ExternalLink, Scale, Plus, CheckCircle2, Clock, ArrowRight, ArrowLeft, Trash2, Truck, Package, ClipboardList, Paperclip, Camera, FileSpreadsheet, AlertCircle, FileCheck } from 'lucide-react';
import {
  WarehouseReceiptRecord,
  WarehouseReceiptItemResult,
  WarehouseReceiptOverallResult,
  FinancialIntegrationStatus,
  MockPersona,
} from '../types';
import { MOCK_WAREHOUSE_RECEIPTS } from '../data/mockSupplyLogisticsData';
import { MOCK_WAREHOUSES, MOCK_SUPPLIERS, MOCK_PRODUCTS } from '../data/mockMasterData';
import { Button } from '../components/design-system/Button';
import { Drawer, ModalDialog } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { toPersianDigits, formatRials, formatNumber } from '../utils/formatters';
import {
  ReceiptAttachmentCard,
  ReceiptAttachmentItem,
} from '../components/warehouse/ReceiptAttachmentCard';
import { IranianPlate } from '../components/design-system/IranianPlate';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import { StatusBadge } from '../components/design-system/Badges';
import {
  EnterpriseCard,
  EnterpriseCardHeader,
  EnterpriseCardBody,
  EnterpriseCardFooter,
  EnterpriseKeyValue,
  EnterpriseCardStatus,
} from '../components/design-system/EnterpriseCard';
import { LayoutGrid, List } from 'lucide-react';
import {
  validateWarehouseReceiptAction,
  adaptPersona,
  getDisplayPersonaName,
} from '../runtime/documentBasedPersonas';

interface WarehouseReceiptsViewProps {
  activePersona: MockPersona;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

const DeferredScopeNoticeBanner: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div
    className={`bg-amber-50/90 border border-amber-300 rounded-xl ${
      compact ? 'p-2.5' : 'p-3'
    } text-amber-950 shadow-none`}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="font-extrabold text-xs text-amber-950">
          این فرم در نسخه فعلی نمایشی است و اثر انباری یا مالی واقعی ایجاد نمی‌کند.
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300">
          موقت
        </span>
        <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-300">
          متصل نیست
        </span>
        <span className="px-1.5 py-0.5 rounded font-bold bg-primary-50 text-primary-900 border border-primary-300">
          نمایشی
        </span>
        <span className="sr-only">DEFERRED NOT_CONNECTED PROTOTYPE_ONLY</span>
      </div>
    </div>
  </div>
);

export const WarehouseReceiptsView: React.FC<WarehouseReceiptsViewProps> = ({
  activePersona,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  const [receipts, setReceipts] = useState<WarehouseReceiptRecord[]>(MOCK_WAREHOUSE_RECEIPTS);
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceiptRecord | null>(null);
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  // Warehouse-receipt creation based on documented personas & fallback rules
  const receiptActionCheck = validateWarehouseReceiptAction(activePersona.id);
  const canCreateReceipt = receiptActionCheck.allowed;
  const isFallbackScenario = receiptActionCheck.roleType === 'fallback';

  // New Receipt Form State (4-step wizard)
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Reference & Account
  const [newWarehouseId, setNewWarehouseId] = useState(MOCK_WAREHOUSES[0]?.id || '');
  const [newSupplierId, setNewSupplierId] = useState(MOCK_SUPPLIERS[0]?.id || '');
  const [newPurchaseRef, setNewPurchaseRef] = useState('PO-1403-889');
  const [newRelatedSupplyRef, setNewRelatedSupplyRef] = useState('SUP-1403-081');
  const [newPurchaseConditions, setNewPurchaseConditions] = useState('تحویل درب انبار، بازرسی آزمایشگاهی و کنترل کیفیت حین تخلیه');

  // Step 2: Transport & Delivery & Weighbridge
  const [newDriverName, setNewDriverName] = useState('اصغر نجفی');
  const [newDriverPhone, setNewDriverPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [newVehiclePlate, setNewVehiclePlate] = useState('۲۲ ع ۸۵۰ ایران ۱۱');
  const [newVehicleType, setNewVehicleType] = useState('خاور مسقف چادری حمل روغن');
  const [newWaybillNo, setNewWaybillNo] = useState('BL-984210');
  const [newFreightAmount, setNewFreightAmount] = useState('45000000');
  const [newDeliveryType, setNewDeliveryType] = useState('حمل جاده‌ای مستقیم از مبدأ');
  const [newDeliveryLocation, setNewDeliveryLocation] = useState('سکوی شماره ۲ تخلیه بار انبار مرکزی');
  const [newUnloadingDestination, setNewUnloadingDestination] = useState('سالن شماره ۱ - قفسه‌بندی روغن خوراکی');
  const [newUnloadingSupervisor, setNewUnloadingSupervisor] = useState(
    receiptActionCheck.roleType === 'fallback'
      ? `${receiptActionCheck.actorAuditName} (جانشین)`
      : receiptActionCheck.actorAuditName
  );
  const [newWeighbridgeGrossKg, setNewWeighbridgeGrossKg] = useState(18500);
  const [newWeighbridgeTareKg, setNewWeighbridgeTareKg] = useState(6200);

  // Step 3: Items
  const [newItems, setNewItems] = useState([
    {
      productId: MOCK_PRODUCTS[0]?.id || '',
      cartons: 100,
      pieces: 1200,
      unit: MOCK_PRODUCTS[0]?.baseUnit || 'بطری',
      expectedQty: 1200,
      actualQty: 1200,
      priceRials: 415000,
      result: 'complete' as WarehouseReceiptItemResult,
      notes: 'تحویل بدون مغایرت و منطبق با بارنامه',
    },
  ]);

  // Step 4: Result & Evidence (Real UI Controls, null initially - not pre-attached)
  const [newOverallResult, setNewOverallResult] = useState<WarehouseReceiptOverallResult>('complete');
  const [newInspectionNotes, setNewInspectionNotes] = useState('کلیه کارتن‌ها با لیبل استاندارد و تاریخ انقضای معتبر بررسی و تأیید شدند.');
  const [waybillAttachment, setWaybillAttachment] = useState<ReceiptAttachmentItem | null>(null);
  const [weighbridgeAttachment, setWeighbridgeAttachment] = useState<ReceiptAttachmentItem | null>(null);
  const [cargoPhotoAttachment, setCargoPhotoAttachment] = useState<ReceiptAttachmentItem | null>(null);
  const [invoiceAttachment, setInvoiceAttachment] = useState<ReceiptAttachmentItem | null>(null);
  const [attachmentValidationError, setAttachmentValidationError] = useState<string | null>(null);
  const [previewAttachmentModal, setPreviewAttachmentModal] = useState<{
    title: string;
    attachment: ReceiptAttachmentItem;
  } | null>(null);

  const formatAttachmentSize = (bytes: number): string => {
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(2))} مگابایت`;
  };

  const getFileTypeLabel = (mimeType: string, filename: string): string => {
    if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) return 'سند دیجیتال PDF';
    if (mimeType.startsWith('image/') || filename.match(/\.(jpg|jpeg|png|webp)$/i)) return 'تصویر محموله/سند';
    return 'فایل ضمیمه';
  };

  const handleProcessFile = (
    category: 'waybill' | 'weighbridge' | 'cargo' | 'invoice',
    file: File
  ) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    const item: ReceiptAttachmentItem = {
      id: `att-${category}-${Date.now()}`,
      name: file.name,
      typeLabel: getFileTypeLabel(file.type, file.name),
      mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      sizeFormatted: formatAttachmentSize(file.size),
      sizeBytes: file.size,
      previewUrl,
      uploadStatus: 'uploaded',
      uploadedAtJalali: 'هم‌اکنون',
    };

    if (category === 'waybill') setWaybillAttachment(item);
    if (category === 'weighbridge') setWeighbridgeAttachment(item);
    if (category === 'cargo') setCargoPhotoAttachment(item);
    if (category === 'invoice') setInvoiceAttachment(item);

    setAttachmentValidationError(null);
    addToast({
      id: `toast-att-${Date.now()}`,
      title: 'سند با موفقیت ضمیمه شد',
      description: `${item.name} (${item.sizeFormatted}) — ذخیره موقت نمایشی`,
      tone: 'success',
    });
  };

  const handleLoadSampleFile = (category: 'waybill' | 'weighbridge' | 'cargo' | 'invoice') => {
    let name = '';
    let mimeType = 'application/pdf';
    let sizeBytes = 1024 * 512;
    let previewUrl: string | undefined = undefined;

    if (category === 'waybill') {
      name = `barnameh_rasmi_${newWaybillNo || '48291'}.pdf`;
      sizeBytes = 1024 * 720;
    } else if (category === 'weighbridge') {
      name = `ghabz_baskool_${toPersianDigits(newWeighbridgeGrossKg || '42000')}_kg.pdf`;
      sizeBytes = 1024 * 410;
    } else if (category === 'cargo') {
      name = `cargo_inspection_pallets_batch404.jpg`;
      mimeType = 'image/jpeg';
      sizeBytes = 1024 * 1250;
      previewUrl =
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80';
    } else if (category === 'invoice') {
      name = `factor_rasmi_supplier_${newPurchaseRef || 'PUR-904'}.pdf`;
      sizeBytes = 1024 * 890;
    }

    const item: ReceiptAttachmentItem = {
      id: `att-${category}-${Date.now()}`,
      name,
      typeLabel: getFileTypeLabel(mimeType, name),
      mimeType,
      sizeFormatted: formatAttachmentSize(sizeBytes),
      sizeBytes,
      previewUrl,
      uploadStatus: 'uploaded',
      uploadedAtJalali: 'هم‌اکنون',
    };

    if (category === 'waybill') setWaybillAttachment(item);
    if (category === 'weighbridge') setWeighbridgeAttachment(item);
    if (category === 'cargo') setCargoPhotoAttachment(item);
    if (category === 'invoice') setInvoiceAttachment(item);

    setAttachmentValidationError(null);
    addToast({
      id: `toast-att-sample-${Date.now()}`,
      title: 'فایل آزمایشی ضمیمه شد',
      description: `${item.name} — ذخیره موقت نمایشی`,
      tone: 'info',
    });
  };

  const resetNewReceiptForm = () => {
    setCreateStep(1);
    setWaybillAttachment(null);
    setWeighbridgeAttachment(null);
    setCargoPhotoAttachment(null);
    setInvoiceAttachment(null);
    setAttachmentValidationError(null);
    setNewOverallResult('complete');
    setNewInspectionNotes('کلیه کارتن‌ها با لیبل استاندارد و تاریخ انقضای معتبر بررسی و تأیید شدند.');
  };

  // Filter receipts
  const filteredReceipts = receipts.filter((r) => {
    if (resultFilter !== 'all' && r.overallResult !== resultFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = r.internalNumber.toLowerCase().includes(q);
      const matchSupplier = r.supplier.name.toLowerCase().includes(q);
      const matchWh = r.warehouse.name.toLowerCase().includes(q);
      const matchDriver = r.driverData.driverName.toLowerCase().includes(q);
      const matchRef = r.purchaseRef.toLowerCase().includes(q);
      const matchItem = r.items.some((it) => it.productName.toLowerCase().includes(q));
      if (!matchNo && !matchSupplier && !matchWh && !matchDriver && !matchRef && !matchItem) {
        return false;
      }
    }
    return true;
  });

  const getResultBadge = (res: WarehouseReceiptOverallResult) => {
    switch (res) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            تحویل کامل و منطبق
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            تحویل جزئی (کسری پارت)
          </span>
        );
      case 'mismatch':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            مغایرت مقدار / مشخصات
          </span>
        );
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            آسیب‌دیده در حمل
          </span>
        );
      case 'wrong_product':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-400">
            ارسال اشتباه کالا
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-500">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            مرجوع کامل بار
          </span>
        );
    }
  };

  const getItemResultBadge = (res: WarehouseReceiptItemResult) => {
    switch (res) {
      case 'complete':
        return <span className="text-emerald-700 font-semibold">تأیید کامل</span>;
      case 'partial':
        return <span className="text-teal-700 font-semibold">تحویل جزئی</span>;
      case 'mismatch':
        return <span className="text-amber-700 font-bold">مغایرت</span>;
      case 'damaged':
        return <span className="text-rose-700 font-bold">معیوب / ضایعات</span>;
      case 'wrong_product':
        return <span className="text-rose-800 font-bold">کالای مغایر</span>;
      case 'rejected':
        return <span className="text-red-800 font-bold">مرجوع</span>;
    }
  };

  const getFinancialIntegrationBadge = (_status?: FinancialIntegrationStatus) => {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <Building2 className="w-3 h-3 text-slate-500" />
        ثبت نشده در سیستم مالی (متصل نیست)
      </span>
    );
  };

  // Participant Sign Action (Truthful Notice - Approvals NOT_CONFIGURED)
  const handleParticipantSign = (
    _roleKey: 'warehouseKeeper' | 'qualityReviewer' | 'warehouseManager' | 'finalApprover'
  ) => {
    addToast({
      id: `not-configured-${Date.now()}`,
      title: 'مسیر تأیید هنوز پیکربندی نشده است',
      description:
        'ترتیب امضاها و ضوابط تصویب رسید انبار در این نسخه پیکربندی نشده است.',
      tone: 'warning',
    });
  };

  const handleCreateReceipt = () => {
    // Required-file validation before final submission
    const missing: string[] = [];
    if (!waybillAttachment) missing.push('بارنامه رسمی جاده‌ای');
    if (!weighbridgeAttachment) missing.push('قبض باسکول دیجیتال');
    if (!cargoPhotoAttachment) missing.push('تصویر محموله و پالت‌ها');
    if (!invoiceAttachment) missing.push('فاکتور یا حواله تأمین‌کننده');

    if (missing.length > 0) {
      setAttachmentValidationError(
        `جهت پیش‌نمایش ثبت رسید انبار، بارگذاری کلیه ضمائم چهارگانه الزامی است. مدارک بارگذاری‌نشده: ${missing.join('، ')}`
      );
      addToast({
        id: `toast-err-${Date.now()}`,
        title: 'نقص مدارک الزامی رسید انبار',
        description: `لطفاً مدارک الزامی زیر را بارگذاری نمایید: ${missing.join('، ')}`,
        tone: 'danger',
      });
      return;
    }

    setAttachmentValidationError(null);

    const wh = MOCK_WAREHOUSES.find((w) => w.id === newWarehouseId) || MOCK_WAREHOUSES[0];
    const sup = MOCK_SUPPLIERS.find((s) => s.id === newSupplierId) || MOCK_SUPPLIERS[0];
    const newNumber = `REC-1403-${Math.floor(120 + Math.random() * 80)}`;

    const itemsFormatted = newItems.map((it, idx) => {
      const prd = MOCK_PRODUCTS.find((p) => p.id === it.productId) || MOCK_PRODUCTS[0];
      return {
        id: `new-rec-it-${idx}`,
        productId: prd.id,
        productCode: prd.code,
        productName: prd.name,
        cartons: Number(it.cartons),
        pieces: Number(it.pieces),
        unit: it.unit,
        conversionRatio: prd.cartonConversion?.piecesPerCarton || 12,
        expectedQuantity: Number(it.expectedQty),
        actualQuantity: Number(it.actualQty),
        purchasePriceRials: Number(it.priceRials),
        purchasePriceSnapshotRials: Number(it.priceRials),
        totalPriceRials: Number(it.actualQty) * Number(it.priceRials),
        itemResult: it.result,
        notes: it.notes,
      };
    });

    const netWeighbridgeKg = Math.max(0, newWeighbridgeGrossKg - newWeighbridgeTareKg);

    const attachmentsList = [
      {
        id: waybillAttachment.id,
        title: `بارنامه رسمی جاده‌ای: ${waybillAttachment.name}`,
        url: waybillAttachment.previewUrl || '#',
      },
      {
        id: weighbridgeAttachment.id,
        title: `قبض باسکول ورودی: ${weighbridgeAttachment.name}`,
        url: weighbridgeAttachment.previewUrl || '#',
      },
      {
        id: cargoPhotoAttachment.id,
        title: `تصویر محموله و پالت‌ها: ${cargoPhotoAttachment.name}`,
        url: cargoPhotoAttachment.previewUrl || '#',
      },
      {
        id: invoiceAttachment.id,
        title: `فاکتور یا حواله تأمین‌کننده: ${invoiceAttachment.name}`,
        url: invoiceAttachment.previewUrl || '#',
      },
    ];

    const newRec: WarehouseReceiptRecord = {
      id: `rec-${Date.now()}`,
      internalNumber: newNumber,
      dateJalali: '۱۴۰۴/۰۶/۱۲',
      timeJalali: 'هم‌اکنون',
      warehouse: {
        id: wh.id,
        name: wh.name,
        code: wh.code,
      },
      supplier: {
        id: sup.id,
        name: sup.name,
        code: sup.code,
        contactPerson: sup.phone,
      },
      purchaseRef: newPurchaseRef,
      purchaseConditions: newPurchaseConditions,
      relatedSupplyRef: newRelatedSupplyRef,
      financialIntegrationStatus: 'not_registered',
      parsinaRefPlaceholder: 'ثبت نشده در پارسینا — اتصال API برقرار نیست',
      driverData: {
        driverName: newDriverName || 'راننده ثبت نشده',
        phone: newDriverPhone || '---',
        vehiclePlate: newVehiclePlate || 'ثبت در باسکول',
        vehicleType: newVehicleType || 'خاور مسقف حمل روغن',
        waybillNumber: newWaybillNo || '---',
        freightAmountRials: Number(newFreightAmount) || 0,
        deliveryType: newDeliveryType,
        deliveryLocation: newDeliveryLocation,
        unloadingDestination: newUnloadingDestination,
        unloadingSupervisor: newUnloadingSupervisor,
        weighbridgeGrossKg: newWeighbridgeGrossKg,
        weighbridgeTareKg: newWeighbridgeTareKg,
        weighbridgeNetKg: netWeighbridgeKg,
      },
      items: itemsFormatted,
      overallResult: newOverallResult,
      participants: {
        warehouseKeeper: {
          roleLabel: 'انباردار / تحویل‌گیرنده انبار (نقش پیشنهادی)',
          status: 'pending',
          notes: 'نقش پیشنهادی — ترتیب و الزام نهایی نشده است',
        },
        qualityReviewer: {
          roleLabel: 'کنترل کیفیت (نقش پیشنهادی)',
          status: 'pending',
          notes: newInspectionNotes,
        },
        warehouseManager: {
          roleLabel: 'مدیر انبار (نقش پیشنهادی)',
          status: 'pending',
        },
        finalApprover: {
          roleLabel: 'مرجع نهایی تصویب (نقش پیشنهادی)',
          status: 'pending',
        },
      },
      creatorExperience: {
        creator: {
          id: activePersona.id,
          name: receiptActionCheck.actorAuditName,
          role: activePersona.jobTitle,
          department: activePersona.department,
        },
        isDelegated: isFallbackScenario,
        delegatorName: isFallbackScenario ? receiptActionCheck.primaryResponsibleName : undefined,
        fallbackName: isFallbackScenario ? receiptActionCheck.actorAuditName : undefined,
      },
      attachments: attachmentsList,
      status: newOverallResult === 'mismatch' ? 'mismatch_flagged' : 'under_inspection',
    };

    setReceipts([newRec, ...receipts]);
    setIsNewModalOpen(false);
    setSelectedReceipt(newRec);
    resetNewReceiptForm();

    addToast({
      id: `toast-rec-${Date.now()}`,
      title: 'سند رسید انبار ثبت شد',
      description: `سند با شماره داخلی ${newNumber} با موفقیت ثبت گردید.`,
      tone: 'info',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-none">
        <div>
          <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-700" />
            اسناد رسید انبار
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            ثبت، پیگیری و مدیریت اسناد تحویل کالا به انبار و کنترل کیفی اقلام ورودی
          </p>
        </div>

        {canCreateReceipt && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetNewReceiptForm();
              setIsNewModalOpen(true);
            }}
            className="shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ثبت سند رسید انبار جدید
          </Button>
        )}
      </div>

      {/* Deferred Scope Notice Banner */}
      <DeferredScopeNoticeBanner />

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        {/* Results Horizontal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar border-b border-slate-100">
          {[
            { id: 'all', label: 'همه رسیدها' },
            { id: 'complete', label: 'تحویل کامل' },
            { id: 'partial', label: 'تحویل جزئی' },
            { id: 'mismatch', label: 'دارای مغایرت' },
            { id: 'damaged', label: 'آسیب‌دیده' },
            { id: 'rejected', label: 'مرجوع شده' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                resultFilter === tab.id
                  ? 'bg-primary-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="mr-1.5 text-caption opacity-80">
                  ({receipts.filter((r) => r.overallResult === tab.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در شماره داخلی رسید، نام تأمین‌کننده، راننده، انبار، شماره عطف یا کالا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-primary-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمای کارتی سازمانی"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>کارت‌ها</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-primary-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمای جدولی فشرده"
            >
              <List className="w-3.5 h-3.5" />
              <span>جدول</span>
            </button>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
        {/* Card View for Desktop/Tablet */}
        {viewMode === 'cards' && (
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4 bg-slate-50/50">
            {filteredReceipts.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500">
                رسیدی منطبق با فیلتر یافت نشد.
              </div>
            ) : (
              filteredReceipts.map((r) => {
                const cardStatus: EnterpriseCardStatus =
                  r.overallResult === 'complete'
                    ? 'success'
                    : r.overallResult === 'partial'
                    ? 'warning'
                    : r.overallResult === 'mismatch'
                    ? 'danger'
                    : 'default';

                return (
                  <EnterpriseCard
                    key={r.id}
                    status={cardStatus}
                    isInteractive
                    onClick={() => setSelectedReceipt(r)}
                    className="h-full"
                  >
                    <EnterpriseCardHeader
                      code={r.internalNumber}
                      badge={getResultBadge(r.overallResult)}
                      icon={<Truck className="w-4 h-4 text-primary-700" />}
                      title={r.supplier.name}
                      subtitle={`${r.warehouse.name} • ${r.dateJalali} (ساعت ${r.timeJalali})`}
                    />
                    <EnterpriseCardBody>
                      {/* Driver and Vehicle Plate Card */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 text-xs truncate">
                            {r.driverData.driverName}
                          </span>
                          <IranianPlate plateString={r.driverData.vehiclePlate} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-caption text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                          <span>بارنامه: {r.driverData.waybillNumber || '---'}</span>
                          <span className="truncate max-w-[120px]">{r.driverData.vehicleType}</span>
                        </div>
                      </div>

                      {/* Digital Weighbridge Mini Formula */}
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 text-caption space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span className="flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-emerald-700" />
                            <span>قبض باسکول:</span>
                          </span>
                          <span className="font-mono text-xs text-emerald-950 font-black">
                            {toPersianDigits(
                              formatNumber(
                                r.driverData.weighbridgeNetKg ||
                                  r.driverData.weighbridgeGrossKg - r.driverData.weighbridgeTareKg
                              )
                            )}{' '}
                            ک‌گ خالص
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-800/80 font-mono">
                          <span>ناخالص: {toPersianDigits(formatNumber(r.driverData.weighbridgeGrossKg))}</span>
                          <span>تار: {toPersianDigits(formatNumber(r.driverData.weighbridgeTareKg))}</span>
                        </div>
                      </div>

                      {/* Items & Purchase Ref */}
                      <div className="grid grid-cols-2 gap-2 text-caption pt-0.5">
                        <EnterpriseKeyValue
                          label="اقلام محموله"
                          value={`${toPersianDigits(r.items.length)} قلم کالا`}
                        />
                        <EnterpriseKeyValue
                          label="عطف خرید"
                          value={r.purchaseRef || '---'}
                        />
                      </div>

                      {/* Integration Notice */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-caption">
                        <span className="text-slate-500">وضعیت مالی:</span>
                        {getFinancialIntegrationBadge(r.financialIntegrationStatus)}
                      </div>
                    </EnterpriseCardBody>

                    <EnterpriseCardFooter>
                      <span className="text-caption text-slate-500 font-mono truncate max-w-[140px]">
                        {r.relatedSupplyRef || 'بدون عطف تأمین'}
                      </span>
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceipt(r);
                        }}
                      >
                        سند رسید انبار
                      </Button>
                    </EnterpriseCardFooter>
                  </EnterpriseCard>
                );
              })
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {viewMode === 'table' && (
          <div className="hidden md:block overflow-x-auto">
            <AdaptiveTable className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">شماره داخلی و تاریخ</th>
                  <th className="p-3">انبار مقصد</th>
                  <th className="p-3">تأمین‌کننده طرف حساب</th>
                  <th className="p-3">راننده / ناوگان و پلاک</th>
                  <th className="p-3">تعداد اقلام</th>
                  <th className="p-3">نتیجه ارزیابی ورود</th>
                  <th className="p-3">وضعیت مسیر تأیید</th>
                  <th className="p-3">وضعیت مالی (غیرمتصل)</th>
                  <th className="p-3">شناسه عطف پارسینا (غیرمتصل)</th>
                  <th className="p-3 text-center">مشاهده فرم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      رسیدی منطبق با فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReceipt(r)}
                      className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-primary-700">{r.internalNumber}</div>
                        <div className="text-caption text-slate-500 mt-0.5">
                          {r.dateJalali} - ساعت {r.timeJalali}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{r.warehouse.name}</div>
                        <div className="font-mono text-caption text-slate-500">{r.warehouse.code}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.supplier.name}</div>
                        <div className="text-caption text-slate-500">{r.purchaseRef}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-800">{r.driverData.driverName}</div>
                        <div className="font-mono text-caption text-slate-500 mb-1">
                          بارنامه: {r.driverData.waybillNumber || 'بدون بارنامه'}
                        </div>
                        <IranianPlate plateString={r.driverData.vehiclePlate} size="sm" />
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800">{toPersianDigits(r.items.length)}</span>
                        <span className="text-slate-500 text-caption"> ردیف کالا</span>
                      </td>

                      <td className="p-3">{getResultBadge(r.overallResult)}</td>

                      <td className="p-3">
                        <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-caption font-bold">
                          پیکربندی نشده
                        </div>
                        <div className="text-caption text-slate-700 font-medium mt-1">
                          در انتظار تعیین ضوابط
                        </div>
                      </td>

                      <td className="p-3">
                        {getFinancialIntegrationBadge(r.financialIntegrationStatus)}
                      </td>

                      <td className="p-3">
                        <div className="text-caption text-slate-500 max-w-[150px] truncate" title="ثبت نشده در پارسینا — متصل نیست">
                          ثبت نشده در پارسینا (متصل نیست)
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceipt(r);
                          }}
                        >
                          سند رسید
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdaptiveTable>
          </div>
        )}

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredReceipts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">رسیدی یافت نشد.</div>
          ) : (
            filteredReceipts.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReceipt(r)}
                className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary-700">{r.internalNumber}</span>
                  <div className="flex items-center gap-2">
                    {getFinancialIntegrationBadge(r.financialIntegrationStatus)}
                    {getResultBadge(r.overallResult)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-caption text-amber-800 bg-amber-50/80 border border-amber-200 px-2 py-1 rounded font-medium">
                  <span className="font-bold">پیکربندی نشده</span>
                  <span>•</span>
                  <span>مسیر گردش: در انتظار تعیین ضوابط</span>
                </div>

                <div className="font-bold text-slate-900 text-xs">{r.supplier.name}</div>
                <div className="text-caption text-slate-600">{r.warehouse.name}</div>

                <div className="space-y-2 text-caption bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500 block">راننده:</span>
                      <span className="font-bold text-slate-800">{r.driverData.driverName}</span>
                    </div>
                    <IranianPlate plateString={r.driverData.vehiclePlate} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                    <span>بارنامه: {r.driverData.waybillNumber || '---'}</span>
                    <span className="font-bold text-emerald-800">
                      خالص: {toPersianDigits(formatNumber(r.driverData.weighbridgeNetKg || (r.driverData.weighbridgeGrossKg - r.driverData.weighbridgeTareKg)))} ک‌گ
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-caption text-slate-500 pt-1">
                  <span>تعداد: {toPersianDigits(r.items.length)} قلم کالا</span>
                  <span className="text-primary-700 font-bold flex items-center gap-1">
                    مشاهده سند رسید انبار
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Warehouse Receipt Official Document Modal / Drawer */}
      {selectedReceipt && (
        <Drawer
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title={`برگه رسید انبار: ${selectedReceipt.internalNumber}`}
          subtitle={`سند تحویل کالا به انبار - تاریخ: ${selectedReceipt.dateJalali}`}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  چاپ نسخه رسمی
                </Button>

                {/* Primary/Fallback/Delegated Creator Badge Info */}
                {selectedReceipt.creatorExperience.isDelegated && (
                  <span className="text-caption bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded">
                    تفویض شده از جانب {selectedReceipt.creatorExperience.delegatorName}
                  </span>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
                بستن
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Official Document Form Container */}
            <div className="border-2 border-slate-300 rounded-xl p-4 bg-white space-y-4 shadow-none">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-200 pb-3 gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    شرکت مهندسی و بازرگانی جوادیان (سهامی خاص)
                  </h2>
                  <span className="text-xs font-bold text-slate-700">فرم رسید کالا به انبار</span>
                </div>

                <div className="text-left sm:text-right font-mono text-caption space-y-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500">شماره رسید: </span>
                    <span className="font-bold text-slate-900">{selectedReceipt.internalNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">تاریخ ثبت: </span>
                    <span>{selectedReceipt.dateJalali} - ساعت {selectedReceipt.timeJalali}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">وضعیت سند: </span>
                    <span className="font-bold text-amber-800">پیش‌نویس رسید انبار</span>
                  </div>
                </div>
              </div>

              {/* Header Details Grid: Warehouse, Supplier, Purchase Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200 text-caption">
                <div>
                  <span className="text-slate-500 block text-caption">انبار تحویل‌گیرنده:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.warehouse.name}</span>
                  <span className="text-slate-500 font-mono block text-caption">کد: {selectedReceipt.warehouse.code}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-caption">تأمین‌کننده / فروشنده:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.supplier.name}</span>
                  <span className="text-slate-500 block text-caption">{selectedReceipt.supplier.contactPerson}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-caption">شماره عطف سفارش خرید / فاکتور:</span>
                  <span className="font-mono font-bold text-primary-900">{selectedReceipt.purchaseRef}</span>
                  {selectedReceipt.relatedSupplyRef && (
                    <span className="text-slate-500 font-mono block text-caption">عطف تأمین: {selectedReceipt.relatedSupplyRef}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-caption">شرایط خرید و قرارداد:</span>
                  <span className="text-slate-800 font-medium line-clamp-2">
                    {selectedReceipt.purchaseConditions || 'تحویل درب انبار، پرداخت طبق قرارداد'}
                  </span>
                </div>
              </div>

              {/* Driver, Vehicle, Weighbridge, Unloading Data */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-2 text-caption">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block text-xs">اطلاعات حمل، راننده و ناوگان ترابری</span>
                  {selectedReceipt.driverData.deliveryType && (
                    <span className="text-caption font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded">
                      نوع تحویل: {selectedReceipt.driverData.deliveryType}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-caption">نام راننده:</span>
                    <span className="font-semibold text-slate-900">{selectedReceipt.driverData.driverName}</span>
                    <span className="text-slate-500 font-mono block text-caption">{selectedReceipt.driverData.phone}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-caption mb-1">پلاک و نوع خودرو:</span>
                    <IranianPlate plateString={selectedReceipt.driverData.vehiclePlate} size="sm" />
                    <span className="text-slate-500 block text-caption mt-1">{selectedReceipt.driverData.vehicleType}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-caption">شماره بارنامه دولتی:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedReceipt.driverData.waybillNumber}</span>
                    <div className="text-slate-500 block text-caption mt-0.5">
                      <span>کرایه: </span>
                      <CurrencyAmount amountRials={selectedReceipt.driverData.freightAmountRials} layout="inline" />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-caption">محل و مقصد تخلیه:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReceipt.driverData.unloadingDestination || selectedReceipt.driverData.deliveryLocation}
                    </span>
                    <span className="text-slate-500 block text-caption">سرشیفت: {selectedReceipt.driverData.unloadingSupervisor}</span>
                  </div>
                </div>

                {/* Weighbridge If Present */}
                {selectedReceipt.driverData.weighbridgeGrossKg && (
                  <div className="mt-2 p-2 bg-white rounded border border-slate-200 flex items-center justify-between text-caption">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Scale className="w-4 h-4 text-primary-700" />
                      قبض توزین باسکول انبار:
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span>وزن ناخالص: {toPersianDigits(selectedReceipt.driverData.weighbridgeGrossKg)} کیلوگرم</span>
                      <span>وزن تار (خالی): {toPersianDigits(selectedReceipt.driverData.weighbridgeTareKg || 0)} کیلوگرم</span>
                      <span className="font-bold text-primary-700">
                        وزن خالص بار: {toPersianDigits(selectedReceipt.driverData.weighbridgeNetKg || 0)} کیلوگرم
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table based on real Persian form */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 font-bold text-slate-800 flex justify-between">
                  <span>جدول اقلام تحویلی به انبار</span>
                  <span>ارزیابی کلی: {getResultBadge(selectedReceipt.overallResult)}</span>
                </div>

                <div className="overflow-x-auto">
                  <AdaptiveTable className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">شرح کالا و مشخصات فنی</th>
                        <th className="p-3">کارتن / حلب</th>
                        <th className="p-3">تعداد / پاره‌سنگ</th>
                        <th className="p-3">واحد</th>
                        <th className="p-3">مقدار بارنامه</th>
                        <th className="p-3">مقدار وارده</th>
                        <th className="p-3">قیمت واحد خرید (ریال)</th>
                        <th className="p-3">مبلغ کل (ریال)</th>
                        <th className="p-3">نتیجه آزمون</th>
                        <th className="p-3">ملاحظات و مغایرت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReceipt.items.map((item, index) => (
                        <tr key={item.id} className={item.itemResult !== 'complete' ? 'bg-amber-50/30' : ''}>
                          <td className="p-3 text-slate-500 font-mono">{toPersianDigits(index + 1)}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="font-mono text-caption text-slate-500">{item.productCode}</div>
                          </td>
                          <td className="p-3 font-mono">{item.cartons ? toPersianDigits(item.cartons) : '-'}</td>
                          <td className="p-3 font-mono">{item.pieces ? toPersianDigits(item.pieces) : '-'}</td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3 font-mono font-semibold text-slate-700">
                            {toPersianDigits(item.expectedQuantity)}
                          </td>
                          <td className="p-3 font-mono font-bold text-primary-900">
                            {toPersianDigits(item.actualQuantity)}
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {item.purchasePriceRials ? formatRials(item.purchasePriceRials) : '-'}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {item.totalPriceRials
                              ? formatRials(item.totalPriceRials)
                              : item.purchasePriceRials
                              ? formatRials(item.actualQuantity * item.purchasePriceRials)
                              : '-'}
                          </td>
                          <td className="p-3">{getItemResultBadge(item.itemResult)}</td>
                          <td className="p-3 text-slate-600 text-caption leading-tight">{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </AdaptiveTable>
                </div>
              </div>

              {/* Source-Form Signature Roles as Evidence Fields */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 block text-xs">
                    نقش‌های پیشنهادی — ترتیب و الزام نهایی نشده است
                  </span>
                  <StatusBadge status="NOT_CONFIGURED" />
                </div>
                <div className="text-caption text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ترتیب امضاها و مسیر تأیید رسید انبار در انتظار تأیید کارفرما است.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* 1. Driver / Deliverer */}
                  <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 text-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-caption">۱. راننده / تحویل‌دهنده کالا (نقش پیشنهادی)</span>
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5 text-caption">
                      <span className="font-bold block text-slate-900">
                        {selectedReceipt.driverData?.driverName || 'مشخصات راننده ثبت‌نشده'}
                      </span>
                      <span className="text-slate-500 block">
                        بارنامه: {selectedReceipt.driverData?.waybillNumber || '---'}
                      </span>
                      <span className="font-mono text-slate-600 block text-caption">
                        پلاک: {selectedReceipt.driverData?.vehiclePlate || '---'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Warehouseman / Receiver */}
                  <div
                    onClick={() => handleParticipantSign('warehouseKeeper')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReceipt.participants.warehouseKeeper?.status === 'signed'
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-caption">۲. انباردار / تحویل‌گیرنده انبار (نقش پیشنهادی)</span>
                      {selectedReceipt.participants.warehouseKeeper?.status === 'signed' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-caption text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 rounded font-bold">
                            ثبت شده
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <span className="text-caption font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          پیکربندی نشده
                        </span>
                      )}
                    </div>
                    {selectedReceipt.participants.warehouseKeeper?.status === 'signed' ? (
                      <div className="space-y-0.5 text-caption">
                        <span className="font-bold block">
                          {selectedReceipt.participants.warehouseKeeper.person?.name}
                        </span>
                        <span className="text-emerald-700">
                          {selectedReceipt.participants.warehouseKeeper.signedAtJalali}
                        </span>
                        <p className="text-caption text-slate-500 line-clamp-2 mt-1">
                          {selectedReceipt.participants.warehouseKeeper.notes}
                        </p>
                      </div>
                    ) : (
                      <span className="text-caption text-slate-500">ترتیب و نقش امضا در انتظار تعیین ضوابط</span>
                    )}
                  </div>

                  {/* 3. Approver */}
                  <div
                    onClick={() => handleParticipantSign('warehouseManager')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReceipt.participants.warehouseManager?.status === 'signed'
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-caption">۳. مقام تأییدکننده (نقش پیشنهادی)</span>
                      {selectedReceipt.participants.warehouseManager?.status === 'signed' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-caption text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 rounded font-bold">
                            ثبت شده
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <span className="text-caption font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          پیکربندی نشده
                        </span>
                      )}
                    </div>
                    {selectedReceipt.participants.warehouseManager?.status === 'signed' ? (
                      <div className="space-y-0.5 text-caption">
                        <span className="font-bold block">
                          {selectedReceipt.participants.warehouseManager.person?.name}
                        </span>
                        <span className="text-emerald-700">
                          {selectedReceipt.participants.warehouseManager.signedAtJalali}
                        </span>
                      </div>
                    ) : (
                      <span className="text-caption text-slate-500">تأیید انطباق فنی و تحویل</span>
                    )}
                  </div>

                  {/* 4. CEO / Final Authority */}
                  <div
                    onClick={() => handleParticipantSign('finalApprover')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReceipt.participants.finalApprover?.status === 'signed'
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-caption">۴. مرجع نهایی تصویب (نقش پیشنهادی)</span>
                      {selectedReceipt.participants.finalApprover?.status === 'signed' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-caption text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 rounded font-bold">
                            ثبت شده
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <span className="text-caption font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          پیکربندی نشده
                        </span>
                      )}
                    </div>
                    {selectedReceipt.participants.finalApprover?.status === 'signed' ? (
                      <div className="space-y-0.5 text-caption">
                        <span className="font-bold block">
                          {selectedReceipt.participants.finalApprover.person?.name}
                        </span>
                        <span className="text-emerald-700">
                          {selectedReceipt.participants.finalApprover.signedAtJalali}
                        </span>
                      </div>
                    ) : (
                      <span className="text-caption text-slate-500">تصویب نهایی رسید کالا</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Operational Workflow Approvers (Separate Box) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block text-xs">
                  مراحل گردش کار و ارزیابی عملیاتی — نقش‌های پیشنهادی:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Quality Reviewer (QC) */}
                  <div
                    onClick={() => handleParticipantSign('qualityReviewer')}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReceipt.participants.qualityReviewer?.status === 'signed'
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-caption">کنترل کیفیت و ارزیابی آزمایشگاهی (نقش پیشنهادی)</span>
                      {selectedReceipt.participants.qualityReviewer?.status === 'signed' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-caption text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 rounded font-bold">
                            ثبت شده
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <span className="text-caption font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          پیکربندی نشده
                        </span>
                      )}
                    </div>
                    {selectedReceipt.participants.qualityReviewer?.status === 'signed' ? (
                      <div className="space-y-0.5 text-caption">
                        <span className="font-bold block">
                          {selectedReceipt.participants.qualityReviewer.person?.name}
                        </span>
                        <span className="text-emerald-700">
                          {selectedReceipt.participants.qualityReviewer.signedAtJalali}
                        </span>
                        <p className="text-caption text-slate-500 line-clamp-2 mt-1">
                          {selectedReceipt.participants.qualityReviewer.notes}
                        </p>
                      </div>
                    ) : (
                      <span className="text-caption text-slate-500">در انتظار آزمایش نمونه و تطبیق استاندارد خوراکی</span>
                    )}
                  </div>

                  {/* Financial Integration Status Note */}
                  <div className="p-3 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-caption">ارسال به سیستم حسابداری و دفترداری (غیرفعال)</span>
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <p className="text-caption text-slate-600 leading-relaxed">
                      این بخش نمایشی است و هنوز به بانک یا پارسینا متصل نیست (ثبت نشده در سیستم مالی).
                    </p>
                  </div>
                </div>
              </div>

              {/* Attachments Section in Drawer */}
              {selectedReceipt.attachments && selectedReceipt.attachments.length > 0 && (
                <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primary-700" />
                      اسناد و مدارک پیوست رسید انبار ({toPersianDigits(selectedReceipt.attachments.length)} سند)
                    </span>
                    <span className="text-caption text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
                      ذخیره موقت نمایشی
                    </span>
                  </div>
                  <div className="text-caption text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ذخیره موقت نمایشی — اتصال به سرور انجام نشده است.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedReceipt.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-4 h-4 text-slate-600 shrink-0" />
                          <span className="text-slate-800 font-medium truncate text-caption" title={att.title}>
                            {att.title}
                          </span>
                        </div>
                        <span className="text-caption text-slate-500 font-mono shrink-0">پیوست موقت</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Linked Records Navigation */}
            {(selectedReceipt.linkedSupplyRequestId || selectedReceipt.linkedLogisticsId) && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">پرونده‌های متصل عملیاتی:</span>
                <div className="flex items-center gap-2">
                  {selectedReceipt.linkedSupplyRequestId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        onNavigateToRoute('supply_requests', selectedReceipt.linkedSupplyRequestId)
                      }
                      className="flex items-center gap-1"
                    >
                      مشاهده درخواست تأمین
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  {selectedReceipt.linkedLogisticsId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        onNavigateToRoute('logistics', selectedReceipt.linkedLogisticsId)
                      }
                      className="flex items-center gap-1"
                    >
                      مشاهده بارنامه حمل
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* New Receipt 4-Step Wizard Modal */}
      {isNewModalOpen && (
        <ModalDialog
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="صدور سند رسید انبار"
          maxWidth="xl"
          footer={
            <div className="w-full flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (createStep > 1) {
                    setCreateStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                  } else {
                    setIsNewModalOpen(false);
                  }
                }}
              >
                {createStep > 1 ? (
                  <span className="flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                    مرحله قبل
                  </span>
                ) : (
                  'انصراف'
                )}
              </Button>

              <div className="flex items-center gap-2">
                {createStep < 4 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                    className="flex items-center gap-2"
                  >
                    مرحله بعد
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateReceipt}
                    className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ثبت رسید انبار
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {isFallbackScenario && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">حالت جانشینی فعال (غیاب مسئول اصلی):</span>
                  <p className="text-caption text-amber-900 leading-relaxed">
                    آرش همچنان مسئول اصلی حوزه لجستیک باقی می‌ماند و این فرم با هویت واقعی اقدام‌کننده ({receiptActionCheck.actorAuditName}) ثبت و ممیزی خواهد شد.
                  </p>
                </div>
              </div>
            )}

            {/* Step Wizard Progress Header */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-3">
              {[
                { step: 1, title: '۱. مرجع و طرف حساب', icon: Building2 },
                { step: 2, title: '۲. حمل، راننده و باسکول', icon: Truck },
                { step: 3, title: '۳. اقلام و بسته‌بندی', icon: Package },
                { step: 4, title: '۴. نتیجه بازرسی و تأیید', icon: ClipboardList },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = createStep === s.step;
                const isPassed = createStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCreateStep(s.step as 1 | 2 | 3 | 4)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg text-center transition-all ${
                      isActive
                        ? 'bg-primary-50 border border-primary-200 text-primary-900 font-bold'
                        : isPassed
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: Reference & Account */}
            {createStep === 1 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      انبار مقصد تحویل‌گیرنده <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newWarehouseId}
                      onChange={(e) => setNewWarehouseId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {MOCK_WAREHOUSES.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      تأمین‌کننده / فروشنده طرف حساب <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newSupplierId}
                      onChange={(e) => setNewSupplierId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {MOCK_SUPPLIERS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code}) - {s.categories?.join('، ') || 'روغن‌های خوراکی'}
                        </option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      شماره عطف سفارش خرید / فاکتور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPurchaseRef}
                      onChange={(e) => setNewPurchaseRef(e.target.value)}
                      placeholder="مثال: PO-1403-889"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      شماره عطف درخواست تأمین مرتبط
                    </label>
                    <input
                      type="text"
                      value={newRelatedSupplyRef}
                      onChange={(e) => setNewRelatedSupplyRef(e.target.value)}
                      placeholder="مثال: SUP-1403-081"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">
                    شرایط خرید و قرارداد تحویل
                  </label>
                  <input
                    type="text"
                    value={newPurchaseConditions}
                    onChange={(e) => setNewPurchaseConditions(e.target.value)}
                    placeholder="شرایط تخلیه، تحویل، بازرسی و..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FieldGroup>

                {/* Financial Integration Status Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">وضعیت در سیستم مالی: ثبت نشده در سیستم مالی</span>
                    <p className="text-caption text-amber-800 mt-0.5">
                      اتصال به نرم‌افزار مالی پس از آماده‌شدن نسخه وب و API فعال خواهد شد. سند به عنوان پیش‌نویس موقت رسید انبار با شناسه داخلی صادر می‌گردد.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Transport, Delivery & Weighbridge */}
            {createStep === 2 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      نام راننده <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="نام راننده حامل"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">شماره تماس راننده</label>
                    <input
                      type="text"
                      value={newDriverPhone}
                      onChange={(e) => setNewDriverPhone(e.target.value)}
                      placeholder="۰۹۱۲..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">
                        شماره پلاک خودرو <span className="text-red-500">*</span>
                      </label>
                      <IranianPlate plateString={newVehiclePlate} size="sm" />
                    </div>
                    <input
                      type="text"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      placeholder="۲۲ ع ۸۵۰ ایران ۱۱"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">نوع خودروی حامل</label>
                    <input
                      type="text"
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value)}
                      placeholder="خاور مسقف، تریلی کفی، نیسان و..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      شماره بارنامه رسمی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newWaybillNo}
                      onChange={(e) => setNewWaybillNo(e.target.value)}
                      placeholder="BL-984210"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">کرایه حمل توافقی (ریال)</label>
                    <input
                      type="number"
                      value={newFreightAmount}
                      onChange={(e) => setNewFreightAmount(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">نوع تحویل و بارگیری</label>
                    <input
                      type="text"
                      value={newDeliveryType}
                      onChange={(e) => setNewDeliveryType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">سکوی تخلیه ورودی</label>
                    <input
                      type="text"
                      value={newDeliveryLocation}
                      onChange={(e) => setNewDeliveryLocation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">سالن مقصد انبارش</label>
                    <input
                      type="text"
                      value={newUnloadingDestination}
                      onChange={(e) => setNewUnloadingDestination(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">سرپرست ناظر بر تخلیه انبار</label>
                  <input
                    type="text"
                    value={newUnloadingSupervisor}
                    onChange={(e) => setNewUnloadingSupervisor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </FieldGroup>

                {/* Digital Weighbridge Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-primary-700" />
                      اطلاعات توزین باسکول دیجیتال
                    </span>
                    <span className="text-caption font-bold text-primary-800 bg-primary-100 px-2 py-0.5 rounded font-mono">
                      وزن خالص محموله:{' '}
                      {formatNumber(
                        Math.max(0, newWeighbridgeGrossKg - newWeighbridgeTareKg)
                      )}{' '}
                      کیلوگرم
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FieldGroup>
                      <label className="text-caption text-slate-600 block mb-1">
                        وزن ناخالص خودرو و بار (Gross Kg)
                      </label>
                      <input
                        type="number"
                        value={newWeighbridgeGrossKg}
                        onChange={(e) => setNewWeighbridgeGrossKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <label className="text-caption text-slate-600 block mb-1">
                        وزن تار / خودروی خالی (Tare Kg)
                      </label>
                      <input
                        type="number"
                        value={newWeighbridgeTareKg}
                        onChange={(e) => setNewWeighbridgeTareKg(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </FieldGroup>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Items & Packaging */}
            {createStep === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-700" />
                    اقلام تحویلی محموله، تعداد کارتن و ضریب تبدیل
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      const firstProd = MOCK_PRODUCTS[0];
                      setNewItems([
                        ...newItems,
                        {
                          productId: firstProd?.id || '',
                          cartons: 50,
                          pieces: 600,
                          unit: firstProd?.baseUnit || 'بطری',
                          expectedQty: 600,
                          actualQty: 600,
                          priceRials: 415000,
                          result: 'complete' as WarehouseReceiptItemResult,
                          notes: 'تحویل منطبق با پته بار',
                        },
                      ]);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن قلم جدید
                  </Button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {newItems.map((item, idx) => {
                    const selProd = MOCK_PRODUCTS.find((p) => p.id === item.productId);
                    const piecesPerCarton = selProd?.cartonConversion?.piecesPerCarton || 12;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                          <span className="font-bold text-slate-700">
                            ردیف {toPersianDigits(idx + 1)}: {selProd?.name || 'کالای انتخابی'}
                          </span>
                          {newItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewItems(newItems.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="حذف ردیف"
                             aria-label="حذف ردیف">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <FieldGroup className="sm:col-span-2">
                            <label className="text-caption text-slate-500 block mb-0.5">
                              انتخاب محصول خوراکی
                            </label>
                            <select
                              value={item.productId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                const p = MOCK_PRODUCTS.find((pr) => pr.id === pId);
                                const ratio = p?.cartonConversion?.piecesPerCarton || 12;
                                const updated = [...newItems];
                                updated[idx].productId = pId;
                                updated[idx].unit = p?.baseUnit || 'بطری';
                                updated[idx].pieces = updated[idx].cartons * ratio;
                                updated[idx].expectedQty = updated[idx].pieces;
                                updated[idx].actualQty = updated[idx].pieces;
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                            >
                              {MOCK_PRODUCTS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.code}) - {p.category}
                                </option>
                              ))}
                            </select>
                          </FieldGroup>

                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              تعداد کارتن / بسته
                            </label>
                            <input
                              type="number"
                              value={item.cartons}
                              onChange={(e) => {
                                const c = Number(e.target.value);
                                const updated = [...newItems];
                                updated[idx].cartons = c;
                                updated[idx].pieces = c * piecesPerCarton;
                                updated[idx].expectedQty = c * piecesPerCarton;
                                updated[idx].actualQty = c * piecesPerCarton;
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </FieldGroup>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption">
                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              تعداد کل ({item.unit})
                            </label>
                            <input
                              type="number"
                              value={item.pieces}
                              onChange={(e) => {
                                const pcs = Number(e.target.value);
                                const updated = [...newItems];
                                updated[idx].pieces = pcs;
                                updated[idx].actualQty = pcs;
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </FieldGroup>

                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              مقدار انتظاری بارنامه
                            </label>
                            <input
                              type="number"
                              value={item.expectedQty}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].expectedQty = Number(e.target.value);
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </FieldGroup>

                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              مقدار واقعی تخلیه‌شده
                            </label>
                            <input
                              type="number"
                              value={item.actualQty}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].actualQty = Number(e.target.value);
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </FieldGroup>

                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              نرخ خرید واحد (ریال)
                            </label>
                            <input
                              type="number"
                              value={item.priceRials}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].priceRials = Number(e.target.value);
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </FieldGroup>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              وضعیت انطباق ردیف
                            </label>
                            <select
                              value={item.result}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].result = e.target.value as WarehouseReceiptItemResult;
                                setNewItems(updated);
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                            >
                              <option value="complete">کامل و بدون مغایرت</option>
                              <option value="partial">کسری پارت تحویلی</option>
                              <option value="mismatch">مغایرت نوع کالا یا مشخصات</option>
                              <option value="damaged">آسیب‌دیدگی / ضایعات کارتن</option>
                            </select>
                          </FieldGroup>

                          <FieldGroup>
                            <label className="text-caption text-slate-500 block mb-0.5">
                              ملاحظات و یادداشت قلم
                            </label>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].notes = e.target.value;
                                setNewItems(updated);
                              }}
                              placeholder="توضیح انباردار در صورت هرگونه مغایرت"
                              className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                            />
                          </FieldGroup>
                        </div>

                        <div className="text-caption text-slate-500 flex justify-between pt-1">
                          <span>
                            ضریب بسته‌بندی: هر کارتن معادل {toPersianDigits(piecesPerCarton)} {item.unit}
                          </span>
                          <span className="font-bold text-slate-700">
                            ارزش ریالی ردیف: {formatRials(item.actualQty * item.priceRials)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Result, Approvals & Evidence */}
            {createStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      نتیجه کلی ارزیابی و بازرسی رسید انبار <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newOverallResult}
                      onChange={(e) =>
                        setNewOverallResult(e.target.value as WarehouseReceiptOverallResult)
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="complete">کامل و منطبق با سفارش (Complete)</option>
                      <option value="partial">دارای کسری مقدار (Partial)</option>
                      <option value="mismatch">دارای مغایرت مشخصات (Mismatch)</option>
                      <option value="damaged">دارای ضایعات و آسیب‌دیدگی (Damaged)</option>
                    </select>
                  </FieldGroup>

                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">
                      گزارش اولیه بازرسی و توضیحات تحویل فیزیکی
                    </label>
                    <textarea
                      rows={2}
                      value={newInspectionNotes}
                      onChange={(e) => setNewInspectionNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      placeholder="نتیجه آزمون کنترل کیفی، وضعیت شرینک، پالت‌بندی و تاریخ‌های تولید/انقضا..."
                    />
                  </FieldGroup>
                </div>

                {/* Required Approval Roles */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-4 h-4 text-primary-700" />
                      نقش‌های پیشنهادی — ترتیب و الزام نهایی نشده است
                    </span>
                    <StatusBadge status="NOT_CONFIGURED" />
                  </div>
                  <div className="text-caption text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ترتیب امضاها و مسیر تأیید رسید انبار در انتظار تأیید کارفرما است.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Role 1: ثبت‌کننده */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-primary-700" />
                          ۱. ثبت‌کننده سند (نقش پیشنهادی)
                        </span>
                        <span className="text-caption text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          پیشنهادی
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium text-caption">
                        {activePersona.name} ({activePersona.jobTitle})
                      </div>
                      <div className="text-caption text-slate-500">
                        مسئولیت: ثبت اوزان باسکول، بارنامه جاده‌ای و تطبیق اولیه ورود بار
                      </div>
                    </div>

                    {/* Role 2: انباردار */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-600" />
                          ۲. انباردار (نقش پیشنهادی)
                        </span>
                        <span className="text-caption text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          پیشنهادی
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium text-caption">
                        علیرضا نجفی (سرپرست چیدمان و نگهداری انبار مرکزی)
                      </div>
                      <div className="text-caption text-slate-500">
                        مسئولیت: نظارت بر تخلیه پالت‌ها، تفکیک بچ و ثبت جانمایی انبار
                      </div>
                    </div>

                    {/* Role 3: کنترل کیفیت */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ۳. کنترل کیفیت (نقش پیشنهادی)
                        </span>
                        <span className="text-caption text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          پیشنهادی
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium text-caption">
                        مهندس سارا کریمی (کارشناس کنترل کیفی آزمایشگاه)
                      </div>
                      <div className="text-caption text-slate-500">
                        مسئولیت: تطبیق آنالیز کیفی روغن، اسیدیته، پروانه بهداشت و تاریخ انقضا
                      </div>
                    </div>

                    {/* Role 4: مسئول تأمین */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
                          ۴. مسئول تأمین (نقش پیشنهادی)
                        </span>
                        <span className="text-caption text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          پیشنهادی
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium text-caption">
                        مریم کاظمی (کارشناس ارشد تأمین کالا و نهاده)
                      </div>
                      <div className="text-caption text-slate-500">
                        مسئولیت: تطبیق مقادیر با پیش‌فاکتور خرید، حواله تجاری و نرخ‌های مصوب
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence & Attachments Controls (Four Required Attachments) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-extrabold text-slate-800 flex items-center gap-2 text-xs">
                        <Paperclip className="w-4 h-4 text-primary-700" />
                        مدارک و ضمائم پیوست رسید انبار
                      </span>
                    </div>
                    <span className="text-caption text-primary-700 font-bold bg-primary-50 border border-primary-200 px-3 py-0.5 rounded-full self-start sm:self-auto">
                      {toPersianDigits(
                        [waybillAttachment, weighbridgeAttachment, cargoPhotoAttachment, invoiceAttachment].filter(Boolean).length
                      )}{' '}
                      از ۴ مدرک پیوست شده
                    </span>
                  </div>

                  {/* Missing Validation Error Banner */}
                  {attachmentValidationError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">نقص مدارک الزامی رسید انبار:</span>
                        <span>{attachmentValidationError}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Attachment 1: بارنامه رسمی */}
                    <ReceiptAttachmentCard
                      id="waybill"
                      title="بارنامه رسمی جاده‌ای"
                      icon={Truck}
                      description={`نسخه ممهور شرکت حمل (شماره بارنامه: ${newWaybillNo || 'ثبت نشده'})`}
                      acceptedTypesDescription="فرمت‌های مجاز: PDF، JPG، PNG (حداکثر ۱۵ مگابایت)"
                      accept="application/pdf,image/*"
                      attachment={waybillAttachment}
                      isInvalid={Boolean(attachmentValidationError && !waybillAttachment)}
                      onFileSelected={(file) => handleProcessFile('waybill', file)}
                      onSampleLoaded={() => handleLoadSampleFile('waybill')}
                      onRemove={() => setWaybillAttachment(null)}
                      onPreview={() =>
                        waybillAttachment &&
                        setPreviewAttachmentModal({
                          title: 'بارنامه رسمی جاده‌ای',
                          attachment: waybillAttachment,
                        })
                      }
                    />

                    {/* Attachment 2: قبض باسکول */}
                    <ReceiptAttachmentCard
                      id="weighbridge"
                      title="قبض باسکول دیجیتال"
                      icon={Scale}
                      description={`توزین دیجیتال ۶۰ تنی (وزن خالص: ${formatNumber(Math.max(0, newWeighbridgeGrossKg - newWeighbridgeTareKg))} کیلوگرم)`}
                      acceptedTypesDescription="فرمت‌های مجاز: PDF، JPG، PNG (حداکثر ۱۰ مگابایت)"
                      accept="application/pdf,image/*"
                      attachment={weighbridgeAttachment}
                      isInvalid={Boolean(attachmentValidationError && !weighbridgeAttachment)}
                      onFileSelected={(file) => handleProcessFile('weighbridge', file)}
                      onSampleLoaded={() => handleLoadSampleFile('weighbridge')}
                      onRemove={() => setWeighbridgeAttachment(null)}
                      onPreview={() =>
                        weighbridgeAttachment &&
                        setPreviewAttachmentModal({
                          title: 'قبض باسکول دیجیتال',
                          attachment: weighbridgeAttachment,
                        })
                      }
                    />

                    {/* Attachment 3: تصویر محموله */}
                    <ReceiptAttachmentCard
                      id="cargo"
                      title="تصویر محموله و پالت‌ها"
                      icon={Camera}
                      description="عکسبرداری حین تخلیه در انبار جهت مستندسازی سلامت و شرینک"
                      acceptedTypesDescription="فرمت‌های مجاز: تصاویر JPG، PNG، WEBP (حداکثر ۲۰ مگابایت)"
                      accept="image/*"
                      attachment={cargoPhotoAttachment}
                      isInvalid={Boolean(attachmentValidationError && !cargoPhotoAttachment)}
                      onFileSelected={(file) => handleProcessFile('cargo', file)}
                      onSampleLoaded={() => handleLoadSampleFile('cargo')}
                      onRemove={() => setCargoPhotoAttachment(null)}
                      onPreview={() =>
                        cargoPhotoAttachment &&
                        setPreviewAttachmentModal({
                          title: 'تصویر محموله و پالت‌ها',
                          attachment: cargoPhotoAttachment,
                        })
                      }
                    />

                    {/* Attachment 4: فاکتور یا حواله تأمین‌کننده */}
                    <ReceiptAttachmentCard
                      id="invoice"
                      title="فاکتور یا حواله تأمین‌کننده"
                      icon={FileSpreadsheet}
                      description={`صورتحساب رسمی یا حواله خروج کارخانه (${newPurchaseRef || 'حواله رسمی خرید'})`}
                      acceptedTypesDescription="فرمت‌های مجاز: نسخه ممهور PDF یا تصویر صورتحساب مالی (حداکثر ۱۵ مگابایت)"
                      accept="application/pdf,image/*"
                      attachment={invoiceAttachment}
                      isInvalid={Boolean(attachmentValidationError && !invoiceAttachment)}
                      onFileSelected={(file) => handleProcessFile('invoice', file)}
                      onSampleLoaded={() => handleLoadSampleFile('invoice')}
                      onRemove={() => setInvoiceAttachment(null)}
                      onPreview={() =>
                        invoiceAttachment &&
                        setPreviewAttachmentModal({
                          title: 'فاکتور یا حواله تأمین‌کننده',
                          attachment: invoiceAttachment,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Review Summary Box */}
                <div className="p-3 bg-primary-50/70 border border-primary-200 rounded-xl space-y-1.5 text-xs text-primary-950">
                  <span className="font-bold text-primary-900 block border-b border-primary-200/60 pb-1">
                    خلاصه نهایی سند قبل از ثبت:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption pt-1">
                    <div>
                      <span className="text-slate-500 block">انبار مقصد:</span>
                      <span className="font-bold">
                        {MOCK_WAREHOUSES.find((w) => w.id === newWarehouseId)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">تأمین‌کننده:</span>
                      <span className="font-bold">
                        {MOCK_SUPPLIERS.find((s) => s.id === newSupplierId)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">تعداد اقلام:</span>
                      <span className="font-bold">
                        {toPersianDigits(newItems.length)} ردیف کالای خوراکی
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ارزش کل محموله:</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {formatRials(
                          newItems.reduce(
                            (acc, curr) => acc + curr.actualQty * curr.priceRials,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalDialog>
      )}

      {/* Preview Attachment Modal */}
      {previewAttachmentModal && (
        <ModalDialog
          isOpen={Boolean(previewAttachmentModal)}
          onClose={() => setPreviewAttachmentModal(null)}
          title={`پیش‌نمایش مدرک پیوست: ${previewAttachmentModal.title}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-caption text-amber-800 bg-amber-50 px-3 py-1 rounded border border-amber-200 font-medium">
                ذخیره موقت نمایشی — اتصال به سرور انجام نشده
              </span>
              <Button variant="outline" size="sm" onClick={() => setPreviewAttachmentModal(null)}>
                بستن پیش‌نمایش
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-caption">نام فایل سند:</span>
                <span className="font-mono font-bold text-slate-900 dir-ltr text-right inline-block">
                  {previewAttachmentModal.attachment.name}
                </span>
              </div>
              <div className="text-left font-mono text-caption text-slate-600">
                <div>حجم: {previewAttachmentModal.attachment.sizeFormatted}</div>
                <div className="text-slate-500">{previewAttachmentModal.attachment.typeLabel}</div>
              </div>
            </div>

            {previewAttachmentModal.attachment.previewUrl ? (
              <div className="border border-slate-200 rounded-xl p-2 bg-slate-900/5 flex items-center justify-center max-h-96 overflow-hidden">
                <img
                  src={previewAttachmentModal.attachment.previewUrl}
                  alt={previewAttachmentModal.title}
                  className="max-h-80 max-w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 text-center space-y-3">
                <FileText className="w-14 h-14 text-primary-700 mx-auto" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {previewAttachmentModal.attachment.name}
                  </div>
                  <div className="text-caption text-slate-500 mt-1">
                    {previewAttachmentModal.attachment.typeLabel} • {previewAttachmentModal.attachment.sizeFormatted}
                  </div>
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  پیش‌نمایش محتوای مدرک در مرورگر بارگذاری شد.
                </p>
              </div>
            )}
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
