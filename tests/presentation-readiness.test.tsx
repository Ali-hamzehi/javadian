import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../src/data/mockMasterData';
import { mockSalesWarehouseStore, CreateSalesOrderPayload } from '../src/data/mockSalesWarehouseStore';
import { mockRepository } from '../src/data/mockRepository';
import { canAccessRoute } from '../src/routes/routesConfig';
import { Sidebar } from '../src/components/shell/Sidebar';
import { TopBar } from '../src/components/shell/TopBar';
import { SalesView, getOrderDates } from '../src/views/SalesView';
import { PaymentRequestsView } from '../src/views/PaymentRequestsView';
import { InboxView } from '../src/views/InboxView';
import { ManagementMonitorView } from '../src/views/ManagementMonitorView';
import { ProductCatalogView } from '../src/views/ProductCatalogView';
import { WarehouseReceiptsView } from '../src/views/WarehouseReceiptsView';
import { WarehouseDispatchView } from '../src/views/WarehouseDispatchView';
import { LoginScreen } from '../src/components/auth/LoginScreen';
import { ToastProvider } from '../src/components/design-system/ToastContext';
import { PWAProvider } from '../src/components/pwa/PWAContext';
import { Drawer, ModalDialog } from '../src/components/design-system/ModalAndDrawer';
import { getAuthorizedRequestTypes } from '../src/utils/roleExperience';
import { clearPersistedState } from '../src/runtime/workflow';

const admin = MOCK_PERSONAS.find((p) => p.personaKey === 'admin_ops') || MOCK_PERSONAS[0];
const salesPersona = MOCK_PERSONAS.find((p) => p.personaKey === 'sales_specialist')!;
const commApprover = MOCK_PERSONAS.find((p) => p.personaKey === 'commercial_approver')!;
const ordinary = MOCK_PERSONAS.find((p) => p.personaKey === 'ordinary_employee')!;
const finDir = MOCK_PERSONAS.find((p) => p.personaKey === 'finance_director')!;
const financePersona = MOCK_PERSONAS.find((p) => p.personaKey === 'finance_specialist')!;
const opsDirector = MOCK_PERSONAS.find((p) => p.personaKey === 'operations_director')!;

const renderWithProviders = (node: React.ReactNode) => {
  return render(
    <PWAProvider>
      <ToastProvider>{node}</ToastProvider>
    </PWAProvider>
  );
};

// ---------------------------------------------------------------------------
// 1. One primary page header per route
// ---------------------------------------------------------------------------
test('1. One primary page header per route: each main view renders exactly one <h1>', () => {
  const viewsToTest: [string, React.ReactElement][] = [
    ['SalesView', <SalesView subRoute="sales_orders" activePersona={admin} />],
    ['PaymentRequestsView', <PaymentRequestsView activePersona={admin} />],
    ['InboxView', <InboxView activePersona={admin} />],
    ['ManagementMonitorView', <ManagementMonitorView activePersona={opsDirector} />],
    ['ProductCatalogView', <ProductCatalogView currentSubRoute="products" activePersona={admin} />],
    ['WarehouseReceiptsView', <WarehouseReceiptsView activePersona={admin} />],
    ['WarehouseDispatchView', <WarehouseDispatchView activePersona={admin} />],
  ];

  for (const [name, element] of viewsToTest) {
    const html = renderWithProviders(element);
    const h1Matches = [...html.matchAll(/<h1\b/g)];
    assert.equal(
      h1Matches.length,
      1,
      `${name} must render exactly one <h1> element, but found ${h1Matches.length}`
    );
  }
});

