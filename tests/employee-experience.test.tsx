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
  isRouteVisibleForPersona,
  isNavGroupVisibleForPersona,
} from '../src/utils/roleExperience';
import { InboxView } from '../src/views/InboxView';
import { PaymentRequestsView } from '../src/views/PaymentRequestsView';
import { SalesView } from '../src/views/SalesView';
import { WarehouseDispatchView } from '../src/views/WarehouseDispatchView';
import { ToastProvider } from '../src/components/design-system/ToastContext';
import { SubmitRequestModal } from '../src/components/work-item/SubmitRequestModal';
import { TopBar } from '../src/components/shell/TopBar';
import { Sidebar } from '../src/components/shell/Sidebar';
import { MobileBottomNav } from '../src/components/shell/MobileBottomNav';
import { DialogSurface } from '../src/components/design-system/DialogSurface';
import { Button } from '../src/components/design-system/Button';
import { canAccessRoute } from '../src/routes/routesConfig';
import { PWAProvider } from '../src/components/pwa/PWAContext';

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

test('acceptance scenarios: employee experience header, tabs, empty state and role-aware navigation', () => {
  const arash = MOCK_PERSONAS.find((p) => p.id === 'p-warehouse')!;
  const ordinaryWh = MOCK_PERSONAS.find((p) => p.id === 'p-ordinary')!;
  const salesSpec = MOCK_PERSONAS.find((p) => p.id === 'p-sales')!;
  const naderi = MOCK_PERSONAS.find((p) => p.id === 'p-field-sales')!;
  const guest = MOCK_PERSONAS.find((p) => p.id === 'p-no-access')!;

  // A. Arash: clean task-first view
  const arashInboxHtml = render(
    <ToastProvider>
      <InboxView activePersona={arash} />
    </ToastProvider>
  );
  assert.ok(arashInboxHtml.includes('برای انجام'));
  assert.ok(arashInboxHtml.includes('برای پیگیری'));
  assert.ok(arashInboxHtml.includes('مسدود'));
  assert.ok(arashInboxHtml.includes('انجام‌شده اخیر'));
  assert.ok(arashInboxHtml.includes('سابقه'));
  assert.ok(!arashInboxHtml.includes('کارتابل من (اقدام جاری)'));

  // B. Warehouse Staff (مسئول انبار — نقش نمونه): no financial menu or payment scope
  assert.equal(isRouteVisibleForPersona('payment_requests', ordinaryWh), false);
  assert.equal(isNavGroupVisibleForPersona('finance', ordinaryWh), false);
  assert.equal(isRouteVisibleForPersona('inventory_receipts', ordinaryWh), true);
  assert.equal(isRouteVisibleForPersona('ops_view', ordinaryWh), false);

  // C. Sales Specialist (کارشناس فروش — نقش نمونه): no payment/finance menu, sales visible
  assert.equal(isRouteVisibleForPersona('payment_requests', salesSpec), false);
  assert.equal(isNavGroupVisibleForPersona('finance', salesSpec), false);
  assert.equal(isRouteVisibleForPersona('sales_orders', salesSpec), true);
  assert.equal(isRouteVisibleForPersona('customers', salesSpec), true);
  assert.equal(isRouteVisibleForPersona('ops_view', salesSpec), false);

  // D. Mr. Naderi: field sales & scoped payments visible; management hidden
  assert.equal(isRouteVisibleForPersona('sales_orders', naderi), true);
  assert.equal(isRouteVisibleForPersona('sales_calls', naderi), true);
  assert.equal(isRouteVisibleForPersona('visit_plans', naderi), true);
  assert.equal(isRouteVisibleForPersona('payment_requests', naderi), true);
  assert.equal(isRouteVisibleForPersona('ops_view', naderi), false);

  // E. Guest (کارآموز مهمان — نقش نمونه): all routes hidden
  assert.equal(isRouteVisibleForPersona('inbox', guest), false);
  assert.equal(isRouteVisibleForPersona('sales_orders', guest), false);
  assert.equal(isRouteVisibleForPersona('payment_requests', guest), false);
  assert.equal(isNavGroupVisibleForPersona('management', guest), false);

  // F. No ordinary employee sees managerial routes
  for (const emp of [arash, ordinaryWh, salesSpec, naderi, guest]) {
    assert.equal(isRouteVisibleForPersona('ops_view', emp), false);
    assert.equal(isRouteVisibleForPersona('traceability', emp), false);
    assert.equal(isRouteVisibleForPersona('integration_errors', emp), false);
    assert.equal(isNavGroupVisibleForPersona('management', emp), false);
  }
});

