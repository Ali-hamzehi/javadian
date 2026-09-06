import {
  SupplyRequestRecord,
  SupplyPriority,
  SupplyTriggerType,
  SupplyResult,
  SupplyNeedSource,
  LogisticsRecord,
  LogisticsCoordinationStatus,
  LogisticsType,
  WarehouseReceiptRecord,
  ReceiptItemResult,
  ReceiptApprovalStage,
  ReceiptApprovalStageType,
  Person,
  MockPersona,
  OperationalRecord,
} from '../types';
import {
  MOCK_SUPPLY_REQUESTS,
  MOCK_LOGISTICS_RECORDS,
  MOCK_WAREHOUSE_RECEIPTS,
} from './mockSupplyLogisticsData';
import { MOCK_PRODUCTS, MOCK_SUPPLIERS, MOCK_WAREHOUSES } from './mockMasterData';
import { mockRepository } from './mockRepository';
import { mockOrgStore } from './mockOrgStore';
import { MOCK_RESPONSIBILITY_AREAS } from './mockOrgData';

export interface CreateSupplyRequestPayload {
  title: string;
  triggerType: SupplyTriggerType;
  triggerDescription: string;
  creatorPersona: MockPersona;
  targetResponsibilityTitle?: string;
  ownerName?: string;
  ownerId?: string;
  currentAssigneeName?: string;
  currentAssigneeId?: string;
  requiredDateJalali: string;
  priority: SupplyPriority;
  reason: string;
  supplierId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unit: string;
    conversionFactor?: number;
    baseUnitEquivalent?: number;
    estimatedPrice?: number;
    notes?: string;
  }>;
  warehouseId?: string;
  warehouseName?: string;
  salesOrderId?: string;
  customerName?: string;
  needSource?: SupplyNeedSource;
}

export interface CreateWarehouseReceiptPayload {
  internalNumber?: string;
  dateJalali?: string;
  warehouseId: string;
  supplierId: string;
  purchaseConditions: string;
  purchaseRef: string;
  relatedSupplyRef?: string;
  externalTradeReference?: string;
  externalWarehouseReference?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  waybillNumber: string;
  freightAmountRials: number;
  deliveryType: string;
  unloadingDestination: string;
  unloadingSupervisor: string;
  weighbridgeGrossKg: number;
  weighbridgeTareKg: number;
  items: Array<{
    productId: string;
    cartons: number;
    pieces: number;
    unit: string;
    expectedQuantity: number;
    actualQuantity: number;
    purchasePriceRials: number;
    itemResult: ReceiptItemResult;
    notes?: string;
  }>;
  overallResult: ReceiptItemResult;
  attachments: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  creatorPersona: MockPersona;
}

export interface CreateLogisticsPayload {
  type: LogisticsType;
  title: string;
  originCity: string;
  originName: string;
  originAddress: string;
  destinationCity: string;
  destinationName: string;
  destinationAddress: string;
  driverName: string;
  driverPhone: string;
  driverLicensePlate: string;
  vehicleType: string;
  vehicleCapacityTons: number;
  waybillNumber: string;
  freightAmountRials: number;
  paymentMethod: 'پیش‌کرایه' | 'پس‌کرایه' | 'تسویه باربری اعتباری';
  payer: 'شرکت جوادیان' | 'مشتری' | 'تأمین‌کننده';
  coordinationStatus: LogisticsCoordinationStatus;
  supplyRequestId?: string;
  salesOrderId?: string;
  receiptId?: string;
  creatorPersona: MockPersona;
}

