import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup as render } from 'react-dom/server';
import {
  getDocumentBasedPersonas,
  getDocumentBasedPersonaById,
  validatePaymentCreationScope,
  validateWarehouseReceiptAction,
  getDocumentPersonaPaymentScope,
  getDisplayPersonaName,
  getPersonasByCategory,
} from '../src/runtime/documentBasedPersonas';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { LoginScreen } from '../src/components/auth/LoginScreen';
import { TopBar } from '../src/components/shell/TopBar';
import { PWAProvider } from '../src/components/pwa/PWAContext';
import { ToastProvider } from '../src/components/design-system/ToastContext';

test('documentBasedPersonas: correctly maps all 12 personas with document-based verification', () => {
  const personas = getDocumentBasedPersonas();
  assert.equal(personas.length, 12, 'Must have exactly 12 personas');

  // Verify Arash
  const arash = personas.find((p) => p.id === 'p-warehouse');
  assert.ok(arash, 'Arash exists');
  assert.equal(arash.name, 'آرش', 'Arash has NO invented surname');
  assert.equal(arash.documentStatus, 'DOCUMENTED_PERSON');
  assert.equal(arash.isDocumentedPerson, true);
  assert.ok(arash.documentedResponsibility.includes('لجستیک'));
  assert.ok(arash.demoGoal.includes('حمل'));

  // Verify Mr. Yousefi
  const yousefi = personas.find((p) => p.id === 'p-multi-delegate');
  assert.ok(yousefi, 'Yousefi exists');
  assert.equal(yousefi.name, 'آقای یوسفی');
  assert.equal(yousefi.documentStatus, 'DOCUMENTED_PERSON');
  assert.equal(yousefi.isDocumentedPerson, true);
  assert.ok(yousefi.warehouseReceiptScope.isFallback);

  // Verify Mr. Montazeri
  const montazeri = personas.find((p) => p.id === 'p-ops-dir');
  assert.ok(montazeri, 'Montazeri exists');
  assert.equal(montazeri.name, 'آقای منتظری');
  assert.equal(montazeri.documentStatus, 'DOCUMENTED_PERSON');
  assert.equal(montazeri.isDocumentedPerson, true);
  assert.ok(montazeri.documentedPosition.includes('مدیرعامل'));

  // Verify Mr. Naderi
  const naderi = personas.find((p) => p.id === 'p-field-sales');
  assert.ok(naderi, 'Naderi exists');
  assert.equal(naderi.name, 'آقای نادری');
  assert.equal(naderi.documentStatus, 'DOCUMENTED_PERSON');
  assert.equal(naderi.isDocumentedPerson, true);
  assert.ok(naderi.activityScope.includes('قم'));

  // Verify Placeholders (all other 8 personas)
  const placeholderIds = [
    'p-sales',
    'p-fin-spec',
    'p-fin-dir',
    'p-comm-approver',
    'p-admin-ops',
    'p-master-data',
    'p-ordinary',
    'p-no-access',
  ];

  for (const id of placeholderIds) {
    const p = personas.find((item) => item.id === id);
    assert.ok(p, `Placeholder persona ${id} exists`);
    assert.equal(p.documentStatus, 'DEMO_PLACEHOLDER', `${id} must be marked as DEMO_PLACEHOLDER`);
    assert.equal(p.isPlaceholder, true, `${id} isPlaceholder must be true`);
    assert.ok(
      p.name.includes('حساب نمایشی'),
      `${id} name (${p.name}) must include 'حساب نمایشی'`
    );
  }
});

test('documentBasedPersonas: no unverified historical names in display name', () => {
  const personas = getDocumentBasedPersonas();
  const unverifiedNames = ['سهراب جوادیان', 'پروانه صالحی', 'سعید محمدی', 'کامران داوودی'];

  for (const p of personas) {
    for (const name of unverifiedNames) {
      assert.notEqual(
        p.name,
        name,
        `Persona ${p.id} must not use unverified name ${name} as name`
      );
      assert.notEqual(
        getDisplayPersonaName(p),
        name,
        `Persona ${p.id} must not use unverified name ${name} as getDisplayPersonaName`
      );
    }
  }
});