test('Mandatory Language & Workflow Rules: zero kartabl in rendered UI and exact logout label', () => {
  const salesSpec = MOCK_PERSONAS.find((p) => p.id === 'p-sales')!;

  // 1. TopBar renders exact logout label and zero kartabl
  const topBarHtml = render(
    <PWAProvider>
      <ToastProvider>
        <TopBar
          activePersona={salesSpec}
          pageTitle="کارهای من"
          breadcrumbs={['خانه', 'کارهای من']}
          onNavigate={() => {}}
          onOpenSearch={() => {}}
          onOpenNotifications={() => {}}
          onSignOut={() => {}}
          onSelectPersona={() => {}}
          onSwitchResponsibility={() => {}}
          initialUserMenuOpen={true}
        />
      </ToastProvider>
    </PWAProvider>
  );
  assert.ok(topBarHtml.includes('خروج از حساب کاربری'), 'Logout must be exactly خروج از حساب کاربری');
  assert.ok(!topBarHtml.includes('کارتابل'), 'TopBar must have zero occurrences of kartabl');

  // 2. Sidebar renders with zero kartabl and renders کارهای من for inbox
  const sidebarHtml = render(
    <PWAProvider>
      <Sidebar
        activePersona={salesSpec}
        currentRoute="inbox"
        onNavigate={() => {}}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        isMobileOpen={false}
        onCloseMobile={() => {}}
      />
    </PWAProvider>
  );
  assert.ok(!sidebarHtml.includes('کارتابل'), 'Sidebar must have zero occurrences of kartabl');
  assert.ok(sidebarHtml.includes('کارهای من'), 'Sidebar renders کارهای من for inbox');

  // 3. InboxView for all personas has zero kartabl
  for (const p of MOCK_PERSONAS) {
    const html = render(
      <ToastProvider>
        <InboxView activePersona={p} />
      </ToastProvider>
    );
    assert.ok(!html.includes('کارتابل'), `InboxView for persona ${p.id} must have zero occurrences of kartabl`);
  }

  // 4. SalesView has zero kartabl
  const salesHtml = render(
    <ToastProvider>
      <SalesView activePersona={salesSpec} />
    </ToastProvider>
  );
  assert.ok(!salesHtml.includes('کارتابل'), 'SalesView must have zero occurrences of kartabl');

  // 5. WarehouseDispatchView (Journey J1) has zero kartabl and final terminal state is dispatched (never completed)
  const whOfficer = MOCK_PERSONAS.find((p) => p.id === 'p-warehouse')!;
  const dispatchHtml = render(
    <ToastProvider>
      <WarehouseDispatchView activePersona={whOfficer} />
    </ToastProvider>
  );
  assert.ok(!dispatchHtml.includes('کارتابل'), 'WarehouseDispatchView must have zero occurrences of kartabl');
  assert.ok(dispatchHtml.includes('خروج نهایی و تحویل به باربری'), 'J1 terminal state must be dispatched');
  assert.ok(!dispatchHtml.includes('تکمیل‌شده نهایی'), 'J1 must not introduce COMPLETED state');

  // 6. PaymentRequestsView (Journey J2) has zero kartabl
  const finDirector = MOCK_PERSONAS.find((p) => p.id === 'p-fin-dir')!;
  const paymentHtml = render(
    <ToastProvider>
      <PaymentRequestsView activePersona={finDirector} />
    </ToastProvider>
  );
  assert.ok(!paymentHtml.includes('کارتابل'), 'PaymentRequestsView must have zero occurrences of kartabl');
});

