import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { mockRepository } from '../src/runtime/workflow';
import {
  determineUserExperienceType,
  getAuthorizedRequestTypes,
  filterEmployeeRecords,
  getEmployeeOneLineSummary,
} from '../src/utils/roleExperience';
import { InboxView } from '../src/views/InboxView';
import { PaymentRequestsView } from '../src/views/PaymentRequestsView';
import { SalesView } from '../src/views/SalesView';
import { ToastProvider } from '../src/components/design-system/ToastContext';
import { SubmitRequestModal } from '../src/components/work-item/SubmitRequestModal';

test('experience type accurately distinguishes pure employee, manager, and hybrid roles', () => {
  const ordinary = MOCK_PERSONAS.find((p) => p.personaKey === 'ordinary_employee')!;
  const sales = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
  const financeSpec = MOCK_PERSONAS.find((p) => p.personaKey === 'finance_specialist')!;
  const fieldVisitor = MOCK_PERSONAS.find((p) => p.personaKey === 'field_sales_visitor')!;
  assert.equal(determineUserExperienceType(ordinary), 'employee');
  assert.equal(determineUserExperienceType(sales), 'employee');
  assert.equal(determineUserExperienceType(financeSpec), 'employee');
  assert.equal(determineUserExperienceType(fieldVisitor), 'employee');

  const opsDir = MOCK_PERSONAS.find((p) => p.personaKey === 'operations_director')!;
  const adminOps = MOCK_PERSONAS.find((p) => p.personaKey === 'admin_ops')!;
  const finDir = MOCK_PERSONAS.find((p) => p.personaKey === 'finance_director')!;
  assert.equal(determineUserExperienceType(opsDir), 'manager');
  assert.equal(determineUserExperienceType(adminOps), 'manager');
  assert.equal(determineUserExperienceType(finDir), 'manager');

  const multiDelegate = MOCK_PERSONAS.find((p) => p.personaKey === 'multi_delegate')!;
  const commApprover = MOCK_PERSONAS.find((p) => p.personaKey === 'commercial_approver')!;
  const warehouse = MOCK_PERSONAS.find((p) => p.personaKey === 'warehouse_officer')!;
  assert.equal(determineUserExperienceType(multiDelegate), 'hybrid');
  assert.equal(determineUserExperienceType(commApprover), 'hybrid');
  assert.equal(determineUserExperienceType(warehouse), 'hybrid');
});

test('request creation options strictly match persona capabilities', () => {
  const ordinary = MOCK_PERSONAS.find((p) => p.personaKey === 'ordinary_employee')!;
  assert.equal(getAuthorizedRequestTypes(ordinary).length, 0);
  const ordinaryHtml = render(<ToastProvider><InboxView activePersona={ordinary} /></ToastProvider>);
  assert.ok(ordinaryHtml.includes('ثبت درخواست (فاقد مجوز)'));

  const sales = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
  const salesOpts = getAuthorizedRequestTypes(sales).map((o) => o.key);
  assert.ok(salesOpts.includes('sales_order'));
  assert.ok(salesOpts.includes('sales_call'));
  assert.ok(!salesOpts.includes('payment_request'));
  assert.ok(!salesOpts.includes('inventory_receipt'));

  const finSpec = MOCK_PERSONAS.find((p) => p.personaKey === 'finance_specialist')!;
  const finOpts = getAuthorizedRequestTypes(finSpec).map((o) => o.key);
  assert.ok(finOpts.includes('payment_request'));
  assert.ok(!finOpts.includes('sales_order'));

  const warehouse = MOCK_PERSONAS.find((p) => p.personaKey === 'warehouse_officer')!;
  const whOpts = getAuthorizedRequestTypes(warehouse).map((o) => o.key);
  assert.ok(whOpts.includes('inventory_receipt'));
  assert.ok(whOpts.includes('inventory_dispatch'));
  assert.ok(whOpts.includes('supply_request'));
});