test('validatePaymentCreationScope: Arash can only create freight payments', () => {
  // Arash creating freight payment -> ALLOWED
  const freightResult = validatePaymentCreationScope('p-warehouse', 'freight');
  assert.equal(freightResult.valid, true);

  const farsiFreightResult = validatePaymentCreationScope('p-warehouse', 'حمل بار');
  assert.equal(farsiFreightResult.valid, true);

  // Arash creating raw material payment -> REJECTED
  const rawMaterialResult = validatePaymentCreationScope('p-warehouse', 'raw_material');
  assert.equal(rawMaterialResult.valid, false);
  assert.ok(rawMaterialResult.reason?.includes('حمل بار'));

  // Arash creating worker expense -> REJECTED
  const workerResult = validatePaymentCreationScope('p-warehouse', 'worker');
  assert.equal(workerResult.valid, false);
});

test('validatePaymentCreationScope: Naderi is strictly scoped to Qom province and worker/driver', () => {
  // Naderi creating Qom worker payment -> ALLOWED
  const qomWorker = validatePaymentCreationScope('p-field-sales', 'worker', 'قم');
  assert.equal(qomWorker.valid, true);

  // Naderi creating Qom driver payment -> ALLOWED
  const qomDriver = validatePaymentCreationScope('p-field-sales', 'driver', 'قم');
  assert.equal(qomDriver.valid, true);

  // Naderi creating non-Qom payment (even worker) -> REJECTED
  const tehranWorker = validatePaymentCreationScope('p-field-sales', 'worker', 'تهران');
  assert.equal(tehranWorker.valid, false);
  assert.ok(tehranWorker.reason?.includes('قم'));

  // Naderi creating supplier payment in Qom -> REJECTED
  const qomSupplier = validatePaymentCreationScope('p-field-sales', 'raw_material', 'قم');
  assert.equal(qomSupplier.valid, false);
  assert.ok(qomSupplier.reason?.includes('کارگر و راننده'));
});

test('validatePaymentCreationScope: Yousefi, Montazeri, Finance, and Sales scope checks', () => {
  // Yousefi can create supplier payments
  const yousefiSupplier = validatePaymentCreationScope('p-multi-delegate', 'raw_material');
  assert.equal(yousefiSupplier.valid, true);

  // Montazeri (CEO) can create supplier payments
  const montazeriSupplier = validatePaymentCreationScope('p-ops-dir', 'supplier');
  assert.equal(montazeriSupplier.valid, true);

  // Finance specialist can create general payments
  const finSpecPayment = validatePaymentCreationScope('p-fin-spec', 'commercial');
  assert.equal(finSpecPayment.valid, true);

  // Sales specialist cannot create payment requests
  const salesPayment = validatePaymentCreationScope('p-sales', 'any');
  assert.equal(salesPayment.valid, false);
});

test('validateWarehouseReceiptAction: Arash is primary; Yousefi and Montazeri are fallbacks', () => {
  // Arash is primary
  const arashReceipt = validateWarehouseReceiptAction('p-warehouse');
  assert.equal(arashReceipt.allowed, true);
  assert.equal(arashReceipt.isPrimary, true);
  assert.equal(arashReceipt.isFallback, false);
  assert.equal(arashReceipt.roleType, 'primary');

  // Yousefi is fallback
  const yousefiReceipt = validateWarehouseReceiptAction('p-multi-delegate');
  assert.equal(yousefiReceipt.allowed, true);
  assert.equal(yousefiReceipt.isPrimary, false);
  assert.equal(yousefiReceipt.isFallback, true);
  assert.equal(yousefiReceipt.roleType, 'fallback');
  assert.ok(yousefiReceipt.reason?.includes('جانشینی'));

  // Montazeri is management fallback
  const montazeriReceipt = validateWarehouseReceiptAction('p-ops-dir');
  assert.equal(montazeriReceipt.allowed, true);
  assert.equal(montazeriReceipt.isPrimary, false);
  assert.equal(montazeriReceipt.isFallback, true);
  assert.equal(montazeriReceipt.roleType, 'fallback');

  // Naderi is NOT allowed to register warehouse receipts
  const naderiReceipt = validateWarehouseReceiptAction('p-field-sales');
  assert.equal(naderiReceipt.allowed, false);

  // Sales specialist is NOT allowed
  const salesReceipt = validateWarehouseReceiptAction('p-sales');
  assert.equal(salesReceipt.allowed, false);
});

