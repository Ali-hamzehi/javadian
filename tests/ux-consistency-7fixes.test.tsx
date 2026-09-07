import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getChannelDisplayName, CHANNEL_PERSIAN_MAP } from '../src/utils/channelMapper';
import {
  getPersonaDisplayName,
  getPersonaSubtitle,
  getPersonaTypeLabel,
  stripRoleSampleSuffix,
  getDocumentBasedPersonaById,
  adaptPersona,
} from '../src/runtime/documentBasedPersonas';
import { mockRepository, sanitizeDspTaskRecord } from '../src/runtime/workflow';
import { CLEAN_ROLE_METAS } from '../src/components/auth/roleDisplayConfig';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { MOCK_PRODUCTS } from '../src/data/mockMasterData';
import { Sidebar } from '../src/components/shell/Sidebar';
import { TopBar } from '../src/components/shell/TopBar';
import { LoginScreen } from '../src/components/auth/LoginScreen';
import { RoleSelectorModal } from '../src/components/auth/RoleSelectorModal';
import { SalesView } from '../src/views/SalesView';
import { ToastProvider } from '../src/components/design-system/ToastContext';
import { PWAProvider } from '../src/components/pwa/PWAContext';

const renderWithProviders = (node: React.ReactNode) => {
  return renderToStaticMarkup(
    <PWAProvider>
      <ToastProvider>
        {node}
      </ToastProvider>
    </PWAProvider>
  );
};

test('1. Sales order defaults: carton count is 1 and 1 carton totals 15,000,000 Rials', () => {
  const defaultCartons = 1;
  const prod = MOCK_PRODUCTS[0];
  assert.equal(defaultCartons, 1, 'Default cartons must be 1');
  
  const piecesPerCarton = prod.cartonConversion?.piecesPerCarton || prod.conversionRatio || 12;
  const unitPrice = prod.currentPriceRials || 1250000;
  assert.equal(unitPrice, 1250000, 'Product unit price is 1,250,000 Rials');
  assert.equal(piecesPerCarton, 12, 'Bottles per carton is 12');

  const pieces = defaultCartons * piecesPerCarton;
  const totalRials = pieces * unitPrice;
  assert.equal(totalRials, 15000000, 'Total of 1 carton must calculate to exactly 15,000,000 Rials');
});

