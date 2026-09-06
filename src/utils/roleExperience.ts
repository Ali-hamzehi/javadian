import { MockPersona, OperationalRecord } from '../types';
import { canActorCreateWorkItem } from './workItemAuthorization';
import { getDocumentBasedPersonaById } from '../runtime/documentBasedPersonas';

export type UserExperienceType = 'employee' | 'manager' | 'hybrid';

export interface RequestTypeOption {
  key: string;
  title: string;
  description: string;
  routeKey: string;
  category: 'sales' | 'supply' | 'finance' | 'warehouse' | 'general';
  actionType?: string;
}

/**
 * Determines the experience type for a given persona:
 * - Pure Employee: only regular operational tasks, no management/approvals oversight.
 * - Manager: primarily approvals, oversight, and team tracking.
 * - Hybrid: both operational executor duties AND managerial/delegated approval responsibilities.
 */
export function determineUserExperienceType(persona: MockPersona): UserExperienceType {
  const pId = persona.id;

  // Arash: multi-responsibility operational employee (logistics, purchasing, receipts, freight)
  if (pId === 'p-warehouse') {
    return 'hybrid';
  }

  // Naderi: pure operational employee in field sales (Qom)
  if (pId === 'p-field-sales') {
    return 'employee';
  }

  // Sales specialist placeholder: pure employee
  if (pId === 'p-sales') {
    return 'employee';
  }

  // Finance specialist placeholder: pure employee
  if (pId === 'p-fin-spec') {
    return 'employee';
  }

  // Warehouse ordinary placeholder: pure employee
  if (pId === 'p-ordinary') {
    return 'employee';
  }

  // Master data placeholder: employee / specialist
  if (pId === 'p-master-data') {
    return 'employee';
  }

  // Yousefi: hybrid (operational fallback for Arash + supplier relations)
  if (pId === 'p-multi-delegate') {
    return 'hybrid';
  }

  // Commercial approver: hybrid (commercial review + operational coordination)
  if (pId === 'p-comm-approver') {
    return 'hybrid';
  }

  // Montazeri (CEO): manager with hands-on operational dispatch/supplier payments
  if (pId === 'p-ops-dir') {
    return 'manager';
  }

  // Finance approver: manager (decisions / approvals)
  if (pId === 'p-fin-dir') {
    return 'manager';
  }

  // Admin ops: manager
  if (pId === 'p-admin-ops') {
    return 'manager';
  }

  const hasManagementCaps =
    persona.capabilities.includes('MANAGEMENT_VIEW') ||
    persona.capabilities.includes('ops_view') ||
    persona.capabilities.includes('USER_MANAGE') ||
    persona.capabilities.includes('RESPONSIBILITY_MANAGE');

  const hasApprovalCaps =
    persona.capabilities.includes('approvals.view') ||
    persona.capabilities.includes('sales.approve') ||
    persona.capabilities.includes('finance.payment_request.approve') ||
    persona.capabilities.includes('pricing.approve');

  if (persona.isManager && (hasManagementCaps || hasApprovalCaps)) {
    return 'manager';
  }

  return 'employee';
}

/**
 * Returns genuinely authorized request types that the given persona can initiate,
 * strictly matching the documented scope of each persona.
 */
