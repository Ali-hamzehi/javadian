import { useSyncExternalStore } from 'react';
import { mockRepository as repository } from '../data/mockRepository';
import { mockSalesWarehouseStore as sales } from '../data/mockSalesWarehouseStore';
import { mockSupplyReceiptStore as supply } from '../data/mockSupplyReceiptStore';
import { MOCK_PERSONAS } from '../data/mockData';
import { MOCK_PAYMENT_REQUESTS } from '../data/mockSupplyLogisticsData';
import type { OperationalRecord, SalesOrderDetails, PaymentRequestRecord } from '../types';
import { loadPersistedState, savePersistedState, clearPersistedState, hasPersistedState } from './persistence';
import { getDisplayPersonaName, getDisplayPersonaRole } from './documentBasedPersonas';

// Observable adapters: protected fixtures and store implementations stay byte-identical.
let revision = 0;
const listeners = new Set<() => void>();
export const subscribeWorkflow = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function notifyWorkflow() {
  revision++;
  listeners.forEach(listener => listener());
  if (initialized) {
    savePersistedState({
      payments,
      repositoryRecords: repository.getAllRecords(),
      salesOrders: sales.getSalesOrders(),
      supplyRequests: supply.getSupplyRequests(),
    });
  }
}
export function useWorkflowRevision() { return useSyncExternalStore(subscribeWorkflow, () => revision, () => revision); }
sales.subscribe(notifyWorkflow);
supply.subscribe(notifyWorkflow);
type ApprovalRecord = OperationalRecord & { approvalStatus?: string };

export function ensureSalesApproval(order: SalesOrderDetails) {
  if (!['submitted', 'under_review', 'needs_price_approval', 'pending_approval', 'pending_commercial_approval'].includes(order.status)) return;
  const creator = MOCK_PERSONAS.find(p => p.id === order.createdById);
  const manager = MOCK_PERSONAS.find(p => p.personaKey === 'commercial_approver' && p.id !== order.createdById)
    || MOCK_PERSONAS.find(p => p.id !== order.createdById && p.capabilities.includes('sales.approve'));
  if (!manager) throw new Error('تأییدکننده مستقل برای سفارش تعریف نشده است.');
  const approver = { id: manager.id, name: getDisplayPersonaName(manager), role: getDisplayPersonaRole(manager), department: manager.department };
  const creatorName = getDisplayPersonaName(creator || { name: order.createdByName });
  const creatorRole = getDisplayPersonaRole(creator || { role: 'کارشناس فروش — نقش نمونه' });
  let record = order.linkedWorkItemId ? repository.getRecordById(order.linkedWorkItemId) as ApprovalRecord | undefined : undefined;
  if (!record) {
    record = {
      id: `wi-approval-${order.id}`, code: `TSK-${order.code}`, title: `بررسی سفارش ${order.code}`,
      type: 'approval', typeLabel: 'تأیید سفارش فروش', itemSummary: order.title,
      creator: { id: order.createdById, name: creatorName, role: creatorRole, department: creator?.department || 'بازرگانی' },
      owner: approver, currentOwner: { ...approver, heldSinceJalali: 'هم‌اکنون', durationHours: 0 },
      createdAt: new Date().toISOString(), createdAtJalali: 'هم‌اکنون', statusSinceJalali: 'هم‌اکنون',
      status: 'ready', statusLabel: 'آماده بررسی', priority: order.hasPriceException ? 'urgent' : 'normal',
      unit: approver.department, tags: ['فروش', 'تأیید'], blocker: null,
      nextAction: { title: 'بررسی و تصمیم‌گیری سفارش', responsibleRole: approver.role, responsiblePersonName: approver.name, dueJalali: 'تعیین نشده', suggestedAction: 'approve' },
      linkedBusinessRecord: { id: order.id, code: order.code, title: order.title, category: 'sales_order', categoryLabel: 'سفارش فروش', currentStatus: order.statusLabel, summary: order.title },
      timeline: [], comments: [], attachments: [], relatedRecords: [],
    };
    repository.addRecord(record);
    order.linkedWorkItemId = record.id;
  }
  record.type = 'approval'; record.workItemType = 'approval_review';
  record.approvalStatus = 'PENDING_APPROVAL';
  record.approver = record.approvalInstance?.resolved_approver || approver;
  record.currentAssignee = record.approver;
  record.currentOwner = { ...record.approver, heldSinceJalali: 'هم‌اکنون', durationHours: 0 };
  record.status = 'ready'; record.statusLabel = 'آماده بررسی';
  record.requestedAmountRials = order.totalAmountRials;
  order.approvalStatus = 'PENDING_APPROVAL';
  order.currentOwnerName = record.approver.name;
}