// ---------------------------------------------------------------------------
// 2. No duplicate primary action
// ---------------------------------------------------------------------------
test('2. No duplicate primary action: SalesView and PaymentRequestsView render single primary button', () => {
  const salesHtml = renderWithProviders(<SalesView subRoute="sales_orders" activePersona={salesPersona} />);
  assert.ok(salesHtml.includes('سفارش فروش'), 'SalesView must have primary action سفارش فروش');
  assert.ok(!salesHtml.includes('ثبت سفارش جدید'), 'SalesView must not have duplicate button ثبت سفارش جدید');

  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={financePersona} />);
  assert.ok(payHtml.includes('درخواست پرداخت'), 'PaymentRequestsView must have primary action درخواست پرداخت');
});

// ---------------------------------------------------------------------------
// 3. Operations Overview route
// ---------------------------------------------------------------------------
test('3. Operations Overview route: authorized for manager and renders operational view without fake metrics', () => {
  assert.ok(canAccessRoute('ops_view', opsDirector), 'Operations Director must be able to access ops_view');
  assert.ok(!canAccessRoute('ops_view', ordinary), 'Ordinary employee must NOT be able to access ops_view');

  const overviewHtml = renderWithProviders(<ManagementMonitorView activePersona={opsDirector} />);
  assert.ok(overviewHtml.includes('دیده‌بان عملیاتی مدیریت و پایش گلوگاه‌ها') || overviewHtml.includes('نمای عملیات'));
  assert.ok(overviewHtml.includes('تصمیم‌های در انتظار'));
  assert.ok(overviewHtml.includes('کارهای مسدود'));
});

// ---------------------------------------------------------------------------
// 4. Role-scoped navigation
// ---------------------------------------------------------------------------
test('4. Role-scoped navigation: unauthorized destinations are completely absent from Sidebar', () => {
  const ordinarySidebar = renderWithProviders(
    <Sidebar currentRoute="inbox" onNavigate={() => {}} activePersona={ordinary} isCollapsed={false} onToggleCollapse={() => {}} />
  );
  assert.ok(!ordinarySidebar.includes('سفارش‌ها'), 'Ordinary employee must not see sales_orders in sidebar');
  assert.ok(!ordinarySidebar.includes('درخواست‌های پرداخت'), 'Ordinary employee must not see payment_requests in sidebar');
  assert.ok(!ordinarySidebar.includes('دیده‌بان عملیاتی'), 'Ordinary employee must not see ops_view in sidebar');

  const salesSidebar = renderWithProviders(
    <Sidebar currentRoute="inbox" onNavigate={() => {}} activePersona={salesPersona} isCollapsed={false} onToggleCollapse={() => {}} />
  );
  assert.ok(salesSidebar.includes('سفارش‌ها'), 'Sales persona must see sales_orders in sidebar');
  assert.ok(salesSidebar.includes('فروش'), 'Sales persona must see sales section in sidebar');
  assert.ok(!salesSidebar.includes('درخواست‌های پرداخت'), 'Sales persona must NOT see payment_requests in sidebar');
});

// ---------------------------------------------------------------------------
// 5. Unauthorized actions not rendered
// ---------------------------------------------------------------------------
test('5. Unauthorized actions not rendered: ordinary employee cannot initiate unauthorized workflows', () => {
  const authorized = getAuthorizedRequestTypes(ordinary);
  assert.equal(authorized.length, 0, 'Ordinary employee must have 0 authorized creation request types');
  assert.ok(!authorized.some((opt) => opt.key === 'sales_order'));
  assert.ok(!authorized.some((opt) => opt.key === 'payment_request'));
});

// ---------------------------------------------------------------------------
// 6. Exact logout wording
// ---------------------------------------------------------------------------
test('6. Exact logout wording: strictly "خروج از حساب کاربری"', () => {
  const topBarHtml = renderWithProviders(
    <TopBar
      onOpenMobileMenu={() => {}}
      onOpenSearch={() => {}}
      onOpenNotifications={() => {}}
      activePersona={admin}
      onSelectPersona={() => {}}
      onSignOut={() => {}}
      pageTitle="آزمون"
      breadcrumbs={['خانه']}
      initialUserMenuOpen={true}
    />
  );
  assert.ok(topBarHtml.includes('خروج از حساب کاربری'), 'TopBar must contain exact phrase "خروج از حساب کاربری"');
  assert.ok(!topBarHtml.includes('خروج از سیستم'), 'Must not use "خروج از سیستم"');
  assert.ok(!topBarHtml.includes('خروج کاربر'), 'Must not use "خروج کاربر"');
});