test('getPersonasByCategory: partitions personas into 4 business domains', () => {
  const categories = getPersonasByCategory();
  const catKeys = Object.keys(categories);
  assert.equal(catKeys.length, 4, 'Must have 4 categories');

  assert.ok(catKeys.includes('purchasing_logistics_warehouse'));
  assert.ok(catKeys.includes('sales_distribution'));
  assert.ok(catKeys.includes('finance_payments'));
  assert.ok(catKeys.includes('management_hybrid'));

  // Check category contents
  assert.ok(categories.purchasing_logistics_warehouse.some((p) => p.id === 'p-warehouse'));
  assert.ok(categories.sales_distribution.some((p) => p.id === 'p-field-sales'));
  assert.ok(categories.sales_distribution.some((p) => p.id === 'p-sales'));
  assert.ok(categories.finance_payments.some((p) => p.id === 'p-fin-spec'));
  assert.ok(categories.finance_payments.some((p) => p.id === 'p-fin-dir'));
  assert.ok(categories.management_hybrid.some((p) => p.id === 'p-ops-dir'));
  assert.ok(categories.management_hybrid.some((p) => p.id === 'p-multi-delegate'));
});

test('LoginScreen: renders 4 business categories and documented vs placeholder badges', () => {
  const html = render(<LoginScreen onSelectPersona={() => {}} />);

  // Check 4 category labels
  assert.ok(html.includes('عملیات خرید، لجستیک و انبار'));
  assert.ok(html.includes('فروش و توزیع'));
  assert.ok(html.includes('مالی و پرداخت'));
  assert.ok(html.includes('مدیریت و نقش‌های ترکیبی'));

  // Check badges
  assert.ok(html.includes('شخص مستند در اسناد'));
  assert.ok(html.includes('حساب نمایشی (Placeholder)'));

  // Check Arash card and demo summary
  assert.ok(html.includes('آرش'));
  assert.ok(html.includes('هزینه حمل بار'));

  // Check Naderi card
  assert.ok(html.includes('آقای نادری'));
  assert.ok(html.includes('قم'));

  // Check Montazeri card
  assert.ok(html.includes('آقای منتظری'));
  assert.ok(html.includes('مدیرعامل'));

  // Check Yousefi card
  assert.ok(html.includes('آقای یوسفی'));
  assert.ok(html.includes('جانشین'));
});

test('TopBar: renders document-based persona names and status pills', () => {
  const arashMock = MOCK_PERSONAS.find((p) => p.id === 'p-warehouse')!;
  const html = render(
    <PWAProvider>
      <ToastProvider>
        <TopBar
          activePersona={arashMock}
          onSelectPersona={() => {}}
          onSwitchPersona={() => {}}
          onOpenAudit={() => {}}
        />
      </ToastProvider>
    </PWAProvider>
  );

  // Shows Arash as document-verified person
  assert.ok(html.includes('آرش'));
  assert.ok(html.includes('فرد مستند'));

  // Check placeholder rendering
  const finSpecMock = MOCK_PERSONAS.find((p) => p.id === 'p-fin-spec')!;
  const placeholderHtml = render(
    <PWAProvider>
      <ToastProvider>
        <TopBar
          activePersona={finSpecMock}
          onSelectPersona={() => {}}
          onSwitchPersona={() => {}}
          onOpenAudit={() => {}}
        />
      </ToastProvider>
    </PWAProvider>
  );
  assert.ok(placeholderHtml.includes('کارشناس مالی — حساب نمایشی'));
  assert.ok(placeholderHtml.includes('حساب نمایشی'));
});