function observable<T extends object>(target: T, after?: (name: string, result: unknown) => void): T {
  return new Proxy(target, { get(object, key) {
    const value = Reflect.get(object, key);
    if (typeof value !== 'function') return value;
    const name = String(key);
    if (/^(get|find|filter|is|compute|check|subscribe)/.test(name)) return value.bind(object);
    return (...args: unknown[]) => {
      const result = value.apply(object, args);
      after?.(name, result);
      notifyWorkflow();
      return result;
    };
  } });
}
function isCurrentApproval(actor: Parameters<typeof repository.isActionableApprovalRecord>[0], record: OperationalRecord) {
  if (record.approvalInstance?.source_entity_type === 'SALES_ORDER') {
    const instance = record.approvalInstance;
    const order = sales.getSalesOrderById(instance.source_entity_id);
    if (!order || order.linkedWorkItemId !== record.id || instance.source_revision !== Math.max(...order.revisions.map(r => r.revisionNumber))) return false;
    // Keep canonical actor/lifecycle checks, but compare against the live order above.
    const current: ApprovalRecord = { ...record, approvalInstance: undefined, approver: instance.resolved_approver, approvalStatus: instance.approval_status };
    return repository.isActionableApprovalRecord(actor, current);
  }
  return repository.isActionableApprovalRecord(actor, record);
}
export function sanitizeDspTaskRecord(rec: OperationalRecord): OperationalRecord {
  if (rec.code !== 'DSP-1404-0550' && rec.id !== 'rec-004') return rec;
  const arashPerson = {
    id: 'p-warehouse',
    name: 'آرش',
    role: 'مسئول لجستیک و هماهنگی خرید',
    department: 'انبار و لجستیک کالا',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  };
  return {
    ...rec,
    creator: { ...rec.creator, ...arashPerson },
    owner: rec.owner ? { ...rec.owner, ...arashPerson } : undefined,
    currentOwner: { ...rec.currentOwner, ...arashPerson },
    currentAssignee: rec.currentAssignee
      ? { ...rec.currentAssignee, ...arashPerson }
      : { ...arashPerson, heldSinceJalali: '۱۴۰۴/۰۶/۱۲ - ۱۱:۰۰', durationHours: 4 },
    blocker: rec.blocker
      ? {
          ...rec.blocker,
          reporter: rec.blocker.reporter ? { ...rec.blocker.reporter, ...arashPerson } : rec.blocker.reporter,
        }
      : rec.blocker,
    nextAction: rec.nextAction
      ? {
          ...rec.nextAction,
          responsibleRole: 'مسئول لجستیک و هماهنگی خرید',
          responsiblePersonName: 'آرش',
        }
      : rec.nextAction,
    timeline:
      rec.timeline?.map((item) => ({
        ...item,
        actor:
          item.actor && (item.actor.id === 'p-warehouse' || item.actor.name?.includes('کامران داوودی'))
            ? { ...item.actor, ...arashPerson }
            : item.actor,
      })) || [],
  };
}