export const INITIAL_APPROVAL_STAGES_PRESET: ReceiptApprovalStage[] = [
  {
    id: 'stage-1',
    stageIndex: 1,
    stageType: 'acknowledgement',
    stageTypeLabel: 'رسید و تصدیق تحویل',
    roleKey: 'driver_ack',
    roleTitle: 'رسید تحویل راننده',
    assignedPersonName: 'راننده ناوگان باربری',
    isMandatory: true,
    status: 'signed',
    signedBy: {
      id: 'driver-01',
      name: 'اکبر قلی‌پور (راننده تریلی)',
      role: 'راننده ناوگان حمل بار',
      department: 'پیمانکار حمل و نقل',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۱:۴۵',
    notes: 'تخلیه ۴۰۰ کارتن روغن سرخ‌کردنی و ۲۵۰ کارتن روغن پخت‌وپز بر روی سکو تصدیق می‌گردد.',
  },
  {
    id: 'stage-2',
    stageIndex: 2,
    stageType: 'operational_review',
    stageTypeLabel: 'بررسی میدانی و انبارداری',
    roleKey: 'warehouse_keeper',
    roleTitle: 'انباردار و متصدی تخلیه',
    assignedPersonName: 'کامران داوودی',
    isMandatory: true,
    status: 'signed',
    signedBy: {
      id: 'p-wh',
      name: 'کامران داوودی',
      role: 'سرپرست انبار کهریزک',
      department: 'انبار و لجستیک',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۲:۰۰',
    notes: 'شمارش فیزیکی، کنترل پالت‌ها و تطبیق با بارنامه جاده‌ای بدون مغایرت انجام شد.',
  },
  {
    id: 'stage-3',
    stageIndex: 3,
    stageType: 'formal_approval',
    stageTypeLabel: 'تصویب رسمی بازرگانی',
    roleKey: 'management_approver',
    roleTitle: 'معاونت بازرگانی و خرید',
    assignedPersonName: 'سهراب جوادیان',
    isMandatory: true,
    status: 'signed',
    signedBy: {
      id: 'p-comm-approver',
      name: 'سهراب جوادیان',
      role: 'مدیر بازرگانی',
      department: 'فروش و بازرگانی',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۲:۳۰',
    notes: 'انطباق با سفارش خرید شماره PO-OIL-44120 و نرخ توافقی تأیید می‌شود.',
  },
  {
    id: 'stage-4',
    stageIndex: 4,
    stageType: 'formal_approval',
    stageTypeLabel: 'تصویب نهایی مدیریت',
    roleKey: 'ceo',
    roleTitle: 'مدیرعامل / مقام مجاز',
    assignedPersonName: 'دکتر محمدرضا جوادیان',
    isMandatory: true,
    status: 'signed',
    signedBy: {
      id: 'p-ceo',
      name: 'دکتر محمدرضا جوادیان',
      role: 'مدیرعامل',
      department: 'مدیریت ارشد',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۳:۰۰',
    notes: 'تصویب قطعی ورود به انبار و صدور دستور پرداخت هزینه حمل و تسویه فاکتور.',
  },
  {
    id: 'stage-opt-1',
    stageIndex: 5,
    stageType: 'operational_review',
    stageTypeLabel: 'بررسی کارشناسی (اختیاری)',
    roleKey: 'qc_reviewer',
    roleTitle: 'کنترل کیفیت و بهداشت (اختیاری)',
    assignedPersonName: 'مهندس سارا نادری',
    isMandatory: false,
    status: 'signed',
    signedBy: {
      id: 'p-qc',
      name: 'مهندس سارا نادری',
      role: 'کارشناس کنترل کیفیت',
      department: 'تولید و کیفیت',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۲:۱۵',
    notes: 'آزمون اسیدیته و عدد پراکسید روغن استاندارد بود.',
  },
  {
    id: 'stage-opt-2',
    stageIndex: 6,
    stageType: 'operational_review',
    stageTypeLabel: 'بررسی کارشناسی (اختیاری)',
    roleKey: 'procurement_reviewer',
    roleTitle: 'هماهنگی عملیات و تأمین (تفویض اختیارات)',
    assignedPersonName: 'محسن راد (جانشین تفویض‌شده عملیات)',
    isMandatory: false,
    status: 'signed',
    signedBy: {
      id: 'p-multi-delegate',
      name: 'محسن راد',
      role: 'سرپرست هماهنگی عملیات',
      department: 'معاونت عملیات و زنجیره تأمین',
    },
    signedAtJalali: '۱۴۰۴/۰۶/۱۲',
    signedAtTime: '۱۲:۲۰',
    notes: 'مفاد پیش‌فاکتور و تخفیف با شرکت سازنده کنترل گردید.',
  },
];

class MockSupplyReceiptStore {
  private supplyRequests: SupplyRequestRecord[] = [];
  private warehouseReceipts: WarehouseReceiptRecord[] = [];
  private logisticsRecords: LogisticsRecord[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // 1. Initialize supply requests adhering strictly to lifecycle rules
    this.supplyRequests = MOCK_SUPPLY_REQUESTS.map((req) => {
      let currentAssignee = req.currentAssignee;
      let supplyResult = req.supplyResult;
      let linkedWorkItemId = req.linkedWorkItemId;

      if (req.status === 'draft') {
        currentAssignee = undefined;
        supplyResult = undefined;
        linkedWorkItemId = undefined;
      } else if (req.status === 'supplied') {
        currentAssignee = undefined;
        supplyResult = 'supplied_complete';
        linkedWorkItemId = undefined;
      } else if (req.status === 'cancelled') {
        currentAssignee = undefined;
        supplyResult = 'cancelled';
        linkedWorkItemId = undefined;
      }

      return {
        ...req,
        creator: req.creator || req.requester,
        owner: req.owner,
        currentAssignee,
        supplyResult,
        linkedWorkItemId,
        targetResponsibilityTitle: req.targetResponsibilityTitle || 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین',
        warehouseId: req.warehouseId || 'wh-01',
        warehouseName: req.warehouseName || 'انبار مرکزی توزیع و سالن نگهداری کهریزک',
        customerName: req.customerName || (req.links.salesOrderId ? 'فروشگاه‌های زنجیره‌ای مروارید سرو' : undefined),
        items: (req.items || []).map((it) => {
          const reqQty = it.quantity || 1000;
          const supQty = it.suppliedQuantity || 0;
          const conv = it.conversionFactor ?? 1;
          const price = it.unitPriceEstimateRials ?? 400000;
          const lineTotal = it.estimatedLineTotal ?? (reqQty * price);
          return {
            ...it,
            requestedQuantity: it.requestedQuantity ?? reqQty,
            approvedQuantity: it.approvedQuantity ?? reqQty,
            orderedQuantity: it.orderedQuantity ?? reqQty,
            receivedQuantity: it.receivedQuantity ?? supQty,
            remainingQuantity: it.remainingQuantity ?? Math.max(0, reqQty - supQty),
            conversionFactor: conv,
            baseUnitEquivalent: it.baseUnitEquivalent ?? (reqQty * conv),
            priceUnit: it.priceUnit ?? it.unit,
            unitPriceEstimateRials: price,
            estimatedLineTotal: lineTotal,
          };
        }),
      };
    });

    // 2. Initialize warehouse receipts with the source evidence signature pattern
    this.warehouseReceipts = MOCK_WAREHOUSE_RECEIPTS.map((rec, idx) => {
      const isFirst = idx === 0;
      const stages: ReceiptApprovalStage[] = INITIAL_APPROVAL_STAGES_PRESET.map((stage) => {
        if (isFirst) return { ...stage };
        // For subsequent records, show pending / partial
        if (stage.stageIndex === 1 || stage.stageIndex === 2) {
          return { ...stage, status: 'signed' as const };
        }
        return {
          ...stage,
          status: 'pending' as const,
          signedBy: undefined,
          signedAtJalali: undefined,
          signedAtTime: undefined,
          notes: undefined,
        };
      });

      return {
        ...rec,
        externalTradeReference: isFirst ? 'TRD-1403-998124' : 'TRD-1403-882104',
        externalWarehouseReference: isFirst ? 'WHS-IR-001923' : 'WHS-IR-001850',
        approvalStages: stages,
        approvalPatternLabel:
          'شواهد امضای سند مبدأ (راننده، انباردار، مقام تأییدکننده، مدیرعامل) — ترتیب تأیید نیازمند تأیید کارفرما',
        financialIntegrationStatus: 'not_registered' as const,
        parsinaRefPlaceholder: 'ثبت نشده در پارسینا — اتصال API برقرار نیست',
      };
    });

    // 3. Initialize logistics
    this.logisticsRecords = [...MOCK_LOGISTICS_RECORDS];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ================= SUPPLY REQUESTS =================

  public getSupplyRequests(): SupplyRequestRecord[] {
    return [...this.supplyRequests];
  }

  public getSupplyRequestById(id: string): SupplyRequestRecord | undefined {
    return this.supplyRequests.find((r) => r.id === id);
  }

  public createSupplyRequest(
    payload: CreateSupplyRequestPayload,
    isDraft?: boolean
  ): {
    supplyRequest: SupplyRequestRecord;
    workItem?: OperationalRecord;
  } {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const newCode = `SUP-1403-${codeNum}`;
    const newId = `sup-${Date.now()}`;

    // Resolve accountable owner from Responsibility Area
    const respArea = MOCK_RESPONSIBILITY_AREAS.find((r) => r.id === 'resp-operations');
    const defaultOwner: Person = {
      id: payload.ownerId || respArea?.primaryResponsiblePersonId || 'p-ops-dir',
      name: payload.ownerName || 'مهندس حامد اسدی',
      role: 'مدیر ارشد عملیات و زنجیره تأمین',
      department: respArea?.unitName || 'معاونت عملیات و زنجیره تأمین',
    };

    // Check if there is an active delegation targeting this responsibility
    let currentAssignee: Person = { ...defaultOwner };
    const delegations = mockOrgStore.getDelegations();
    const activeDel = delegations.find(
      (d) =>
        d.status === 'active' &&
        (d.title.includes('عملیات') ||
          d.authorizedScope.includes('تأمین') ||
          d.delegator.id === 'p-ops-dir')
    );
    if (activeDel) {
      currentAssignee = {
        id: activeDel.delegatee.id || 'p-multi-delegate',
        name: activeDel.delegatee.name || 'محسن راد',
        role: `${activeDel.delegatee.role} (جانشین تفویض‌شده)`,
        department: activeDel.delegatee.department || 'معاونت عملیات و زنجیره تأمین',
      };
    }

    const creatorPerson: Person = {
      id: payload.creatorPersona.id,
      name: payload.creatorPersona.name,
      role: payload.creatorPersona.jobTitle,
      department: payload.creatorPersona.department,
    };

    // Build items with conversion factor, base equivalent, price unit, and line total
    const formattedItems = payload.items.map((it, idx) => {
      const prd = MOCK_PRODUCTS.find((p) => p.id === it.productId) || MOCK_PRODUCTS[0];
      const q = Number(it.quantity) || 0;
      const conv = it.conversionFactor ?? 1;
      const baseEq = it.baseUnitEquivalent ?? (q * conv);
      const unitPrice = Number(it.estimatedPrice) || prd.currentPriceRials || 400000;
      const lineTotal = q * unitPrice;

      return {
        id: `item-${newId}-${idx}`,
        productId: prd.id,
        productCode: prd.code,
        productName: prd.name,
        quantity: q,
        requestedQuantity: q,
        approvedQuantity: isDraft ? 0 : q,
        orderedQuantity: isDraft ? 0 : q,
        receivedQuantity: 0,
        remainingQuantity: q,
        unit: it.unit || prd.baseUnit || 'کیلوگرم',
        conversionFactor: conv,
        baseUnitEquivalent: baseEq,
        priceUnit: it.unit || prd.baseUnit || 'کیلوگرم',
        suppliedQuantity: 0,
        unitPriceEstimateRials: unitPrice,
        estimatedLineTotal: lineTotal,
        notes: it.notes || '',

        // Physical Quantity preservation fields
        sourceRequiredQuantity: (it as any).sourceRequiredQuantity,
        sourceRequiredUnit: (it as any).sourceRequiredUnit,
        selectedProcurementQuantity: (it as any).selectedProcurementQuantity ?? q,
        selectedProcurementUnit: (it as any).selectedProcurementUnit ?? (it.unit || prd.baseUnit),
        resultingBaseQuantity: (it as any).resultingBaseQuantity ?? baseEq,
        roundingDifference: (it as any).roundingDifference ?? 0,
        roundingPolicy: (it as any).roundingPolicy,
        isSourceDerived: (it as any).isSourceDerived,
      };
    });

    const totalEst = formattedItems.reduce(
      (sum, item) => sum + (item.estimatedLineTotal || 0),
      0
    );

    const supObj = payload.supplierId
      ? MOCK_SUPPLIERS.find((s) => s.id === payload.supplierId)
      : undefined;

    // 1. Create SupplyRequestRecord
    const newSupplyRequest: SupplyRequestRecord = {
      id: newId,
      code: newCode,
      title: payload.title,
      triggerType: payload.triggerType,
      triggerDescription: payload.triggerDescription,
      creator: creatorPerson,
      requester: creatorPerson,
      owner: defaultOwner,
      currentAssignee: isDraft ? undefined : currentAssignee,
      targetResponsibilityTitle:
        payload.targetResponsibilityTitle || 'مسئولیت تدارکات، خرید مواد اولیه و ملزومات خوراکی',
      fallbackOwner: {
        id: 'p-supp-lead',
        name: 'مهندس کیوان رستمی',
        role: 'سرپرست خرید و تأمین',
        department: 'زنجیره تأمین',
      },
      selectedSupplier: supObj
        ? {
            id: supObj.id,
            name: supObj.name,
            code: supObj.code,
            phone: supObj.phone,
          }
        : undefined,
      requiredDateJalali: payload.requiredDateJalali,
      priority: payload.priority,
      reason: payload.reason,
      status: isDraft ? 'draft' : 'assigned',
      statusReason: isDraft
        ? 'پیش‌نویس اولیه — هنوز ارسال و ارجاع نشده است'
        : `ثبت و ارجاع به ${currentAssignee.name} جهت استعلام قیمت و خرید`,
      supplyResult: isDraft ? undefined : 'pending',
      items: formattedItems,
      estimatedTotalAmountRials: totalEst,
      createdAtJalali: 'هم‌اکنون',
      warehouseId: payload.warehouseId,
      warehouseName: payload.warehouseName,
      customerName: payload.customerName,
      needSource: payload.needSource,
      links: {
        salesOrderId: payload.salesOrderId,
        warehouseId: payload.warehouseId,
      },
    };

    if (isDraft) {
      // For drafts: no WorkItem, no Assignee, no Approval instance
      this.supplyRequests.unshift(newSupplyRequest);
      this.notify();
      return { supplyRequest: newSupplyRequest };
    }

    // 2. Visibly create the corresponding Work Item in mockRepository!
    const workItemId = `wi-sup-${Date.now()}`;
    const workItemCode = `TSK-${newCode}`;

    const newWorkItem: OperationalRecord = {
      id: workItemId,
      code: workItemCode,
      title: `اقدام عملیاتی تدارکات: ${payload.title}`,
      type: 'general_task',
      typeLabel: 'وظیفه پیگیری تدارکات',
      itemSummary: `درخواست تأمین با کد ${newCode} جهت تأمین اقلام ذیل ارجاع گردید:\n${payload.reason}`,
      createdAt: new Date().toISOString(),
      createdAtJalali: 'هم‌اکنون',
      currentOwner: {
        ...currentAssignee,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      currentAssignee: currentAssignee,
      status: 'in_progress',
      statusLabel: 'در دست اقدام تدارکات',
      statusSinceJalali: 'هم‌اکنون',
      priority: payload.priority === 'urgent' ? 'urgent' : payload.priority === 'high' ? 'high' : 'normal',
      creator: creatorPerson,
      owner: defaultOwner,
      unit: 'زنجیره تأمین',
      tags: ['تأمین', 'مواد اولیه', 'خرید'],
      blocker: null,
      nextAction: {
        title: 'استعلام قیمت از تأمین‌کنندگان و هماهنگی خرید',
        responsibleRole: 'کارشناس تدارکات و خرید',
        responsiblePersonName: currentAssignee.name,
        dueJalali: payload.requiredDateJalali,
        suggestedAction: 'review',
      },
      linkedBusinessRecord: {
        id: newId,
        code: newCode,
        title: `درخواست تأمین ${newCode} — ${payload.title}`,
        category: 'supply_request',
        categoryLabel: 'درخواست تأمین',
        currentStatus: 'در دست اقدام تدارکات',
        summary: payload.reason || payload.triggerDescription || 'درخواست تأمین و خرید مواد اولیه',
      },
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: creatorPerson,
          title: 'ایجاد درخواست تأمین و اقدام عملیاتی',
          note: `درخواست تأمین با کد ${newCode} ثبت گردید.`,
          type: 'creation',
        },
      ],
      comments: [
        {
          id: `cmt-${Date.now()}`,
          author: creatorPerson,
          text: `درخواست تأمین به شماره ${newCode} ثبت گردید و وظیفه مسئولانه ایجاد شد.`,
          createdAtJalali: 'هم‌اکنون',
          isInternal: true,
        },
      ],
      attachments: [],
      workRelation: {
        relation_type: 'SOURCE_RECORD',
        source_type: 'SUPPLY_REQUEST',
        source_id: newCode,
        source_revision: 1,
      },
      relatedRecords: [
        {
          id: newId,
          code: newCode,
          title: payload.title,
          typeLabel: 'درخواست تأمین',
          statusLabel: 'ارجاع به خرید',
          routeKey: 'supply_requests',
          relation: 'سند منشأ اصلی',
        },
        ...(payload.needSource?.type === 'shortage'
          ? [
              {
                id: payload.needSource.snapshotId || `snap-${Date.now()}`,
                code: payload.needSource.snapshotCode || 'SNAP-EVIDENCE',
                title: `کاردکس ثبتی انبار: ${payload.needSource.productName || payload.warehouseName}`,
                typeLabel: 'منشأ نیاز: انبارداری',
                statusLabel: payload.needSource.snapshotStatus || `کسری ${payload.needSource.calculatedShortage || ''} ${payload.needSource.unit || ''}`,
                routeKey: 'inventory_receipts',
                relation: 'محرک موجودی انبار',
              },
            ]
          : []),
        ...(payload.needSource?.type === 'sales_order'
          ? [
              {
                id: payload.needSource.salesOrderId || payload.salesOrderId || `so-${Date.now()}`,
                code: payload.needSource.salesOrderCode || payload.salesOrderId || 'ORD-SO',
                title: `سفارش فروش رسمی (${payload.needSource.customerName || payload.customerName || 'مشتری'})`,
                typeLabel: 'منشأ نیاز: تعهد سفارش مشتری',
                statusLabel: payload.needSource.approvalStatus || payload.needSource.orderStatus || 'مصوب بازرگانی',
                routeKey: 'sales_orders',
                relation: 'محرک سفارش فروش',
              },
            ]
          : []),
      ],
    };

    // Save work item in repository
    mockRepository.createRecord(newWorkItem);

    // Link work item to supply request
    newSupplyRequest.linkedWorkItemId = workItemId;

    this.supplyRequests.unshift(newSupplyRequest);
    this.notify();

    return { supplyRequest: newSupplyRequest, workItem: newWorkItem };
  }

  public fulfillSupplyRequestItem(requestId: string, itemId: string, receivedQty: number): boolean {
    const req = this.supplyRequests.find((r) => r.id === requestId);
    if (!req) return false;

    const it = req.items.find((i) => i.id === itemId);
    if (!it) return false;

    it.receivedQuantity = (it.receivedQuantity || 0) + receivedQty;
    it.suppliedQuantity = it.receivedQuantity;
    const ordered = it.orderedQuantity || it.requestedQuantity || it.quantity;
    it.remainingQuantity = Math.max(0, ordered - it.receivedQuantity);

    const allFulfilled = req.items.every((i) => (i.remainingQuantity || 0) <= 0);
    if (allFulfilled) {
      req.status = 'supplied';
      req.supplyResult = 'supplied_complete';
      req.statusReason = 'تأمین کامل کلیه اقلام درخواست';
    } else {
      req.status = 'partial';
      req.supplyResult = 'supplied_partial';
      req.statusReason = 'تأمین بخشی از اقلام درخواست';
    }

    this.notify();
    return true;
  }

  public closeSupplyRequest(requestId: string, reason: string): boolean {
    const req = this.supplyRequests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = 'supplied';
    req.supplyResult = 'supplied_complete';
    req.statusReason = `مختومه شدن درخواست: ${reason}`;
    this.notify();
    return true;
  }

  public updateSupplyResult(
    requestId: string,
    suppliedQuantities: Record<string, number>,
    resultStatus: 'supplied_complete' | 'supplied_partial' | 'cancelled' | 'blocked',
    notes: string
  ): boolean {
    const req = this.supplyRequests.find((r) => r.id === requestId);
    if (!req) return false;

    let allFulfilled = true;
    req.items.forEach((it) => {
      if (suppliedQuantities[it.id] !== undefined) {
        it.suppliedQuantity = Number(suppliedQuantities[it.id]);
        if (it.suppliedQuantity < it.quantity) {
          allFulfilled = false;
        }
      }
    });

    req.supplyResult = resultStatus;
    if (resultStatus === 'supplied_complete') {
      req.status = 'supplied';
      req.statusReason = `تأمین کامل انجام شد. ${notes}`;
    } else if (resultStatus === 'supplied_partial') {
      req.status = 'partial';
      req.statusReason = `تأمین جزئی با کسری پارت. ${notes}`;
    } else if (resultStatus === 'blocked') {
      req.status = 'blocked';
      req.statusReason = `تأمین مسدود گردید. ${notes}`;
    } else if (resultStatus === 'cancelled') {
      req.status = 'cancelled';
      req.statusReason = `تأمین لغو شد. ${notes}`;
    }

    this.notify();
    return true;
  }

  // ================= WAREHOUSE RECEIPTS =================

  public getWarehouseReceipts(): WarehouseReceiptRecord[] {
    return [...this.warehouseReceipts];
  }

  public getWarehouseReceiptById(id: string): WarehouseReceiptRecord | undefined {
    return this.warehouseReceipts.find((r) => r.id === id);
  }

  public createWarehouseReceipt(payload: CreateWarehouseReceiptPayload): WarehouseReceiptRecord {
    const num = Math.floor(120 + Math.random() * 800);
    const newInternalNumber = payload.internalNumber || `REC-1403-${num}`;
    const newId = `rec-${Date.now()}`;

    const wh = MOCK_WAREHOUSES.find((w) => w.id === payload.warehouseId) || MOCK_WAREHOUSES[0];
    const sup = MOCK_SUPPLIERS.find((s) => s.id === payload.supplierId) || MOCK_SUPPLIERS[0];

    const netWeight = Math.max(0, payload.weighbridgeGrossKg - payload.weighbridgeTareKg);

    const itemsFormatted = payload.items.map((it, idx) => {
      const prd = MOCK_PRODUCTS.find((p) => p.id === it.productId) || MOCK_PRODUCTS[0];
      return {
        id: `rec-it-${newId}-${idx}`,
        productId: prd.id,
        productCode: prd.code,
        productName: prd.name,
        cartons: Number(it.cartons),
        pieces: Number(it.pieces),
        unit: it.unit || prd.baseUnit || 'بطری',
        conversionRatio: prd.cartonConversion?.piecesPerCarton || 12,
        expectedQuantity: Number(it.expectedQuantity),
        actualQuantity: Number(it.actualQuantity),
        purchasePriceRials: Number(it.purchasePriceRials),
        purchasePriceSnapshotRials: Number(it.purchasePriceRials),
        totalPriceRials: Number(it.actualQuantity) * Number(it.purchasePriceRials),
        itemResult: it.itemResult,
        notes: it.notes || '',
      };
    });

    // Create fresh approval stages based on active organizational pattern:
    // Stage 1: Driver acknowledgement (pending)
    // Stage 2: Warehouse keeper (signed by creator if warehousekeeper, or pending)
    // Stage 3: Management approver (pending)
    // Stage 4: CEO (pending)
    // Stage 5 & 6: Optional QC & Procurement reviewers
    const stages: ReceiptApprovalStage[] = [
      {
        id: `stage-${newId}-1`,
        stageIndex: 1,
        stageType: 'acknowledgement',
        stageTypeLabel: 'رسید و تصدیق تحویل',
        roleKey: 'driver_ack',
        roleTitle: 'رسید تحویل راننده',
        assignedPersonName: payload.driverName,
        isMandatory: true,
        status: 'pending',
        notes: 'در انتظار امضا و تصدیق تحویل توسط راننده باربری',
      },
      {
        id: `stage-${newId}-2`,
        stageIndex: 2,
        stageType: 'operational_review',
        stageTypeLabel: 'بررسی میدانی و انبارداری',
        roleKey: 'warehouse_keeper',
        roleTitle: 'انباردار و متصدی تخلیه',
        assignedPersonName: payload.creatorPersona.name,
        isMandatory: true,
        status: 'signed',
        signedBy: {
          id: payload.creatorPersona.id,
          name: payload.creatorPersona.name,
          role: payload.creatorPersona.jobTitle,
          department: payload.creatorPersona.department,
        },
        signedAtJalali: 'هم‌اکنون',
        signedAtTime: '۱۲:۰۰',
        notes: 'شمارش اولیه کارتن‌ها و ثبت در بدو ورود توسط انباردار انجام شد.',
      },
      {
        id: `stage-${newId}-3`,
        stageIndex: 3,
        stageType: 'formal_approval',
        stageTypeLabel: 'تصویب رسمی بازرگانی',
        roleKey: 'management_approver',
        roleTitle: 'معاونت بازرگانی و خرید',
        assignedPersonName: 'سهراب جوادیان',
        isMandatory: true,
        status: 'pending',
      },
      {
        id: `stage-${newId}-4`,
        stageIndex: 4,
        stageType: 'formal_approval',
        stageTypeLabel: 'تصویب نهایی مدیریت',
        roleKey: 'ceo',
        roleTitle: 'مدیرعامل / مقام مجاز',
        assignedPersonName: 'دکتر محمدرضا جوادیان',
        isMandatory: true,
        status: 'pending',
      },
      {
        id: `stage-${newId}-5`,
        stageIndex: 5,
        stageType: 'operational_review',
        stageTypeLabel: 'بررسی کارشناسی (اختیاری)',
        roleKey: 'qc_reviewer',
        roleTitle: 'کنترل کیفیت و بهداشت (اختیاری)',
        assignedPersonName: 'مهندس سارا نادری',
        isMandatory: false,
        status: 'pending',
      },
      {
        id: `stage-${newId}-6`,
        stageIndex: 6,
        stageType: 'operational_review',
        stageTypeLabel: 'بررسی کارشناسی (اختیاری)',
        roleKey: 'procurement_reviewer',
        roleTitle: 'هماهنگی عملیات و تأمین (تفویض اختیارات)',
        assignedPersonName: 'محسن راد (جانشین تفویض‌شده عملیات)',
        isMandatory: false,
        status: 'pending',
      },
    ];

    const newRecord: WarehouseReceiptRecord = {
      id: newId,
      internalNumber: newInternalNumber,
      dateJalali: payload.dateJalali || '۱۴۰۴/۰۶/۱۵',
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
        contactPerson: sup.contactPerson || 'مسئول فروش شرکت',
      },
      purchaseConditions: payload.purchaseConditions,
      deliveryType: payload.deliveryType,
      unloadingDestination: payload.unloadingDestination,
      purchaseRef: payload.purchaseRef,
      relatedSupplyRef: payload.relatedSupplyRef,
      externalTradeReference: payload.externalTradeReference || `TRD-1403-${num + 200}`,
      externalWarehouseReference: payload.externalWarehouseReference || `WHS-IR-00${num}`,
      financialIntegrationStatus: 'not_registered',
      parsinaRefPlaceholder: 'ثبت نشده در پارسینا — اتصال API برقرار نیست',
      driverData: {
        driverName: payload.driverName,
        phone: payload.driverPhone,
        vehiclePlate: payload.vehiclePlate,
        vehicleType: payload.vehicleType,
        waybillNumber: payload.waybillNumber,
        freightAmountRials: Number(payload.freightAmountRials),
        deliveryType: payload.deliveryType,
        deliveryLocation: payload.unloadingDestination,
        unloadingSupervisor: payload.unloadingSupervisor,
        weighbridgeGrossKg: Number(payload.weighbridgeGrossKg),
        weighbridgeTareKg: Number(payload.weighbridgeTareKg),
        weighbridgeNetKg: netWeight,
      },
      items: itemsFormatted,
      overallResult: payload.overallResult,
      participants: {
        warehouseKeeper: {
          roleLabel: 'انباردار و متصدی تخلیه',
          person: {
            id: payload.creatorPersona.id,
            name: payload.creatorPersona.name,
            role: payload.creatorPersona.jobTitle,
            department: payload.creatorPersona.department,
          },
          signedAtJalali: 'هم‌اکنون',
          status: 'signed',
          notes: 'ثبت اولیه رسید انبار',
        },
        qualityReviewer: {
          roleLabel: 'کنترل کیفیت',
          status: 'pending',
        },
        warehouseManager: {
          roleLabel: 'مدیریت انبار',
          status: 'pending',
        },
        finalApprover: {
          roleLabel: 'تأییدکننده نهایی',
          status: 'pending',
        },
      },
      approvalStages: stages,
      approvalPatternLabel:
        'الگوی تأیید فعال سازمان: تأیید ۴ مرحله‌ای رسمی (رسید راننده، انباردار، مدیر بازرگانی، مدیرعامل)',
      creatorExperience: {
        creator: {
          id: payload.creatorPersona.id,
          name: payload.creatorPersona.name,
          role: payload.creatorPersona.jobTitle,
          department: payload.creatorPersona.department,
        },
        isDelegated: false,
      },
      attachments: payload.attachments,
      status: payload.overallResult === 'complete' ? 'under_inspection' : 'mismatch_flagged',
    };

    // Store actual received quantity against matching supply request if present:
    // decrement remaining quantity, update SupplyResult
    if (payload.relatedSupplyRef) {
      const supReq = this.supplyRequests.find(
        (sr) => sr.code === payload.relatedSupplyRef || sr.id === payload.relatedSupplyRef
      );
      if (supReq) {
        itemsFormatted.forEach((recItem) => {
          const matchedItem = supReq.items.find((si) => si.productId === recItem.productId);
          if (matchedItem) {
            matchedItem.receivedQuantity = (matchedItem.receivedQuantity || 0) + recItem.actualQuantity;
            matchedItem.suppliedQuantity = matchedItem.receivedQuantity;
            const ordered = matchedItem.orderedQuantity || matchedItem.requestedQuantity || matchedItem.quantity;
            matchedItem.remainingQuantity = Math.max(0, ordered - matchedItem.receivedQuantity);
          }
        });
        const allFulfilled = supReq.items.every((i) => (i.remainingQuantity || 0) <= 0);
        if (allFulfilled) {
          supReq.status = 'supplied';
          supReq.supplyResult = 'supplied_complete';
          supReq.statusReason = `تأمین کامل با رسید انبار شماره ${newRecord.internalNumber}`;
        } else {
          supReq.status = 'partial';
          supReq.supplyResult = 'supplied_partial';
          supReq.statusReason = `تأمین بخشی از اقلام با رسید انبار شماره ${newRecord.internalNumber}`;
        }
      }
    }

    this.warehouseReceipts.unshift(newRecord);
    this.notify();
    return newRecord;
  }

  public signReceiptStage(
    receiptId: string,
    roleKey: string,
    signerPersona: MockPersona,
    notes: string
  ): boolean {
    const rec = this.warehouseReceipts.find((r) => r.id === receiptId);
    if (!rec || !rec.approvalStages) return false;

    const stage = rec.approvalStages.find((s) => s.roleKey === roleKey);
    if (!stage) return false;

    stage.status = 'signed';
    stage.signedBy = {
      id: signerPersona.id,
      name: signerPersona.name,
      role: signerPersona.jobTitle,
      department: signerPersona.department,
    };
    stage.signedAtJalali = 'هم‌اکنون';
    stage.signedAtTime = '۱۲:۴۵';
    stage.notes = notes;

    // Check if all mandatory stages are signed
    const mandatoryStages = rec.approvalStages.filter((s) => s.isMandatory);
    const allMandatorySigned = mandatoryStages.every((s) => s.status === 'signed');
    if (allMandatorySigned) {
      rec.status = 'confirmed';
    }

    this.notify();
    return true;
  }

  public returnReceiptStage(
    receiptId: string,
    roleKey: string,
    signerPersona: MockPersona,
    returnReason: string
  ): boolean {
    const rec = this.warehouseReceipts.find((r) => r.id === receiptId);
    if (!rec || !rec.approvalStages) return false;

    const stage = rec.approvalStages.find((s) => s.roleKey === roleKey);
    if (!stage) return false;

    stage.status = 'returned';
    stage.signedBy = {
      id: signerPersona.id,
      name: signerPersona.name,
      role: signerPersona.jobTitle,
      department: signerPersona.department,
    };
    stage.signedAtJalali = 'هم‌اکنون';
    stage.returnReason = returnReason;
    stage.notes = `برگشت سند با علت: ${returnReason}`;

    rec.status = 'mismatch_flagged';

    this.notify();
    return true;
  }

  // ================= LOGISTICS =================

  public getLogisticsRecords(): LogisticsRecord[] {
    return [...this.logisticsRecords];
  }

  public getLogisticsById(id: string): LogisticsRecord | undefined {
    return this.logisticsRecords.find((l) => l.id === id);
  }

  public createLogisticsRecord(payload: CreateLogisticsPayload): LogisticsRecord {
    const num = Math.floor(100 + Math.random() * 900);
    const newCode = `LOG-1403-${num}`;
    const newId = `log-${Date.now()}`;

    const newRecord: LogisticsRecord = {
      id: newId,
      code: newCode,
      type: payload.type,
      title: payload.title,
      origin: {
        name: payload.originName,
        city: payload.originCity,
        address: payload.originAddress,
      },
      destination: {
        name: payload.destinationName,
        city: payload.destinationCity,
        address: payload.destinationAddress,
      },
      driver: {
        name: payload.driverName,
        phone: payload.driverPhone,
        nationalCode: '---',
        licensePlate: payload.driverLicensePlate,
      },
      vehicle: {
        type: payload.vehicleType,
        capacityTons: payload.vehicleCapacityTons,
      },
      waybill: {
        number: payload.waybillNumber,
        issuedBy: 'باربری مجاز پایانه حمل و نقل',
        dateJalali: 'هم‌اکنون',
      },
      freight: {
        amountRials: Number(payload.freightAmountRials),
        paymentMethod: payload.paymentMethod,
        payer: payload.payer,
      },
      coordinationStatus: payload.coordinationStatus,
      currentOwner: {
        id: payload.creatorPersona.id,
        name: payload.creatorPersona.name,
        role: payload.creatorPersona.jobTitle,
        department: payload.creatorPersona.department,
      },
      fallbackOwner: {
        id: 'p-wh',
        name: 'کامران داوودی',
        role: 'سرپرست انبار و لجستیک',
        department: 'انبار و لجستیک',
      },
      nextAction: 'هماهنگی بارگیری و کنترل بارنامه رسمی جاده‌ای',
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestampJalali: 'هم‌اکنون',
          title: 'ثبت هماهنگی لجستیک',
          description: `عملیات حمل توسط ${payload.creatorPersona.name} ثبت گردید.`,
          actorName: payload.creatorPersona.name,
        },
      ],
      attachments: [],
      linkedRecords: {
        supplyRequestId: payload.supplyRequestId,
        salesOrderId: payload.salesOrderId,
        receiptId: payload.receiptId,
      },
    };

    this.logisticsRecords.unshift(newRecord);
    this.notify();
    return newRecord;
  }

  public updateLogisticsStatus(
    id: string,
    newStatus: LogisticsCoordinationStatus,
    note: string,
    actorName: string
  ): boolean {
    const item = this.logisticsRecords.find((l) => l.id === id);
    if (!item) return false;

    item.coordinationStatus = newStatus;
    item.timeline.unshift({
      id: `tl-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      title: `تغییر وضعیت به ${newStatus}`,
      description: note,
      actorName: actorName,
    });

    this.notify();
    return true;
  }
}

export const mockSupplyReceiptStore = new MockSupplyReceiptStore();