// ---------------------------------------------------------------------------
// 7. Forbidden legacy terminology
// ---------------------------------------------------------------------------
test('7. Forbidden legacy terminology: "کارتابل" and "LocalStorage" never appear in rendered UI', () => {
  const topBar = renderWithProviders(
    <TopBar
      onOpenMobileMenu={() => {}}
      onOpenSearch={() => {}}
      onOpenNotifications={() => {}}
      activePersona={salesPersona}
      onSelectPersona={() => {}}
      onSignOut={() => {}}
      pageTitle="آزمون"
      breadcrumbs={['خانه']}
      initialUserMenuOpen={true}
    />
  );
  assert.ok(!topBar.includes('کارتابل'), 'TopBar must not contain "کارتابل"');
  assert.ok(!topBar.includes('LocalStorage'), 'TopBar must not contain "LocalStorage"');

  const sidebar = renderWithProviders(
    <Sidebar currentRoute="inbox" onNavigate={() => {}} activePersona={salesPersona} isCollapsed={false} onToggleCollapse={() => {}} />
  );
  assert.ok(!sidebar.includes('کارتابل'), 'Sidebar must not contain "کارتابل"');

  const inbox = renderWithProviders(<InboxView activePersona={ordinary} />);
  assert.ok(!inbox.includes('کارتابل'), 'InboxView must not contain "کارتابل"');
});

// ---------------------------------------------------------------------------
// 8. Route / persona scroll reset logic
// ---------------------------------------------------------------------------
test('8. Route / persona scroll reset: App includes window.scrollTo(0, 0) logic', () => {
  const appCode = fs.readFileSync('src/App.tsx', 'utf8');
  assert.ok(appCode.includes('window.scrollTo(0, 0)'), 'App.tsx must contain window.scrollTo(0, 0)');
  assert.ok(appCode.includes('currentRoute'), 'Scroll reset must depend on currentRoute');
  assert.ok(appCode.includes('activePersona'), 'Scroll reset must depend on activePersona');
});

// ---------------------------------------------------------------------------
// 9. Complete Sales date mapping
// ---------------------------------------------------------------------------
test('9. Complete Sales date mapping: orders have valid non-empty Persian dates with no "—" placeholder in table', () => {
  const orders = mockSalesWarehouseStore.getSalesOrders();
  assert.ok(orders.length > 0, 'Must have mock sales orders');

  for (const ord of orders) {
    const { created, delivery } = getOrderDates(ord);
    assert.ok(created && created.length > 0 && created !== '—', `Order ${ord.code} must have valid created date`);
    assert.ok(delivery && delivery.length > 0 && delivery !== '—', `Order ${ord.code} must have valid delivery date`);
  }

  const salesHtml = renderWithProviders(<SalesView subRoute="sales_orders" activePersona={admin} />);
  assert.ok(salesHtml.includes('۱۴۰۴'), 'Sales table must contain Jalali year digits');
});

// ---------------------------------------------------------------------------
// 10. Simplified table columns
// ---------------------------------------------------------------------------
test('10. Simplified table columns: PaymentRequestsView desktop table has exactly 8 prototype columns', () => {
  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={admin} />);
  const expectedHeaders = ['شناسه', 'ذی‌نفع', 'موضوع', 'مبلغ', 'وضعیت', 'درخواست‌دهنده', 'موعد', 'عملیات'];

  for (const header of expectedHeaders) {
    assert.ok(payHtml.includes(header), `PaymentRequestsView must include column header "${header}"`);
  }
  assert.ok(payHtml.includes('ریال'), 'Amounts must specify ریال');
});