export const mockRepository = new Proxy(observable(repository), { get(target, key) {
  if (key === 'isActionableApprovalRecord') return isCurrentApproval;
  if (key === 'getActionableApprovalItems') return (actor: Parameters<typeof repository.getActionableApprovalItems>[0]) => actor ? repository.getAuthorizedRecords(actor).map(sanitizeDspTaskRecord).filter(record => isCurrentApproval(actor, record)) : [];
  if (key === 'computeScopedTaskCounts') return (actor: Parameters<typeof repository.computeScopedTaskCounts>[0]) => ({ ...repository.computeScopedTaskCounts(actor), approvals: actor ? repository.getAuthorizedRecords(actor).map(sanitizeDspTaskRecord).filter(record => isCurrentApproval(actor, record)).length : 0 });
  if (key === 'getRecordById') return (id: string) => {
    const r = repository.getRecordById(id);
    return r ? sanitizeDspTaskRecord(r) : undefined;
  };
  if (key === 'getAllRecords') return () => repository.getAllRecords().map(sanitizeDspTaskRecord);
  if (key === 'getAuthorizedRecords') return (actor: Parameters<typeof repository.getAuthorizedRecords>[0]) => repository.getAuthorizedRecords(actor).map(sanitizeDspTaskRecord);
  return Reflect.get(target, key);
} });
const observedSales = observable(sales, (name, result) => {
  if (name === 'createSalesOrder') ensureSalesApproval(result as SalesOrderDetails);
});
export const mockSalesWarehouseStore = new Proxy(observedSales, { get(target, key) {
  if (key === 'reviseSalesOrder') return (...args: Parameters<typeof sales.reviseSalesOrder>) => {
    const order = sales.getSalesOrderById(args[0]);
    if (!order || order.createdById !== args[1].id || !['returned', 'submitted', 'under_review', 'needs_price_approval', 'pending_commercial_approval'].includes(order.status)) return false;
    if (args[2].items?.some(item => !Number.isSafeInteger(item.cartons) || item.cartons <= 0 || !Number.isSafeInteger(item.agreedUnitPriceRials) || item.agreedUnitPriceRials <= 0)) return false;
    const result = target.reviseSalesOrder(...args);
    if (result) {
      ensureSalesApproval(order);
      const record = repository.getRecordById(order.linkedWorkItemId!)!;
      const revision = order.revisions[0]?.revisionNumber || 1;
      record.code = `APPR-${order.code}-R${revision}`;
      record.title = `بررسی سفارش ${order.code} — نگارش ${revision}`;
      record.itemSummary = `${order.customerName} — ${order.title}`;
      if (record.linkedBusinessRecord) { record.linkedBusinessRecord.summary = record.itemSummary; record.linkedBusinessRecord.currentStatus = order.statusLabel; }
      record.nextAction.title = `بررسی و تصمیم‌گیری نگارش ${revision} سفارش ${order.code}`;
      notifyWorkflow();
    }
    return result;
  };
  if (key === 'approveSalesOrder' || key === 'rejectSalesOrder' || key === 'returnSalesOrder') {
    return (...args: Parameters<typeof sales.approveSalesOrder>) => {
      const order = sales.getSalesOrderById(args[0]);
      if (!order || !['submitted', 'under_review', 'needs_price_approval', 'pending_approval', 'pending_commercial_approval'].includes(order.status)) {
        return { success: false, message: 'این سفارش دیگر در انتظار تصمیم نیست؛ نسخه جاری را بررسی کنید.' };
      }
      return (target[key] as typeof sales.approveSalesOrder)(...args);
    };
  }
  if (key === 'updateDispatchQuantities') {
    return (...args: Parameters<typeof sales.updateDispatchQuantities>) => {
      const [exitId, dispatches, , outcome] = args;
      const exit = sales.getWarehouseExitById(exitId);
      if (!exit) return false;

      // Cancellation guard: cancelled exits cannot be dispatched
      if ((exit.status as string) === 'cancelled') return false;

      // Stale / repeated action guard: already dispatched exits cannot be dispatched again
      if (exit.status === 'dispatched' && outcome === 'dispatched') return false;

      // Cumulative partial dispatch quantity check:
      // Dispatched quantities cannot exceed requested/approved cumulative quantities or be negative
      for (const d of dispatches) {
        const item = exit.items.find((i) => i.id === d.itemId);
        if (item) {
          if (d.dispatchedQuantity > item.requestedQuantity || d.dispatchedQuantity < 0) return false;
          if (d.dispatchedCartons !== undefined && item.requestedCartons !== undefined) {
            if (d.dispatchedCartons > item.requestedCartons || d.dispatchedCartons < 0) return false;
          }
        }
      }

      const result = target.updateDispatchQuantities(...args);
      if (result) {
        notifyWorkflow();
      }
      return result;
    };
  }
  return Reflect.get(target, key);
} });
function syncSupplyWorkItems() {
  supply.getSupplyRequests().forEach(request => {
    const record = request.linkedWorkItemId ? repository.getRecordById(request.linkedWorkItemId) : undefined;
    if (!record) return;
    record.linkedBusinessRecord!.currentStatus = request.statusReason || request.status;
    if (request.status === 'supplied') { record.status = 'completed'; record.statusLabel = 'تأمین کامل'; }
    else if (request.status === 'cancelled') { record.status = 'cancelled'; record.statusLabel = 'لغوشده'; }
    else if (request.status === 'blocked') { record.status = 'blocked'; record.statusLabel = 'مسدود'; }
    else if (request.status === 'partial') { record.status = 'in_progress'; record.statusLabel = 'تأمین جزئی؛ در انتظار باقیمانده'; }
  });
}
const observedSupply = observable(supply, syncSupplyWorkItems);
export const mockSupplyReceiptStore = new Proxy(observedSupply, { get(target, key) {
  if (key === 'updateSupplyResult') return (...args: Parameters<typeof supply.updateSupplyResult>) => {
    const request = supply.getSupplyRequestById(args[0]);
    if (!request || request.items.some(item => {
      const quantity = args[1][item.id] ?? item.suppliedQuantity ?? 0;
      return !Number.isFinite(quantity) || quantity < 0 || quantity > item.quantity || (args[2] === 'supplied_complete' && quantity !== item.quantity);
    })) return false;
    const result = target.updateSupplyResult(...args);
    // Keep delivery and outstanding quantities consistent with supplied quantities.
    request.items.forEach(item => { item.receivedQuantity = item.suppliedQuantity ?? 0; item.remainingQuantity = Math.max(0, item.quantity - item.receivedQuantity); });
    notifyWorkflow();
    return result;
  };
  return Reflect.get(target, key);
} });