export function getAuthorizedRequestTypes(persona: MockPersona): RequestTypeOption[] {
  const options: RequestTypeOption[] = [];
  const pId = persona.id;
  const docPersona = getDocumentBasedPersonaById(pId);

  // 1. Arash (Logistics & Purchasing Coordinator)
  if (pId === 'p-warehouse') {
    options.push({
      key: 'inventory_receipt',
      title: 'ثبت ورود کالا (رسید انبار)',
      description: 'ثبت محموله وارده بر اساس بارنامه و قبض باسکول (مسئول اصلی)',
      routeKey: 'inventory_receipts',
      category: 'warehouse',
      actionType: 'create_receipt',
    });
    options.push({
      key: 'inventory_dispatch',
      title: 'ثبت خروج کالا از انبار',
      description: 'ثبت حواله خروج و بارگیری کالا طبق دستور تحویل',
      routeKey: 'inventory_dispatches',
      category: 'warehouse',
      actionType: 'create_dispatch',
    });
    options.push({
      key: 'payment_request_freight',
      title: 'درخواست پرداخت کرایه حمل بار',
      description: 'ثبت دستور پرداخت منحصراً برای هزینه حمل و بارنامه',
      routeKey: 'payment_requests',
      category: 'finance',
      actionType: 'create_freight_payment',
    });
    options.push({
      key: 'supply_request',
      title: 'هماهنگی و پیگیری خرید کالا',
      description: 'ثبت نیاز خرید اقلام یا مواد اولیه',
      routeKey: 'supply_requests',
      category: 'supply',
      actionType: 'create_supply',
    });
    return options;
  }

  // 2. Mr. Naderi (Regional Field Sales - Qom Scoped)
  if (pId === 'p-field-sales') {
    options.push({
      key: 'sales_order',
      title: 'ثبت سفارش فروش مویرگی (قم)',
      description: 'ثبت پیش‌فاکتور و سفارش مشتریان در محدوده استان قم',
      routeKey: 'sales_orders',
      category: 'sales',
      actionType: 'create_order',
    });
    options.push({
      key: 'sales_call',
      title: 'ثبت تماس و گزارش ویزیت (قم)',
      description: 'ثبت پرونده ویزیت و مذاکره با خریداران در قم',
      routeKey: 'sales_calls',
      category: 'sales',
      actionType: 'create_call',
    });
    options.push({
      key: 'payment_request_qom',
      title: 'پرداخت محلی قم (کارگر / راننده)',
      description: 'ثبت هزینه کارگری تخلیه و تنخواه رانندگان منحصراً در استان قم',
      routeKey: 'payment_requests',
      category: 'finance',
      actionType: 'create_qom_payment',
    });
    return options;
  }

  // 3. Mr. Yousefi (Operational Fallback & Supplier Relations)
  if (pId === 'p-multi-delegate') {
    options.push({
      key: 'inventory_receipt_fallback',
      title: 'ثبت رسید انبار (جانشین آرش)',
      description: 'ثبت رسید انبار منحصراً در غیاب آرش (مسئول اصلی لجستیک)',
      routeKey: 'inventory_receipts',
      category: 'warehouse',
      actionType: 'create_receipt_fallback',
    });
    options.push({
      key: 'payment_request_supplier',
      title: 'درخواست پرداخت تأمین‌کننده',
      description: 'ثبت دستور پرداخت برای تأمین‌کنندگان کالا و مواد اولیه',
      routeKey: 'payment_requests',
      category: 'finance',
      actionType: 'create_supplier_payment',
    });
    options.push({
      key: 'supply_request',
      title: 'پیگیری درخواست تأمین کالا',
      description: 'ارتباط با تأمین‌کنندگان و ثبت نیاز اقلام',
      routeKey: 'supply_requests',
      category: 'supply',
      actionType: 'create_supply',
    });
    return options;
  }

  // 4. Mr. Montazeri (CEO with Operational Capabilities)
  if (pId === 'p-ops-dir') {
    options.push({
      key: 'sales_order_draft',
      title: 'صدور پیش‌نویس فاکتور فروش / خروج انبار',
      description: 'ثبت عملیاتی پیش‌نویس فروش یا دستور خروج کالا',
      routeKey: 'sales_orders',
      category: 'sales',
      actionType: 'create_order_draft',
    });
    options.push({
      key: 'payment_request_supplier',
      title: 'دستور پرداخت تأمین‌کننده',
      description: 'ثبت دستور پرداخت برای تأمین‌کنندگان طرف قرارداد',
      routeKey: 'payment_requests',
      category: 'finance',
      actionType: 'create_supplier_payment',
    });
    options.push({
      key: 'inventory_receipt_fallback',
      title: 'ثبت رسید انبار (در نبود مسئول)',
      description: 'ثبت اضطراری رسید انبار در غیاب مسئول اصلی',
      routeKey: 'inventory_receipts',
      category: 'warehouse',
      actionType: 'create_receipt_fallback',
    });
    options.push({
      key: 'assign_task',
      title: 'ارجاع وظیفه به مدیران و واحدها',
      description: 'تعریف کار جدید و واگذاری به همکاران',
      routeKey: 'inbox',
      category: 'general',
      actionType: 'assign_task',
    });
    return options;
  }

  // 5. Sales Specialist (Demo Placeholder)
  if (pId === 'p-sales') {
    options.push({
      key: 'sales_order',
      title: 'سفارش فروش جدید',
      description: 'ثبت پیش‌فاکتور و سفارش مشتری بر اساس قیمت مصوب',
      routeKey: 'sales_orders',
      category: 'sales',
      actionType: 'create_order',
    });
    options.push({
      key: 'sales_call',
      title: 'ثبت تماس / پیام مشتری',
      description: 'ثبت درخواست‌های تلفنی و پیام‌های خریداران',
      routeKey: 'sales_calls',
      category: 'sales',
      actionType: 'create_call',
    });
    options.push({
      key: 'inventory_dispatch',
      title: 'پیش‌نویس حواله خروج انبار',
      description: 'ایجاد درخواست خروج اقلام برای سفارش‌های فروش',
      routeKey: 'inventory_dispatch',
      category: 'warehouse',
      actionType: 'create_dispatch',
    });
    // Explicitly NO payment creation per documented facts
    return options;
  }

  // 6. Finance Specialist (Demo Placeholder)
  if (pId === 'p-fin-spec') {
    options.push({
      key: 'payment_request',
      title: 'درخواست پرداخت و تسویه مالی',
      description: 'ثبت دستور پرداخت فاکتورهای شرکتی و تأمین‌کنندگان',
      routeKey: 'payment_requests',
      category: 'finance',
      actionType: 'create_payment',
    });
    return options;
  }

  // General fallback using capabilities
  const caps = persona.capabilities;

  if (caps.includes('sales.create')) {
    options.push({
      key: 'sales_order',
      title: 'سفارش فروش جدید',
      description: 'ثبت پیش‌فاکتور و سفارش مشتری بر اساس قیمت مصوب و سقف اعتبار',
      routeKey: 'sales_orders',
      category: 'sales',
      actionType: 'create_order',
    });
  }

  if (caps.includes('crm.write')) {
    options.push({
      key: 'sales_call',
      title: 'ثبت تماس / پیام مشتری',
      description: 'تبدیل پیام‌های تلفنی و غیررسمی به پرونده رسمی مشتری',
      routeKey: 'sales_calls',
      category: 'sales',
      actionType: 'create_call',
    });
  }

  if (caps.includes('supply.create')) {
    options.push({
      key: 'supply_request',
      title: 'درخواست تأمین کالا',
      description: 'ثبت نیاز خرید روغن خام، ملزومات بسته‌بندی یا مواد اولیه',
      routeKey: 'supply_requests',
      category: 'supply',
      actionType: 'create_supply',
    });
  }

  if (canActorCreateWorkItem(persona) || caps.includes('WORK_CREATE') || caps.includes('WORK_ASSIGN')) {
    options.push({
      key: 'assign_task',
      title: 'واگذاری کار جدید به همکار',
      description: 'تعریف وظیفه مشخص و ارجاع مستقیم به همکاران واحد',
      routeKey: 'inbox',
      category: 'general',
      actionType: 'assign_task',
    });
  }

  return options;
}