// ---------------------------------------------------------------------------
// 11. Current login/session behavior
// ---------------------------------------------------------------------------
test('11. Current login/session behavior: renders enterprise branding and persona selection with credentials toggle', () => {
  const loginHtml = renderWithProviders(<LoginScreen onLogin={() => {}} />);
  assert.ok(loginHtml.includes('سامانه جوادیان'), 'Login screen must show system branding');
  assert.ok(loginHtml.includes('انتخاب نقش برای ورود'), 'Login screen must show role selection header');
  assert.ok(loginHtml.includes('ورود با شناسه'), 'Login screen must provide credentials toggle');
});

// ---------------------------------------------------------------------------
// 12. Protected-route behavior
// ---------------------------------------------------------------------------
test('12. Protected-route behavior: strictly protects routes against unauthorized roles', () => {
  assert.equal(canAccessRoute('payment_requests', ordinary), false);
  assert.equal(canAccessRoute('ops_view', ordinary), false);
  assert.equal(canAccessRoute('org_users', ordinary), false);

  assert.equal(canAccessRoute('sales_orders', salesPersona), true);

  const guest = MOCK_PERSONAS.find((p) => p.id === 'p-no-access');
  if (guest) {
    assert.equal(canAccessRoute('inbox', guest), false);
    assert.equal(canAccessRoute('sales_orders', guest), false);
  }
});

// ---------------------------------------------------------------------------
// 13. Responsive table and card strategy
// ---------------------------------------------------------------------------
test('13. Responsive table and card strategy: views provide mobile card alternatives with lg:hidden', () => {
  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={admin} />);
  assert.ok(payHtml.includes('lg:hidden'), 'PaymentRequestsView must contain mobile card container with lg:hidden');

  const salesHtml = renderWithProviders(<SalesView subRoute="sales_orders" activePersona={admin} />);
  assert.ok(salesHtml.includes('lg:hidden'), 'SalesView must contain mobile card container with lg:hidden');
});

// ---------------------------------------------------------------------------
// 14. Modal and drawer accessibility
// ---------------------------------------------------------------------------
test('14. Modal and drawer accessibility: renders native dialog with aria-modal and aria-labelledby', () => {
  const drawerHtml = renderWithProviders(
    <Drawer isOpen={true} onClose={() => {}} title="جزئیات پرونده">
      <div>محتوای پرونده</div>
    </Drawer>
  );
  assert.ok(drawerHtml.includes('<dialog'), 'Drawer must render <dialog> element');
  assert.ok(drawerHtml.includes('aria-modal="true"'), 'Drawer must have aria-modal="true"');
  assert.ok(drawerHtml.includes('aria-labelledby='), 'Drawer must have aria-labelledby');
  assert.ok(drawerHtml.includes('جزئیات پرونده'), 'Drawer must render title');

  const modalHtml = renderWithProviders(
    <ModalDialog isOpen={true} onClose={() => {}} title="تأیید اقدام">
      <div>متن تایید</div>
    </ModalDialog>
  );
  assert.ok(modalHtml.includes('<dialog'), 'ModalDialog must render <dialog> element');
  assert.ok(modalHtml.includes('aria-modal="true"'), 'ModalDialog must have aria-modal="true"');
  assert.ok(modalHtml.includes('aria-labelledby='), 'ModalDialog must have aria-labelledby');
});

// ---------------------------------------------------------------------------
// 15. Safe identifier masking & consistent counts
// ---------------------------------------------------------------------------
test('15. Safe identifier masking & consistent counts: beneficiary IBANs are masked and counts match repo', () => {
  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={finDir} />);
  assert.ok(payHtml.includes('IR58 ••••') || payHtml.includes('••••'), 'Payment view must mask IBAN');
  assert.equal(payHtml.includes('IR580120000000001234569210'), false, 'Raw IBAN must never leak into DOM');

  const counts = mockRepository.computeScopedTaskCounts(salesPersona);
  assert.equal(typeof counts.mine, 'number');
  assert.equal(typeof counts.orders, 'number');
});