export function sanitizePaymentRecord(p: PaymentRequestRecord): PaymentRequestRecord {
  if (p.id === 'pay-06' || p.code === 'PAY-1403-138') {
    return {
      ...p,
      contextType: 'company',
      category: 'freight',
      amountRials: 75000000,
      purpose: 'کرایه حمل بارنامه رسمی باربری محموله روغن خوراکی انبار کهریزک',
      beneficiary: {
        name: 'شرکت حمل‌ونقل سراسری باربری کالا',
        nationalOrEconomicCode: '۱۰۱۰۲۴۵۸۹۶۱',
        bankName: 'بانک ملت - شعبه مرکزی',
        maskedIban: 'IR58 •••• •••• •••• •••• •••• 9210',
        fullIban: 'IR580120000000001234569210',
        maskedCard: '۶۱۰۴ •••• •••• ۹۲۱۰',
        fullCard: '۶۱۰۴۳۳۷۸۹۰۱۲۹۲۱۰',
      },
      requester: {
        id: 'p-warehouse',
        name: 'آرش',
        role: 'مسئول لجستیک و هماهنگی خرید',
        department: 'انبار و لجستیک کالا',
      },
      reviewer: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس مالی — نقش نمونه',
        department: 'امور مالی',
      },
      approver: {
        id: 'p-fin-dir',
        name: 'تأییدکننده مالی — نقش نمونه',
        role: 'تأییدکننده مالی — نقش نمونه',
        department: 'امور مالی',
      },
      executor: {
        id: 'p-fin-dir',
        name: 'تأییدکننده مالی — نقش نمونه',
        role: 'تأییدکننده مالی — نقش نمونه',
        department: 'امور مالی',
      },
      status: 'submitted',
      statusNote: 'آماده بررسی و تأیید مالی',
      isSelfApprovalBlocked: false,
      unauthorizedRegionOrCategoryWarning: undefined,
      auditLogs: [
        {
          id: 'aud-9',
          timestampJalali: '۱۴۰۴/۰۶/۱۲ - ۱۲:۰۰',
          actorName: 'آرش',
          action: 'ثبت درخواست پرداخت کرایه حمل',
          details: 'پیوست بارنامه رسمی و فیش باسکول ثبت گردید.',
        },
      ],
    };
  }

  return {
    ...p,
    requester: {
      ...p.requester,
      name: getDisplayPersonaName(p.requester),
      role: getDisplayPersonaRole(p.requester),
    },
    reviewer: p.reviewer
      ? {
          ...p.reviewer,
          name: getDisplayPersonaName(p.reviewer),
          role: getDisplayPersonaRole(p.reviewer),
        }
      : p.reviewer,
    approver: {
      ...p.approver,
      name: getDisplayPersonaName(p.approver),
      role: getDisplayPersonaRole(p.approver),
    },
    executor: {
      ...p.executor,
      name: getDisplayPersonaName(p.executor),
      role: getDisplayPersonaRole(p.executor),
    },
    statusNote: p.statusNote
      ? p.statusNote.replace(
          /مسدود به علت قانون جلوگیری از خود-تأییدی \(Self-Approval Blocked\)/g,
          'مسدود به علت قانون تفکیک وظایف و جلوگیری از خود-تأییدی'
        )
      : p.statusNote,
    auditLogs:
      p.auditLogs?.map((log) => ({
        ...log,
        actorName: getDisplayPersonaName(log.actorName),
      })) || [],
  };
}