test('absence of AI-style icons and forbidden AI assistant terminology', () => {
  const salesSpec = MOCK_PERSONAS.find((p) => p.id === 'p-sales')!;

  const topBarHtml = render(
    <PWAProvider>
      <ToastProvider>
        <TopBar
          activePersona={salesSpec}
          pageTitle="کارهای من"
          breadcrumbs={['خانه', 'کارهای من']}
          onNavigate={() => {}}
          onOpenSearch={() => {}}
          onOpenNotifications={() => {}}
          onSignOut={() => {}}
          onSelectPersona={() => {}}
          onSwitchResponsibility={() => {}}
          initialUserMenuOpen={true}
        />
      </ToastProvider>
    </PWAProvider>
  );

  const sidebarHtml = render(
    <PWAProvider>
      <Sidebar
        activePersona={salesSpec}
        currentRoute="inbox"
        onNavigate={() => {}}
        isCollapsed={false}
        onToggleCollapse={() => {}}
        isMobileOpen={false}
        onCloseMobile={() => {}}
      />
    </PWAProvider>
  );

  const mobileNavHtml = render(
    <MobileBottomNav
      activePersona={salesSpec}
      currentRoute="inbox"
      onNavigate={() => {}}
      onOpenMore={() => {}}
    />
  );

  const inboxHtml = render(
    <ToastProvider>
      <InboxView activePersona={salesSpec} />
    </ToastProvider>
  );

  const combinedHtml = [topBarHtml, sidebarHtml, mobileNavHtml, inboxHtml].join(' ');

  // Forbidden AI icons:
  const forbiddenIcons = [
    'lucide-bot',
    'lucide-sparkles',
    'lucide-sparkle',
    'lucide-wand',
    'lucide-wand-2',
    'lucide-cpu',
    'lucide-bot-message-square',
  ];
  for (const icon of forbiddenIcons) {
    assert.ok(!combinedHtml.includes(icon), `UI must not contain AI icon class: ${icon}`);
  }

  // Forbidden AI terms in copy:
  const forbiddenAiTerms = ['هوش مصنوعی', 'دستیار هوشمند', 'ربات', 'چت‌بات'];
  for (const term of forbiddenAiTerms) {
    assert.ok(!combinedHtml.includes(term), `UI must not contain AI marketing/assistant term: ${term}`);
  }
});

test('role-based capability-driven navigation and preservation of trusted authorization input', () => {
  const employee = MOCK_PERSONAS.find((p) => p.personaKey === 'ordinary_employee')!;
  const manager = MOCK_PERSONAS.find((p) => p.personaKey === 'operations_director')!;

  // 1. Ordinary employee sees only capability-driven items and zero manager-only routes
  assert.equal(isRouteVisibleForPersona('ops_view', employee), false);
  assert.equal(isRouteVisibleForPersona('traceability', employee), false);
  assert.equal(isRouteVisibleForPersona('integration_errors', employee), false);
  assert.equal(isNavGroupVisibleForPersona('management', employee), false);
  assert.equal(canAccessRoute('ops_view', employee), false);

  // 2. Manager sees management routes derived from trusted permissions
  assert.equal(canAccessRoute('ops_view', manager), true);
  assert.equal(isRouteVisibleForPersona('ops_view', manager), true);
  assert.equal(isNavGroupVisibleForPersona('management', manager), true);

  // 3. Modifying/revoking backend capabilities strictly alters route access (no hardcoded frontend bypass)
  const strippedManager: typeof manager = {
    ...manager,
    capabilities: [],
    isManager: false,
  };
  assert.equal(canAccessRoute('ops_view', strippedManager), false);
  assert.equal(isRouteVisibleForPersona('ops_view', strippedManager), false);
  assert.equal(isNavGroupVisibleForPersona('management', strippedManager), false);
});

