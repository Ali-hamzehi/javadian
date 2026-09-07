import { QuoteComparison } from '../components/design-system/QuoteComparison';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardBody } from '../components/design-system/EnterpriseCard';
import { MetricStrip, ViewSwitcher, AmountInWords } from '../components/design-system/WorkspaceTools';
import { EmptyState } from '../components/design-system/SystemStates';
import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, FileText, CreditCard, ShoppingBag, Clock, CheckCircle2, AlertCircle, ExternalLink, ChevronRight, Filter, Layers, Building2, CheckSquare, Package, AlertTriangle, PackageCheck, XCircle, Info, Trash2, WifiOff } from 'lucide-react';
import {
  SupplyRequestRecord,
  SupplyRequestStatus,
  SupplyPriority,
  SupplyTriggerType,
  SupplyResult,
  SupplyNeedSource,
  MockPersona,
  ProductRecord,
  SalesOrderDetails,
  InventorySnapshotEvidence,
} from '../types';
import { mockSupplyReceiptStore } from '../runtime/workflow';
import {
  MOCK_PRODUCTS,
  MOCK_SUPPLIERS,
  MOCK_WAREHOUSES,
  MOCK_INVENTORY_SNAPSHOTS,
} from '../data/mockMasterData';
import { MOCK_SALES_ORDERS } from '../data/mockSalesData';
import { MOCK_RESPONSIBILITY_AREAS } from '../data/mockOrgData';
import { mockOrgStore } from '../data/mockOrgStore';
import { Button } from '../components/design-system/Button';
import { Drawer, ModalDialog } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { toPersianDigits, formatRials } from '../utils/formatters';
import { getPersonaDisplayName } from '../runtime/documentBasedPersonas';

export interface SupportedProductUnit {
  unit: string;
  conversionFactor: number;
  label: string;
  defaultPrice: number;
}

export function getProductSupportedUnits(product?: ProductRecord): SupportedProductUnit[] {
  if (!product) return [];
  const list: SupportedProductUnit[] = [];

  // 1. Base unit (e.g. بطری, قوطی, عدد, کیلوگرم, لیتر)
  list.push({
    unit: product.baseUnit,
    conversionFactor: 1,
    label: `${product.baseUnit} (واحد پایه — ضریب ۱:۱)`,
    defaultPrice: product.currentPriceRials,
  });

  // 2. Secondary unit (e.g. کارتن, شیرینک, بسته)
  if (product.secondaryUnit && product.secondaryUnit !== product.baseUnit) {
    const ratio = product.conversionRatio || product.cartonConversion?.piecesPerCarton || 1;
    list.push({
      unit: product.secondaryUnit,
      conversionFactor: ratio,
      label: `${product.secondaryUnit} (هر ${product.secondaryUnit} = ${toPersianDigits(ratio)} ${product.baseUnit})`,
      defaultPrice: product.currentPriceRials * ratio,
    });
  }

  // 3. Pallet (پالت - 40 کارتن)
  if (product.secondaryUnit === 'کارتن' || product.conversionRatio) {
    const ratio = product.conversionRatio || product.cartonConversion?.piecesPerCarton || 1;
    const palletFactor = ratio * 40;
    list.push({
      unit: 'پالت',
      conversionFactor: palletFactor,
      label: `پالت (۴۰ کارتن = ${toPersianDigits(palletFactor)} ${product.baseUnit})`,
      defaultPrice: product.currentPriceRials * palletFactor,
    });
  }

  // 4. Weight unit (کیلوگرم) if baseUnit is not kg and cartonConversion provides kg
  if (product.baseUnit !== 'کیلوگرم' && product.cartonConversion?.kgPerCarton && product.conversionRatio) {
    const kgFactor = product.cartonConversion.kgPerCarton / product.conversionRatio;
    list.push({
      unit: 'کیلوگرم',
      conversionFactor: 1 / kgFactor,
      label: `کیلوگرم (هر کیلوگرم ≈ ${toPersianDigits(Number((1 / kgFactor).toFixed(3)))} ${product.baseUnit})`,
      defaultPrice: Math.round(product.currentPriceRials / kgFactor),
    });
  }

  // 5. Bulk units if base unit is kg
  if (product.baseUnit === 'کیلوگرم') {
    list.push({
      unit: 'تن',
      conversionFactor: 1000,
      label: 'تن (۱,۰۰۰ کیلوگرم)',
      defaultPrice: product.currentPriceRials * 1000,
    });
    list.push({
      unit: 'کیسه',
      conversionFactor: 50,
      label: 'کیسه (۵۰ کیلوگرم)',
      defaultPrice: product.currentPriceRials * 50,
    });
  }

  return list;
}

export type ProcurementRoundingPolicy = 'ROUND_UP_FULL_UNIT' | 'FRACTIONAL_PERMITTED';

export interface FormSupplyItem {
  productId: string;
  quantity: number;
  unit: string;
  conversionFactor: number;
  baseUnitEquivalent: number;
  estimatedPrice: number;
  notes: string;

  // Source Line Isolation & Immutability Fields
  isSourceDerived?: boolean;
  sourceType?: 'shortage' | 'sales_order' | 'operational_need';
  sourceRecordId?: string;
  sourceRevision?: number;
  sourceLineId?: string;
  sourceQuantity?: number;
  sourceUnit?: string;
  sourceConversionFactor?: number;
  sourceRequiredQuantity?: number; // strictly mirrors sourceQuantity
  sourceRequiredUnit?: string; // strictly mirrors sourceUnit

  selectedProcurementQuantity?: number;
  selectedProcurementUnit?: string;
  resultingBaseQuantity?: number;
  roundingDifference?: number;
  roundingPolicy?: ProcurementRoundingPolicy;
}

export function recalculateItemForUnit(
  item: FormSupplyItem,
  newUnitName: string,
  product?: ProductRecord,
  policy: ProcurementRoundingPolicy = item.roundingPolicy || 'ROUND_UP_FULL_UNIT'
): FormSupplyItem {
  const units = getProductSupportedUnits(product);
  const chosenUnit = units.find((u) => u.unit === newUnitName) || {
    unit: newUnitName,
    conversionFactor: 1,
    label: newUnitName,
    defaultPrice: product?.currentPriceRials || 400000,
  };

  const conv = chosenUnit.conversionFactor || 1;
  const isDerived = Boolean(
    item.isSourceDerived && (item.sourceQuantity !== undefined || (item.sourceRequiredQuantity || 0) > 0)
  );

  const immutableSourceQuantity = isDerived
    ? (item.sourceQuantity ?? item.sourceRequiredQuantity ?? 0)
    : item.quantity;
  const sourceConv = isDerived ? (item.sourceConversionFactor || 1) : (item.conversionFactor || 1);

  // The base physical requirement is derived strictly from immutable source values
  const baseRequired = isDerived
    ? immutableSourceQuantity * sourceConv
    : item.quantity * (item.conversionFactor || 1);

  let procQty = 0;
  let resultingBase = 0;
  let roundingDiff = 0;

  if (policy === 'ROUND_UP_FULL_UNIT') {
    if (conv === 1) {
      procQty = baseRequired;
      resultingBase = baseRequired;
      roundingDiff = 0;
    } else {
      procQty = Math.ceil(baseRequired / conv);
      resultingBase = procQty * conv;
      roundingDiff = resultingBase - baseRequired;
    }
  } else {
    // Fractional permitted
    procQty = Number((baseRequired / conv).toFixed(3));
    resultingBase = baseRequired;
    roundingDiff = 0;
  }

  return {
    ...item,
    unit: chosenUnit.unit,
    selectedProcurementUnit: chosenUnit.unit,
    conversionFactor: conv,
    quantity: procQty,
    selectedProcurementQuantity: procQty,
    resultingBaseQuantity: resultingBase,
    baseUnitEquivalent: resultingBase,
    roundingDifference: roundingDiff,
    roundingPolicy: policy,
    estimatedPrice: chosenUnit.defaultPrice,
    // Strictly preserve source quantities without modification
    sourceType: item.sourceType,
    sourceRecordId: item.sourceRecordId,
    sourceRevision: item.sourceRevision,
    sourceLineId: item.sourceLineId,
    sourceQuantity: isDerived ? immutableSourceQuantity : undefined,
    sourceUnit: isDerived ? (item.sourceUnit || item.sourceRequiredUnit) : undefined,
    sourceConversionFactor: isDerived ? sourceConv : undefined,
    sourceRequiredQuantity: isDerived ? immutableSourceQuantity : baseRequired,
    sourceRequiredUnit: isDerived ? (item.sourceUnit || item.sourceRequiredUnit) : (product?.baseUnit || chosenUnit.unit),
    isSourceDerived: isDerived,
  };
}

export interface SalesOrderFulfillmentEligibility {
  isEligible: boolean;
  blockReasonCode:
    | 'PENDING_APPROVAL'
    | 'PRICE_APPROVAL_REQUIRED'
    | 'REJECTED'
    | 'RETURNED'
    | 'CANCELLED'
    | 'SUPERSEDED'
    | 'NOT_APPROVED'
    | null;
  warningMessage?: string;
  revisionNumber: number;
  approvalStatus: string;
  businessStatus: string;
}

export function checkSalesOrderEligibility(
  order?: SalesOrderDetails | null
): SalesOrderFulfillmentEligibility {
  if (!order) {
    return {
      isEligible: false,
      blockReasonCode: null,
      warningMessage: 'سفارش فروشی انتخاب نشده است.',
      revisionNumber: 1,
      approvalStatus: 'UNKNOWN',
      businessStatus: 'UNKNOWN',
    };
  }

  const currentRev = order.revisions && order.revisions.length > 0 ? order.revisions[0] : null;
  const revNum = currentRev?.revisionNumber || 1;
  const approvalStatus = (currentRev?.approvalStatus || order.approvalStatus || '').toUpperCase();
  const businessStatus = (order.status || '').toLowerCase();

  // Strict rule: Only a SalesOrder whose current selected revision has:
  // - business status eligible for fulfillment
  // - Approval Status = APPROVED or FINAL_APPROVED
  // may trigger final SupplyRequest submission.
  const isApproved = approvalStatus === 'APPROVED' || approvalStatus === 'FINAL_APPROVED';
  const isBusinessStatusEligible =
    businessStatus === 'approved' || businessStatus === 'final_approved';

  if (isApproved && isBusinessStatusEligible) {
    return {
      isEligible: true,
      blockReasonCode: null,
      revisionNumber: revNum,
      approvalStatus: 'APPROVED',
      businessStatus: order.status,
    };
  }

  // Exact Persian warning for ORD-1404-0981 or PENDING_APPROVAL:
  if (
    order.code === 'ORD-1404-0981' ||
    approvalStatus === 'PENDING_APPROVAL' ||
    businessStatus.includes('pending')
  ) {
    return {
      isEligible: false,
      blockReasonCode: 'PENDING_APPROVAL',
      warningMessage:
        'این سفارش هنوز تأیید نهایی نشده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. درخواست را میتوانید بهصورت پیشنویس ذخیره کنید.',
      revisionNumber: revNum,
      approvalStatus: approvalStatus || 'PENDING_APPROVAL',
      businessStatus: order.status,
    };
  }

  // Exact Persian warning for ORD-1404-0985 or PRICE_APPROVAL_REQUIRED:
  if (
    order.code === 'ORD-1404-0985' ||
    approvalStatus === 'PRICE_APPROVAL_REQUIRED' ||
    order.hasPriceException ||
    businessStatus === 'under_review'
  ) {
    return {
      isEligible: false,
      blockReasonCode: 'PRICE_APPROVAL_REQUIRED',
      warningMessage:
        'این سفارش به دلیل نرخ پیشنهادی کمتر از کف مصوب، نیازمند تأیید قیمت توسط معاونت بازرگانی است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. درخواست را میتوانید بهصورت پیشنویس ذخیره کنید.',
      revisionNumber: revNum,
      approvalStatus: approvalStatus || 'PRICE_APPROVAL_REQUIRED',
      businessStatus: order.status,
    };
  }

  return {
    isEligible: false,
    blockReasonCode: 'NOT_APPROVED',
    warningMessage:
      'این سفارش هنوز تأیید نهایی نشده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. درخواست را میتوانید بهصورت پیشنویس ذخیره کنید.',
    revisionNumber: revNum,
    approvalStatus: approvalStatus || 'NOT_APPROVED',
    businessStatus: order.status,
  };
}

export interface SnapshotFreshnessValidation {
  isFresh: boolean;
  warningMessage?: string;
}