let payments: PaymentRequestRecord[] = structuredClone(MOCK_PAYMENT_REQUESTS).map(sanitizePaymentRecord);
export function getPayments() { return payments; }
export function setPayments(next: PaymentRequestRecord[] | ((previous: PaymentRequestRecord[]) => PaymentRequestRecord[])) {
  const nextPayments = typeof next === 'function' ? next(payments) : next;
  payments = nextPayments.map(sanitizePaymentRecord);
  payments.forEach(syncPaymentWorkItem);
  notifyWorkflow();
}
export function usePayments(): [PaymentRequestRecord[], typeof setPayments] {
  useWorkflowRevision();
  return [payments, setPayments];
}
function syncPaymentWorkItem(payment: PaymentRequestRecord) {
  let record = repository.getAllRecords().find(r => r.linkedBusinessRecord?.id === payment.id) as ApprovalRecord | undefined;
  if (!record && payment.status !== 'draft') {
    record = {
      id: `wi-payment-${payment.id}`, code: `TSK-${payment.code}`, title: `رسیدگی به پرداخت ${payment.code}`, type: 'approval', typeLabel: 'رسیدگی مالی', itemSummary: payment.purpose,
      creator: payment.requester, owner: payment.requester, currentOwner: { ...payment.approver, heldSinceJalali: 'هم‌اکنون', durationHours: 0 },
      createdAt: new Date().toISOString(), createdAtJalali: payment.createdAtJalali, statusSinceJalali: 'هم‌اکنون', status: 'ready', statusLabel: 'آماده بررسی', priority: 'normal',
      unit: payment.approver.department, tags: ['پرداخت'], blocker: null,
      nextAction: { title: 'رسیدگی مالی', responsibleRole: payment.approver.role, responsiblePersonName: payment.approver.name, dueJalali: 'تعیین نشده', suggestedAction: 'approve' },
      linkedBusinessRecord: { id: payment.id, code: payment.code, title: payment.purpose, category: 'payment_request', categoryLabel: 'پرداخت', currentStatus: payment.status, summary: payment.purpose }, timeline: [], comments: [], attachments: [], relatedRecords: [],
    };
    repository.addRecord(record);
  }
  if (!record) return;
  const pending = ['submitted', 'under_review', 'pending'].includes(payment.status);
  const terminal = ['paid', 'closed', 'cancelled', 'rejected'].includes(payment.status);
  const person = pending ? payment.approver : payment.status === 'returned' ? payment.requester : payment.executor;
  record.type = pending ? 'approval' : 'general_task';
  record.workItemType = pending ? 'approval_review' : 'followup';
  record.approver = pending ? payment.approver : undefined;
  record.approvalStatus = pending ? 'PENDING_APPROVAL' : payment.status.toUpperCase();
  record.currentAssignee = person;
  record.currentOwner = { ...person, heldSinceJalali: 'هم‌اکنون', durationHours: 0 };
  record.status = payment.status === 'blocked' ? 'blocked' : terminal ? (payment.status === 'rejected' ? 'rejected' : payment.status === 'cancelled' ? 'cancelled' : 'completed') : pending ? 'ready' : payment.status === 'returned' ? 'returned' : 'in_progress';
  const labels: Record<string, string> = { submitted: 'آماده بررسی مالی', under_review: 'در حال رسیدگی مالی', approved: 'تأییدشده؛ در انتظار خزانه‌داری', ready: 'آماده پرداخت', paid: 'پرداخت‌شده', returned: 'عودت جهت اصلاح', rejected: 'ردشده', cancelled: 'لغوشده', blocked: 'مسدود' };
  record.statusLabel = payment.statusNote || labels[payment.status] || 'در حال رسیدگی';
  record.requestedAmountRials = payment.amountRials;
  record.linkedBusinessRecord!.currentStatus = record.statusLabel;
  record.nextAction = { title: pending ? 'بررسی و تأیید درخواست پرداخت' : terminal ? 'مشاهده سابقه' : 'ادامه رسیدگی در پرونده پرداخت', responsibleRole: person.role, responsiblePersonName: person.name, dueJalali: 'تعیین نشده', suggestedAction: pending ? 'approve' : 'review' };
}
export function decidePayment(recordId: string, actorId: string, decision: 'approved' | 'returned' | 'rejected', note = '') {
  const record = repository.getRecordById(recordId);
  const payment = payments.find(p => p.id === record?.linkedBusinessRecord?.id);
  const actor = MOCK_PERSONAS.find(p => p.id === actorId);
  if (!payment || !actor || payment.requester.id === actorId || payment.approver.id !== actorId || !['submitted', 'under_review', 'pending'].includes(payment.status)) return false;
  setPayments(current => current.map(p => p.id !== payment.id ? p : { ...p, status: decision, statusNote: note || (decision === 'approved' ? 'تأیید شد؛ در انتظار خزانه‌داری' : 'نیازمند رسیدگی'), auditLogs: [...p.auditLogs, { id: `audit-${crypto.randomUUID()}`, timestampJalali: new Date().toLocaleDateString('fa-IR'), actorName: getDisplayPersonaName(actor), action: decision, details: note }] }));
  return true;
}