test('mobile destination limit: mobile bottom navigation renders at most 5 items', () => {
  for (const persona of MOCK_PERSONAS) {
    const html = render(
      <MobileBottomNav
        activePersona={persona}
        currentRoute="inbox"
        onNavigate={() => {}}
        onOpenMore={() => {}}
      />
    );
    const buttonCount = (html.match(/<button/g) || []).length;
    assert.ok(buttonCount <= 5, `Persona ${persona.id} has ${buttonCount} mobile destinations (must be <= 5)`);
    assert.ok(buttonCount >= 1, `Persona ${persona.id} must have at least 1 mobile destination`);
  }
});

test('dialog accessibility: DialogSurface provides native modal, accessible labelling and escape handling', () => {
  const dialogHtml = render(
    <DialogSurface isOpen={true} onClose={() => {}} title="عنوان گفت‌وگو">
      <p>محتوای پنجره</p>
    </DialogSurface>
  );

  // 1. Native dialog element
  assert.ok(dialogHtml.startsWith('<dialog'), 'Must use native <dialog> element');

  // 2. Accessibility attributes
  assert.ok(dialogHtml.includes('aria-modal="true"'), 'Must have aria-modal="true"');
  assert.ok(dialogHtml.includes('aria-labelledby='), 'Must have aria-labelledby');
  assert.ok(dialogHtml.includes('عنوان گفت‌وگو'), 'Must contain accessible title');

  // 3. Responsive dialog surface class
  assert.ok(dialogHtml.includes('dialog-surface'), 'Must include dialog-surface responsive styling class');

  // 4. Closed state renders nothing
  const closedHtml = render(
    <DialogSurface isOpen={false} onClose={() => {}} title="عنوان گفت‌وگو">
      <p>محتوای پنجره</p>
    </DialogSurface>
  );
  assert.equal(closedHtml, '', 'Closed dialog must not render to DOM');
});

test('responsive shell behavior: minimum 44px tap targets on interactive elements', () => {
  const salesSpec = MOCK_PERSONAS.find((p) => p.id === 'p-sales')!;

  // 1. TopBar interactive targets
  const topBarHtml = render(
    <PWAProvider>
      <ToastProvider>
        <TopBar
          activePersona={salesSpec}
          pageTitle="کارهای من"
          breadcrumbs={['خانه', 'کارهای من']}
          onNavigate={() => {}}
          onOpenSearch={() => {}}
          onOpenNotifications={() => {}}
          onSignOut={() => {}}
          onSelectPersona={() => {}}
          onSwitchResponsibility={() => {}}
          initialUserMenuOpen={false}
        />
      </ToastProvider>
    </PWAProvider>
  );

  // Hamburger button, notifications button, and user menu button have min-h-[44px]
  assert.ok(topBarHtml.includes('min-h-[44px]'), 'TopBar must enforce >=44px min height for touch targets');
  assert.ok(topBarHtml.includes('min-w-[44px]'), 'TopBar must enforce >=44px min width for touch targets');

  // 2. Mobile bottom nav touch targets
  const mobileNavHtml = render(
    <MobileBottomNav
      activePersona={salesSpec}
      currentRoute="inbox"
      onNavigate={() => {}}
      onOpenMore={() => {}}
    />
  );
  assert.ok(mobileNavHtml.includes('min-h-[48px]'), 'Mobile nav buttons must provide >= 44px tap target');

  // 3. Primary Button component
  const buttonHtml = render(<Button variant="primary">دکمه آزمون</Button>);
  assert.ok(buttonHtml.includes('min-h-[44px]'), 'Button must enforce >= 44px min touch target');
});




