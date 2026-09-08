import { useWorkflowRevision, initializeWorkflow } from './runtime/workflow';
import { adaptPersona, getPersonaDisplayName, getPersonaSubtitle, getPersonaTypeLabel, stripRoleSampleSuffix } from './runtime/documentBasedPersonas';
import { ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { MOCK_PERSONAS, NAV_ITEMS } from './data/mockData';
import { MockPersona } from './types';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { GlobalSearchModal } from './components/shell/GlobalSearchModal';
import { NotificationsPopover } from './components/shell/NotificationsPopover';
import { ToastProvider, useToast } from './components/design-system/ToastContext';
import { PWAProvider, usePWA } from './components/pwa/PWAContext';
import { PWAOfflineBanner } from './components/pwa/PWAOfflineBanner';
import { PWAUpdateBanner } from './components/pwa/PWAUpdateBanner';
import { PWAInstallGuideModal } from './components/pwa/PWAInstallGuideModal';
import { PWALaunchSplash } from './components/pwa/PWALaunchSplash';
import { MobileBottomNav } from './components/shell/MobileBottomNav';
import { InboxView } from './views/InboxView';
import { SalesView } from './views/SalesView';
import { MasterDataView } from './views/MasterDataView';
import { ProductCatalogView } from './views/ProductCatalogView';
import { CustomersView } from './views/CustomersView';
import { UsersView } from './views/UsersView';
import { ResponsibilitiesView } from './views/ResponsibilitiesView';
import { PermissionsView } from './views/PermissionsView';
import { DelegationsView } from './views/DelegationsView';
import { DesignSystemShowcaseView } from './views/DesignSystemShowcaseView';
import { RoutePlaceholderView } from './views/RoutePlaceholderView';
import { SupplyRequestsView } from './views/SupplyRequestsView';
import { LogisticsView } from './views/LogisticsView';
import { WarehouseReceiptsView } from './views/WarehouseReceiptsView';
import { WarehouseDispatchView } from './views/WarehouseDispatchView';
import { PaymentRequestsView } from './views/PaymentRequestsView';
import { FieldSalesView } from './views/FieldSalesView';
import { ManualIntakeView } from './views/ManualIntakeView';
import { ManagementMonitorView } from './views/ManagementMonitorView';
import { APP_ROUTES, canAccessRoute, AppRouteKey } from './routes/routesConfig';
import { Forbidden403 } from './components/design-system/SystemStates';
import { LoginScreen } from './components/auth/LoginScreen';
import { RoleSelectorModal } from './components/auth/RoleSelectorModal';
import { CreateUserModal } from './components/management/CreateUserModal';
import { AssignTaskModal } from './components/management/AssignTaskModal';
import { MOCK_USER_PROFILES } from './data/mockOrgData';
import { UserAccessProfile } from './types';

function AppContent() {
  useWorkflowRevision();
  useEffect(() => { initializeWorkflow(); }, []);
  const { addToast } = useToast();
  const { showInstallGuide, setShowInstallGuide } = usePWA();

  // Active mock persona state - safe restoration from storage or default to primary sales specialist
  const [activePersona, setActivePersona] = useState<MockPersona | null>(() => {
    try {
      const isExplicitlyLoggedOut = sessionStorage.getItem('javadian_explicit_signed_out');
      if (isExplicitlyLoggedOut) return null;
      const savedPersonaId = localStorage.getItem('javadian_pwa_persona_id');
      if (savedPersonaId) {
        const found = MOCK_PERSONAS.find((p) => p.id === savedPersonaId);
        if (found) return adaptPersona(found);
      }
      // If no saved persona and not explicitly signed out, default to primary sales specialist
      const defaultPersona = MOCK_PERSONAS.find((p) => p.id === 'sales_specialist') || MOCK_PERSONAS[0];
      if (defaultPersona) {
        return adaptPersona(defaultPersona);
      }
    } catch (e) {
      console.warn('Could not restore saved persona:', e);
    }
    return null;
  });

  const [sessionNotice, setSessionNotice] = useState<{ message: string; type?: 'info' | 'warning' | 'error' } | null>(null);

  // Routing state - safe restoration from storage
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    try {
      const savedRoute = localStorage.getItem('javadian_pwa_route');
      if (savedRoute && APP_ROUTES[savedRoute as AppRouteKey]) {
        return savedRoute;
      }
    } catch (e) {
      console.warn('Could not restore saved route:', e);
    }
    return 'inbox';
  });
  const [targetRecordId, setTargetRecordId] = useState<string | undefined>(undefined);

  // Sync state changes to storage for seamless re-opening
  useEffect(() => {
    try {
      if (activePersona) {
        localStorage.setItem('javadian_pwa_persona_id', activePersona.id);
      } else {
        localStorage.removeItem('javadian_pwa_persona_id');
      }
    } catch (e) {}
  }, [activePersona]);

  useEffect(() => {
    try {
      if (currentRoute) {
        localStorage.setItem('javadian_pwa_route', currentRoute);
      }
    } catch (e) {}
  }, [currentRoute]);

  // Scroll to top on route change or persona switch to ensure headings are never clipped
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    } catch (e) {}
  }, [currentRoute, activePersona?.id]);

  // Shell UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState<boolean>(false);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (activePersona && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, [activePersona]);

  // Manager action modals state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [initialTaskAssignee, setInitialTaskAssignee] = useState<string | undefined>(undefined);
  const [userList, setUserList] = useState<UserAccessProfile[]>([...MOCK_USER_PROFILES]);

  // Determine authorized landing route based on persona
  const getPersonaLandingRoute = (persona: MockPersona): string => {
    if (persona.personaKey === 'field_sales_visitor') {
      return 'visit_plans';
    }
    if (persona.personaKey === 'master_data_manager') {
      return 'products';
    }
    if (persona.capabilities.includes('USER_MANAGE')) {
      return 'org_users';
    }
    if (persona.isManager && (persona.capabilities.includes('MANAGEMENT_VIEW') || persona.capabilities.includes('ops_view'))) {
      return 'ops_view';
    }
    return 'inbox';
  };

  // Sign out handler - clears session and returns to Persian RTL login page
  const handleSignOut = () => {
    try {
      sessionStorage.setItem('javadian_explicit_signed_out', 'true');
    } catch (e) {}
    setActivePersona(null);
    setCurrentRoute('inbox');
    setTargetRecordId(undefined);
    setSessionNotice({
      message: 'شما با موفقیت از سامانه خارج شدید.',
      type: 'info',
    });
    addToast('از سامانه خارج شدید', {
      description: 'نشست کاربری با موفقیت خاتمه یافت.',
      tone: 'info',
    });
  };

  // Switch persona handler
  const handleSelectPersona = (persona: MockPersona) => {
    try {
      sessionStorage.removeItem('javadian_explicit_signed_out');
    } catch (e) {}
    const canonical = adaptPersona(persona);
    setActivePersona(canonical);
    // If user cannot access current route under new persona, gracefully redirect
    if (!canAccessRoute(currentRoute, canonical)) {
      setCurrentRoute(getPersonaLandingRoute(canonical));
      setTargetRecordId(undefined);
    }
    const displayName = getPersonaDisplayName(canonical);
    const subtitle = getPersonaSubtitle(canonical);
    const typeLabel = getPersonaTypeLabel(canonical);
    const descParts = [subtitle, typeLabel].filter(Boolean);
    addToast(`نقش به «${displayName}» تغییر یافت`, {
      description: descParts.join(' • '),
      tone: 'info',
    });
  };

  // Route protection effect: redirect immediately if persona cannot access current page
  React.useEffect(() => {
    if (activePersona && !canAccessRoute(currentRoute, activePersona)) {
      setCurrentRoute(getPersonaLandingRoute(activePersona));
      setTargetRecordId(undefined);
    }
  }, [activePersona, currentRoute]);

  // Switch active responsibility (for multi-delegate persona)
  const handleSwitchResponsibility = (delegationId: string) => {
    if (!activePersona) return;
    setActivePersona((prev) => (prev ? {
      ...prev,
      activeResponsibilityId: delegationId,
    } : null));
    const found = activePersona.delegatedResponsibilities?.find((d) => d.id === delegationId);
    if (found) {
      addToast(`مسئولیت فعال تغییر کرد`, {
        description: `اکنون در حال اقدام به عنوان: «${found.title}»`,
        tone: 'warning',
      });
    } else {
      addToast(`به پست اصلی بازگشتید`, {
        description: `${getPersonaSubtitle(activePersona) || stripRoleSampleSuffix(activePersona.jobTitle)}`,
        tone: 'info',
      });
    }
  };

  // If user is not logged in, render the official enterprise LoginScreen
  if (!activePersona) {
    return (
      <div className="min-h-screen flex flex-col justify-between text-slate-800 bg-[#f5f6fa] antialiased">
        <PWALaunchSplash />
        <PWAOfflineBanner />
        <LoginScreen
          sessionNotice={sessionNotice}
          onLogin={(persona) => {
            try {
              sessionStorage.removeItem('javadian_explicit_signed_out');
            } catch (e) {}
            const canonical = adaptPersona(persona);
            setActivePersona(canonical);
            setSessionNotice(null);
            setCurrentRoute(getPersonaLandingRoute(canonical));
            addToast(`خوش آمدید، ${getPersonaDisplayName(canonical)}`, {
              description: `سمت سازمانی: ${getPersonaSubtitle(canonical) || stripRoleSampleSuffix(canonical.jobTitle)}`,
              tone: 'success',
            });
          }}
        />
        <PWAInstallGuideModal
          isOpen={showInstallGuide}
          onClose={() => setShowInstallGuide(false)}
        />
        <PWAUpdateBanner />
      </div>
    );
  }

  // Helper to get breadcrumb and page title from route
  const getPageInfo = () => {
    if (currentRoute === 'inbox') {
      return {
        title: 'کارهای من',
        breadcrumbs: ['خانه', 'کارهای من'],
      };
    }
    const routeDef = APP_ROUTES[currentRoute as AppRouteKey];
    if (routeDef) {
      return {
        title: routeDef.title.replace(/کارتابل/g, 'کارهای من'),
        breadcrumbs: [
          routeDef.breadcrumbs[0]?.replace(/کارتابل/g, 'کارهای من') || '',
          routeDef.breadcrumbs[1]?.replace(/کارتابل/g, 'کارهای من') || '',
        ],
      };
    }
    for (const group of NAV_ITEMS) {
      if (group.subItems) {
        const sub = group.subItems.find((s) => s.routeKey === currentRoute);
        if (sub) {
          return {
            title: sub.title.replace(/کارتابل/g, 'کارهای من'),
            breadcrumbs: [
              group.title.replace(/کارتابل/g, 'کارهای من'),
              sub.title.replace(/کارتابل/g, 'کارهای من'),
            ],
          };
        }
      }
    }
    return {
      title: 'سامانه جوادیان',
      breadcrumbs: ['خانه', 'کارهای من'],
    };
  };

  const { title: pageTitle, breadcrumbs } = getPageInfo();
  const isAuthorized = canAccessRoute(currentRoute, activePersona);
  const currentRouteDef = APP_ROUTES[currentRoute as AppRouteKey];

  return (
    <div className="min-h-screen text-slate-800 bg-[#f5f6fa] flex flex-col antialiased selection:bg-[#6558d9] selection:text-white">
      <PWALaunchSplash />
      <PWAOfflineBanner />

      <a href="#main-content" className="skip-link">رفتن به محتوای اصلی</a>
      <div className="flex flex-1 min-w-0">
        {/* RTL Desktop and Mobile Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={(routeKey) => {
            setCurrentRoute(routeKey);
            setTargetRecordId(undefined);
          }}
          activePersona={activePersona}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Header */}
          <TopBar
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            activePersona={activePersona}
            onSelectPersona={handleSelectPersona}
            onSwitchResponsibility={handleSwitchResponsibility}
            onSignOut={handleSignOut}
            pageTitle={pageTitle}
            breadcrumbs={breadcrumbs}
          />

          {/* Dynamic Route View */}
          <main id="main-content" tabIndex={-1} className="app-main flex-1">
          {currentRoute !== 'inbox' && <button type="button" className="lg:hidden flex items-center gap-2 text-primary-700 mb-3 rounded-lg" onClick={() => { setCurrentRoute('inbox'); setTargetRecordId(undefined); }}><ArrowRight className="w-4 h-4" />بازگشت به کارهای من</button>}
          {!isAuthorized ? (
            <Forbidden403
              missingCapabilities={currentRouteDef?.requiredCapabilities || []}
              onNavigateToInbox={() => {
                setCurrentRoute('inbox');
                setTargetRecordId(undefined);
              }}
              onSwitchPersona={() => {
                setIsRoleSelectorOpen(true);
              }}
            />
          ) : currentRoute === 'inbox' || currentRoute === 'approvals' || currentRoute === 'notifications' ? (
            <InboxView
              onNavigateToLinkedRecord={(category, code) => {
                const routes: Record<string, string> = { sales_order: 'sales_orders', supply_request: 'supply_requests', payment_request: 'payment_requests', warehouse_exit: 'inventory_dispatch' };
                const route = routes[category];
                if (route && canAccessRoute(route, activePersona)) { setCurrentRoute(route); setTargetRecordId(code); }
                else addToast('دسترسی به پرونده مرتبط برای این نقش فراهم نیست.', 'warning');
              }}
              activePersona={activePersona}
              selectedRecordId={targetRecordId}
              initialTab={currentRoute === 'approvals' ? 'my_approvals' : currentRoute === 'notifications' ? 'notifications' : undefined}
              onOpenAssignTaskModal={(assignee) => {
                setInitialTaskAssignee(assignee);
                setIsAssignTaskModalOpen(true);
              }}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'sales_calls' ? (
            <ManualIntakeView
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'sales_orders' ? (
            <SalesView
              selectedRecordId={targetRecordId}
              subRoute="sales_orders"
              activePersona={activePersona}
              onNavigateToRoute={(routeKey) => setCurrentRoute(routeKey)}
              onNavigateToInboxRecord={(recId) => {
                setCurrentRoute('inbox');
                setTargetRecordId(recId);
              }}
            />
          ) : currentRoute === 'visit_plans' || currentRoute === 'field_followups' || currentRoute === 'field_manager' ? (
            <FieldSalesView
              activePersona={activePersona}
              initialTab={
                currentRoute === 'field_followups'
                  ? 'field_followups'
                  : currentRoute === 'field_manager'
                  ? 'field_manager'
                  : 'visit_plans'
              }
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'ops_view' || currentRoute === 'integration_errors' || currentRoute === 'traceability' ? (
            <ManagementMonitorView
              activePersona={activePersona}
              initialMode={
                currentRoute === 'integration_errors'
                  ? 'integration_errors'
                  : currentRoute === 'traceability'
                  ? 'traceability'
                  : 'ops_view'
              }
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'products' || currentRoute === 'product_categories' || currentRoute === 'product_units' || currentRoute === 'pricing' ? (
            <ProductCatalogView
              currentSubRoute={currentRoute as any}
              activePersona={activePersona}
              onNavigateToSubRoute={(subRoute) => setCurrentRoute(subRoute)}
            />
          ) : currentRoute === 'customers' ? (
            <CustomersView
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'suppliers' || currentRoute === 'warehouses' ? (
            <MasterDataView
              initialTab={currentRoute as any}
              activePersona={activePersona}
            />
          ) : currentRoute === 'org_users' ? (
            <UsersView
              activePersona={activePersona}
              onOpenAssignTaskModal={(assignee) => {
                setInitialTaskAssignee(assignee);
                setIsAssignTaskModalOpen(true);
              }}
            />
          ) : currentRoute === 'org_responsibilities' ? (
            <ResponsibilitiesView activePersona={activePersona} />
          ) : currentRoute === 'access_matrix' ? (
            <PermissionsView activePersona={activePersona} />
          ) : currentRoute === 'org_delegations' ? (
            <DelegationsView activePersona={activePersona} />
          ) : currentRoute === 'supply_requests' ? (
            <SupplyRequestsView
              selectedRecordId={targetRecordId}
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'logistics' ? (
            <LogisticsView
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'inventory_receipts' ? (
            <WarehouseReceiptsView
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'inventory_dispatch' ? (
            <WarehouseDispatchView
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'payment_requests' ? (
            <PaymentRequestsView
              selectedRecordId={targetRecordId}
              activePersona={activePersona}
              onNavigateToRoute={(routeKey, recordId) => {
                setCurrentRoute(routeKey);
                setTargetRecordId(recordId);
              }}
            />
          ) : currentRoute === 'design_system_showcase' ? (
            <DesignSystemShowcaseView />
          ) : (
            <RoutePlaceholderView
              routeKey={currentRoute}
              activePersona={activePersona}
              onNavigateToInboxWithRecord={(recId) => {
                setCurrentRoute('inbox');
                setTargetRecordId(recId);
              }}
              onSwitchPersonaRequested={() => setIsRoleSelectorOpen(true)}
            />
          )}
        </main>
        <footer className="py-3 px-4 border-t border-[#e6e8ef] text-center text-caption text-[#697082] bg-white">
          © سامانه جوادیان — مدیریت عملیات، فروش و فرایندها
        </footer>
      </div>
      </div>

      {/* Mobile Bottom Navigation (Safe Area + Scoped Badge Counts) */}
      <MobileBottomNav
        currentRoute={currentRoute}
        onNavigate={(routeKey) => {
          setCurrentRoute(routeKey);
          setTargetRecordId(undefined);
        }}
        onOpenMore={() => setIsMobileMenuOpen(true)}
        activePersona={activePersona}
      />

      {/* Global Search Palette (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        activePersona={activePersona}
        onSelectRecord={(rec) => {
          setCurrentRoute('inbox');
          setTargetRecordId(rec.id);
        }}
        onNavigateRoute={(routeKey) => {
          setCurrentRoute(routeKey);
          setTargetRecordId(undefined);
        }}
      />

      {/* Notifications Popover Drawer */}
      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activePersona={activePersona}
        onNavigateToRecord={(code, routeKey) => {
          if (routeKey) {
            setCurrentRoute(routeKey);
          } else {
            setCurrentRoute('inbox');
          }
          setTargetRecordId(code);
        }}
      />

      {/* Manager Action: Guided User Creation Modal */}
      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          existingUsers={userList}
          onUserCreated={(newUser) => {
            setUserList((prev) => [newUser, ...prev]);
            addToast(`حساب کاربری جدید «${newUser.name}» ایجاد شد`, {
              description: `واحد: ${newUser.unit} • شناسه: ${newUser.personnelId}`,
              tone: 'success',
            });
          }}
          onAssignTask={(userName) => {
            setInitialTaskAssignee(userName);
            setIsAssignTaskModalOpen(true);
          }}
          onConfigureAdvancedAccess={(userId) => {
            setCurrentRoute('access_matrix');
            addToast('هدایت به ماتریس تفکیک اختیارات', { tone: 'info' });
          }}
        />
      )}

      {/* Manager Action: Guided Task Assignment Modal */}
      {isAssignTaskModalOpen && (
        <AssignTaskModal
          isOpen={isAssignTaskModalOpen}
          onClose={() => {
            setIsAssignTaskModalOpen(false);
            setInitialTaskAssignee(undefined);
          }}
          activePersona={activePersona}
          initialAssigneeName={initialTaskAssignee}
          onTaskAssigned={(newTask) => {
            addToast(`وظیفه «${newTask.title}» با موفقیت واگذار گردید`, {
              description: `کد پیگیری: ${newTask.code}`,
              tone: 'success',
            });
          }}
          onViewCreatedTask={(recordId) => {
            setCurrentRoute('inbox');
            setTargetRecordId(recordId);
          }}
          onViewTeamWork={() => {
            setCurrentRoute('inbox');
          }}
        />
      )}

      {/* Role Selection Modal for Explicit Switching */}
      <RoleSelectorModal
        isOpen={isRoleSelectorOpen}
        onClose={() => setIsRoleSelectorOpen(false)}
        onSelect={(persona) => {
          handleSelectPersona(persona);
          setIsRoleSelectorOpen(false);
        }}
        currentPersonaId={activePersona?.id}
      />

      {/* PWA Guided Install Modal and Update Banner */}
      <PWAInstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
      <PWAUpdateBanner />
    </div>
  );
}

export default function App() {
  return (
    <PWAProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </PWAProvider>
  );
}