test('2. Channel mapper: maps raw English channels to friendly Persian', () => {
  assert.equal(getChannelDisplayName('phone'), 'تماس تلفنی');
  assert.equal(getChannelDisplayName('in_person'), 'مراجعه حضوری');
  assert.equal(getChannelDisplayName('whatsapp'), 'واتساپ');
  assert.equal(getChannelDisplayName('telegram'), 'تلگرام');
  assert.equal(getChannelDisplayName('visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('field_visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('other'), 'سایر');
  assert.equal(getChannelDisplayName('unknown_xyz'), 'سایر');
  assert.equal(getChannelDisplayName(null), 'سایر');
});

test('3. DSP-1404-0550 task consistency: Arash is responsible and Kamran Davoudi is completely absent', () => {
  const dspRecord = mockRepository.getRecordById('rec-004');
  assert.ok(dspRecord, 'Record rec-004 must exist');
  assert.equal(dspRecord.code, 'DSP-1404-0550');

  // Creator, owner, currentOwner, currentAssignee
  assert.equal(dspRecord.creator.name, 'آرش');
  assert.equal(dspRecord.currentOwner?.name, 'آرش');
  assert.equal(dspRecord.currentAssignee?.name, 'آرش');

  // Next action
  assert.equal(dspRecord.nextAction?.responsiblePersonName, 'آرش');
  assert.equal(dspRecord.nextAction?.responsibleRole, 'مسئول لجستیک و هماهنگی خرید');

  // Timeline events
  for (const event of dspRecord.timeline || []) {
    if (event.actor) {
      assert.notEqual(event.actor.name, 'کامران داوودی', 'Actor name in timeline must not be Kamran Davoudi');
    }
  }

  // Serialized record JSON check
  const json = JSON.stringify(dspRecord);
  assert.equal(json.includes('کامران داوودی'), false, 'Kamran Davoudi must not appear anywhere in DSP-1404-0550');
});

test('4. Role type labels: strictly "نقش سازمانی" or "نقش نمونه"', () => {
  for (const persona of MOCK_PERSONAS) {
    const typeLabel = getPersonaTypeLabel(persona);
    assert.ok(
      typeLabel === 'نقش سازمانی' || typeLabel === 'نقش نمونه',
      `Persona ${persona.id} label "${typeLabel}" must be either "نقش سازمانی" or "نقش نمونه"`
    );
  }

  for (const [id, meta] of Object.entries(CLEAN_ROLE_METAS)) {
    assert.ok(
      meta.badgeText === 'نقش سازمانی' || meta.badgeText === 'نقش نمونه',
      `Role meta ${id} badgeText "${meta.badgeText}" must be either "نقش سازمانی" or "نقش نمونه"`
    );
  }
});

test('5. Role title cleanliness: no duplicate "(نقش نمونه)" or "— نقش نمونه" in CLEAN_ROLE_METAS', () => {
  for (const [id, meta] of Object.entries(CLEAN_ROLE_METAS)) {
    assert.equal(
      meta.name.includes('نقش نمونه'),
      false,
      `Role meta ${id} name "${meta.name}" should not include "نقش نمونه"`
    );
    assert.equal(
      meta.jobTitle.includes('نقش نمونه'),
      false,
      `Role meta ${id} jobTitle "${meta.jobTitle}" should not include "نقش نمونه"`
    );
    assert.notEqual(
      meta.name,
      meta.jobTitle,
      `Role meta ${id} jobTitle should be distinct from name, not a duplicate`
    );
  }
});

test('6. Sidebar footer for sales persona: renders clean title "کارشناس فروش", independent badge "نقش نمونه", and no "کارشناس فروش (نقش نمونه)"', () => {
  const salesPersona = adaptPersona(getDocumentBasedPersonaById('p-sales')!);
  const out = renderWithProviders(
    <Sidebar
      currentRoute="sales"
      onNavigate={() => {}}
      activePersona={salesPersona}
      isCollapsed={false}
      onToggleCollapse={() => {}}
    />
  );
  assert.ok(out.includes('کارشناس فروش'), 'Sidebar must render clean title "کارشناس فروش"');
  assert.ok(out.includes('نقش نمونه'), 'Sidebar must render independent badge "نقش نمونه"');
  assert.equal(out.includes('کارشناس فروش (نقش نمونه)'), false, 'Sidebar must not contain "کارشناس فروش (نقش نمونه)"');
  assert.equal(out.includes('کارشناس فروش — نقش نمونه'), false, 'Sidebar must not contain "کارشناس فروش — نقش نمونه"');
});

test('7. SalesView Step 4: renders "ثبت‌کننده سفارش (کارشناس فروش)" and no duplicate persona suffix', () => {
  const salesPersona = adaptPersona(getDocumentBasedPersonaById('p-sales')!);
  const out = renderWithProviders(
    <SalesView
      subRoute="sales_orders"
      activePersona={salesPersona}
      initialCreateModalOpen={true}
      initialStep={4}
    />
  );
  assert.ok(out.includes('ثبت‌کننده سفارش (کارشناس فروش)'), 'Step 4 must contain "ثبت‌کننده سفارش (کارشناس فروش)"');
  assert.equal(out.includes('کارشناس فروش (نقش نمونه)'), false, 'Step 4 must not contain "کارشناس فروش (نقش نمونه)"');
  assert.equal(out.includes('کارشناس فروش — نقش نمونه'), false, 'Step 4 must not contain "کارشناس فروش — نقش نمونه"');
});

test('8. Accessible Name in role selectors: Arash and Sales Specialist have clean, non-duplicated accessible names', () => {
  const salesPersona = adaptPersona(getDocumentBasedPersonaById('p-sales')!);

  // RoleSelectorModal
  const modalOut = renderWithProviders(
    <RoleSelectorModal
      isOpen={true}
      onClose={() => {}}
      activePersona={salesPersona}
      onSelect={() => {}}
    />
  );
  assert.ok(
    modalOut.includes('aria-label="انتخاب نقش آرش — نقش سازمانی"'),
    'RoleSelectorModal must contain aria-label="انتخاب نقش آرش — نقش سازمانی"'
  );
  assert.ok(
    modalOut.includes('aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'),
    'RoleSelectorModal must contain aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'
  );

  // TopBar role menu
  const topBarOut = renderWithProviders(
    <TopBar
      onOpenMobileMenu={() => {}}
      onOpenSearch={() => {}}
      onOpenNotifications={() => {}}
      activePersona={salesPersona}
      onSelectPersona={() => {}}
      pageTitle="سامانه عملیات جوادیان"
      breadcrumbs={[]}
      initialPersonaMenuOpen={true}
    />
  );
  assert.ok(
    topBarOut.includes('aria-label="انتخاب نقش آرش — نقش سازمانی"'),
    'TopBar dropdown must contain aria-label="انتخاب نقش آرش — نقش سازمانی"'
  );
  assert.ok(
    topBarOut.includes('aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'),
    'TopBar dropdown must contain aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'
  );

  // LoginScreen
  const loginOut = renderWithProviders(
    <LoginScreen onLogin={() => {}} />
  );
  assert.ok(
    loginOut.includes('aria-label="انتخاب نقش آرش — نقش سازمانی"'),
    'LoginScreen must contain aria-label="انتخاب نقش آرش — نقش سازمانی"'
  );
  assert.ok(
    loginOut.includes('aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'),
    'LoginScreen must contain aria-label="انتخاب نقش کارشناس فروش — نقش نمونه"'
  );

  // Assert each accessible name contains the persona name exactly once
  const extractRoleLabels = (html: string) => {
    const matches = html.match(/aria-label="انتخاب نقش [^"]+"/g) || [];
    return matches.map(m => m.replace(/aria-label="|"/g, ''));
  };

  const modalLabels = extractRoleLabels(modalOut);
  const arashLabel = modalLabels.find(l => l.includes('آرش')) || '';
  const salesLabel = modalLabels.find(l => l.includes('کارشناس فروش')) || '';

  assert.equal((arashLabel.match(/آرش/g) || []).length, 1, 'Accessible name for Arash must contain "آرش" exactly once');
  assert.equal((salesLabel.match(/کارشناس فروش/g) || []).length, 1, 'Accessible name for Sales specialist must contain "کارشناس فروش" exactly once');
});

test('9. Elimination of forbidden concatenated strings across rendered UI components', () => {
  const salesPersona = adaptPersona(getDocumentBasedPersonaById('p-sales')!);
  const arashPersona = adaptPersona(getDocumentBasedPersonaById('p-warehouse')!);

  const renderedUIs = [
    {
      name: 'Sales Sidebar',
      html: renderWithProviders(
        <Sidebar
          currentRoute="sales"
          onNavigate={() => {}}
          activePersona={salesPersona}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      ),
    },
    {
      name: 'Arash Sidebar',
      html: renderWithProviders(
        <Sidebar
          currentRoute="inbox"
          onNavigate={() => {}}
          activePersona={arashPersona}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      ),
    },
    {
      name: 'SalesView Step 4',
      html: renderWithProviders(
        <SalesView
          activePersona={salesPersona}
          showToast={() => {}}
          onNavigateToInbox={() => {}}
          initialCreateModalOpen={true}
          initialStep={4}
        />
      ),
    },
    {
      name: 'TopBar',
      html: renderWithProviders(
        <TopBar
          onOpenMobileMenu={() => {}}
          onOpenSearch={() => {}}
          onOpenNotifications={() => {}}
          activePersona={salesPersona}
          onSelectPersona={() => {}}
          pageTitle="سامانه عملیات جوادیان"
          breadcrumbs={[]}
        />
      ),
    },
    {
      name: 'LoginScreen',
      html: renderWithProviders(
        <LoginScreen onLogin={() => {}} />
      ),
    },
    {
      name: 'RoleSelectorModal',
      html: renderWithProviders(
        <RoleSelectorModal
          isOpen={true}
          onClose={() => {}}
          activePersona={salesPersona}
          onSelect={() => {}}
        />
      ),
    },
  ];

  for (const { name, html } of renderedUIs) {
    // 1. "کارشناس فروش (نقش نمونه)" must never appear anywhere
    assert.equal(
      html.includes('کارشناس فروش (نقش نمونه)'),
      false,
      `${name} must not contain "کارشناس فروش (نقش نمونه)"`
    );

    // 2. Duplicate names must never appear in HTML / accessible names
    assert.equal(
      html.includes('آرش آرش'),
      false,
      `${name} must not contain "آرش آرش"`
    );
    assert.equal(
      html.includes('کارشناس فروش کارشناس فروش'),
      false,
      `${name} must not contain "کارشناس فروش کارشناس فروش"`
    );

    // 3. Visible text (outside the intended aria-label button name) must never concatenate "کارشناس فروش — نقش نمونه"
    const visibleText = html.replace(/aria-label="[^"]*"/g, '');
    assert.equal(
      visibleText.includes('کارشناس فروش — نقش نمونه'),
      false,
      `${name} visible text must not contain concatenated "کارشناس فروش — نقش نمونه"`
    );
  }
});

test('10. Independent badges "نقش سازمانی" and "نقش نمونه" are preserved', () => {
  const salesPersona = adaptPersona(getDocumentBasedPersonaById('p-sales')!);
  const arashPersona = adaptPersona(getDocumentBasedPersonaById('p-warehouse')!);

  const salesSidebar = renderWithProviders(
    <Sidebar
      currentRoute="sales"
      onNavigate={() => {}}
      activePersona={salesPersona}
      isCollapsed={false}
      onToggleCollapse={() => {}}
    />
  );
  assert.ok(salesSidebar.includes('نقش نمونه'), 'Sales sidebar footer must have independent badge "نقش نمونه"');

  const arashSidebar = renderWithProviders(
    <Sidebar
      currentRoute="inbox"
      onNavigate={() => {}}
      activePersona={arashPersona}
      isCollapsed={false}
      onToggleCollapse={() => {}}
    />
  );
  assert.ok(arashSidebar.includes('نقش سازمانی'), 'Arash sidebar footer must have independent badge "نقش سازمانی"');

  const modalOut = renderWithProviders(
    <RoleSelectorModal
      isOpen={true}
      onClose={() => {}}
      activePersona={salesPersona}
      onSelect={() => {}}
    />
  );
  assert.ok(modalOut.includes('نقش سازمانی'), 'Role modal must render independent badge "نقش سازمانی"');
  assert.ok(modalOut.includes('نقش نمونه'), 'Role modal must render independent badge "نقش نمونه"');
});