/**
 * Filter operational records for the Employee Experience:
 * - 'to_do': actionable items for current user (not completed/rejected/cancelled)
 * - 'tracking': items submitted by user held by someone else
 * - 'history': completed, rejected, cancelled items
 */
export function filterEmployeeRecords(
  records: OperationalRecord[],
  persona: MockPersona,
  tab: 'to_do' | 'tracking' | 'history'
): OperationalRecord[] {
  const isAssignee = (rec: OperationalRecord) => {
    if (rec.currentAssignee?.id === persona.id) return true;
    if (rec.currentOwner?.id === persona.id) return true;
    if (persona.personaKey === 'multi_delegate') {
      return Boolean(rec.currentAssignee?.isActingDelegate || rec.currentOwner?.isActingDelegate);
    }
    return false;
  };

  const isCreator = (rec: OperationalRecord) => rec.creator.id === persona.id;
  const isOwner = (rec: OperationalRecord) => rec.owner?.id === persona.id;

  const isTerminal = (rec: OperationalRecord) =>
    rec.status === 'completed' || rec.status === 'rejected' || rec.status === 'cancelled';

  if (tab === 'to_do') {
    return records.filter((rec) => {
      if (isTerminal(rec)) return false;
      return isAssignee(rec);
    });
  }

  if (tab === 'tracking') {
    return records.filter((rec) => {
      if (isTerminal(rec)) return false;
      // Created or owned by user, but held by someone else
      if (!isCreator(rec) && !isOwner(rec)) return false;
      // If user is currently holding it, it belongs in to_do
      if (isAssignee(rec)) return false;
      return true;
    });
  }

  if (tab === 'history') {
    return records.filter((rec) => {
      if (!isTerminal(rec)) return false;
      return isAssignee(rec) || isCreator(rec) || isOwner(rec);
    });
  }

  return [];
}

/**
 * Generate a friendly, accurate one-line operational summary for employees
 */
export function getEmployeeOneLineSummary(records: OperationalRecord[], persona: MockPersona): string | null {
  const toDoList = filterEmployeeRecords(records, persona, 'to_do');
  const trackingList = filterEmployeeRecords(records, persona, 'tracking');

  if (toDoList.length === 0 && trackingList.length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (toDoList.length > 0) {
    parts.push(`${toDoList.length} کار برای اقدام`);
  }
  const blockedCount = toDoList.filter((r) => r.status === 'blocked' || r.blocker?.exists).length;
  if (blockedCount > 0) {
    parts.push(`${blockedCount} مورد مسدود`);
  }
  const returnedCount = toDoList.filter((r) => r.status === 'returned').length;
  if (returnedCount > 0) {
    parts.push(`${returnedCount} مورد برگشتی جهت اصلاح`);
  }
  if (trackingList.length > 0) {
    parts.push(`${trackingList.length} درخواست در دست پیگیری`);
  }

  return parts.join(' • ');
}
