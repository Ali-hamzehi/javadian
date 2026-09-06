import {
  CustomerRecord,
  CustomerPhone,
  CustomerLocation,
  CustomerSalespersonHistory,
  CustomerInteraction,
  SalesOrderDetails,
  SalesOrderItem,
  OrderRevision,
  WarehouseExitRecord,
  WarehouseExitItem,
  WarehouseExitSignature,
  WarehouseExitStatus,
  Person,
  MockPersona,
  OperationalRecord,
  ApprovalInstance,
} from '../types';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS } from './mockMasterData';
import { MOCK_SALES_ORDERS } from './mockSalesData';
import { MOCK_WAREHOUSE_EXITS } from './mockSupplyLogisticsData';
import { mockRepository } from './mockRepository';

export interface CreateSalesOrderPayload {
  customerId: string;
  channel: 'phone' | 'visit' | 'whatsapp' | 'telegram' | 'in_person' | 'other';
  channelLabel?: string;
  creatorPersona: MockPersona;
  salesResponsibleId: string;
  salesResponsibleName: string;
  deliveryAddress: string;
  paymentTerms: string;
  deliveryTerms: string;
  items: Array<{
    productId: string;
    productName: string;
    unit: string;
    conversionFactor: number;
    cartons: number;
    pieces: number;
    weightKg: number;
    baseUnit: string;
    dailyReferencePriceRials: number;
    minPermittedPriceRials: number;
    offeredPriceRials: number;
    agreedUnitPriceRials: number;
    discountPercent: number;
  }>;
}

export interface CreateWarehouseExitPayload {
  linkedSalesOrderId?: string;
  code?: string;
  dateJalali: string;
  buyer: {
    id?: string;
    name: string;
    nationalId: string;
    phone: string;
    economicCode?: string;
  };
  postalCode?: string;
  deliveryAddress: string;
  salesConditions: string;
  salesResponsible: {
    id: string;
    name: string;
    role?: string;
  };
  freightAmountRials: number;
  deliveryMode: string;
  externalTradeReference?: string;
  externalWarehouseReference?: string;
  warehouseId?: string;
  warehouseName?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  waybillNumber?: string;
  items: Array<{
    productId: string;
    productCode: string;
    productName: string;
    requestedCartons?: number;
    requestedQuantity: number;
    unit: string;
    salePriceRials?: number;
    unitWeightKg: number;
    notes?: string;
  }>;
  creatorPersona: MockPersona;
}