export function checkSnapshotFreshness(
  snap?: InventorySnapshotEvidence | null
): SnapshotFreshnessValidation {
  if (!snap) {
    return { isFresh: false, warningMessage: 'مستند کاردکس موجودی انتخاب نشده است.' };
  }
  if (snap.freshnessStatus === 'STALE') {
    return {
      isFresh: false,
      warningMessage: `این مستند موجودی (${snap.code}) به دلیل گذشت ${snap.snapshotAge}، منقضی (STALE) شده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. لطفاً مستند ارزیابی جدید انتخاب نمایید یا درخواست را بهصورت پیش‌نویس ذخیره کنید.`,
    };
  }
  return { isFresh: true };
}

interface SupplyRequestsViewProps {
  activePersona: MockPersona;
  selectedRecordId?: string;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const SupplyRequestsView: React.FC<SupplyRequestsViewProps> = ({
  activePersona,
  selectedRecordId,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [largeOnly, setLargeOnly] = useState(false);
  const [requests, setRequests] = useState<SupplyRequestRecord[]>(() => mockSupplyReceiptStore.getSupplyRequests());
  const [selectedRecord, setSelectedRecord] = useState<SupplyRequestRecord | null>(null);
  useEffect(() => { if (selectedRecordId) setSelectedRecord(requests.find(r => r.id === selectedRecordId || r.code === selectedRecordId) || null); }, [selectedRecordId, requests]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecordResultModalOpen, setIsRecordResultModalOpen] = useState(false);

  // Supply-request creation: supply.create or supply.manage only. supply.read must never create.
  const canCreateSupplyRequest =
    activePersona.capabilities.includes('supply.create') ||
    activePersona.capabilities.includes('supply.manage');

  // Load from reactive store
  useEffect(() => {
    setRequests(mockSupplyReceiptStore.getSupplyRequests());
    const unsubscribe = mockSupplyReceiptStore.subscribe(() => {
      const all = mockSupplyReceiptStore.getSupplyRequests();
      setRequests(all);
      if (selectedRecord) {
        const updated = all.find((r) => r.id === selectedRecord.id);
        if (updated) setSelectedRecord(updated);
      }
    });
    return unsubscribe;
  }, [selectedRecord?.id]);

  // Resolve Accountable Owner and Eligible Assignee dynamically from Responsibility Area
  const opsRespArea = MOCK_RESPONSIBILITY_AREAS.find((r) => r.id === 'resp-operations');
  const accountableOwnerName = 'آقای منتظری';
  const accountableOwnerRole = 'مدیرعامل';
  const accountableOwnerId = opsRespArea?.primaryResponsiblePersonId || 'p-ops-dir';

  const activeDelegation = mockOrgStore.getDelegations().find(
    (d) =>
      d.status === 'active' &&
      (d.title.includes('عملیات') ||
        d.authorizedScope.includes('تأمین') ||
        d.delegator.id === 'p-ops-dir')
  );
  const eligibleAssigneeName = activeDelegation?.delegatee.name || accountableOwnerName;
  const eligibleAssigneeRole = activeDelegation
    ? `${activeDelegation.delegatee.role} (جانشین تفویض‌شده)`
    : accountableOwnerRole;
  const eligibleAssigneeId = activeDelegation?.delegatee.id || accountableOwnerId;

  // New Request Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<SupplyTriggerType>('shortage');
  const [newTriggerDescription, setNewTriggerDescription] = useState(
    'کسری موجودی فیزیکی در انبار مرکزی کهریزک نسبت به حد نصاب ایمنی'
  );
  const [newPriority, setNewPriority] = useState<SupplyPriority>('normal');
  const [newRequiredDate, setNewRequiredDate] = useState('۱۴۰۴/۰۶/۲۵');
  const [newReason, setNewReason] = useState('');
  const [newWarehouseId, setNewWarehouseId] = useState(MOCK_WAREHOUSES[0]?.id || 'wh-01');
  const [newSupplierId, setNewSupplierId] = useState(MOCK_SUPPLIERS[0]?.id || '');

  // Trigger-specific Form State
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState<string>(''); // Must NOT be preselected; force explicit selection
  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [requestingUnit, setRequestingUnit] = useState('معاونت عملیات و خطوط بسته‌بندی');
  const [costCenter, setCostCenter] = useState('مرکز هزینه ۱۱۰ - خطوط بسته‌بندی و ملزومات');
  const [operationalJustification, setOperationalJustification] = useState(
    'شارژ مواد اولیه و اقلام بسته‌بندی بر اساس برنامه هفتگی تولید'
  );

  const selectedSnapshot = MOCK_INVENTORY_SNAPSHOTS.find((s) => s.id === selectedSnapshotId);
  const selectedSalesOrder = MOCK_SALES_ORDERS.find((so) => so.id === selectedSalesOrderId);

  const salesOrderEligibility =
    newTriggerType === 'sales_order'
      ? checkSalesOrderEligibility(selectedSalesOrder)
      : null;

  const snapshotFreshness =
    newTriggerType === 'shortage'
      ? checkSnapshotFreshness(selectedSnapshot)
      : null;

  const [newItems, setNewItems] = useState<FormSupplyItem[]>([]);

  const handleTriggerChange = (trigger: SupplyTriggerType) => {
    setNewTriggerType(trigger);
    setSelectedSnapshotId('');
    setSelectedSalesOrderId('');
    setSalesOrderId('');
    setCustomerName('');

    if (trigger === 'shortage') {
      setNewTriggerDescription('کسری موجودی فیزیکی در انبار نسبت به حد نصاب ایمنی و نقطه سفارش');
      setNewTitle('تأمین کسری کاردکس انبار');
      setNewReason('');
      setNewItems([]);
    } else if (trigger === 'sales_order') {
      setNewTriggerDescription('الزام تعهد سفارش فروش و تأمین محموله مشتری');
      setNewTitle('تأمین اقلام سفارش فروش');
      setNewReason('');
      setNewItems([]);
    } else {
      setNewTriggerDescription('نیاز عملیاتی دوره‌ای جهت خطوط بسته‌بندی و ملزومات تولید');
      setNewTitle('درخواست تأمین مستقیم');
      setNewReason('');
      const defaultProd = MOCK_PRODUCTS[0];
      const supported = getProductSupportedUnits(defaultProd);
      const firstU = supported[0];
      setNewItems([
        {
          sourceType: 'operational_need',
          productId: defaultProd.id,
          quantity: 100,
          unit: firstU.unit,
          conversionFactor: firstU.conversionFactor,
          baseUnitEquivalent: 100 * firstU.conversionFactor,
          estimatedPrice: firstU.defaultPrice,
          notes: '',
          isSourceDerived: false,
          sourceQuantity: 100,
          sourceUnit: firstU.unit,
          sourceConversionFactor: firstU.conversionFactor,
          sourceRequiredQuantity: 100,
          sourceRequiredUnit: firstU.unit,
          selectedProcurementQuantity: 100,
          selectedProcurementUnit: firstU.unit,
          resultingBaseQuantity: 100 * firstU.conversionFactor,
          roundingDifference: 0,
          roundingPolicy: 'ROUND_UP_FULL_UNIT',
        },
      ]);
    }
  };

  const handleSelectSnapshot = (snapId: string) => {
    setSelectedSnapshotId(snapId);
    const snap = MOCK_INVENTORY_SNAPSHOTS.find((s) => s.id === snapId);
    if (snap) {
      setNewWarehouseId(snap.warehouseId);
      setNewTitle(`تأمین کسری انبار: ${snap.productName} (${snap.code})`);
      setNewReason(
        `بر اساس مستند رسمی ${snap.code} صادره از ${snap.evidenceSource}، موجودی آزاد به میزان ${toPersianDigits(
          snap.calculatedShortage
        )} ${snap.unit} زیر نقطه سفارش است.`
      );
      const product =
        MOCK_PRODUCTS.find((p) => p.id === snap.productId || p.code === snap.productCode) ||
        MOCK_PRODUCTS[0];
      const units = getProductSupportedUnits(product);
      const matchedUnit = units.find((u) => u.unit === snap.unit) || units[0];
      const shortageQty = snap.calculatedShortage > 0 ? snap.calculatedShortage : 1000;
      const sourceConv = matchedUnit.conversionFactor || 1;
      const resultingBase = shortageQty * sourceConv;

      const baseItem: FormSupplyItem = {
        sourceType: 'shortage',
        sourceRecordId: snap.id,
        sourceRevision: 1,
        sourceLineId: snap.id,
        productId: product.id,
        sourceQuantity: shortageQty,
        sourceUnit: matchedUnit.unit,
        sourceConversionFactor: sourceConv,
        sourceRequiredQuantity: shortageQty,
        sourceRequiredUnit: matchedUnit.unit,

        selectedProcurementQuantity: shortageQty,
        selectedProcurementUnit: matchedUnit.unit,
        resultingBaseQuantity: resultingBase,
        roundingDifference: 0,
        roundingPolicy: 'ROUND_UP_FULL_UNIT',

        quantity: shortageQty,
        unit: matchedUnit.unit,
        conversionFactor: sourceConv,
        baseUnitEquivalent: resultingBase,
        estimatedPrice: matchedUnit.defaultPrice,
        notes: `تأمین کسری کاردکس مستند ${snap.code}`,
        isSourceDerived: true,
      };

      setNewItems([baseItem]);
    } else {
      setNewItems([]);
    }
  };

  const handleSelectSalesOrder = (orderId: string) => {
    setSelectedSalesOrderId(orderId);
    const order = MOCK_SALES_ORDERS.find((so) => so.id === orderId);
    if (order) {
      setSalesOrderId(order.code);
      setCustomerName(order.customerName);
      setNewTitle(`تأمین اقلام تعهد سفارش فروش ${order.code} (${order.customerName})`);
      setNewReason(
        `تأمین و تحویل اقلام بر اساس تعهد قطعی سفارش ${order.code} برای ${order.customerName}. شرایط تحویل: ${
          order.deliveryTerms || 'تحویل انبار مرکزی'
        }.`
      );
      const revNum = order.revisions?.[0]?.revisionNumber || 1;
      if (order.items && order.items.length > 0) {
        const mapped: FormSupplyItem[] = order.items.map((it) => {
          const p =
            MOCK_PRODUCTS.find(
              (prod) => prod.id === it.productId || prod.name.includes(it.productName)
            ) || MOCK_PRODUCTS[0];
          const units = getProductSupportedUnits(p);
          const sourceUnit = it.unit || p.baseUnit || 'بطری';
          const matchedUnit = units.find((u) => u.unit === sourceUnit) || units[0];
          const sourceConv = matchedUnit.conversionFactor || 1;
          const sourceQty = it.pieces ?? it.cartons ?? 100;
          const resultingBase = sourceQty * sourceConv;

          return {
            sourceType: 'sales_order',
            sourceRecordId: order.id,
            sourceRevision: revNum,
            sourceLineId: it.id,
            productId: p.id,
            sourceQuantity: sourceQty,
            sourceUnit: sourceUnit,
            sourceConversionFactor: sourceConv,
            sourceRequiredQuantity: sourceQty,
            sourceRequiredUnit: sourceUnit,

            selectedProcurementQuantity: sourceQty,
            selectedProcurementUnit: sourceUnit,
            resultingBaseQuantity: resultingBase,
            roundingDifference: 0,
            roundingPolicy: 'ROUND_UP_FULL_UNIT',

            quantity: sourceQty,
            unit: sourceUnit,
            conversionFactor: sourceConv,
            baseUnitEquivalent: resultingBase,
            estimatedPrice: matchedUnit.defaultPrice,
            notes: `عطف تعهد سطر سفارش فروش ${order.code} (ویرایش ${toPersianDigits(revNum)})`,
            isSourceDerived: true,
          };
        });
        setNewItems(mapped);
      } else {
        setNewItems([]);
      }
    } else {
      setSalesOrderId('');
      setCustomerName('');
      setNewItems([]);
    }
  };

  // Validation logic for Submit & Refer
  const isItemsValid =
    newItems.length > 0 &&
    newItems.every((it) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === it.productId);
      const supported = getProductSupportedUnits(product);
      const unitMatch = supported.find((u) => u.unit === it.unit);
      return (
        it.quantity > 0 &&
        Boolean(unitMatch) &&
        (it.conversionFactor || 0) > 0 &&
        (it.estimatedPrice || 0) > 0
      );
    });