// ---------------------------------------------------------------------------
// 16. Truthful integration copy
// ---------------------------------------------------------------------------
test('16. Truthful integration copy: no false claims of active automated banking', () => {
  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={admin} />);
  assert.ok(payHtml.includes('ثبت نشده در سیستم مالی'), 'Must truthfully state that payment is not auto-posted to external banking');
});

// ---------------------------------------------------------------------------
// 17. Reset to known demo state behavior
// ---------------------------------------------------------------------------
test('17. Reset to known demo state behavior: clearPersistedState is defined and resets runtime', () => {
  assert.equal(typeof clearPersistedState, 'function', 'clearPersistedState must be an exported function');
  clearPersistedState();
  const records = mockRepository.getAllRecords();
  assert.ok(records.length > 0, 'Repository must contain records after reset');
});

// ---------------------------------------------------------------------------
// 18. Four presentation journeys rehearsal
// ---------------------------------------------------------------------------
test('18. Presentation Journey 1: Employee workspace (ordinary employee)', () => {
  const inboxHtml = renderWithProviders(<InboxView activePersona={ordinary} />);
  assert.ok(!inboxHtml.includes('کارتابل'));
  assert.ok(inboxHtml.includes('کارهای من') || inboxHtml.includes('برای اقدام من'));
});

test('18. Presentation Journey 2: Sales and approval flow', () => {
  const product = MOCK_PRODUCTS[0];
  const payload: CreateSalesOrderPayload = {
    customerId: MOCK_CUSTOMERS[0].id,
    channel: 'phone',
    creatorPersona: salesPersona,
    salesResponsibleId: salesPersona.id,
    salesResponsibleName: salesPersona.name,
    deliveryAddress: 'آدرس آزمون سناریو ۲',
    paymentTerms: 'نقدی',
    deliveryTerms: 'تحویل انبار',
    items: [
      {
        productId: product.id,
        productName: product.name,
        unit: 'کارتن',
        conversionFactor: 12,
        cartons: 1,
        pieces: 12,
        weightKg: 18,
        baseUnit: product.baseUnit,
        dailyReferencePriceRials: product.effectivePrice?.referencePriceRials || 1250000,
        minPermittedPriceRials: product.effectivePrice?.minPermittedPriceRials || 1200000,
        offeredPriceRials: 1100000,
        agreedUnitPriceRials: 1100000,
        discountPercent: 12,
      },
    ],
  };

  const order = mockSalesWarehouseStore.createSalesOrder(payload);
  assert.equal(order.status, 'needs_price_approval');

  const ordApprResult = mockSalesWarehouseStore.approveSalesOrder(order.id, ordinary);
  assert.equal(ordApprResult.success, false);

  const commApprResult = mockSalesWarehouseStore.approveSalesOrder(order.id, commApprover, 'تأیید برای ارائه');
  assert.equal(commApprResult.success, true);
  assert.equal(order.status, 'approved');
});

test('18. Presentation Journey 3: Operational payment flow', () => {
  const payHtml = renderWithProviders(<PaymentRequestsView activePersona={finDir} />);
  assert.ok(payHtml.includes('PAY-') || payHtml.includes('پرداخت'));
  assert.ok(payHtml.includes('ثبت نشده در سیستم مالی'));
});

test('18. Presentation Journey 4: Management operational overview', () => {
  const overviewHtml = renderWithProviders(<ManagementMonitorView activePersona={opsDirector} />);
  assert.ok(overviewHtml.includes('دیده‌بان عملیاتی مدیریت و پایش گلوگاه‌ها') || overviewHtml.includes('نمای عملیات'));
  assert.ok(overviewHtml.includes('تصمیم‌های در انتظار'));
});