class MockSalesWarehouseStore {
  private customers: CustomerRecord[] = JSON.parse(JSON.stringify(MOCK_CUSTOMERS));
  private salesOrders: SalesOrderDetails[] = JSON.parse(JSON.stringify(MOCK_SALES_ORDERS));
  private warehouseExits: WarehouseExitRecord[] = JSON.parse(JSON.stringify(MOCK_WAREHOUSE_EXITS));
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener error in MockSalesWarehouseStore:', err);
      }
    });
  }

  // ================= CUSTOMERS & CRM =================

  public getCustomers(): CustomerRecord[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): CustomerRecord | undefined {
    return this.customers.find((c) => c.id === id || c.code === id);
  }

  public checkDuplicateConflict(data: {
    phone?: string;
    mobile?: string;
    nationalId?: string;
    officialName?: string;
    tradeName?: string;
    currentId?: string;
  }): {
    hasConflict: boolean;
    conflictReason?: string;
    conflictingCustomerId?: string;
    conflictingCustomerName?: string;
  } {
    const cleanNum = (s?: string) => (s ? s.replace(/[^\d]/g, '') : '');
    const targetPhone = cleanNum(data.phone);
    const targetMobile = cleanNum(data.mobile);
    const targetNationalId = cleanNum(data.nationalId);

    for (const cust of this.customers) {
      if (data.currentId && cust.id === data.currentId) continue;

      const custNatId = cleanNum(cust.nationalId);
      if (targetNationalId && custNatId && targetNationalId === custNatId) {
        return {
          hasConflict: true,
          conflictReason: `شناسه ملی یکسان (${cust.nationalId}) با پرونده «${cust.tradeName || cust.officialName}» یافت شد.`,
          conflictingCustomerId: cust.id,
          conflictingCustomerName: cust.tradeName || cust.officialName,
        };
      }

      const allCustPhones = [
        cust.phone,
        cust.mobile,
        ...(cust.phones || []).map((p) => p.number),
      ].map(cleanNum).filter(Boolean);

      if (targetMobile && allCustPhones.includes(targetMobile)) {
        return {
          hasConflict: true,
          conflictReason: `شماره همراه (${data.mobile}) با پرونده «${cust.tradeName || cust.officialName}» مشترک است.`,
          conflictingCustomerId: cust.id,
          conflictingCustomerName: cust.tradeName || cust.officialName,
        };
      }

      if (targetPhone && allCustPhones.includes(targetPhone)) {
        return {
          hasConflict: true,
          conflictReason: `شماره ثابت (${data.phone}) با شماره ثبت‌شده برای «${cust.tradeName || cust.officialName}» تطبیق دارد.`,
          conflictingCustomerId: cust.id,
          conflictingCustomerName: cust.tradeName || cust.officialName,
        };
      }

      if (data.tradeName && cust.tradeName && data.tradeName.trim().length > 3) {
        if (
          cust.tradeName.trim().toLowerCase() === data.tradeName.trim().toLowerCase() ||
          cust.tradeName.includes(data.tradeName.trim()) ||
          data.tradeName.includes(cust.tradeName.trim())
        ) {
          return {
            hasConflict: true,
            conflictReason: `نام تجاری بسیار مشابه با پرونده «${cust.tradeName}» (${cust.code}) است.`,
            conflictingCustomerId: cust.id,
            conflictingCustomerName: cust.tradeName,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  public addCustomer(newCustData: Omit<CustomerRecord, 'id' | 'code'> & { code?: string }): CustomerRecord {
    const nextNum = this.customers.length + 1093;
    const code = newCustData.code || `CUST-${nextNum}`;
    const id = `cust-${Date.now()}`;

    const duplicateCheck = this.checkDuplicateConflict({
      phone: newCustData.phone,
      mobile: newCustData.mobile,
      nationalId: newCustData.nationalId,
      tradeName: newCustData.tradeName,
    });

    const newCustomer: CustomerRecord = {
      ...newCustData,
      id,
      code,
      isDuplicateFlagged: duplicateCheck.hasConflict,
      duplicateConflictNote: duplicateCheck.hasConflict ? duplicateCheck.conflictReason : undefined,
      phones: newCustData.phones && newCustData.phones.length > 0 ? newCustData.phones : [
        {
          id: `ph-1`,
          label: 'شماره ثابت اصلی',
          number: newCustData.phone,
          isPrimary: true,
        },
        {
          id: `ph-2`,
          label: 'تلفن همراه مسئول خرید',
          number: newCustData.mobile,
          isPrimary: false,
        },
      ],
      salespersonHistory: newCustData.salespersonHistory || [
        {
          id: `sh-init`,
          salesperson: newCustData.assignedSalesperson,
          assignedAtJalali: '۱۴۰۴/۰۶/۱۲',
          assignedBy: 'ثبت اولیه پرونده در سیستم',
          reason: 'تخصیص کارشناس مسئول فروش در بدو تشکیل پرونده',
        },
      ],
      interactions: newCustData.interactions || [
        {
          id: `int-init`,
          type: 'assignment',
          typeLabel: 'تشکیل پرونده',
          title: 'تشکیل و ثبت اطلاعات پایه مشتری در سیستم',
          dateJalali: '۱۴۰۴/۰۶/۱۲',
          time: 'هم‌اکنون',
          actorName: newCustData.assignedSalesperson.name,
          actorRole: newCustData.assignedSalesperson.role,
          summary: `پرونده مشتری با سقف اعتبار ${(newCustData.creditLimitRials / 10000000).toLocaleString('fa-IR')} میلیون تومان ایجاد شد.`,
          statusBadge: { text: 'ثبت شده', tone: 'info' },
        },
      ],
    };

    this.customers.unshift(newCustomer);
    this.notify();
    return newCustomer;
  }

  public updateCustomer(id: string, partial: Partial<CustomerRecord>): boolean {
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) return false;
    Object.assign(cust, partial);
    this.notify();
    return true;
  }

  public addCustomerPhone(customerId: string, phone: Omit<CustomerPhone, 'id'>): boolean {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    cust.phones = cust.phones || [];
    if (phone.isPrimary) {
      cust.phones.forEach((p) => (p.isPrimary = false));
      cust.phone = phone.number;
    }
    const newPhone: CustomerPhone = {
      ...phone,
      id: `cp-${Date.now()}`,
    };
    cust.phones.push(newPhone);
    this.notify();
    return true;
  }

  public addCustomerLocation(customerId: string, loc: Omit<CustomerLocation, 'id'>): boolean {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    cust.locations = cust.locations || [];
    const newLoc: CustomerLocation = {
      ...loc,
      id: `loc-${Date.now()}`,
    };
    cust.locations.push(newLoc);
    this.notify();
    return true;
  }

  public reassignSalesperson(
    customerId: string,
    newSalesperson: Person,
    reason: string,
    assignedBy: string,
    assignedAtJalali = '۱۴۰۴/۰۶/۱۲'
  ): boolean {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return false;

    const previousSalesperson = { ...cust.assignedSalesperson };
    cust.assignedSalesperson = newSalesperson;

    cust.salespersonHistory = cust.salespersonHistory || [];
    if (cust.salespersonHistory.length > 0) {
      const last = cust.salespersonHistory[0];
      if (!last.unassignedAtJalali) {
        last.unassignedAtJalali = assignedAtJalali;
      }
    }

    cust.salespersonHistory.unshift({
      id: `sh-${Date.now()}`,
      salesperson: newSalesperson,
      assignedAtJalali,
      assignedBy,
      reason,
    });

    cust.interactions = cust.interactions || [];
    cust.interactions.unshift({
      id: `int-${Date.now()}`,
      type: 'assignment',
      typeLabel: 'تغییر مسئول فروش',
      title: `انتقال پرونده به ${newSalesperson.name}`,
      dateJalali: assignedAtJalali,
      time: '۱۲:۰۰',
      actorName: assignedBy,
      summary: `مسئول فروش از «${previousSalesperson.name}» به «${newSalesperson.name}» تغییر یافت. علت: ${reason}`,
      statusBadge: { text: 'تخصیص مجدد', tone: 'info' },
    });

    this.notify();
    return true;
  }

  public addCustomerInteraction(
    customerId: string,
    interaction: Omit<CustomerInteraction, 'id'>
  ): boolean {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    cust.interactions = cust.interactions || [];
    cust.interactions.unshift({
      ...interaction,
      id: `int-${Date.now()}`,
    });
    this.notify();
    return true;
  }

  public dismissDuplicateWarning(customerId: string, note?: string): boolean {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return false;
    cust.isDuplicateFlagged = false;
    if (note) {
      cust.duplicateConflictNote = `رفع تعارض توسط کارشناس: ${note}`;
    }
    this.notify();
    return true;
  }

  // ================= SALES ORDERS =================

  public getSalesOrders(): SalesOrderDetails[] {
    return [...this.salesOrders];
  }

  public getSalesOrderById(id: string): SalesOrderDetails | undefined {
    return this.salesOrders.find((o) => o.id === id || o.code === id);
  }

  public createSalesOrder(payload: CreateSalesOrderPayload): SalesOrderDetails {
    const cust = this.customers.find((c) => c.id === payload.customerId) || this.customers[0];
    const nextCodeNum = this.salesOrders.length + 986;
    const code = `ORD-1404-${nextCodeNum}`;
    const id = `so-${Date.now()}`;

    let totalAmount = 0;
    let hasPriceBelowFloor = false;
    let minAllowedPriceViolation = 0;
    let requestedPriceViolation = 0;

    const items: SalesOrderItem[] = payload.items.map((it, idx) => {
      const lineTotal = it.pieces * it.agreedUnitPriceRials;
      totalAmount += lineTotal;
      const isBelowFloor = it.agreedUnitPriceRials < it.minPermittedPriceRials;
      if (isBelowFloor) {
        hasPriceBelowFloor = true;
        minAllowedPriceViolation = it.minPermittedPriceRials;
        requestedPriceViolation = it.agreedUnitPriceRials;
      }
      return {
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        productName: it.productName,
        unit: it.unit,
        conversionFactor: it.conversionFactor,
        cartons: it.cartons,
        pieces: it.pieces,
        weightKg: it.weightKg,
        baseUnit: it.baseUnit,
        dailyReferencePriceRials: it.dailyReferencePriceRials,
        minPermittedPriceRials: it.minPermittedPriceRials,
        offeredPriceRials: it.offeredPriceRials,
        finalPriceRials: it.agreedUnitPriceRials,
        appliedDiscountPercent: it.discountPercent,
        officialSnapshotPriceRials: it.dailyReferencePriceRials,
        agreedUnitPriceRials: it.agreedUnitPriceRials,
        discountPercent: it.discountPercent,
        totalRials: lineTotal,
      };
    });

    const isCreditExceeded =
      cust.openBalanceRials + totalAmount > cust.creditLimitRials;

    let status: SalesOrderDetails['status'] = 'submitted';
    let statusLabel = 'ثبت‌شده — آماده بررسی';
    let hasPriceException = false;
    let priceExceptionReason: string | undefined;

    if (hasPriceBelowFloor) {
      status = 'needs_price_approval';
      statusLabel = 'مشروط — نیازمند تأیید معاونت بازرگانی (قیمت زیر کف مجاز)';
      hasPriceException = true;
      priceExceptionReason = `قیمت توافقی واحد (${requestedPriceViolation.toLocaleString('fa-IR')} ریال) کمتر از حداقل قیمت مصوب مجاز (${minAllowedPriceViolation.toLocaleString('fa-IR')} ریال) است.`;
    } else if (isCreditExceeded) {
      status = 'under_review';
      statusLabel = 'در حال بررسی اعتباری (فراتر از سقف اعتبار)';
      hasPriceException = true;
      priceExceptionReason = 'تجاوز مبلغ سفارش از سقف اعتباری مجاز مشتری';
    }

    const channelLabels: Record<string, string> = {
      phone: 'تماس تلفنی',
      visit: 'ویزیت و جلسه حضوری',
      whatsapp: 'پیام‌رسان واتساپ',
      telegram: 'پیام‌رسان تلگرام',
      in_person: 'مراجعه حضوری به دفتر مرکزی',
      other: 'کانال اختصاصی / سایر',
    };

    const newOrder: SalesOrderDetails = {
      id,
      code,
      title: `سفارش فروش ${items.reduce((s, i) => s + i.cartons, 0).toLocaleString('fa-IR')} کارتن انواع روغن به ${cust.tradeName || cust.officialName}`,
      customerId: cust.id,
      customerName: cust.tradeName || cust.officialName,
      channel: payload.channel,
      channelLabel: payload.channelLabel || channelLabels[payload.channel] || 'ثبت دستی',
      createdById: payload.creatorPersona.id,
      createdByName: `${payload.creatorPersona.name} (${payload.creatorPersona.jobTitle})`,
      salesResponsibleId: payload.salesResponsibleId,
      salesResponsibleName: payload.salesResponsibleName,
      deliveryAddress: payload.deliveryAddress || cust.locations[0]?.address || 'انبار مشتری',
      paymentTerms: payload.paymentTerms,
      deliveryTerms: payload.deliveryTerms,
      items,
      totalAmountRials: totalAmount,
      status,
      statusLabel,
      currentOwnerName: hasPriceBelowFloor ? 'سهراب جوادیان (معاونت بازرگانی)' : payload.salesResponsibleName,
      hasPriceException,
      priceExceptionReason,
      autosavedAtJalali: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۱:۰۰',
      revisions: [
        {
          revisionNumber: 1,
          dateJalali: '۱۴۰۴/۰۶/۱۲ - ۱۱:۰۰',
          modifiedBy: {
            id: payload.creatorPersona.id,
            name: payload.creatorPersona.name,
            role: payload.creatorPersona.jobTitle,
            department: payload.creatorPersona.department,
          },
          changeSummary: 'ثبت اولیه پیش‌نویس سفارش در سامانه',
          beforeAmountRials: 0,
          afterAmountRials: totalAmount,
          itemsDiff: [],
        },
      ],
      commercialApproval: hasPriceBelowFloor
        ? {
            triggerType: 'below_floor_price',
            title: 'عدم تطابق نرخ با کف قیمت مجاز فروشگاه',
            description: priceExceptionReason || '',
            requestedDiscountPercent: items[0]?.appliedDiscountPercent || 0,
            maxAuthorizedDiscountPercent: 5.0,
            requestedUnitPriceRials: requestedPriceViolation,
            minAllowedUnitPriceRials: minAllowedPriceViolation,
            orderTotalRials: totalAmount,
            customerCreditLimitRials: cust.creditLimitRials,
            customerOpenBalanceRials: cust.openBalanceRials,
            availableCreditRials: Math.max(0, cust.creditLimitRials - cust.openBalanceRials),
            isSelfApprovalBlocked: true, // Creator cannot approve!
          }
        : isCreditExceeded
        ? {
            triggerType: 'credit_limit_exceeded',
            title: 'تجاوز از سقف اعتبار مجاز',
            description: 'مانده بدهی مشتری از سقف اعتباری بیشتر خواهد شد.',
            requestedDiscountPercent: 0,
            maxAuthorizedDiscountPercent: 0,
            requestedUnitPriceRials: items[0]?.agreedUnitPriceRials || 0,
            minAllowedUnitPriceRials: items[0]?.minPermittedPriceRials || 0,
            orderTotalRials: totalAmount,
            customerCreditLimitRials: cust.creditLimitRials,
            customerOpenBalanceRials: cust.openBalanceRials,
            availableCreditRials: Math.max(0, cust.creditLimitRials - cust.openBalanceRials),
            isSelfApprovalBlocked: false,
          }
        : undefined,
    };

    this.salesOrders.unshift(newOrder);

    // Prompt 2: If price below floor or credit exceeded, create an approval obligation WorkItem in mockRepository
    if (hasPriceBelowFloor || isCreditExceeded) {
      const workItemId = `wi-so-appr-${Date.now()}`;
      const workItemCode = `TSK-APPR-${newOrder.code}`;

      const approvalWorkItem: OperationalRecord = {
        id: workItemId,
        code: workItemCode,
        title: hasPriceBelowFloor
          ? `تأیید بازرگانی نرخ زیر کف: سفارش ${newOrder.code}`
          : `تأیید بازرگانی سقف اعتبار: سفارش ${newOrder.code}`,
        type: 'general_task',
        typeLabel: 'وظیفه تصمیم‌گیری و تأیید قیمت',
        itemSummary: hasPriceBelowFloor
          ? `سفارش فروش ${newOrder.code} برای مشتری «${cust.tradeName || cust.officialName}» به مبلغ ${(totalAmount / 10000000).toLocaleString('fa-IR')} میلیون تومان به علت «${priceExceptionReason}» نیازمند تأیید مدیریت بازرگانی است.`
          : `سفارش فروش ${newOrder.code} برای مشتری «${cust.tradeName || cust.officialName}» سقف اعتباری مشتری را نقض نموده و نیازمند بررسی تجاری است.`,
        createdAt: new Date().toISOString(),
        createdAtJalali: 'هم‌اکنون',
        status: 'pending_approval',
        statusLabel: 'در انتظار تأیید بازرگانی',
        statusSinceJalali: 'هم‌اکنون',
        priority: 'urgent',
        creator: {
          id: payload.creatorPersona.id,
          name: payload.creatorPersona.name,
          role: payload.creatorPersona.jobTitle,
          department: payload.creatorPersona.department,
        },
        owner: {
          id: 'p-comm-approver',
          name: 'سهراب جوادیان',
          role: 'معاونت بازرگانی و فروش',
          department: 'فروش و بازرگانی',
        },
        currentAssignee: {
          id: 'p-comm-approver',
          name: 'سهراب جوادیان',
          role: 'معاونت بازرگانی و فروش',
          department: 'فروش و بازرگانی',
        },
        currentOwner: {
          id: 'p-comm-approver',
          name: 'سهراب جوادیان',
          role: 'معاونت بازرگانی و فروش',
          department: 'فروش و بازرگانی',
          heldSinceJalali: 'هم‌اکنون',
          durationHours: 0,
        },
        unit: 'فروش و بازرگانی',
        tags: ['سفارش فروش', 'تأیید قیمت', 'کف قیمت', 'بازرگانی'],
        blocker: null,
        nextAction: {
          title: 'بررسی نرخ استثنایی و تأیید/رد در کارتابل',
          responsibleRole: 'معاونت بازرگانی و فروش',
          responsiblePersonName: 'سهراب جوادیان',
          dueJalali: '۱۴۰۴/۰۶/۱۳',
          suggestedAction: 'approve',
        },
        linkedBusinessRecord: {
          id: newOrder.id,
          code: newOrder.code,
          title: `سفارش فروش ${newOrder.code} — ${cust.tradeName || cust.officialName}`,
          category: 'sales_order',
          categoryLabel: 'سفارش فروش',
          currentStatus: statusLabel,
          summary: priceExceptionReason || 'نیازمند تأیید قیمت استثنایی یا سقف اعتبار',
        },
        relatedRecords: [
          {
            id: newOrder.id,
            code: newOrder.code,
            title: `سفارش فروش ${newOrder.code}`,
            typeLabel: 'سفارش فروش',
            statusLabel: statusLabel,
          },
        ],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timestampJalali: 'هم‌اکنون',
            actor: {
              id: payload.creatorPersona.id,
              name: payload.creatorPersona.name,
              role: payload.creatorPersona.jobTitle,
              department: payload.creatorPersona.department,
            },
            title: 'ایجاد وظیفه تأیید قیمت سفارش',
            note: `سفارش به دلیل نرخ زیر کف نیازمند تأیید مدیریت بازرگانی است.`,
            type: 'creation',
          },
        ],
        comments: [],
        attachments: [],
      };

      mockRepository.createRecord(approvalWorkItem);
      newOrder.linkedWorkItemId = workItemId;
    }

    // Also register this order into Customer CRM timeline
    this.addCustomerInteraction(cust.id, {
      type: 'order',
      typeLabel: 'سفارش فروش',
      title: `ثبت سفارش جدید ${code}`,
      dateJalali: '۱۴۰۴/۰۶/۱۲',
      time: 'هم‌اکنون',
      actorName: payload.creatorPersona.name,
      actorRole: payload.creatorPersona.jobTitle,
      summary: `سفارش به ارزش ${(totalAmount / 10000000).toLocaleString('fa-IR')} میلیون تومان ثبت شد (${statusLabel}).`,
      referenceCode: code,
      amountRials: totalAmount,
      linkRoute: 'sales',
      linkId: newOrder.id,
      statusBadge: hasPriceBelowFloor
        ? { text: 'نیازمند تأیید تجاری نرخ', tone: 'danger' }
        : { text: 'ثبت‌شده', tone: 'info' },
    });

    this.notify();
    return newOrder;
  }

  public approveSalesOrder(
    orderId: string,
    approverPersona: MockPersona,
    approvalNote?: string,
    targetRevision?: number
  ): { success: boolean; message: string; linkedWarehouseExit?: WarehouseExitRecord } {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'سفارش مورد نظر یافت نشد.' };
    }

    // STRICT BUSINESS RULE: Separation of Duties (SoD) & Creator Cannot Self-Approve!
    if (order.createdById === approverPersona.id) {
      return {
        success: false,
        message:
          'خطای انطباق و تفکیک وظایف (SoD): کاربر ثبت‌کننده سفارش مجاز به تأیید تجاری یا نرخ تخفیف سفارش خود نمی‌باشد. تأیید باید توسط سرپرست یا معاون بازرگانی مستقل انجام شود.',
      };
    }

    // Capability check: approver must have commercial approval authority
    const hasApprovalCap =
      approverPersona.capabilities.includes('sales.approve') ||
      approverPersona.capabilities.includes('pricing.approve') ||
      approverPersona.capabilities.includes('MANAGEMENT_VIEW') ||
      approverPersona.personaKey === 'commercial_approver';

    if (!hasApprovalCap) {
      return {
        success: false,
        message: 'شما صلاحیت سازمانی تأیید تجاری یا تصویب نرخ سفارشات را ندارید.',
      };
    }

    // Revision check: cannot approve old / superseded revision
    const currentRev = order.revisions[0]?.revisionNumber || 1;
    if (targetRevision !== undefined && targetRevision < currentRev) {
      return {
        success: false,
        message: `امکان تصمیم‌گیری روی ویرایش ${targetRevision} وجود ندارد، این نگارش منسوخ شده است (SUPERSEDED) و صرفاً ویرایش جاری (ویرایش ${currentRev}) قابل بررسی و تصویب است.`,
      };
    }

    // Update Order Status
    order.status = 'approved';
    order.statusLabel = 'تأییدشده نهایی بازرگانی — صادرشده جهت خروج از انبار';
    order.approvalStatus = 'APPROVED';
    order.currentOwnerName = 'کامران داوودی (سرپرست انبار کهریزک)';
    if (order.commercialApproval) {
      order.commercialApproval.isSelfApprovalBlocked = false;
      order.commercialApproval.description = `${order.commercialApproval.description} [تأییدشده توسط ${approverPersona.name}: ${approvalNote || 'مورد تأیید است'}]`;
    }

    order.decisionHistory = order.decisionHistory || [];
    order.decisionHistory.unshift({
      approvalId: order.relatedApprovalId || `appr-${order.code}-rev${currentRev}`,
      revision: currentRev,
      status: 'APPROVED',
      decidedBy: `${approverPersona.name} (${approverPersona.jobTitle})`,
      decidedAtJalali: 'هم‌اکنون',
      notes: approvalNote || 'تأییدیه نهایی استثنای قیمت و سقف اعتبار صادر گردید.',
    });

    if (order.linkedWorkItemId) {
      mockRepository.approveRecord(order.linkedWorkItemId, approverPersona.name, approvalNote);
    }

    // Add revision note for approval
    order.revisions = order.revisions || [];
    order.revisions.unshift({
      revisionNumber: order.revisions.length + 1,
      dateJalali: '۱۴۰۴/۰۶/۱۲ - ۱۲:۳۰',
      modifiedBy: {
        id: approverPersona.id,
        name: approverPersona.name,
        role: approverPersona.jobTitle,
        department: approverPersona.department,
      },
      changeSummary: `تأیید نهایی تجاری و مجوز خروج از انبار توسط ${approverPersona.name}. یادداشت: ${approvalNote || 'نرخ و شرایط مصوب شد.'}`,
      beforeAmountRials: order.totalAmountRials,
      afterAmountRials: order.totalAmountRials,
      itemsDiff: [],
    });

    // Traceable Fulfillment / Warehouse Exit Creation!
    // Check if exit already exists for this order
    let existingExit = this.warehouseExits.find((e) => e.linkedSalesOrder.id === order.id);

    if (!existingExit) {
      const nextExitNum = this.warehouseExits.length + 60;
      const exitCode = `DSP-1403-0${nextExitNum}`;
      const exitId = `dsp-${Date.now()}`;
      const cust = this.customers.find((c) => c.id === order.customerId);

      const exitItems: WarehouseExitItem[] = order.items.map((item, idx) => ({
        id: `dsp-item-${Date.now()}-${idx}`,
        productId: item.productId,
        productCode: item.productId === 'prod-01' ? 'PRD-OIL-101' : 'PRD-OIL-102',
        productName: item.productName,
        requestedCartons: item.cartons,
        requestedQuantity: item.pieces || item.cartons,
        dispatchedCartons: 0,
        dispatchedQuantity: 0,
        unit: item.unit,
        salePriceRials: item.agreedUnitPriceRials,
        unitWeightKg: item.weightKg ? Math.round(item.weightKg / (item.cartons || 1)) : 16,
        notes: `تولید شده از سفارش مصوب ${order.code}`,
      }));

      const newExit: WarehouseExitRecord = {
        id: exitId,
        code: exitCode,
        dateJalali: '۱۴۰۴/۰۶/۱۲',
        linkedSalesOrder: {
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          approvedDateJalali: '۱۴۰۴/۰۶/۱۲',
          totalAmountRials: order.totalAmountRials,
        },
        buyer: {
          name: cust?.tradeName || order.customerName,
          nationalId: cust?.nationalId || '۱۰۱۰۲۸۴۷۱۵۰',
          phone: cust?.mobile || cust?.phone || '۰۹۱۲-۱۱۴-۵۵۲۱',
          economicCode: cust?.economicCode,
        },
        postalCode: cust?.locations[0]?.postalCode || '۱۹۹۱۸۴۷۱۲۳',
        deliveryAddress: order.deliveryAddress,
        salesConditions: order.paymentTerms,
        salesResponsible: {
          id: order.salesResponsibleId,
          name: order.salesResponsibleName,
          role: 'مسئول فروش و صدور حواله',
        },
        freightAmountRials: 45000000,
        deliveryMode: 'تحویل با ناوگان هماهنگ‌شده انبار کهریزک (DAP)',
        warehouse: {
          id: 'wh-01',
          name: 'انبار مرکزی کهریزک',
          code: 'WH-CENTRAL',
        },
        externalInventorySnapshot: {
          availableStockKg: 85000,
          sourceSystem: 'استعلام سیستمی WMS کهریزک',
          sourceTimestamp: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۲:۳۰',
          isSufficient: true,
        },
        items: exitItems,
        status: 'ready',
        logistics: {
          driverName: 'در انتظار تخصیص راننده بارانداز',
          driverPhone: '---',
          vehiclePlate: '---',
          vehicleType: 'خاور مسقف چادری ۶ چرخ',
          waybillNumber: `WB-TEH-${Math.floor(1000 + Math.random() * 9000)}`,
          freightAmountRials: 45000000,
          deliveryConfirmed: false,
        },
        approvalSignatures: [
          {
            roleKey: 'sales_responsible',
            roleLabel: 'کارشناس / مسئول فروش',
            signerName: order.salesResponsibleName,
            isSigned: true,
            signedAtJalali: '۱۴۰۴/۰۶/۱۲',
            comments: 'سفارش تأیید و حواله خروج صادر شد',
          },
          {
            roleKey: 'management',
            roleLabel: 'معاونت بازرگانی / مدیریت',
            signerName: approverPersona.name,
            isSigned: true,
            signedAtJalali: '۱۴۰۴/۰۶/۱۲',
            comments: approvalNote || 'مورد تأیید است',
          },
          {
            roleKey: 'ceo',
            roleLabel: 'مدیریت عامل (اختیاری)',
            isSigned: false,
          },
        ],
      };

      this.warehouseExits.unshift(newExit);
      existingExit = newExit;
    }

    // Add customer timeline entry
    this.addCustomerInteraction(order.customerId, {
      type: 'order',
      typeLabel: 'تأیید تجاری سفارش',
      title: `تأیید بازرگانی سفارش ${order.code}`,
      dateJalali: '۱۴۰۴/۰۶/۱۲',
      time: '۱۲:۳۰',
      actorName: approverPersona.name,
      actorRole: approverPersona.jobTitle,
      summary: `سفارش توسط ${approverPersona.name} تأیید شد و حواله خروج ${existingExit.code} در کارتابل انبار قرار گرفت.`,
      referenceCode: order.code,
      amountRials: order.totalAmountRials,
      linkRoute: 'warehouse_dispatch',
      linkId: existingExit.id,
      statusBadge: { text: 'تأیید نهایی شد', tone: 'success' },
    });

    // Prompt 2: Update linked approval work item in repository if present
    if (order.linkedWorkItemId) {
      const wi = mockRepository.getAllRecords().find((r) => r.id === order.linkedWorkItemId);
      if (wi) {
        wi.status = 'completed';
        wi.statusLabel = 'تأییدشده بازرگانی';
        wi.timeline.unshift({
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: {
            id: approverPersona.id,
            name: approverPersona.name,
            role: approverPersona.jobTitle,
            department: approverPersona.department,
          },
          title: 'تأیید نهایی بازرگانی سفارش',
          note: approvalNote || 'تأیید شد و حواله خروج انبار صادر گردید.',
          type: 'approval',
        });
      }
    }

    this.notify();
    return {
      success: true,
      message: `سفارش ${order.code} با موفقیت تأیید شد و حواله خروج انبار ${existingExit.code} برای سرپرست انبار صادر گردید.`,
      linkedWarehouseExit: existingExit,
    };
  }

  public rejectSalesOrder(
    orderId: string,
    approverPersona: MockPersona,
    reason: string,
    targetRevision?: number
  ): { success: boolean; message: string } {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'سفارش مورد نظر یافت نشد.' };

    if (order.createdById === approverPersona.id) {
      return { success: false, message: 'خطای تفکیک وظایف (SoD): ثبت‌کننده سفارش مجاز به رد یا تأیید سفارش خود نیست.' };
    }

    const currentRev = order.revisions[0]?.revisionNumber || 1;
    if (targetRevision !== undefined && targetRevision < currentRev) {
      return {
        success: false,
        message: `امکان تصمیم‌گیری روی ویرایش ${targetRevision} وجود ندارد، این نگارش منسوخ شده است (SUPERSEDED) و صرفاً ویرایش جاری (ویرایش ${currentRev}) قابل بررسی است.`,
      };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, message: 'ثبت دلیل رد سفارش الزامی است.' };
    }

    order.status = 'rejected';
    order.statusLabel = 'رد شده توسط معاونت بازرگانی';
    order.approvalStatus = 'REJECTED';
    order.currentOwnerName = order.salesResponsibleName;

    order.decisionHistory = order.decisionHistory || [];
    order.decisionHistory.unshift({
      approvalId: order.relatedApprovalId || `appr-${order.code}-rev${currentRev}`,
      revision: currentRev,
      status: 'REJECTED',
      decidedBy: `${approverPersona.name} (${approverPersona.jobTitle})`,
      decidedAtJalali: 'هم‌اکنون',
      notes: reason,
    });

    if (order.linkedWorkItemId) {
      mockRepository.rejectRecord(order.linkedWorkItemId, approverPersona.name, reason);
    }

    this.notify();
    return { success: true, message: `سفارش ${order.code} رد شد.` };
  }

  public returnSalesOrder(
    orderId: string,
    approverPersona: MockPersona,
    reason: string,
    targetRevision?: number
  ): { success: boolean; message: string } {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'سفارش مورد نظر یافت نشد.' };

    if (order.createdById === approverPersona.id) {
      return { success: false, message: 'خطای تفکیک وظایف (SoD): ثبت‌کننده سفارش مجاز به بازگشت یا تصمیم‌گیری روی سفارش خود نیست.' };
    }

    const currentRev = order.revisions[0]?.revisionNumber || 1;
    if (targetRevision !== undefined && targetRevision < currentRev) {
      return {
        success: false,
        message: `امکان تصمیم‌گیری روی ویرایش ${targetRevision} وجود ندارد، این نگارش منسوخ شده است (SUPERSEDED) و صرفاً ویرایش جاری (ویرایش ${currentRev}) قابل بررسی است.`,
      };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, message: 'ثبت دلیل بازگشت جهت اصلاح الزامی است.' };
    }

    order.status = 'returned';
    order.statusLabel = 'برگشت‌داده‌شده جهت اصلاح به کارشناس فروش';
    order.approvalStatus = 'RETURNED_FOR_CORRECTION';
    order.currentOwnerName = order.salesResponsibleName;

    order.decisionHistory = order.decisionHistory || [];
    order.decisionHistory.unshift({
      approvalId: order.relatedApprovalId || `appr-${order.code}-rev${currentRev}`,
      revision: currentRev,
      status: 'RETURNED_FOR_CORRECTION',
      decidedBy: `${approverPersona.name} (${approverPersona.jobTitle})`,
      decidedAtJalali: 'هم‌اکنون',
      notes: reason,
    });

    if (order.linkedWorkItemId) {
      mockRepository.returnRecord(order.linkedWorkItemId, approverPersona.name, reason);
    }

    this.notify();
    return { success: true, message: `سفارش ${order.code} با موفقیت جهت اصلاح به کارشناس بازگردانده شد.` };
  }

  public reviseSalesOrder(
    orderId: string,
    modifierPersona: MockPersona,
    updates: {
      deliveryAddress?: string;
      paymentTerms?: string;
      deliveryTerms?: string;
      items?: Array<{
        productId: string;
        cartons: number;
        agreedUnitPriceRials: number;
      }>;
    },
    changeSummary: string
  ): boolean {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) return false;

    const beforeAmount = order.totalAmountRials;
    const itemsDiff: OrderRevision['itemsDiff'] = [];

    if (updates.deliveryAddress && updates.deliveryAddress !== order.deliveryAddress) {
      itemsDiff.push({
        field: 'آدرس تحویل',
        before: order.deliveryAddress,
        after: updates.deliveryAddress,
        isCritical: false,
      });
      order.deliveryAddress = updates.deliveryAddress;
    }

    if (updates.paymentTerms && updates.paymentTerms !== order.paymentTerms) {
      itemsDiff.push({
        field: 'شرایط پرداخت',
        before: order.paymentTerms,
        after: updates.paymentTerms,
        isCritical: true,
      });
      order.paymentTerms = updates.paymentTerms;
    }

    if (updates.deliveryTerms && updates.deliveryTerms !== order.deliveryTerms) {
      itemsDiff.push({
        field: 'شرایط تحویل',
        before: order.deliveryTerms,
        after: updates.deliveryTerms,
        isCritical: false,
      });
      order.deliveryTerms = updates.deliveryTerms;
    }

    let reTriggerBelowFloor = false;

    if (updates.items && updates.items.length > 0) {
      updates.items.forEach((upItem) => {
        const lineItem = order.items.find((i) => i.productId === upItem.productId);
        if (lineItem) {
          if (upItem.cartons !== undefined && upItem.cartons !== lineItem.cartons) {
            itemsDiff.push({
              field: `تعداد کارتن (${lineItem.productName})`,
              before: `${lineItem.cartons} کارتن`,
              after: `${upItem.cartons} کارتن`,
              isCritical: true,
            });
            lineItem.cartons = upItem.cartons;
            lineItem.pieces = upItem.cartons * (lineItem.conversionFactor || 12);
            lineItem.weightKg = Math.round(lineItem.pieces * 1.3);
            lineItem.totalRials = lineItem.pieces * lineItem.agreedUnitPriceRials;
          }
          if (
            upItem.agreedUnitPriceRials !== undefined &&
            upItem.agreedUnitPriceRials !== lineItem.agreedUnitPriceRials
          ) {
            itemsDiff.push({
              field: `قیمت توافقی واحد (${lineItem.productName})`,
              before: `${lineItem.agreedUnitPriceRials.toLocaleString('fa-IR')} ریال`,
              after: `${upItem.agreedUnitPriceRials.toLocaleString('fa-IR')} ریال`,
              isCritical: true,
            });
            lineItem.agreedUnitPriceRials = upItem.agreedUnitPriceRials;
            lineItem.finalPriceRials = upItem.agreedUnitPriceRials;
            lineItem.totalRials = lineItem.pieces * upItem.agreedUnitPriceRials;

            if (upItem.agreedUnitPriceRials < lineItem.minPermittedPriceRials) {
              reTriggerBelowFloor = true;
            }
          }
        }
      });

      order.totalAmountRials = order.items.reduce((s, i) => s + i.totalRials, 0);
      itemsDiff.push({
        field: 'مبلغ کل سفارش',
        before: `${beforeAmount.toLocaleString('fa-IR')} ریال`,
        after: `${order.totalAmountRials.toLocaleString('fa-IR')} ریال`,
        isCritical: true,
      });
    }

    const hasCriticalChange = itemsDiff.some((d) => d.isCritical);
    const wasApproved = order.status === 'approved';

    if (reTriggerBelowFloor) {
      order.status = 'needs_price_approval';
      order.statusLabel = 'مشروط — نیازمند تأیید مجدد بازرگانی پس از ویرایش قیمت';
      order.hasPriceException = true;
      if (order.commercialApproval) {
        order.commercialApproval.description = `ابطال تأیید قبلی به دلیل ثبت نرخ زیر کف مصوب در نسخه جدید: نیازمند بررسی و تأیید مجدد مدیریت بازرگانی.`;
      }
      order.currentOwnerName = 'سهراب جوادیان (معاونت بازرگانی)';
    } else if (hasCriticalChange || wasApproved) {
      // Contract rule: A revision after submission supersedes previous approval; never silently reuse approval.
      order.status = 'under_review';
      order.statusLabel = 'ویرایش‌شده — ابطال تأیید قبلی و نیازمند بررسی مجدد بازرگانی';
      order.currentOwnerName = 'سهراب جوادیان (معاونت بازرگانی)';
      if (order.commercialApproval) {
        order.commercialApproval.description = `تأیید قبلی به دلیل تغییر اقلام یا شرایط مالی در نسخه جدید ابطال شد. نیازمند بررسی و تأیید مجدد.`;
      }
    }

    // If order had a linked warehouse exit in preparation, suspend it until re-approval
    if (wasApproved || hasCriticalChange || order.commercialApproval) {
      const linkedExit = this.warehouseExits.find((e) => e.linkedSalesOrder?.id === order.id);
      if (linkedExit && (linkedExit.status === 'preparing' || linkedExit.status === 'ready')) {
        linkedExit.status = 'blocked';
        linkedExit.blockedReason = `توقف صدور حواله: سفارش فروش ${order.code} مورد ویرایش قرار گرفته و تأییدیه پیشین منسوخ گردیده است. خروج کالا منوط به تأیید مجدد است.`;
      }
    }

    const newRevNumber = (order.revisions?.length || 0) + 1;
    const previousWorkItemId = order.linkedWorkItemId;

    // Invalidate previous approval instance and work item (superseded)
    if (previousWorkItemId) {
      const prevWi = mockRepository.getAllRecords().find((r) => r.id === previousWorkItemId);
      if (prevWi) {
        if (prevWi.approvalInstance) {
          prevWi.approvalInstance.approval_status = 'SUPERSEDED';
        }
        prevWi.status = 'cancelled';
        prevWi.statusLabel = 'منسوخ شده (تولید نگارش جدید)';
      }
    }

    // Create new Approval Instance for the new revision
    const newApprovalId = `appr-${order.code.toLowerCase()}-rev${newRevNumber}`;
    const newApprovalInstance: ApprovalInstance = {
      approval_id: newApprovalId,
      source_entity_type: 'SALES_ORDER',
      source_entity_id: order.id,
      source_entity_code: order.code,
      source_revision: newRevNumber,
      reason_codes: ['PRICE_BELOW_THRESHOLD', 'CREDIT_LIMIT_EXCEEDED'],
      reason_details: {
        priceDeviation: {
          productName: order.items[0]?.productName || 'روغن سرخ‌کردنی بطری ۱.۵ لیتری',
          referencePriceRials: 1250000,
          minAllowedPriceRials: 1180000,
          offeredPriceRials: order.items[0]?.agreedUnitPriceRials || 1220000,
          discountPercent: order.items[0]?.discountPercent || 2.4,
          differenceRials: -30000,
        },
        creditSnapshot: {
          source: 'سامانه حسابداری فروش و پایگاه اعتبارات بازرگانی',
          timestampJalali: '۱۴۰۴/۰۶/۱۲ - ۱۲:۰۰',
          customerCreditLimitRials: 20000000000,
          customerOpenBalanceRials: 18500000000,
          availableCreditRials: 1500000000,
          orderTotalRials: order.totalAmountRials,
          exceededAmountRials: Math.max(0, order.totalAmountRials - 1500000000),
        },
        notes: `نگارش جدید ${newRevNumber} سفارش پس از اصلاح توسط کارشناس فروش ثبت شد و مستلزم بررسی و تصمیم‌گیری مجدد است.`,
      },
      approval_status: 'PENDING_APPROVAL',
      resolved_approver: {
        id: 'p-comm-approver',
        name: 'سهراب جوادیان',
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
      },
      accountable_responsibility: {
        id: 'resp-commercial',
        code: 'RSP-101',
        title: 'مسئولیت بازرگانی، فروش و خط‌مشی قیمت‌گذاری',
        unitName: 'معاونت بازرگانی و فروش',
      },
      created_at: new Date().toISOString(),
      created_at_jalali: 'هم‌اکنون',
    };

    // Create new APPROVAL_REVIEW WorkItem for Sahrab Javadian
    const newWorkItemId = `wi-appr-${order.code.toLowerCase()}-rev${newRevNumber}`;
    const newWorkItemCode = `APPR-1404-0981-R${newRevNumber}`;
    const newWorkItem: OperationalRecord = {
      id: newWorkItemId,
      code: newWorkItemCode,
      title: `رسیدگی و تصویب اعتباری و قیمت سفارش فروش ORD-1404-0981 (نگارش ${newRevNumber})`,
      type: 'approval',
      workItemType: 'approval_review',
      typeLabel: 'بررسی و تصمیم‌گیری تأیید',
      itemSummary: `رسیدگی به استثنای قیمت و سقف اعتبار سفارش فروش ${order.code} شرکت فروشگاه‌های زنجیره‌ای مروارید سرو (نگارش ${newRevNumber})`,
      requestedAmountRials: order.totalAmountRials,
      quantitySummary: `${order.items.reduce((s, i) => s + i.cartons, 0)} کارتن`,
      unit: 'معاونت بازرگانی و فروش',
      tags: ['فروشگاه‌های زنجیره‌ای سرو', 'تصویب بازرگانی', 'سقف اعتبار', `نگارش ${newRevNumber}`],
      salesChannel: 'phone',
      linkedBusinessRecord: {
        id: order.id,
        code: order.code,
        title: order.title,
        category: 'sales_order',
        categoryLabel: 'سفارش فروش رسمی',
        currentStatus: 'در انتظار تأیید تجاری و اعتباری',
        summary: `مشتری: شرکت فروشگاه‌های زنجیره‌ای مروارید سرو — نگارش ${newRevNumber} — مبلغ: ${order.totalAmountRials.toLocaleString('fa-IR')} ریال`,
      },
      relatedRecords: [
        { id: order.id, code: order.code, title: `سفارش فروش رسمی صادره (نگارش ${newRevNumber})`, typeLabel: 'سفارش فروش', statusLabel: 'در انتظار تأیید تجاری و اعتباری' },
      ],
      commercialApprovalDetails: {
        triggerType: 'credit_limit_exceeded',
        title: 'تجاوز از سقف اعتباری باز مشتری و تخفیف موردی',
        description: `نگارش جدید ${newRevNumber} سفارش نیاز به بررسی و تصویب مجدد معاونت بازرگانی دارد.`,
        requestedDiscountPercent: 2.4,
        maxAuthorizedDiscountPercent: 3.0,
        requestedUnitPriceRials: order.items[0]?.agreedUnitPriceRials || 1220000,
        minAllowedUnitPriceRials: 1180000,
        orderTotalRials: order.totalAmountRials,
        customerCreditLimitRials: 20000000000,
        customerOpenBalanceRials: 18500000000,
        availableCreditRials: 1500000000,
        isSelfApprovalBlocked: false,
      },
      approvalInstance: newApprovalInstance,
      creator: {
        id: modifierPersona.id,
        name: modifierPersona.name,
        role: modifierPersona.jobTitle,
        department: modifierPersona.department,
        avatar: modifierPersona.avatar,
      },
      createdAt: new Date().toISOString(),
      createdAtJalali: 'هم‌اکنون',
      currentAssignee: {
        id: 'p-comm-approver',
        name: 'سهراب جوادیان',
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      },
      approver: {
        id: 'p-comm-approver',
        name: 'سهراب جوادیان',
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      },
      currentOwner: {
        id: 'p-comm-approver',
        name: 'سهراب جوادیان',
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      },
      owner: {
        id: 'p-comm-approver',
        name: 'سهراب جوادیان',
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
      },
      status: 'ready',
      statusLabel: 'آماده بررسی',
      statusSinceJalali: 'هم‌اکنون',
      priority: 'high',
      blocker: { exists: false },
      nextAction: {
        title: `بررسی اسناد اعتباری و تصمیم‌گیری تأیید/رد نگارش ${newRevNumber} سفارش ORD-1404-0981`,
        responsibleRole: 'معاونت بازرگانی',
        responsiblePersonName: 'سهراب جوادیان',
        dueJalali: 'حداکثر ۱۲ ساعت کاری',
        suggestedAction: 'approve',
      },
      timeline: [
        {
          id: `tl-create-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: {
            id: modifierPersona.id,
            name: modifierPersona.name,
            role: modifierPersona.jobTitle,
            department: modifierPersona.department,
          },
          title: `ارسال نگارش جدید (${newRevNumber}) سفارش جهت بررسی و تصمیم‌گیری تأیید`,
          note: `نگارش جدید پس از اصلاح توسط کارشناس فروش ایجاد گردید و پرونده جدید تأیید به جریان افتاد.`,
          type: 'creation',
        },
      ],
      comments: [],
      attachments: [],
    };
    mockRepository.addRecord(newWorkItem);

    // Update order fields
    order.status = 'pending_commercial_approval';
    order.statusLabel = 'در انتظار تأیید تجاری و اعتباری (معاونت بازرگانی)';
    order.approvalStatus = 'PENDING_APPROVAL';
    order.relatedApprovalId = newApprovalId;
    order.linkedWorkItemId = newWorkItemId;
    order.currentOwnerName = 'سهراب جوادیان (معاونت بازرگانی)';

    order.revisions = order.revisions || [];
    order.revisions.unshift({
      revisionNumber: newRevNumber,
      dateJalali: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۳:۰۰',
      modifiedBy: {
        id: modifierPersona.id,
        name: modifierPersona.name,
        role: modifierPersona.jobTitle,
        department: modifierPersona.department,
      },
      changeSummary,
      beforeAmountRials: beforeAmount,
      afterAmountRials: order.totalAmountRials,
      itemsDiff,
    });

    this.notify();
    return true;
  }

  // ================= WAREHOUSE EXITS / SALES DRAFTS =================

  public getWarehouseExits(): WarehouseExitRecord[] {
    return [...this.warehouseExits];
  }

  public getWarehouseExitById(id: string): WarehouseExitRecord | undefined {
    return this.warehouseExits.find((e) => e.id === id || e.code === id);
  }

  public createWarehouseExit(payload: CreateWarehouseExitPayload): WarehouseExitRecord {
    const nextCodeNum = this.warehouseExits.length + 61;
    const code = payload.code || `DSP-1403-0${nextCodeNum}`;
    const id = `dsp-${Date.now()}`;

    const items: WarehouseExitItem[] = payload.items.map((item, idx) => ({
      id: `dsp-item-${Date.now()}-${idx}`,
      productId: item.productId,
      productCode: item.productCode || 'PRD-OIL-101',
      productName: item.productName,
      requestedCartons: item.requestedCartons || Math.round(item.requestedQuantity / 12),
      requestedQuantity: item.requestedQuantity,
      dispatchedCartons: 0,
      dispatchedQuantity: 0,
      unit: item.unit || 'کیلوگرم',
      salePriceRials: item.salePriceRials,
      unitWeightKg: item.unitWeightKg || 16.5,
      notes: item.notes,
    }));

    const newExit: WarehouseExitRecord = {
      id,
      code,
      dateJalali: payload.dateJalali,
      linkedSalesOrder: payload.linkedSalesOrderId
        ? {
            id: payload.linkedSalesOrderId,
            code:
              this.salesOrders.find((o) => o.id === payload.linkedSalesOrderId)?.code ||
              'ORD-MANUAL',
            customerName: payload.buyer.name,
            approvedDateJalali: payload.dateJalali,
            totalAmountRials: items.reduce(
              (s, i) => s + (i.salePriceRials || 1200000) * i.requestedQuantity,
              0
            ),
          }
        : {
            id: 'ord-manual',
            code: 'صدور مستقیم حواله فروش',
            customerName: payload.buyer.name,
            approvedDateJalali: payload.dateJalali,
            totalAmountRials: 0,
          },
      buyer: {
        name: payload.buyer.name,
        nationalId: payload.buyer.nationalId,
        phone: payload.buyer.phone,
        economicCode: payload.buyer.economicCode,
      },
      postalCode: payload.postalCode,
      deliveryAddress: payload.deliveryAddress,
      salesConditions: payload.salesConditions,
      salesResponsible: payload.salesResponsible,
      freightAmountRials: payload.freightAmountRials,
      deliveryMode: payload.deliveryMode,
      externalTradeReference: payload.externalTradeReference,
      externalWarehouseReference: payload.externalWarehouseReference,
      warehouse: {
        id: payload.warehouseId || 'wh-01',
        name: payload.warehouseName || 'انبار مرکزی کهریزک',
        code: 'WH-CENTRAL',
      },
      externalInventorySnapshot: {
        availableStockKg: 85000,
        sourceSystem: 'استعلام لحظه‌ای سامانه انبارداری کهریزک',
        sourceTimestamp: `${payload.dateJalali} - ساعت ۱۱:۰۰`,
        isSufficient: true,
      },
      items,
      status: 'ready',
      logistics: {
        driverName: payload.driverName || 'در انتظار تعیین خودرو',
        driverPhone: payload.driverPhone || '---',
        vehiclePlate: payload.vehiclePlate || '---',
        vehicleType: payload.vehicleType || 'خاور مسقف ۶ چرخ',
        waybillNumber: payload.waybillNumber || `WB-TEH-${Math.floor(1000 + Math.random() * 9000)}`,
        freightAmountRials: payload.freightAmountRials,
        deliveryConfirmed: false,
      },
      approvalSignatures: [
        {
          roleKey: 'sales_responsible',
          roleLabel: 'مسئول فروش',
          signerName: payload.salesResponsible.name,
          isSigned: true,
          signedAtJalali: payload.dateJalali,
          comments: 'پیش‌نویس و حواله خروج صادر شد',
        },
        {
          roleKey: 'management',
          roleLabel: 'مدیریت بازرگانی',
          signerName:
            payload.creatorPersona.isManager || payload.creatorPersona.capabilities.includes('sales.approve')
              ? payload.creatorPersona.name
              : undefined,
          isSigned:
            payload.creatorPersona.isManager || payload.creatorPersona.capabilities.includes('sales.approve'),
          signedAtJalali: payload.dateJalali,
          comments: 'تأییدیه مدیریت',
        },
        {
          roleKey: 'ceo',
          roleLabel: 'مدیریت عامل (اختیاری)',
          isSigned: false,
        },
      ],
    };

    // If exit is not yet dispatched, create warehouse work item in mockRepository
    if (newExit.status !== 'dispatched') {
      const workItemId = `wi-exit-${Date.now()}`;
      const workItemCode = `TSK-${code}`;
      const newWorkItem: OperationalRecord = {
        id: workItemId,
        code: workItemCode,
        title: `اقدام انبارداری و بارگیری حواله خروج ${code}`,
        type: 'general_task',
        typeLabel: 'وظیفه تحویل و بارگیری انبار',
        itemSummary: `حواله خروج ${code} مربوط به سفارش ${newExit.linkedSalesOrder.code} (مشتری: ${newExit.buyer.name}) جهت بارگیری و خروج فیزیکی در صف اقدام انبار قرار گرفت.`,
        createdAt: new Date().toISOString(),
        createdAtJalali: 'هم‌اکنون',
        currentOwner: {
          id: 'p-wh-keeper',
          name: 'کامران داوودی',
          role: 'سرپرست انبار و لجستیک',
          department: 'انبار و لجستیک کالا',
          heldSinceJalali: 'هم‌اکنون',
          durationHours: 0,
        },
        currentAssignee: {
          id: 'p-wh-keeper',
          name: 'کامران داوودی',
          role: 'سرپرست انبار و لجستیک',
          department: 'انبار و لجستیک کالا',
        },
        status: 'in_progress',
        statusLabel: 'در انتظار بارگیری و خروج',
        statusSinceJalali: 'هم‌اکنون',
        priority: 'high',
        creator: {
          id: payload.creatorPersona.id,
          name: payload.creatorPersona.name,
          role: payload.creatorPersona.jobTitle,
          department: payload.creatorPersona.department,
        },
        owner: {
          id: 'p-wh-keeper',
          name: 'کامران داوودی',
          role: 'سرپرست انبار و لجستیک',
          department: 'انبار و لجستیک کالا',
        },
        unit: 'انبار و لجستیک کالا',
        tags: ['حواله خروج', 'انبار', 'بارگیری', 'تحویل'],
        blocker: null,
        nextAction: {
          title: 'ثبت شواهد خروج (راننده، پلاک، ساعت و تاریخ خروج) و تأیید بارگیری',
          responsibleRole: 'سرپرست انبار و لجستیک',
          responsiblePersonName: 'کامران داوودی',
          dueJalali: payload.dateJalali,
          suggestedAction: 'review',
        },
        linkedBusinessRecord: {
          id: newExit.id,
          code: newExit.code,
          title: `حواله خروج ${newExit.code} — ${newExit.buyer.name}`,
          category: 'warehouse_exit',
          categoryLabel: 'حواله خروج کالا',
          currentStatus: 'در انتظار بارگیری و خروج',
          summary: `سفارش فروش ${newExit.linkedSalesOrder.code}`,
        },
        timeline: [
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timestampJalali: 'هم‌اکنون',
            actor: {
              id: payload.creatorPersona.id,
              name: payload.creatorPersona.name,
              role: payload.creatorPersona.jobTitle,
              department: payload.creatorPersona.department,
            },
            title: 'صدور حواله خروج و ایجاد کارتابل انبار',
            note: `حواله خروج ${code} صادر گردید.`,
            type: 'creation',
          },
        ],
        comments: [],
        attachments: [],
        relatedRecords: [
          {
            id: newExit.id,
            code: newExit.code,
            title: `حواله خروج ${newExit.code}`,
            typeLabel: 'حواله خروج کالا',
            statusLabel: 'در انتظار بارگیری',
          },
        ],
      };
      mockRepository.createRecord(newWorkItem);
      newExit.linkedWorkItemId = workItemId;
    }

    this.warehouseExits.unshift(newExit);
    this.notify();
    return newExit;
  }

  public updateDispatchQuantities(
    exitId: string,
    dispatches: Array<{
      itemId: string;
      dispatchedQuantity: number;
      dispatchedCartons?: number;
      notes?: string;
    }>,
    actorPersona: MockPersona,
    outcome: WarehouseExitStatus,
    blockedReason?: string,
    dispatchDetails?: {
      driverName?: string;
      driverPhone?: string;
      vehiclePlate?: string;
      exitDateJalali?: string;
      exitTime?: string;
    }
  ): boolean {
    const exit = this.warehouseExits.find((e) => e.id === exitId);
    if (!exit) return false;

    dispatches.forEach((d) => {
      const item = exit.items.find((i) => i.id === d.itemId);
      if (item) {
        item.dispatchedQuantity = d.dispatchedQuantity;
        if (d.dispatchedCartons !== undefined) {
          item.dispatchedCartons = d.dispatchedCartons;
        }
        if (d.notes) {
          item.notes = d.notes;
        }
      }
    });

    exit.status = outcome;
    exit.blockedReason = blockedReason;

    const finalExitDate = dispatchDetails?.exitDateJalali || '۱۴۰۴/۰۶/۱۲';
    const finalExitTime = dispatchDetails?.exitTime || '۱۵:۰۰';
    exit.exitDateJalali = finalExitDate;
    exit.exitTime = finalExitTime;

    if (dispatchDetails?.driverName) exit.logistics.driverName = dispatchDetails.driverName;
    if (dispatchDetails?.driverPhone) exit.logistics.driverPhone = dispatchDetails.driverPhone;
    if (dispatchDetails?.vehiclePlate) exit.logistics.vehiclePlate = dispatchDetails.vehiclePlate;

    exit.dispatchActor = {
      person: {
        id: actorPersona.id,
        name: actorPersona.name,
        role: actorPersona.jobTitle,
        department: actorPersona.department,
      },
      dispatchedAtJalali: finalExitDate,
      dispatchedAtTime: finalExitTime,
    };

    if (outcome === 'dispatched') {
      exit.logistics.deliveryConfirmed = true;
      if (exit.linkedWorkItemId) {
        const wi = mockRepository.getRecordById(exit.linkedWorkItemId);
        if (wi) {
          wi.status = 'completed';
          wi.statusLabel = 'تکمیل‌شده';
          wi.workResult = {
            completedAtJalali: finalExitDate,
            completedBy: {
              id: actorPersona.id,
              name: actorPersona.name,
              role: actorPersona.jobTitle,
              department: actorPersona.department,
            },
            resultSummary: `بارگیری و خروج فیزیکی حواله ${exit.code} انجام و با موفقیت ثبت گردید. راننده: ${exit.logistics.driverName}، پلاک: ${exit.logistics.vehiclePlate}، زمان خروج: ${finalExitDate} ساعت ${finalExitTime}`,
            outcomeType: 'success',
          };
        }
      }
    }

    this.notify();
    return true;
  }

  public signWarehouseExit(
    exitId: string,
    roleKey: 'sales_responsible' | 'management' | 'ceo',
    signerPersona: MockPersona,
    comments?: string
  ): boolean {
    const exit = this.warehouseExits.find((e) => e.id === exitId);
    if (!exit) return false;

    exit.approvalSignatures = exit.approvalSignatures || [];
    let sig = exit.approvalSignatures.find((s) => s.roleKey === roleKey);
    if (!sig) {
      const labels: Record<string, string> = {
        sales_responsible: 'مسئول فروش',
        management: 'مدیریت بازرگانی',
        ceo: 'مدیریت عامل',
      };
      sig = {
        roleKey,
        roleLabel: labels[roleKey] || roleKey,
        isSigned: false,
      };
      exit.approvalSignatures.push(sig);
    }

    sig.isSigned = true;
    sig.signerName = signerPersona.name;
    sig.signedAtJalali = '۱۴۰۴/۰۶/۱۲';
    if (comments) sig.comments = comments;

    this.notify();
    return true;
  }
}

export const mockSalesWarehouseStore = new MockSalesWarehouseStore();
