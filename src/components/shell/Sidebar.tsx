import React from 'react';
import {
  Home,
  ShoppingBag,
  Truck,
  CreditCard,
  MapPin,
  BarChart3,
  Database,
  ShieldCheck,
  Palette,
  Boxes,
  PanelRightClose,
  PanelRightOpen,
  Download,
  X,
  Inbox,
  ClipboardCheck,
  Bell,
  Phone,
  Tag,
  Users,
  Warehouse,
  History,
  GitFork,
  FileText,
} from 'lucide-react';
import { MockPersona } from '../../types';
import { NAV_ITEMS } from '../../data/mockData';
import { mockRepository } from '../../runtime/workflow';
import { toPersianDigits } from '../../utils/formatters';
import { isRouteVisibleForPersona, isNavGroupVisibleForPersona } from '../../utils/roleExperience';
import { usePWA } from '../pwa/PWAContext';
import { DialogSurface } from '../design-system/DialogSurface';
import { getPersonaDisplayName, getPersonaSubtitle, getPersonaTypeLabel } from '../../runtime/documentBasedPersonas';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (routeKey: string) => void;
  activePersona: MockPersona;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ROUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  inbox: Inbox,
  approvals: ShieldCheck,
  notifications: Bell,
  sales_orders: ShoppingBag,
  customers: Users,
  pricing: Tag,
  sales_calls: Phone,
  supply_requests: Truck,
  logistics: Truck,
  inventory_receipts: Warehouse,
  inventory_dispatch: Warehouse,
  payment_requests: CreditCard,
  field_visits: MapPin,
  users: Users,
  roles: ShieldCheck,
  management: BarChart3,
  audit_trail: History,
  traceability: GitFork,
  design_system: Palette,
};

const icons = { Home, ShoppingBag, Truck, CreditCard, MapPin, BarChart3, Database, ShieldCheck, Palette, FileText };

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  activePersona,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { isInstallable, setShowInstallGuide } = usePWA();

  const counts = mockRepository.computeScopedTaskCounts(activePersona);
  const badgeCounts: Record<string, number | undefined> = {
    inbox: counts.mine,
    approvals: counts.approvals || undefined,
    sales_orders: counts.orders || undefined,
    supply_requests: counts.supplyReqs || undefined,
    payment_requests: counts.payRequests || undefined,
    visit_plans: counts.visitPlans || undefined,
  };

  const renderContent = (compact: boolean, mobile = false) => (
    <aside className="sidebar">
      {/* Brand Header matching prototype .brand */}
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">ج</div>
        {!compact && (
          <div className="min-w-0 flex-1">
            <div className="brand-title sidebar-brand-name">سامانه جوادیان</div>
            <div className="brand-sub">مدیریت عملیات، فروش و فرایندها</div>
          </div>
        )}
        {mobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="بستن منو"
            className="close-btn shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        ) : !compact && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="جمع کردن منو"
            aria-label="جمع کردن منو"
            className="icon-btn ghost shrink-0 !w-8 !h-8"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {compact && (
        <button
          type="button"
          onClick={onToggleCollapse}
          title="باز کردن منو"
          aria-label="باز کردن منو"
          className="mx-auto my-2 icon-btn ghost !w-8 !h-8"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      )}

      {/* Navigation matching prototype .nav with .nav-section and .nav-item */}
      <nav aria-label="بخش‌های سامانه" className="nav sidebar-navigation">
        {NAV_ITEMS.filter((group) => isNavGroupVisibleForPersona(group.id, activePersona)).map((group) => {
          const subs = group.subItems?.filter((sub) => isRouteVisibleForPersona(sub.routeKey, activePersona)) || [];
          if (subs.length === 0) return null;

          const renderedGroupTitle = group.title
            .replace(/کارتابل من/g, 'کارهای من')
            .replace(/کارتابل/g, 'کارهای من')
            .replace(/^خانه$/, 'عملیات');

          return (
            <div key={group.id}>
              {!compact && <div className="nav-section">{renderedGroupTitle}</div>}
              {subs.map((sub) => {
                const isSubActive = currentRoute === sub.routeKey;
                const renderedTitle = sub.routeKey === 'inbox' || sub.title.includes('کارتابل') ? 'کارهای من' : sub.title;
                const Icon = ROUTE_ICONS[sub.routeKey] || icons[group.iconName as keyof typeof icons] || Boxes;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    aria-current={isSubActive ? 'page' : undefined}
                    onClick={() => {
                      onNavigate(sub.routeKey);
                      onCloseMobile?.();
                    }}
                    className={`nav-item ${isSubActive ? 'active' : ''}`}
                    title={renderedTitle}
                  >
                    <span className="nav-icon">
                      <Icon className="w-4 h-4" />
                    </span>
                    {!compact && <span className="truncate">{renderedTitle}</span>}
                    {!compact && badgeCounts[sub.routeKey] !== undefined && (
                      <span className={`pill neutral mr-auto text-[10px] ${isSubActive ? '!bg-white/80' : ''}`}>
                        {toPersianDigits(badgeCounts[sub.routeKey]!)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer matching prototype .sidebar-foot */}
      {!compact && (
        <div className="sidebar-foot safe-bottom">
          {isInstallable && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile?.();
                setShowInstallGuide(true);
              }}
              className="btn small w-full mb-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              نصب برنامه
            </button>
          )}
          <div className="user-card">
            <div className="avatar">
              {getPersonaDisplayName(activePersona).charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="user-name truncate">
                {getPersonaDisplayName(activePersona)}
              </div>
              <div className="user-role truncate">
                {getPersonaSubtitle(activePersona) || activePersona.department}
              </div>
            </div>
            <span className="pill primary font-bold text-[10px] shrink-0">
              {getPersonaTypeLabel(activePersona)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="desktop-sidebar hidden lg:block shrink-0" data-collapsed={isCollapsed}>
        <div className="sidebar-panel fixed top-0 bottom-0 right-0 z-30">{renderContent(isCollapsed)}</div>
      </div>
      <DialogSurface isOpen={!!isMobileOpen} onClose={() => onCloseMobile?.()} title="بخش‌های سامانه" className="drawer-surface lg:hidden">
        <div className="h-dvh w-full max-w-sm safe-top safe-bottom bg-white">{renderContent(false, true)}</div>
      </DialogSurface>
    </>
  );
};