test('employee records filter correctly isolates to_do, tracking, and history', () => {
  const sales = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
  const allRecords = mockRepository.getAuthorizedRecords(sales);

  const toDo = filterEmployeeRecords(allRecords, sales, 'to_do');
  for (const r of toDo) {
    assert.ok(r.status !== 'completed' && r.status !== 'rejected' && r.status !== 'cancelled');
    const isAssignee = r.currentAssignee?.id === sales.id || r.currentOwner?.id === sales.id;
    assert.ok(isAssignee);
  }

  const tracking = filterEmployeeRecords(allRecords, sales, 'tracking');
  for (const r of tracking) {
    assert.ok(r.status !== 'completed' && r.status !== 'rejected' && r.status !== 'cancelled');
    const isOwnerOrCreator = r.creator.id === sales.id || r.owner?.id === sales.id;
    assert.ok(isOwnerOrCreator);
    const isAssignee = r.currentAssignee?.id === sales.id || r.currentOwner?.id === sales.id;
    assert.equal(isAssignee, false);
  }

  const history = filterEmployeeRecords(allRecords, sales, 'history');
  for (const r of history) {
    assert.ok(r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled');
  }
});

test('one-line employee summary provides honest counts and avoids fake KPIs', () => {
  const ordinary = MOCK_PERSONAS.find((p) => p.personaKey === 'ordinary_employee')!;
  const records = mockRepository.getAuthorizedRecords(ordinary);
  const summary = getEmployeeOneLineSummary(records, ordinary);
  if (records.length > 0) {
    assert.ok(summary);
    assert.ok(summary.includes('کار برای اقدام') || summary.includes('در دست پیگیری'));
  }
});

test('everyday UI eliminates jargon: SoD, APPROVAL_REVIEW, توپ در زمین, and Three Status Dimensions', () => {
  const sales = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
  const comm = MOCK_PERSONAS.find((p) => p.personaKey === 'commercial_approver')!;

  const salesInbox = render(<ToastProvider><InboxView activePersona={sales} /></ToastProvider>);
  const managerInbox = render(<ToastProvider><InboxView activePersona={comm} /></ToastProvider>);

  for (const html of [salesInbox, managerInbox]) {
    assert.ok(!html.includes('APPROVAL_REVIEW'));
    assert.ok(!html.includes('Three Status Dimensions'));
    assert.ok(!html.includes('توپ در زمین'));
    assert.ok(!html.includes('(SoD)'));
  }

  const paymentHtml = render(<ToastProvider><PaymentRequestsView activePersona={sales} /></ToastProvider>);
  assert.ok(!paymentHtml.includes('توپ در زمین'));
  assert.ok(!paymentHtml.includes('نقض تفکیک وظایف (SoD)'));
  assert.ok(paymentHtml.includes('مسئول فعلی'));

  const salesHtml = render(<ToastProvider><SalesView activePersona={sales} subRoute="sales_orders" /></ToastProvider>);
  assert.ok(!salesHtml.includes('اصل تفکیک وظایف (SoD)'));
  assert.ok(!salesHtml.includes('تفکیک وظایف (SoD) محفوظ است'));
});

test('SubmitRequestModal renders authorized options and can be closed cleanly', () => {
  const sales = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
  const openHtml = render(
    <SubmitRequestModal isOpen={true} onClose={() => {}} activePersona={sales} onSelectOption={() => {}} />
  );
  assert.ok(openHtml.includes('سفارش فروش جدید'));
  assert.ok(openHtml.includes('ثبت تماس / پیام مشتری'));
  assert.ok(!openHtml.includes('درخواست پرداخت و تسویه مالی'));

  const closedHtml = render(
    <SubmitRequestModal isOpen={false} onClose={() => {}} activePersona={sales} onSelectOption={() => {}} />
  );
  assert.equal(closedHtml, '');
});

test('local persistence functions safely handle storage operations and mock browser', async () => {
  const { loadPersistedState, savePersistedState, clearPersistedState, hasPersistedState } = await import('../src/runtime/persistence');
  assert.equal(typeof hasPersistedState(), 'boolean');
  assert.equal(loadPersistedState(), null);

  // Simulated browser window.localStorage environment
  const mockStorage: Record<string, string> = {};
  let reloaded = false;
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
      removeItem: (k: string) => { delete mockStorage[k]; },
    },
    location: { reload: () => { reloaded = true; } },
  };

  try {
    assert.equal(hasPersistedState(), false);
    mockStorage['javadian_operations_state_v1'] = JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      payments: [{ id: 'p-1' }],
    });
    assert.equal(hasPersistedState(), true);
    const loaded = loadPersistedState();
    assert.ok(loaded);
    assert.equal(loaded?.payments?.length, 1);

    clearPersistedState();
    assert.equal(hasPersistedState(), false);
    assert.equal(reloaded, true);
  } finally {
    delete (globalThis as any).window;
  }
});