export type { CreateWarehouseExitPayload } from '../data/mockSalesWarehouseStore';

let initialized = false;
export function initializeWorkflow() {
  if (initialized) return;
  initialized = true;

  const persisted = loadPersistedState();
  if (persisted) {
    if (Array.isArray(persisted.payments) && persisted.payments.length > 0) {
      payments = persisted.payments.map(sanitizePaymentRecord);
    }
    if (Array.isArray(persisted.repositoryRecords)) {
      for (const rec of persisted.repositoryRecords) {
        if (!repository.getRecordById(rec.id)) {
          repository.addRecord(rec);
        } else {
          repository.updateRecord(rec);
        }
      }
    }
    if (Array.isArray(persisted.salesOrders)) {
      const currentOrders = sales.getSalesOrders();
      for (const order of persisted.salesOrders) {
        const existing = sales.getSalesOrderById(order.id);
        if (existing) {
          Object.assign(existing, order);
        } else {
          currentOrders.push(order);
        }
      }
    }
    if (Array.isArray(persisted.supplyRequests)) {
      const currentRequests = supply.getSupplyRequests();
      for (const req of persisted.supplyRequests) {
        const existing = supply.getSupplyRequestById(req.id);
        if (existing) {
          Object.assign(existing, req);
        } else {
          currentRequests.push(req);
        }
      }
    }
  }

  const dspRec = repository.getRecordById('rec-004');
  if (dspRec) {
    repository.updateRecord(sanitizeDspTaskRecord(dspRec));
  }

  sales.getSalesOrders().forEach(ensureSalesApproval);
  payments.forEach(syncPaymentWorkItem);
  syncSupplyWorkItems();
  notifyWorkflow();
}

export { clearPersistedState, hasPersistedState };