  const isTriggerValid =
    newTriggerType === 'shortage'
      ? Boolean(selectedSnapshotId && selectedSnapshot && snapshotFreshness?.isFresh)
      : newTriggerType === 'sales_order'
      ? Boolean(selectedSalesOrderId && selectedSalesOrder && salesOrderEligibility?.isEligible)
      : Boolean(requestingUnit.trim() && costCenter.trim());

  const isSubmitValid =
    Boolean(newTitle.trim()) &&
    Boolean(newReason.trim()) &&
    Boolean(newRequiredDate.trim()) &&
    Boolean(newWarehouseId) &&
    isItemsValid &&
    isTriggerValid;

  // Record Supply Result State
  const [deliveryInputs, setDeliveryInputs] = useState<Record<string, number>>({});
  const [deliveryResultStatus, setDeliveryResultStatus] = useState<
    'supplied_complete' | 'supplied_partial' | 'cancelled' | 'blocked'
  >('supplied_complete');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Filter Logic
  const filteredRequests = requests.filter((r) => {
    if (largeOnly && r.estimatedTotalAmountRials <= 1_000_000_000) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = r.code.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchSupplier = r.selectedSupplier?.name.toLowerCase().includes(q) || false;
      const matchRequester = r.requester?.name?.toLowerCase().includes(q) || false;
      const matchCreator = r.creator?.name?.toLowerCase().includes(q) || false;
      const matchProduct = r.items.some((it) => it.productName.toLowerCase().includes(q));
      if (!matchCode && !matchTitle && !matchSupplier && !matchRequester && !matchCreator && !matchProduct) {
        return false;
      }
    }
    return true;
  });

  const getPriorityBadge = (p: SupplyPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-rose-50 text-rose-700 border border-rose-200">
            فوری و اضطراری
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-bold bg-amber-50 text-amber-800 border border-amber-200">
            اولویت بالا
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-700 border border-slate-200">
            عادی
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-50 text-slate-500 border border-slate-200">
            کم
          </span>
        );
    }
  };

  const getTriggerBadge = (t?: SupplyTriggerType) => {
    switch (t) {
      case 'shortage':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-semibold bg-orange-50 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            کسری موجودی انبار
          </span>
        );
      case 'sales_order':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-semibold bg-slate-50 text-slate-800 border border-slate-200">
            <ShoppingBag className="w-3 h-3 text-slate-600" />
            سفارش مشتری
          </span>
        );
      case 'operational_need':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Layers className="w-3 h-3 text-sky-600" />
            نیاز عملیاتی مستقیم
          </span>
        );
    }
  };

  const getStatusBadge = (s: SupplyRequestStatus) => {
    switch (s) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            پیش‌نویس
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
            ارجاع به خرید
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            در حال استعلام و سفارش
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            تأمین جزئی
          </span>
        );
      case 'supplied':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            تأمین کامل شد
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
            مسدود / قفل بودجه
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 line-through border border-slate-300">
            ابطال شده
          </span>
        );
    }
  };

  const getResultBadge = (status: SupplyRequestStatus, r?: SupplyResult) => {
    if (status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 text-caption font-medium text-slate-500">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          پیش‌نویس (فاقد ورود کالا)
        </span>
      );
    }
    if (status === 'cancelled' || r === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-caption font-bold text-slate-500">
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          لغو شده — فاقد ورود کالا
        </span>
      );
    }
    if (status === 'supplied' || r === 'supplied_complete') {
      return (
        <span className="inline-flex items-center gap-1 text-caption font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          تحویل قطعی کامل
        </span>
      );
    }
    if (status === 'partial' || r === 'supplied_partial') {
      return (
        <span className="inline-flex items-center gap-1 text-caption font-bold text-amber-700">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          تحویل جزئی با پارت باز
        </span>
      );
    }
    if (status === 'blocked' || r === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 text-caption font-bold text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          توقف و انسداد تأمین
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-caption text-blue-600 font-medium">
        <PackageCheck className="w-3.5 h-3.5 text-blue-500" />
        در انتظار ورود کالا
      </span>
    );
  };

  // Helper to build verified needSource evidence based on trigger
  const buildNeedSource = (): SupplyNeedSource => {
    const wh = MOCK_WAREHOUSES.find((w) => w.id === newWarehouseId);
    if (newTriggerType === 'shortage') {
      return {
        type: 'shortage',
        warehouseId: newWarehouseId,
        warehouseName: wh?.name || selectedSnapshot?.warehouseName || 'انبار مرکزی توزیع و سالن نگهداری کهریزک',
        snapshotId: selectedSnapshot?.id,
        snapshotCode: selectedSnapshot?.code,
        evidenceTimestampJalali: selectedSnapshot?.evidenceTimestampJalali,
        evidenceSource: selectedSnapshot?.evidenceSource,
        productId: selectedSnapshot?.productId,
        productCode: selectedSnapshot?.productCode,
        productName: selectedSnapshot?.productName,
        physicalStock: selectedSnapshot?.physicalQuantity || 0,
        reservedStock: selectedSnapshot?.reservedQuantity || 0,
        availableStock: selectedSnapshot?.availableQuantity || 0,
        orderPoint: selectedSnapshot?.reorderPoint || 0,
        calculatedShortage: selectedSnapshot?.calculatedShortage || 0,
        unit: selectedSnapshot?.unit || 'بطری',
        snapshotStatus: selectedSnapshot?.snapshotStatus,
        offlineNotice:
          selectedSnapshot?.offlineNotice || 'بر اساس آخرین ثبت موجودی — اتصال برخط فعال نیست.',
        sourceTimestamp:
          selectedSnapshot?.sourceTimestamp || selectedSnapshot?.evidenceTimestampJalali,
        snapshotAge: selectedSnapshot?.snapshotAge,
        freshnessStatus: selectedSnapshot?.freshnessStatus || 'CURRENT',
        sourceSystem: selectedSnapshot?.sourceSystem || selectedSnapshot?.evidenceSource,
        integrationStatus: selectedSnapshot?.integrationStatus || 'NOT_CONNECTED',
      };
    }
    if (newTriggerType === 'sales_order') {
      return {
        type: 'sales_order',
        salesOrderId: selectedSalesOrder?.id || salesOrderId,
        salesOrderCode: selectedSalesOrder?.code || salesOrderId,
        customerName: selectedSalesOrder?.customerName || customerName,
        revisionNumber: selectedSalesOrder?.revisions?.[0]?.revisionNumber || 1,
        orderStatus: selectedSalesOrder?.statusLabel || selectedSalesOrder?.status,
        approvalStatus:
          selectedSalesOrder?.approvalStatus ||
          selectedSalesOrder?.revisions?.[0]?.approvalStatus ||
          'APPROVED',
        deliveryDateJalali: selectedSalesOrder?.deliveryTerms,
        deliveryTerms: selectedSalesOrder?.deliveryTerms || selectedSalesOrder?.deliveryAddress,
        orderItemsSummary: selectedSalesOrder?.items?.map((it) => `${it.productName}: ${toPersianDigits(it.cartons || it.pieces || 0)} ${it.unit || 'کارتن'}`).join(' | '),
      };
    }
    return {
      type: 'operational_need',
      requestingUnit: requestingUnit,
      costCenter: costCenter,
      operationalJustification: operationalJustification,
    };
  };

  // 1. Save Draft: Creates ONLY the draft Supply Request, NO WorkItem, NO Assignee
  const handleSaveDraft = () => {
    if (!newTitle.trim()) {
      addToast({
        id: `err-${Date.now()}`,
        title: 'خطای اعتبارسنجی پیش‌نویس',
        description: 'حداقل عنوان درخواست برای ذخیره پیش‌نویس الزامی است.',
        tone: 'danger',
      });
      return;
    }

    const wh = MOCK_WAREHOUSES.find((w) => w.id === newWarehouseId);
    const needSource = buildNeedSource();

    const { supplyRequest } = mockSupplyReceiptStore.createSupplyRequest(
      {
        title: newTitle,
        triggerType: newTriggerType,
        triggerDescription: newTriggerDescription,
        creatorPersona: activePersona,
        targetResponsibilityTitle: opsRespArea?.title || 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین',
        ownerId: accountableOwnerId,
        ownerName: accountableOwnerName,
        requiredDateJalali: newRequiredDate,
        priority: newPriority,
        reason: newReason || 'پیش‌نویس اولیه درخواست تأمین',
        supplierId: newSupplierId,
        warehouseId: newWarehouseId,
        warehouseName: wh?.name || selectedSnapshot?.warehouseName || 'انبار مرکزی کهریزک',
        customerName: newTriggerType === 'sales_order' ? (selectedSalesOrder?.customerName || customerName) : undefined,
        salesOrderId: newTriggerType === 'sales_order' ? (selectedSalesOrder?.code || salesOrderId) : undefined,
        needSource: needSource,
        items: newItems,
      },
      true // isDraft = true
    );

    setIsCreateModalOpen(false);
    setSelectedRecord(supplyRequest);

    addToast({
      id: `toast-${Date.now()}`,
      title: 'پیش‌نویس ذخیره شد',
      description: `درخواست تأمین با کد پیش‌نویس ${supplyRequest.code} ذخیره گردید (فاقد ارجاع به کارهای من و فاقد وضعیت ورود کالا).`,
      tone: 'info',
    });
  };

  // 2. Submit and Refer: Validates thoroughly, creates Supply Request AND WorkItem in active assignee's inbox
  const handleCreateAndRefer = () => {
    if (!isSubmitValid) {
      addToast({
        id: `err-${Date.now()}`,
        title: 'خطای اعتبارسنجی ثبت و ارجاع',
        description:
          'لطفاً تمامی فیلدهای الزامی شامل عنوان، انبار، موعد تحویل، شرح ضرورت، محرک نیاز و اقلام با نرخ معتبر را تکمیل فرمایید.',
        tone: 'danger',
      });
      return;
    }

    if (newTriggerType === 'sales_order') {
      const eligibility = checkSalesOrderEligibility(selectedSalesOrder);
      if (!eligibility.isEligible) {
        addToast({
          id: `err-${Date.now()}`,
          title: 'عدم امکان ارجاع قطعی سفارش تأییدنشده',
          description: eligibility.warningMessage,
          tone: 'danger',
        });
        return;
      }
    }

    if (newTriggerType === 'shortage') {
      const freshness = checkSnapshotFreshness(selectedSnapshot);
      if (!freshness.isFresh) {
        addToast({
          id: `err-${Date.now()}`,
          title: 'عدم امکان ارجاع قطعی مستند منقضی (STALE)',
          description: freshness.warningMessage,
          tone: 'danger',
        });
        return;
      }
    }

    const wh = MOCK_WAREHOUSES.find((w) => w.id === newWarehouseId);
    const needSource = buildNeedSource();

    const { supplyRequest, workItem } = mockSupplyReceiptStore.createSupplyRequest(
      {
        title: newTitle,
        triggerType: newTriggerType,
        triggerDescription: newTriggerDescription,
        creatorPersona: activePersona,
        targetResponsibilityTitle: opsRespArea?.title || 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین',
        ownerId: accountableOwnerId,
        ownerName: accountableOwnerName,
        currentAssigneeId: eligibleAssigneeId,
        currentAssigneeName: eligibleAssigneeName,
        requiredDateJalali: newRequiredDate,
        priority: newPriority,
        reason: newReason,
        supplierId: newSupplierId,
        warehouseId: newWarehouseId,
        warehouseName: wh?.name || selectedSnapshot?.warehouseName || 'انبار مرکزی کهریزک',
        customerName: newTriggerType === 'sales_order' ? (selectedSalesOrder?.customerName || customerName) : undefined,
        salesOrderId: newTriggerType === 'sales_order' ? (selectedSalesOrder?.code || salesOrderId) : undefined,
        needSource: needSource,
        items: newItems,
      },
      false // isDraft = false
    );

    setIsCreateModalOpen(false);
    setSelectedRecord(supplyRequest);

    addToast({
      id: `toast-${Date.now()}`,
      title: '«ثبت و ارجاع» با موفقیت انجام شد',
      description: `درخواست تأمین ${supplyRequest.code} ثبت و وظیفه مسئولانه ${workItem?.code} در سامانه عملیات به ${supplyRequest.currentAssignee?.name} ارجاع گردید.`,
      tone: 'success',
    });
  };

  // Open Record Supply Result Dialog
  const handleOpenDeliveryModal = () => {
    if (!selectedRecord) return;
    const initialInputs: Record<string, number> = {};
    selectedRecord.items.forEach((it) => {
      initialInputs[it.id] = it.suppliedQuantity ?? 0;
    });
    setDeliveryInputs(initialInputs);
    setDeliveryResultStatus('supplied_complete');
    setDeliveryNotes('کالاها در انبار تخلیه و برگه باسکول تأیید گردید.');
    setIsRecordResultModalOpen(true);
  };

  // Save Supply Result
  const handleSaveDeliveryResult = () => {
    if (!selectedRecord) return;
    const success = mockSupplyReceiptStore.updateSupplyResult(
      selectedRecord.id,
      deliveryInputs,
      deliveryResultStatus,
      deliveryNotes
    );
    if (!success) { addToast('مقدار تحویل باید معتبر و حداکثر مقدار درخواستی باشد؛ تأمین کامل به تحویل همه اقلام نیاز دارد.', 'danger'); return; }

    setIsRecordResultModalOpen(false);
    addToast({
      id: `toast-${Date.now()}`,
      title: 'نتیجه نهایی تأمین ثبت شد',
      description: `مقادیر تحویل‌شده برای پرونده ${selectedRecord.code} با موفقیت به‌روزرسانی گردید.`,
      tone: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-none">
        <div>
          <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-700" />
            درخواست‌های تأمین کالا و ملزومات
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            سفارش‌گذاری ناشی از کسری انبار یا نیاز عملیاتی، تفکیک ثبت‌کننده/صاحب‌کار/مجری و ارجاع مستقیم به فهرست وظایف
          </p>
        </div>

        {canCreateSupplyRequest ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ثبت و ارجاع درخواست تأمین جدید
          </Button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            ثبت درخواست نیازمند صلاحیت supply.create یا supply.manage است
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none">
          <span className="text-slate-500 block text-caption">کل پرونده‌های تأمین</span>
          <span className="text-lg font-mono font-bold text-slate-900 mt-0.5 block">
            {toPersianDigits(requests.length)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none">
          <span className="text-primary-700 font-semibold block text-caption">در حال استعلام و اقدام</span>
          <span className="text-lg font-mono font-bold text-primary-700 mt-0.5 block">
            {toPersianDigits(
              requests.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length
            )}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none">
          <span className="text-emerald-600 font-semibold block text-caption">تأمین قطعی و کامل</span>
          <span className="text-lg font-mono font-bold text-emerald-700 mt-0.5 block">
            {toPersianDigits(requests.filter((r) => r.status === 'supplied').length)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none">
          <span className="text-rose-600 font-semibold block text-caption">اولویت فوری و بحرانی</span>
          <span className="text-lg font-mono font-bold text-rose-700 mt-0.5 block">
            {toPersianDigits(requests.filter((r) => r.priority === 'urgent').length)}
          </span>
        </div>
      </div>

      {/* Filters & Status Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar border-b border-slate-100">
          {[
            { id: 'all', label: 'همه درخواست‌ها' },
            { id: 'draft', label: 'پیش‌نویس' },
            { id: 'assigned', label: 'ارجاع به خرید' },
            { id: 'in_progress', label: 'در حال استعلام' },
            { id: 'partial', label: 'تأمین جزئی' },
            { id: 'supplied', label: 'تأمین کامل' },
            { id: 'blocked', label: 'مسدود / قفل' },
            { id: 'cancelled', label: 'ابطال شده' },
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
                <span
                  className={`mr-1.5 px-1.5 py-0.2 rounded-full text-caption ${
                    statusFilter === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {requests.filter((r) => r.status === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در کد درخواست، عنوان، کالا، تأمین‌کننده یا ایجادکننده..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">اولویت:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="all">همه اولویت‌ها</option>
              <option value="urgent">فوری و اضطراری</option>
              <option value="high">اولویت بالا</option>
              <option value="normal">عادی</option>
              <option value="low">کم</option>
            </select>
          </div>
        </div>
      </div>

      <MetricStrip total={requests.length} pending={requests.filter(x => !['paid', 'closed', 'cancelled', 'rejected', 'completed', 'supplied'].includes(x.status)).length} amount={requests.reduce((sum, x) => sum + x.estimatedTotalAmountRials, 0)} />
      <div className="flex items-center justify-between gap-3 flex-wrap"><button type="button" aria-pressed={largeOnly} onClick={() => setLargeOnly(!largeOnly)} className={`px-4 py-2 rounded-full text-xs border ${largeOnly ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200'}`}>بالای ۱۰۰ میلیون تومان</button><ViewSwitcher value={viewMode} onChange={setViewMode} /></div>
      {viewMode === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRequests.length === 0 && <div className="col-span-full"><EmptyState title="فضا برای پرونده‌های تازه" description="فیلترها را تغییر دهید یا یک درخواست جدید ثبت کنید." actionText="پاک کردن فیلترها" onAction={() => { setLargeOnly(false); setSearchQuery(''); setStatusFilter('all'); }} /></div>}
        {filteredRequests.map(r => <EnterpriseCard key={r.id} isInteractive onClick={() => setSelectedRecord(r)} status="primary"><EnterpriseCardHeader title={r.title} code={r.code} /><EnterpriseCardBody><CurrencyAmount amountRials={r.estimatedTotalAmountRials} size="lg" /><div className="mt-3 text-xs text-slate-500">{r.statusReason || r.status}</div></EnterpriseCardBody></EnterpriseCard>)}
      </div>}
      {/* Requests Table / Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
        {/* Desktop Table */}
        <div className={viewMode === 'table' ? "hidden lg:block overflow-x-auto" : "hidden"}>
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">کد و عنوان درخواست</th>
                <th className="p-3">محرک نیاز</th>
                <th className="p-3">ثبت‌کننده (Creator)</th>
                <th className="p-3">صاحب کار اولیه (Owner)</th>
                <th className="p-3">مجری کنونی (Assignee)</th>
                <th className="p-3">تأمین‌کننده</th>
                <th className="p-3">موعد و اولویت</th>
                <th className="p-3">نتیجه تأمین</th>
                <th className="p-3">اسناد و پیوندها</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    موردی منطبق با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-mono font-bold text-primary-700">{r.code}</div>
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">{r.title}</div>
                      <div className="text-caption text-slate-500 mt-0.5">
                        {toPersianDigits(r.items.length)} قلم کالا | برآورد:{' '}
                        <CurrencyAmount amountRials={r.estimatedTotalAmountRials} />
                      </div>
                    </td>

                    <td className="p-3">{getTriggerBadge(r.triggerType)}</td>

                    {/* Creator */}
                    <td className="p-3">
                      <div className="font-bold text-slate-800">
                        {r.creator ? r.creator.name : r.requester.name}
                      </div>
                      <div className="text-caption text-slate-500">
                        {r.creator ? r.creator.role : r.requester.department}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{r.owner.name}</div>
                      <div className="text-caption text-slate-500">{r.owner.role}</div>
                    </td>

                    {/* Current Assignee */}
                    <td className="p-3">
                      {r.status === 'draft' ? (
                        <span className="text-slate-500 italic text-caption block">
                          هنوز ارسال و ارجاع نشده است
                        </span>
                      ) : r.status === 'cancelled' ? (
                        <span className="text-slate-500 text-caption block">
                          مختومه (لغو شده)
                        </span>
                      ) : r.status === 'supplied' ? (
                        <span className="text-emerald-700 text-caption font-semibold block">
                          مختومه (تأمین تکمیل شد)
                        </span>
                      ) : (
                        <div>
                          <div className="font-bold text-primary-900 bg-primary-50/70 px-2 py-1 rounded border border-primary-100 inline-block">
                            {r.currentAssignee?.name || r.owner.name}
                          </div>
                          {r.delegationInfo ? (
                            <div className="text-caption text-primary-700 mt-0.5 font-medium">
                              تفویض: {r.delegationInfo.delegationId}
                            </div>
                          ) : (
                            <div className="text-caption text-primary-700 mt-0.5">
                              {r.currentAssignee?.role || r.owner.department}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {r.selectedSupplier ? (
                        <div>
                          <div className="font-semibold text-slate-800">{r.selectedSupplier.name}</div>
                          {r.externalPurchaseRef && (
                            <span className="font-mono text-caption text-slate-500">
                              {r.externalPurchaseRef}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">تعیین‌نشده</span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="font-mono text-slate-700 font-semibold">{r.requiredDateJalali}</div>
                      <div className="mt-1">{getPriorityBadge(r.priority)}</div>
                    </td>

                    <td className="p-3">
                      <div>{getStatusBadge(r.status)}</div>
                      <div className="mt-1">{getResultBadge(r.status, r.supplyResult)}</div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        {r.linkedWorkItemId && (
                          <span title="دارای وظیفه در کارهای من">
                            <CheckSquare className="w-3.5 h-3.5 text-primary-700" />
                          </span>
                        )}
                        {r.links.logisticsId && (
                          <span title="دارای هماهنگی لجستیک">
                            <Truck className="w-3.5 h-3.5 text-teal-600" />
                          </span>
                        )}
                        {r.links.receiptId && (
                          <span title="دارای رسید انبار">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                        {r.links.paymentRequestId && (
                          <span title="دارای دستور پرداخت">
                            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                        {r.links.salesOrderId && (
                          <span title="متصل به سفارش فروش">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="cursor-pointer"
                      >
                        بررسی و جزئیات
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdaptiveTable>
        </div>

        {/* Mobile / Tablet Cards */}
        <div className={viewMode === 'table' ? "lg:hidden divide-y divide-slate-100" : "hidden"}>
          {filteredRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">درخواستی یافت نشد.</div>
          ) : (
            filteredRequests.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRecord(r)}
                className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary-700">{r.code}</span>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(r.priority)}
                    {getStatusBadge(r.status)}
                    {getResultBadge(r.status, r.supplyResult)}
                  </div>
                </div>

                <div className="font-bold text-slate-900 text-xs leading-snug">{r.title}</div>
                <div>{getTriggerBadge(r.triggerType)}</div>

                <div className="grid grid-cols-2 gap-2 text-caption bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">ثبت‌کننده:</span>
                    <span className="font-semibold text-slate-800">
                      {r.creator ? r.creator.name : r.requester.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">مجری کنونی (اقدام‌کننده):</span>
                    {r.status === 'draft' ? (
                      <span className="text-slate-500 italic text-caption">
                        هنوز ارسال و ارجاع نشده است
                      </span>
                    ) : r.status === 'cancelled' ? (
                      <span className="text-slate-500 text-caption">
                        مختومه (لغو شده)
                      </span>
                    ) : r.status === 'supplied' ? (
                      <span className="text-emerald-700 text-caption font-semibold">
                        مختومه (تأمین تکمیل شد)
                      </span>
                    ) : (
                      <span className="font-bold text-primary-800">
                        {r.currentAssignee?.name || r.owner.name}
                        {r.delegationInfo && (
                          <span className="text-caption text-primary-700 block font-normal">
                            (تفویض: {r.delegationInfo.delegationId})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">تأمین‌کننده:</span>
                    <span className="font-semibold text-slate-800">
                      {r.selectedSupplier ? r.selectedSupplier.name : 'در حال استعلام'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">برآورد مبلغ:</span>
                    <span className="font-mono font-bold text-slate-800">
                      <CurrencyAmount amountRials={r.estimatedTotalAmountRials} />
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-caption text-slate-500 pt-1">
                  <span>موعد: {r.requiredDateJalali}</span>
                  <span className="text-primary-700 font-bold flex items-center gap-1">
                    مشاهده جزئیات
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedRecord && (
        <Drawer
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`جزئیات پرونده تأمین: ${selectedRecord.code}`}
          subtitle={selectedRecord.title}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleOpenDeliveryModal}
                  className="cursor-pointer"
                >
                  <Package className="w-4 h-4 ml-1" />
                  ثبت تحویل کالا
                </Button>

                {selectedRecord.linkedWorkItemId && onNavigateToRoute && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigateToRoute('inbox', selectedRecord.linkedWorkItemId)}
                    className="cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-primary-700" />
                    مشاهده وظیفه در کارهای من
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
          <div className="space-y-5 text-xs">
            {/* 4 Explicit Statuses Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Business Status */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-caption font-semibold mb-1">۱. وضعیت کسب‌وکار پرونده</span>
                <div>{getStatusBadge(selectedRecord.status)}</div>
                <div className="mt-1">{getResultBadge(selectedRecord.status, selectedRecord.supplyResult)}</div>
                {selectedRecord.statusReason && (
                  <div className="text-caption text-slate-500 mt-1 leading-relaxed">
                    {selectedRecord.statusReason}
                  </div>
                )}
              </div>

              {/* 2. Approval Status */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-caption font-semibold mb-1">۲. وضعیت گردش تأیید</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  فاقد گردش تأیید خودکار
                </span>
                <div className="text-caption text-slate-500 mt-1.5 leading-relaxed">
                  جریان تأیید هنوز تعریف نشده است — نیازمند تنظیم کارفرما (بدون امضای صوری یا مراحل شبیه‌سازی‌شده).
                </div>
              </div>

              {/* 3. WorkItem Status */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-caption font-semibold mb-1">۳. وضعیت وظیفه در کارهای من</span>
                {selectedRecord.status === 'draft' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    فاقد وظیفه عملیاتی (پیش‌نویس)
                  </span>
                ) : selectedRecord.status === 'supplied' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    وظیفه خاتمه‌یافته (مختومه)
                  </span>
                ) : selectedRecord.status === 'cancelled' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    ابطال شده (فاقد وظیفه فعال)
                  </span>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-bold bg-primary-50 text-primary-700 border border-primary-200">
                      <CheckSquare className="w-3 h-3 text-primary-700" />
                      در جریان در کارهای من
                    </span>
                    {selectedRecord.linkedWorkItemId && (
                      <span className="block font-mono text-caption text-primary-700 mt-1">
                        شناسه: {selectedRecord.linkedWorkItemId}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Integration Status */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <span className="text-slate-500 block text-caption font-semibold mb-1">۴. وضعیت اتصال سامانه‌ها</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  اتصال سامانه‌ای غیرفعال
                </span>
                <div className="text-caption text-slate-500 mt-1.5 leading-relaxed">
                  فاقد وب‌سرویس فعال خارجی — وضعیت تأمین کاملاً مستقل از سامانه‌های بیرونی مدیریت می‌گردد.
                </div>
              </div>
            </div>

            {/* Responsibilities & 3 Persons Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="font-extrabold text-slate-800 text-xs border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>تفکیک نقش‌ها، مسئولیت و اقدام‌کننده</span>
                <span className="font-mono text-primary-700">{selectedRecord.code}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Creator */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-caption">۱. ایجادکننده و ثبت‌کننده (Creator)</span>
                  <div className="font-bold text-slate-900 mt-1">
                    {selectedRecord.creator ? selectedRecord.creator.name : selectedRecord.requester.name}
                  </div>
                  <div className="text-caption text-slate-500">
                    {selectedRecord.creator ? selectedRecord.creator.role : selectedRecord.requester.department}
                  </div>
                </div>

                {/* 2. Owner */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-caption">۲. صاحب کار اولیه (Owner)</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedRecord.owner.name}</div>
                  <div className="text-caption text-slate-500">{selectedRecord.owner.role}</div>
                  {selectedRecord.fallbackOwner && (
                    <div className="text-caption text-slate-500 mt-1">
                      جانشین سازمانی: {selectedRecord.fallbackOwner.name}
                    </div>
                  )}
                </div>

                {/* 3. Current Assignee */}
                <div className="p-3 bg-primary-50/80 rounded-lg border border-primary-200">
                  <span className="text-primary-700 font-bold block text-caption">
                    ۳. مجری کنونی / اقدام‌کننده (Current Assignee)
                  </span>
                  {selectedRecord.status === 'draft' ? (
                    <div className="text-slate-500 italic mt-1 font-medium text-xs">
                      هنوز ارسال و ارجاع نشده است
                    </div>
                  ) : selectedRecord.status === 'cancelled' ? (
                    <div className="text-slate-500 mt-1 font-medium text-xs">
                      مختومه (لغو شده)
                    </div>
                  ) : selectedRecord.status === 'supplied' ? (
                    <div className="text-emerald-700 mt-1 font-semibold text-xs">
                      مختومه (تأمین تکمیل شد)
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-primary-900 mt-1">
                        {selectedRecord.currentAssignee?.name || selectedRecord.owner.name}
                      </div>
                      <div className="text-caption text-primary-700">
                        {selectedRecord.currentAssignee?.role || selectedRecord.owner.department}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Delegation Box if Present */}
              {selectedRecord.delegationInfo && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg space-y-1 text-xs text-primary-950">
                  <div className="font-bold flex items-center justify-between text-primary-900 border-b border-primary-200/60 pb-1">
                    <span>مستند تفویض اختیار سازمانی: {selectedRecord.delegationInfo.delegationId}</span>
                    <span className="text-caption bg-primary-100 px-1.5 py-0.5 rounded font-mono">معتبر و فعال</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-caption text-primary-800">
                    <div>
                      تفویض‌کننده: <strong>{selectedRecord.delegationInfo.delegatorName}</strong> ({selectedRecord.delegationInfo.delegatorRole})
                    </div>
                    <div>
                      مجری تفویض‌شده: <strong>{selectedRecord.delegationInfo.delegateeName}</strong>
                    </div>
                    <div>
                      بازه اعتبار: {selectedRecord.delegationInfo.validity}
                    </div>
                    <div>
                      حدود اختیارات: {selectedRecord.delegationInfo.scope}
                    </div>
                  </div>
                </div>
              )}

              {/* Target Responsibility Title */}
              <div className="text-caption text-slate-600 flex items-center gap-2 pt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>حوزه مسئولیت سازمانی هدف:</span>
                <span className="font-semibold text-slate-800">
                  {selectedRecord.targetResponsibilityTitle || 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین'}
                </span>
              </div>
            </div>

            {/* Closure Info Box if Present */}
            {selectedRecord.closureInfo && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1 text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-2 text-emerald-900 border-b border-emerald-200/60 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>اطلاعات خاتمه و مختومه‌سازی پرونده</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-caption text-emerald-800">
                  <div>
                    زمان مختومه شدن: <strong>{selectedRecord.closureInfo.closedAtJalali}</strong>
                  </div>
                  <div>
                    اقدام‌کننده مختومه: <strong>{selectedRecord.closureInfo.closedBy}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    نتیجه کار: <strong>{selectedRecord.closureInfo.workResult}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Info Box if Present */}
            {selectedRecord.cancellationInfo && (
              <div className="bg-slate-100 border border-slate-300 p-3 rounded-xl space-y-1 text-xs text-slate-800">
                <div className="font-bold flex items-center gap-2 text-slate-900 border-b border-slate-300 pb-1">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>اطلاعات ابطال و لغو پرونده</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-caption text-slate-700">
                  <div>
                    زمان ابطال: <strong>{selectedRecord.cancellationInfo.cancelledAtJalali}</strong>
                  </div>
                  <div>
                    مسئول ابطال: <strong>{selectedRecord.cancellationInfo.cancelledBy}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    علت ابطال: <strong>{selectedRecord.cancellationInfo.cancellationReason}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Next Expected Action & Inbox Receiver */}
            <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-xs flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  اقدام مسئولانه بعدی و کارهای من گیرنده
                </span>
                <span className="font-mono text-caption font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                  کارهای من:{' '}
                  {selectedRecord.status === 'draft'
                    ? 'فاقد کارهای من (پیش‌نویس ارجاع نشده)'
                    : selectedRecord.status === 'cancelled'
                    ? 'بایگانی مختومه'
                    : selectedRecord.status === 'supplied'
                    ? 'مختومه (تکمیل شده)'
                    : selectedRecord.currentAssignee?.name || selectedRecord.owner.name}
                </span>
              </div>
              <div className="text-amber-800 text-xs bg-white/70 p-2 rounded border border-amber-200/60">
                {selectedRecord.status === 'draft' &&
                  'تکمیل مشخصات فنی و استعلام اولیه قیمت توسط واحد درخواست‌کننده جهت ثبت و ارجاع قطعی.'}
                {selectedRecord.status === 'assigned' &&
                  `بررسی شرایط بازار و استعلام پیش‌فاکتور رسمی از تأمین‌کننده توسط ${
                    selectedRecord.currentAssignee?.name || 'کارشناس تأمین'
                  }.`}
                {selectedRecord.status === 'in_progress' &&
                  'هماهنگی لجستیک، باسکول و صدور بارنامه حمل به مقصد انبار مرکزی.'}
                {selectedRecord.status === 'partial' &&
                  'پیگیری تحویل پارت دوم محموله و تسویه تفاوت اقلام کسری با تأمین‌کننده.'}
                {selectedRecord.status === 'blocked' &&
                  (selectedRecord.statusReason || 'مسدود: نیازمند طرح در جلسه هیئت مدیره جهت افزایش اعتبار')}
                {selectedRecord.status === 'cancelled' &&
                  (selectedRecord.statusReason || 'ابطال شده — بدون هرگونه انتظار ورود کالا به انبار.')}
                {selectedRecord.status === 'supplied' &&
                  'تأمین تکمیل گردید — اقلام با برگ باسکول و رسید انبار تطبیق داده شده است.'}
              </div>
            </div>

            {/* Trigger & Motivation */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">محرک نیاز و ضرورت تأمین</span>
                {getTriggerBadge(selectedRecord.triggerType)}
              </div>
              <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedRecord.triggerDescription || selectedRecord.reason}
              </p>
              {selectedRecord.warehouseName && (
                <div className="text-caption text-slate-500">
                  انبار مقصد تحویل: <strong className="text-slate-800">{selectedRecord.warehouseName}</strong>
                </div>
              )}

              {/* Evidence: Inventory Shortage Source */}
              {selectedRecord.needSource?.type === 'shortage' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/70 pb-1.5 font-bold text-amber-950">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      مستند رسمی و ارزیابی سیستمی کسری موجودی (Inventory Evidence)
                    </span>
                    <span className="font-mono text-caption bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      {selectedRecord.needSource.snapshotCode || selectedRecord.needSource.snapshotId || 'SNAP-VERIFIED'}
                    </span>
                  </div>

                  {/* Offline & Freshness banner */}
                  <div className="p-2 bg-amber-100/70 border border-amber-300/70 rounded-lg text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold">
                      <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      {selectedRecord.needSource.offlineNotice || 'بر اساس آخرین ثبت موجودی — اتصال برخط فعال نیست.'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                        سامانه: {selectedRecord.needSource.sourceSystem || 'انبار مرکزی'}
                      </span>
                      <span className="font-bold text-caption px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        وضعیت تازگی: {selectedRecord.needSource.freshnessStatus === 'STALE' ? 'منقضی (STALE)' : 'جاری (CURRENT)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-caption">۱. انبار مقصد:</span>
                      <strong>{selectedRecord.needSource.warehouseName || selectedRecord.warehouseName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۲. شناسه مستند رسمی:</span>
                      <strong className="font-mono">{selectedRecord.needSource.snapshotCode || selectedRecord.needSource.snapshotId || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۳. زمان ثبت مستند:</span>
                      <strong>{selectedRecord.needSource.evidenceTimestampJalali || '۱۴۰۴/۰۶/۱۶ - ساعت ۱۰:۳۰'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۴. مرجع و منبع ارزیابی:</span>
                      <strong>{selectedRecord.needSource.evidenceSource || 'کاردکس انبار و ثبت سیستم ERP'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۵. کالای کسری:</span>
                      <strong>{selectedRecord.needSource.productName || selectedRecord.items[0]?.productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۶. موجودی فیزیکی:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {toPersianDigits(selectedRecord.needSource.physicalStock ?? 1500)} {selectedRecord.needSource.unit || 'بطری'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۷. موجودی رزروشده:</span>
                      <span className="font-mono font-bold text-amber-800">
                        {toPersianDigits(selectedRecord.needSource.reservedStock ?? 500)} {selectedRecord.needSource.unit || 'بطری'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۸. موجودی قابل اتکا:</span>
                      <span className="font-mono font-bold text-blue-800">
                        {toPersianDigits(selectedRecord.needSource.availableStock ?? 1000)} {selectedRecord.needSource.unit || 'بطری'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۹. نقطه سفارش (حد ایمنی):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {toPersianDigits(selectedRecord.needSource.orderPoint ?? 5000)} {selectedRecord.needSource.unit || 'بطری'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">۱۰. کسری محاسبه‌شده:</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {toPersianDigits(selectedRecord.needSource.calculatedShortage ?? 4000)} {selectedRecord.needSource.unit || 'بطری'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-caption">۱۱. وضعیت مستند انبار:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {selectedRecord.needSource.snapshotStatus === 'verified' || !selectedRecord.needSource.snapshotStatus
                          ? 'تأییدشده و قطعی در کاردکس انبار'
                          : selectedRecord.needSource.snapshotStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence: Sales Order Commitment */}
              {selectedRecord.needSource?.type === 'sales_order' && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5 font-bold text-slate-950">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-slate-600" />
                      مستند تعهد سفارش فروش و قرارداد مشتری (Sales Order Evidence)
                    </span>
                    <span className="font-mono text-caption bg-slate-200 text-slate-900 px-2 py-0.5 rounded">
                      {selectedRecord.needSource.salesOrderCode || selectedRecord.needSource.salesOrderId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-caption text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-caption">کد سفارش فروش:</span>
                      <strong className="font-mono">{selectedRecord.needSource.salesOrderCode || selectedRecord.needSource.salesOrderId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">مشتری طرف قرارداد:</span>
                      <strong>{selectedRecord.needSource.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">شماره بازنگری:</span>
                      <span className="font-mono font-bold">ویرایش {toPersianDigits(selectedRecord.needSource.revisionNumber || 1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">وضعیت سفارش فروش:</span>
                      <strong className="text-slate-800">{selectedRecord.needSource.orderStatus || 'در حال اجرا'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">وضعیت تأیید سفارش:</span>
                      <strong className="text-emerald-700">
                        {selectedRecord.needSource.approvalStatus === 'APPROVED' || selectedRecord.needSource.approvalStatus === 'approved'
                          ? 'تأییدشده توسط مدیریت فروش و مالی'
                          : selectedRecord.needSource.approvalStatus || 'تأییدشده'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-caption">موعد و شرایط تحویل:</span>
                      <strong>{selectedRecord.needSource.deliveryTerms || selectedRecord.needSource.deliveryDateJalali || 'تحویل انبار مرکزی'}</strong>
                    </div>
                    {selectedRecord.needSource.orderItemsSummary && (
                      <div className="sm:col-span-3 bg-white/80 p-2 rounded border border-slate-100 text-slate-700">
                        <span className="text-slate-500 block text-caption mb-0.5">اقلام و مقادیر تعهدشده در سفارش:</span>
                        <div className="font-medium text-caption">{selectedRecord.needSource.orderItemsSummary}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Work Item Connection Banner */}
            {selectedRecord.linkedWorkItemId && (
              <div className="bg-primary-50 border border-primary-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary-700" />
                  <div>
                    <span className="font-bold text-primary-900 block text-xs">
                      وظیفه مسئولانه در سامانه عملیات ایجاد شد
                    </span>
                    <span className="text-caption text-primary-700 font-mono">
                      شناسه تسک: {selectedRecord.linkedWorkItemId}
                    </span>
                  </div>
                </div>
                {onNavigateToRoute && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => onNavigateToRoute('inbox', selectedRecord.linkedWorkItemId)}
                    className="cursor-pointer flex items-center gap-1"
                  >
                    رفتن به کارهای من
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}

            <QuoteComparison key={selectedRecord.id} requestId={selectedRecord.id} />
            {/* Requested Items & Supplied Breakdown */}
            <details open className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                <span>اقلام درخواستی و وضعیت تحویل فیزیکی ({toPersianDigits(selectedRecord.items.length)} قلم)</span>
                <span className="text-slate-800 font-mono text-caption font-bold">
                  مجموع برآورد: <CurrencyAmount amountRials={selectedRecord.estimatedTotalAmountRials} />
                </span>
              </summary>
              <div className="overflow-x-auto">
                <AdaptiveTable className="w-full text-right text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="p-3">نام و کد کالا</th>
                      <th className="p-3">مقدار درخواستی</th>
                      <th className="p-3">ضریب تبدیل و معادل پایه</th>
                      <th className="p-3">مقدار تأمین‌شده</th>
                      <th className="p-3">برآورد واحد (ریال)</th>
                      <th className="p-3">مبلغ کل سطر (ریال)</th>
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="font-mono text-caption text-slate-500">{item.productCode}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {toPersianDigits(item.quantity)} {item.unit}
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.conversionFactor && item.conversionFactor !== 1 ? (
                            <div className="text-caption space-y-0.5">
                              <div>
                                ضریب: {toPersianDigits(item.conversionFactor)} ({toPersianDigits(item.baseUnitEquivalent || item.quantity * item.conversionFactor)} معادل پایه)
                              </div>
                              {item.sourceRequiredQuantity ? (
                                <div className="text-caption text-primary-700 font-semibold">
                                  نیاز فیزیکی مبدأ: {toPersianDigits(item.sourceRequiredQuantity)} {item.sourceRequiredUnit || 'پایه'}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-caption">ضریب ۱:۱</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              item.suppliedQuantity >= item.quantity
                                ? 'text-emerald-600'
                                : item.suppliedQuantity > 0
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {toPersianDigits(item.suppliedQuantity)} {item.unit}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          <CurrencyAmount amountRials={item.unitPriceEstimateRials || 0} />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {formatRials(
                            item.estimatedLineTotal ||
                              (item.unitPriceEstimateRials || 0) * item.quantity
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-caption">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-800">
                    <tr>
                      <td colSpan={5} className="p-3 text-left">
                        مجموع کل برآورد اقلام:
                      </td>
                      <td className="p-3 font-mono font-bold text-primary-700">
                        <CurrencyAmount amountRials={selectedRecord.estimatedTotalAmountRials} />
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </AdaptiveTable>
              </div>
            </details>

            {/* Connected Records: Order, Logistics, Receipt, Payment */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block">اسناد و فرآیندهای مرتبط (زنجیره تأمین تا پرداخت)</span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Sales Order Link */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-700 font-bold mb-1">
                      <ShoppingBag className="w-4 h-4" />
                      سفارش مشتری
                    </div>
                    {selectedRecord.links.salesOrderId ? (
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        کد: {selectedRecord.links.salesOrderId}
                      </span>
                    ) : (
                      <span className="text-caption text-slate-500 block">سفارش مستقل (بدون ارجاع مشتری)</span>
                    )}
                  </div>
                  {selectedRecord.links.salesOrderId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-2 w-full flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => onNavigateToRoute('sales_orders', selectedRecord.links.salesOrderId)}
                    >
                      مشاهده سفارش
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Logistics Link */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-teal-700 font-bold mb-1">
                      <Truck className="w-4 h-4" />
                      عملیات لجستیک
                    </div>
                    {selectedRecord.links.logisticsId ? (
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        کد: {selectedRecord.links.logisticsId}
                      </span>
                    ) : (
                      <span className="text-caption text-slate-500 block">هنوز ناوگان تخصیص نیافته</span>
                    )}
                  </div>
                  {selectedRecord.links.logisticsId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-2 w-full flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => onNavigateToRoute('logistics_coordination', selectedRecord.links.logisticsId)}
                    >
                      مشاهده حمل
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Warehouse Receipt Link */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-primary-700 font-bold mb-1">
                      <FileText className="w-4 h-4" />
                      رسید انبار
                    </div>
                    {selectedRecord.links.receiptId ? (
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        کد: {selectedRecord.links.receiptId}
                      </span>
                    ) : (
                      <span className="text-caption text-slate-500 block">کالا تحویل انبار نشده</span>
                    )}
                  </div>
                  {selectedRecord.links.receiptId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-2 w-full flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => onNavigateToRoute('inventory_receipts', selectedRecord.links.receiptId)}
                    >
                      مشاهده رسید
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Payment Request Link */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                      <CreditCard className="w-4 h-4" />
                      دستور پرداخت مالی
                    </div>
                    {selectedRecord.links.paymentRequestId ? (
                      <span className="font-mono text-xs font-bold text-slate-800 block">
                        کد: {selectedRecord.links.paymentRequestId}
                      </span>
                    ) : (
                      <span className="text-caption text-slate-500 block">دستور پرداخت صادر نشده</span>
                    )}
                  </div>
                  {selectedRecord.links.paymentRequestId && onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-2 w-full flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => onNavigateToRoute('payment_requests', selectedRecord.links.paymentRequestId)}
                    >
                      مشاهده پرداخت
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Record Supply Result Modal */}
      {isRecordResultModalOpen && selectedRecord && (
        <ModalDialog
          isOpen={isRecordResultModalOpen}
          onClose={() => setIsRecordResultModalOpen(false)}
          title={`ثبت تحویل فیزیکی اقلام و نتیجه نهایی تأمین (${selectedRecord.code})`}
          maxWidth="md"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRecordResultModalOpen(false)}
                className="cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDeliveryResult}
                className="cursor-pointer"
              >
                تأیید و ثبت نتیجه تأمین
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">مقادیر واقعی تأمین و تحویل‌شده</span>
              <div className="space-y-2.5 mt-2">
                {selectedRecord.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 bg-white p-2 rounded border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      <div className="text-caption text-slate-500">
                        سفارش اولیه: {toPersianDigits(it.quantity)} {it.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={deliveryInputs[it.id] ?? it.quantity}
                        onChange={(e) =>
                          setDeliveryInputs({
                            ...deliveryInputs,
                            [it.id]: Number(e.target.value),
                          })
                        }
                        className="w-24 p-1.5 border border-slate-200 rounded font-mono text-center font-bold text-xs"
                      />
                      <span className="text-slate-500 text-caption">{it.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">نتیجه کلی تأمین</label>
              <select
                value={deliveryResultStatus}
                onChange={(e) => setDeliveryResultStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="supplied_complete">تأمین قطعی و کامل (تحویل ۱۰۰٪ اقلام)</option>
                <option value="supplied_partial">تأمین جزئی (کسری پارت سفارش)</option>
                <option value="blocked">مسدود و توقف تأمین</option>
                <option value="cancelled">ابطال سفارش تأمین</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">ملاحظات و توضیحات تحویل</label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                placeholder="توضیحات مربوط به بارنامه، تحویل به انباردار و انطباق کیفی..."
              />
            </FieldGroup>
          </div>
        </ModalDialog>
      )}

      {/* Create Modal: Trigger selection + Role display + Save Draft + Submit & Refer */}
      {isCreateModalOpen && (
        <ModalDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="ایجاد درخواست تأمین کالا (Supply Request)"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="cursor-pointer"
              >
                انصراف
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="cursor-pointer flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  ذخیره پیش‌نویس
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateAndRefer}
                  disabled={!isSubmitValid}
                  className={`cursor-pointer flex items-center gap-2 ${
                    !isSubmitValid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  ارسال برای بررسی
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Validation Banner if Invalid */}
            {!isSubmitValid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900 text-caption">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  {newTriggerType === 'sales_order' && !selectedSalesOrder ? (
                    <p className="font-bold text-amber-950">
                      «انتخاب سفارش فروش مشتری الزامی است.»
                    </p>
                  ) : newTriggerType === 'sales_order' && !salesOrderEligibility?.isEligible ? (
                    <p className="font-bold text-amber-950">
                      «این سفارش هنوز تأیید نهایی نشده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. درخواست را میتوانید بهصورت پیشنویس ذخیره کنید.»
                    </p>
                  ) : newTriggerType === 'shortage' && !selectedSnapshot ? (
                    <p className="font-bold text-amber-950">
                      «انتخاب مستند موجودی الزامی است.»
                    </p>
                  ) : newTriggerType === 'shortage' && selectedSnapshot?.freshnessStatus === 'STALE' ? (
                    <p className="font-bold text-rose-950">
                      «مستند موجودی منقضی (STALE) شده است و نمیتواند مبنای ارجاع قطعی باشد. درخواست را میتوانید بهصورت پیش‌نویس ذخیره کنید.»
                    </p>
                  ) : (
                    <span>
                      جهت «ثبت و ارجاع قطعی»، تکمیل عنوان، انبار، موعد، شرح ضرورت و اطلاعات محرک نیاز الزامی است. (برای ثبت اولیه بدون تکمیل، از «ذخیره پیش‌نویس» استفاده کنید).
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 1. Trigger Selection */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                محرک ثبت درخواست (Trigger) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleTriggerChange('shortage')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    newTriggerType === 'shortage'
                      ? 'border-primary-600 bg-primary-50/70 shadow-none text-primary-950 ring-1 ring-primary-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-xs mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                    کسری موجودی انبار
                  </div>
                  <div className="text-caption text-slate-500">
                    افت موجودی قابل اتکا به زیر نقطه سفارش ایمنی
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerChange('sales_order')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    newTriggerType === 'sales_order'
                      ? 'border-primary-600 bg-primary-50/70 shadow-none text-primary-950 ring-1 ring-primary-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-xs mb-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                    الزام سفارش فروش
                  </div>
                  <div className="text-caption text-slate-500">
                    تعهد تحویل به مشتری و قرارداد فروش قطعی
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerChange('operational_need')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    newTriggerType === 'operational_need'
                      ? 'border-primary-600 bg-primary-50/70 shadow-none text-primary-950 ring-1 ring-primary-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-xs mb-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    نیاز عملیاتی مستقیم
                  </div>
                  <div className="text-caption text-slate-500">
                    شارژ مواد اولیه، کارتن، بطری و ملزومات تولید
                  </div>
                </button>
              </div>
            </div>

            {/* Trigger Details Section */}
            {newTriggerType === 'shortage' && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    انتخاب ارزیابی و کسری موجودی انبار
                  </span>
                  <span className="text-caption text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded font-semibold">
                    الزامی — بر اساس اطلاعات کاردکس
                  </span>
                </div>

                <FieldGroup>
                  <label className="text-caption text-slate-700 font-bold block mb-1">
                    مستند رسمی ارزیابی موجودی انبار را انتخاب کنید <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSnapshotId}
                    onChange={(e) => handleSelectSnapshot(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">-- لطفاً مستند رسمی کسری موجودی کاردکس انبار را انتخاب فرمایید --</option>
                    {MOCK_INVENTORY_SNAPSHOTS.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {snap.code} — {snap.productName} ({snap.warehouseName}) | کسری محاسبه‌شده: {toPersianDigits(snap.calculatedShortage)} {snap.unit}
                      </option>
                    ))}
                  </select>
                </FieldGroup>

                {!selectedSnapshot ? (
                  <div className="p-3 bg-white/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      ثبت دستی اعداد و ارقام مجاز نمی‌باشد. لطفاً یکی از اسناد قطعی کسری کاردکس انبار را انتخاب کنید تا ارقام فیزیکی، تعهد، حد نصاب و کسری به‌صورت مستند درج شوند.
                    </span>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2.5 text-xs">
                    {/* Offline / Connectivity Banner */}
                    <div className="p-3 bg-amber-100/70 border border-amber-300/80 rounded-lg text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-bold">
                        <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
                        {selectedSnapshot.offlineNotice || 'بر اساس آخرین ثبت موجودی — اتصال برخط فعال نیست.'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-caption px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold" data-status={selectedSnapshot.integrationStatus || 'NOT_CONNECTED'}>
                          وضعیت اتصال: متصل نیست (آفلاین)
                        </span>
                        <span
                          className={`font-bold text-caption px-2 py-0.5 rounded ${
                            selectedSnapshot.freshnessStatus === 'STALE'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          تازگی داده: {selectedSnapshot.freshnessStatus === 'STALE' ? 'نیازمند به‌روزرسانی' : 'جاری'}
                        </span>
                      </div>
                    </div>

                    {/* Stale Warning Banner if applicable */}
                    {selectedSnapshot.freshnessStatus === 'STALE' && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center gap-2 text-rose-950">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          مستند منقضی — ثبت و ارجاع قطعی مسدود است
                        </div>
                        <p className="text-rose-800 leading-relaxed font-medium">
                          {snapshotFreshness?.warningMessage ||
                            `این مستند موجودی (${selectedSnapshot.code}) به دلیل گذشت ${selectedSnapshot.snapshotAge}، منقضی شده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. لطفاً مستند ارزیابی جدید انتخاب نمایید یا درخواست را بهصورت پیش‌نویس ذخیره کنید.`}
                        </p>
                        <div className="text-caption text-rose-700 bg-white/80 p-1.5 rounded border border-rose-200 font-medium">
                          دکمه «ارسال برای بررسی» غیرفعال شده است. شما می‌توانید درخواست را به‌صورت پیش‌نویس ذخیره کنید.
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-800">مستند احراز شده: {selectedSnapshot.code}</span>
                      <span className="text-slate-600 font-medium text-caption">
                        سامانه مبدأ: <strong className="text-slate-800">{selectedSnapshot.sourceSystem || selectedSnapshot.evidenceSource}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-caption">۱. انبار مقصد:</span>
                        <strong>{selectedSnapshot.warehouseName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۲. شناسه مستند رسمی:</span>
                        <strong className="font-mono">{selectedSnapshot.code}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۳. زمان ثبت در انبار:</span>
                        <strong>{selectedSnapshot.sourceTimestamp || selectedSnapshot.evidenceTimestampJalali}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۴. زمان ارزیابی کاردکس:</span>
                        <strong>{selectedSnapshot.snapshotAge}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۵. کالای کسری:</span>
                        <strong>{selectedSnapshot.productName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۶. موجودی فیزیکی انبار:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {toPersianDigits(selectedSnapshot.physicalQuantity)} {selectedSnapshot.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۷. موجودی رزرو / تعهد:</span>
                        <span className="font-mono font-bold text-amber-800">
                          {toPersianDigits(selectedSnapshot.reservedQuantity)} {selectedSnapshot.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۸. موجودی قابل اتکا:</span>
                        <span className="font-mono font-bold text-blue-800">
                          {toPersianDigits(selectedSnapshot.availableQuantity)} {selectedSnapshot.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۹. حد نصاب ایمنی (نقطه سفارش):</span>
                        <span className="font-mono font-bold text-slate-800">
                          {toPersianDigits(selectedSnapshot.reorderPoint)} {selectedSnapshot.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">۱۰. کسری محاسبه‌شده:</span>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {toPersianDigits(selectedSnapshot.calculatedShortage)} {selectedSnapshot.unit}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block text-caption">۱۱. وضعیت مستند و کاردکس:</span>
                        <span className="font-bold text-slate-800">
                          {selectedSnapshot.snapshotStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {newTriggerType === 'sales_order' && (
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-950 text-xs flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-600" />
                    انتخاب سفارش فروش مشتری طرف قرارداد (Sales Order Record)
                  </span>
                  <span className="text-caption text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded font-semibold">
                    الزامی — رکورد رسمی سیستم فروش
                  </span>
                </div>

                <FieldGroup>
                  <label className="text-caption text-slate-700 font-bold block mb-1">
                    سفارش فروش تعهدشده را انتخاب فرمایید <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSalesOrderId}
                    onChange={(e) => handleSelectSalesOrder(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                  >
                    <option value="">-- لطفاً سفارش فروش مشتری را انتخاب نمایید (انتخاب از لیست رسمی الزامی است) --</option>
                    {MOCK_SALES_ORDERS.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.code} — {so.customerName} | مبلغ: <CurrencyAmount amountRials={so.totalAmountRials} /> ({so.statusLabel || so.status})
                      </option>
                    ))}
                  </select>
                </FieldGroup>

                {!selectedSalesOrder ? (
                  <div className="p-3 bg-white/80 border border-slate-200 rounded-lg text-xs text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>
                      ورود دستی شماره سفارش مجاز نمی‌باشد. برای رعایت صحت ارتباطات سازمانی، سفارش مشتری باید به‌طور صریح از فهرست رکوردهای رسمی فروش انتخاب شود.
                    </span>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5 text-xs">
                    {/* Blocking Warning Banner if not eligible */}
                    {!salesOrderEligibility?.isEligible && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-1.5">
                        <div className="font-bold flex items-center gap-2 text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          سفارش فروش تأییدنشده — ارجاع قطعی مسدود است
                        </div>
                        <p className="text-amber-900 leading-relaxed font-semibold text-caption">
                          {salesOrderEligibility?.warningMessage ||
                            'این سفارش هنوز تأیید نهایی نشده است و نمیتواند مبنای ارجاع قطعی درخواست تأمین باشد. درخواست را میتوانید بهصورت پیشنویس ذخیره کنید.'}
                        </p>
                        <div className="text-caption text-amber-800 bg-white/80 p-2 rounded border border-amber-200 flex items-center justify-between">
                          <span>
                            وضعیت تأیید جاری: <strong className="font-mono">{salesOrderEligibility?.approvalStatus}</strong> | شماره بازنگری: <strong className="font-mono">ویرایش {toPersianDigits(salesOrderEligibility?.revisionNumber || 1)}</strong>
                          </span>
                          <span className="font-bold text-amber-700">امکان «ذخیره پیش‌نویس» فعال است</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-800">مشخصات سفارش فروش: {selectedSalesOrder.code}</span>
                      <span className="text-slate-800 font-bold text-caption bg-slate-100 px-2 py-0.5 rounded">
                        {selectedSalesOrder.statusLabel || selectedSalesOrder.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-caption text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-caption">کد سفارش فروش:</span>
                        <strong className="font-mono">{selectedSalesOrder.code}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">مشتری طرف قرارداد:</span>
                        <strong>{selectedSalesOrder.customerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">شماره بازنگری:</span>
                        <span className="font-mono font-bold">ویرایش {toPersianDigits(selectedSalesOrder.revisions?.[0]?.revisionNumber || 1)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">وضعیت سفارش فروش:</span>
                        <strong className="text-slate-800">{selectedSalesOrder.statusLabel || selectedSalesOrder.status}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">وضعیت تأیید سفارش:</span>
                        <strong
                          className={
                            salesOrderEligibility?.isEligible
                              ? 'text-emerald-700'
                              : 'text-amber-700 font-bold'
                          }
                        >
                          {selectedSalesOrder.approvalStatus === 'APPROVED' || selectedSalesOrder.approvalStatus === 'FINAL_APPROVED'
                            ? 'تأییدشده توسط مدیریت فروش و مالی (APPROVED)'
                            : selectedSalesOrder.approvalStatus === 'PRICE_APPROVAL_REQUIRED'
                            ? 'نیازمند تأیید قیمت (PRICE_APPROVAL_REQUIRED)'
                            : selectedSalesOrder.approvalStatus || 'در انتظار تأیید (PENDING_APPROVAL)'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-caption">موعد و شرایط تحویل:</span>
                        <strong>{selectedSalesOrder.deliveryTerms || selectedSalesOrder.deliveryAddress || 'تحویل انبار مرکزی'}</strong>
                      </div>
                    </div>

                    {selectedSalesOrder.items && selectedSalesOrder.items.length > 0 && (
                      <div className="mt-2 bg-slate-50/50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 block text-caption font-bold mb-1">اقلام و مقادیر تعهدشده در قرارداد:</span>
                        <div className="space-y-1">
                          {selectedSalesOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-caption text-slate-950 font-medium bg-white/70 px-2 py-0.5 rounded">
                              <span>{item.productName}</span>
                              <span className="font-mono font-bold text-slate-800">
                                {toPersianDigits(item.cartons || item.pieces || 0)} {item.unit || 'کارتن'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {newTriggerType === 'operational_need' && (
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                <span className="font-bold text-sky-900 block text-xs">
                  اطلاعات نیاز واحد عملیاتی:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <FieldGroup>
                    <label className="text-caption text-slate-500 block">واحد متقاضی عملیاتی</label>
                    <input
                      type="text"
                      value={requestingUnit}
                      onChange={(e) => setRequestingUnit(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <label className="text-caption text-slate-500 block">مرکز هزینه</label>
                    <input
                      type="text"
                      value={costCenter}
                      onChange={(e) => setCostCenter(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </FieldGroup>
                </div>
              </div>
            )}

            {/* Role & Responsibility Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-caption">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-800">تفکیک مسئولیت و مسیر گردش ارجاع:</span>
                <span className="text-primary-700 font-semibold">
                  {opsRespArea?.title || 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-600">
                <div>
                  <span className="text-slate-500 block text-caption">۱. ثبت‌کننده (کاربر جاری):</span>
                  <strong className="text-slate-900">{getPersonaDisplayName(activePersona)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">۲. صاحب کار پاسخ‌گو (Owner):</span>
                  <strong className="text-slate-900">{accountableOwnerName}</strong> ({accountableOwnerRole})
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">۳. مجری در صورت ارجاع قطعی:</span>
                  <strong className="text-primary-800">{eligibleAssigneeName}</strong>
                  <span className="text-caption text-primary-700 block mt-0.5">
                    {activeDelegation ? `(جانشین تفویض‌شده مطابق حکم ${activeDelegation.id})` : '(مدیر مسئول)'}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-caption bg-primary-50/60 p-2 rounded text-primary-900 flex items-center gap-2 border border-primary-100">
                <Info className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                <span>
                  نکته: در صورت ذخیره به عنوان <strong>«پیش‌نویس»</strong>، هیچ وظیفه‌ای در کارهای من ایجاد نخواهد شد و پرونده بدون مجری باقی می‌ماند. با انتخاب <strong>«ثبت و ارجاع»</strong>، وظیفه فوراً به کارهای من ارجاع می‌گردد.
                </span>
              </div>
            </div>

            {/* Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">
                  عنوان درخواست تأمین <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: خرید روغن آفتابگردان خام تانکری یا کارتن‌های روغن سرخ‌کردنی ۱.۵ لیتری"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-primary-500"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">اولویت نیاز</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="urgent">فوری و اضطراری</option>
                  <option value="high">اولویت بالا</option>
                  <option value="normal">عادی</option>
                  <option value="low">کم</option>
                </select>
              </FieldGroup>
            </div>

            {/* Warehouse & Required Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">
                  انبار مقصد تحویل <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newWarehouseId}
                  onChange={(e) => setNewWarehouseId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-primary-500 cursor-pointer"
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
                  موعد الزام تحویل (شمسی) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRequiredDate}
                  onChange={(e) => setNewRequiredDate(e.target.value)}
                  placeholder="مثال: ۱۴۰۴/۰۶/۲۵"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none focus:border-primary-500"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">تأمین‌کننده پیشنهادی</label>
                <select
                  value={newSupplierId}
                  onChange={(e) => setNewSupplierId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Reason */}
            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">
                شرح ضرورت و علت خرید <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="دلایل ضرورت تأمین، ارتباط با کسری خطوط یا قراردادهای فروش را شرح دهید..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-primary-500"
              />
            </FieldGroup>

            {/* Dynamic Items */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>اقلام درخواستی خوراکی و ملزومات ({toPersianDigits(newItems.length)} قلم)</span>
                <button
                  type="button"
                  onClick={() =>
                    setNewItems([
                      ...newItems,
                      {
                        productId: MOCK_PRODUCTS[0]?.id || '',
                        quantity: 100,
                        unit: MOCK_PRODUCTS[0]?.baseUnit || 'کیلوگرم',
                        conversionFactor: 1,
                        baseUnitEquivalent: 100,
                        estimatedPrice: MOCK_PRODUCTS[0]?.currentPriceRials || 400000,
                        notes: '',
                      },
                    ])
                  }
                  className="text-xs text-primary-700 hover:text-primary-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن ردیف کالا
                </button>
              </div>

              {newItems.map((it, idx) => {
                const product = MOCK_PRODUCTS.find((p) => p.id === it.productId);
                const supportedUnits = getProductSupportedUnits(product);
                const isUnitSupported = supportedUnits.some((u) => u.unit === it.unit);
                const hasValidConversion = (it.conversionFactor || 0) > 0;

                return (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5">
                    {it.isSourceDerived && (
                      <div className="p-3 bg-primary-50/80 border border-primary-200 rounded-lg text-xs text-primary-950 space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption">
                          <div className="bg-white p-2 rounded border border-primary-100/80 shadow-none">
                            <span className="text-slate-500 block text-caption">مقدار قطعی مبدأ:</span>
                            <strong className="font-mono text-primary-950 font-bold text-xs">
                              {toPersianDigits(it.sourceQuantity ?? it.sourceRequiredQuantity ?? 0)}
                            </strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-primary-100/80 shadow-none">
                            <span className="text-slate-500 block text-caption">واحد قطعی مبدأ:</span>
                            <strong className="text-primary-950 font-bold text-xs">
                              {it.sourceUnit ?? it.sourceRequiredUnit ?? product?.baseUnit}
                            </strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-primary-100/80 shadow-none">
                            <span className="text-slate-500 block text-caption">مقدار پیشنهادی خرید:</span>
                            <strong className="font-mono text-primary-950 font-bold text-xs">
                              {toPersianDigits(it.selectedProcurementQuantity ?? it.quantity)}
                            </strong>
                          </div>
                          <div className="bg-white p-2 rounded border border-primary-100/80 shadow-none">
                            <span className="text-slate-500 block text-caption">واحد پیشنهادی خرید:</span>
                            <strong className="text-primary-950 font-bold text-xs">
                              {it.selectedProcurementUnit ?? it.unit}
                            </strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-caption pt-1.5 border-t border-primary-100">
                          <div className="flex items-center gap-3">
                            <span>
                              معادل واحد پایه:{' '}
                              <strong className="font-mono font-bold text-slate-800">
                                {toPersianDigits(it.resultingBaseQuantity ?? it.baseUnitEquivalent)} {product?.baseUnit}
                              </strong>
                            </span>
                            <span>
                              اختلاف ناشی از گردکردن:{' '}
                              <strong className="font-mono font-bold text-slate-800">
                                {toPersianDigits(Number((it.roundingDifference || 0).toFixed(2)))} {product?.baseUnit}
                              </strong>
                              {(it.roundingDifference || 0) > 0 && (
                                <span className="text-caption text-primary-700 font-semibold mr-1">
                                  (+{toPersianDigits(Number((it.roundingDifference || 0).toFixed(2)))} {product?.baseUnit} مازاد بسته کامل)
                                </span>
                              )}
                            </span>
                          </div>

                          {it.conversionFactor > 1 && (
                            <div className="flex items-center gap-2 text-caption">
                              <span className="text-slate-600 font-semibold">قاعده تبدیل بسته:</span>
                              <select
                                value={it.roundingPolicy || 'ROUND_UP_FULL_UNIT'}
                                onChange={(e) => {
                                  const updated = [...newItems];
                                  const newPolicy = e.target.value as 'ROUND_UP_FULL_UNIT' | 'FRACTIONAL_PERMITTED';
                                  const prod = MOCK_PRODUCTS.find((p) => p.id === updated[idx].productId);
                                  updated[idx] = recalculateItemForUnit(
                                    updated[idx],
                                    updated[idx].unit,
                                    prod,
                                    newPolicy
                                  );
                                  setNewItems(updated);
                                }}
                                className="p-1 bg-white border border-primary-200 rounded font-medium text-caption cursor-pointer text-primary-900"
                              >
                                <option value="ROUND_UP_FULL_UNIT">
                                  بسته کامل ({toPersianDigits(Math.ceil((it.sourceQuantity ?? it.sourceRequiredQuantity ?? 0) / it.conversionFactor))} {it.unit})
                                </option>
                                <option value="FRACTIONAL_PERMITTED">
                                  واحد کسری دقیق ({toPersianDigits(Number(((it.sourceQuantity ?? it.sourceRequiredQuantity ?? 0) / it.conversionFactor).toFixed(3)))} {it.unit})
                                </option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <FieldGroup className="sm:col-span-4">
                        <label className="text-caption text-slate-500 block">انتخاب محصول کاتالوگ</label>
                        <select
                          value={it.productId}
                          onChange={(e) => {
                            const updated = [...newItems];
                            const pId = e.target.value;
                            const prod = MOCK_PRODUCTS.find((p) => p.id === pId);
                            const units = getProductSupportedUnits(prod);
                            const firstUnit = units[0];
                            updated[idx].productId = pId;
                            if (firstUnit) {
                              updated[idx].unit = firstUnit.unit;
                              updated[idx].conversionFactor = firstUnit.conversionFactor;
                              updated[idx].estimatedPrice = firstUnit.defaultPrice;
                              updated[idx].isSourceDerived = false;
                              updated[idx].sourceRequiredQuantity = updated[idx].quantity * firstUnit.conversionFactor;
                              updated[idx].sourceRequiredUnit = prod?.baseUnit || firstUnit.unit;
                              updated[idx].selectedProcurementQuantity = updated[idx].quantity;
                              updated[idx].selectedProcurementUnit = firstUnit.unit;
                              updated[idx].resultingBaseQuantity = updated[idx].quantity * firstUnit.conversionFactor;
                              updated[idx].baseUnitEquivalent = updated[idx].quantity * firstUnit.conversionFactor;
                              updated[idx].roundingDifference = 0;
                            }
                            setNewItems(updated);
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-medium"
                        >
                          {MOCK_PRODUCTS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </FieldGroup>

                      <FieldGroup className="sm:col-span-3">
                        <label className="text-caption text-slate-500 block">واحد اندازه‌گیری (Unit)</label>
                        <select
                          value={it.unit}
                          onChange={(e) => {
                            const updated = [...newItems];
                            const selectedUnitName = e.target.value;
                            const prod = MOCK_PRODUCTS.find((p) => p.id === updated[idx].productId);
                            updated[idx] = recalculateItemForUnit(
                              updated[idx],
                              selectedUnitName,
                              prod,
                              updated[idx].roundingPolicy || 'ROUND_UP_FULL_UNIT'
                            );
                            setNewItems(updated);
                          }}
                          className={`w-full p-1.5 bg-slate-50 border rounded text-xs cursor-pointer font-medium ${
                            !isUnitSupported ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200'
                          }`}
                        >
                          {supportedUnits.map((u) => (
                            <option key={u.unit} value={u.unit}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </FieldGroup>

                      <div className="sm:col-span-2">
                        <label className="text-caption text-slate-500 block">ضریب تبدیل واحد</label>
                        <div
                          className={`p-1.5 border rounded text-xs font-mono text-center font-bold ${
                            hasValidConversion
                              ? 'bg-slate-100 border-slate-200 text-slate-800'
                              : 'bg-rose-50 border-rose-300 text-rose-700'
                          }`}
                        >
                          {hasValidConversion ? toPersianDigits(it.conversionFactor) : 'نامعتبر'}
                        </div>
                      </div>

                      <FieldGroup className="sm:col-span-1">
                        <label className="text-caption text-slate-500 block">مقدار ({it.unit})</label>
                        <input
                          type="number"
                          step="any"
                          min={0.001}
                          value={it.quantity}
                          onChange={(e) => {
                            const updated = [...newItems];
                            const q = Math.max(0.001, Number(e.target.value));
                            updated[idx].quantity = q;
                            updated[idx].selectedProcurementQuantity = q;
                            const conv = updated[idx].conversionFactor || 1;
                            const resultingBase = q * conv;
                            updated[idx].resultingBaseQuantity = resultingBase;
                            updated[idx].baseUnitEquivalent = resultingBase;
                            if (updated[idx].isSourceDerived && (updated[idx].sourceQuantity !== undefined || (updated[idx].sourceRequiredQuantity || 0) > 0)) {
                              const baseReq = (updated[idx].sourceQuantity ?? updated[idx].sourceRequiredQuantity ?? 0) * (updated[idx].sourceConversionFactor || 1);
                              updated[idx].roundingDifference = resultingBase - baseReq;
                            } else {
                              updated[idx].sourceRequiredQuantity = resultingBase;
                              updated[idx].roundingDifference = 0;
                            }
                            setNewItems(updated);
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-center font-bold"
                        />
                      </FieldGroup>

                      <FieldGroup className="sm:col-span-2">
                        <label className="text-caption text-slate-500 block">نرخ هر {it.unit} (ریال)</label>
                        <input
                          type="number"
                          min={0}
                          value={it.estimatedPrice}
                          onChange={(e) => {
                            const updated = [...newItems];
                            updated[idx].estimatedPrice = Number(e.target.value);
                            setNewItems(updated);
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-left font-bold"
                        />
                      </FieldGroup>
                    </div>

                    {(!isUnitSupported || !hasValidConversion) && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-caption text-rose-700 font-medium">
                        خطا: واحد انتخابی برای این محصول تعریف نشده یا ضریب تبدیل آن نامعتبر است. ثبت درخواست مسدود می‌باشد.
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-caption text-slate-500 pt-1 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        {newItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="حذف سطر کالا"
                           aria-label="حذف سطر کالا">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span>
                          معادل فیزیکی واحد پایه ({product?.baseUnit}):{' '}
                          <strong className="text-slate-800 font-mono font-bold">
                            {toPersianDigits(it.resultingBaseQuantity ?? it.baseUnitEquivalent)} {product?.baseUnit}
                          </strong>
                          {it.conversionFactor > 1 && (
                            <span className="text-caption text-slate-500 mr-1.5">
                              ({toPersianDigits(it.quantity)} {it.unit} × {toPersianDigits(it.conversionFactor)})
                            </span>
                          )}
                          {it.isSourceDerived && (it.roundingDifference || 0) > 0 && (
                            <span className="text-caption text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-bold mr-1.5">
                              +{toPersianDigits(Number(it.roundingDifference?.toFixed(2)))} {product?.baseUnit} مازاد بسته کامل
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        مبلغ کل سطر:{' '}
                        <strong className="font-mono text-primary-900 font-bold text-xs">
                          <CurrencyAmount amountRials={it.quantity * (it.estimatedPrice || 0)} />
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-2 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between font-bold text-primary-950 text-xs">
                <span>مجموع برآورد ریالی اقلام:</span>
                <span className="font-mono text-sm">
                  {formatRials(
                    newItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.estimatedPrice || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
