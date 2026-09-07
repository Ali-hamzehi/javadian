import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Truck, CreditCard, MapPin, BarChart3, Database, ShieldCheck, Palette, ChevronDown, Boxes, PanelRightClose, PanelRightOpen, Download, X } from 'lucide-react';
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
const icons = { Home, ShoppingBag, Truck, CreditCard, MapPin, BarChart3, Database, ShieldCheck, Palette };
export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, activePersona, isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { isInstallable, setShowInstallGuide } = usePWA();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ home: true, sales: true, design_system: true });

  useEffect(() => {
    const parentGroup = NAV_ITEMS.find(group =>
      group.subItems?.some(sub => sub.routeKey === currentRoute)
    );
    if (parentGroup) {
      setOpenGroups(prev => ({ ...prev, [parentGroup.id]: true }));
    }
  }, [currentRoute]);

  const counts = mockRepository.computeScopedTaskCounts(activePersona);
  const badgeCounts: Record<string, number | undefined> = { inbox: counts.mine, approvals: counts.approvals || undefined, sales_orders: counts.orders || undefined, supply_requests: counts.supplyReqs || undefined, payment_requests: counts.payRequests || undefined, visit_plans: counts.visitPlans || undefined };

  const renderContent = (compact: boolean, mobile = false) => (
    <aside className="flex flex-col h-full bg-white/95 backdrop-blur-md text-slate-800 border-l border-slate-200/80">
      <div className="sidebar-brand px-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-primary-700 flex items-center justify-center text-white font-black" aria-hidden="true">ج</div>
        {!compact && <div className="min-w-0 flex-1"><p className="sidebar-brand-name text-sm font-bold text-slate-900">سامانه عملیات جوادیان</p><p className="text-caption text-slate-500">عملیات و زنجیره تأمین</p></div>}
        {mobile ? <button type="button" onClick={onCloseMobile} aria-label="بستن منو" className="shrink-0 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1 inline-flex items-center justify-center"><X className="w-5 h-5" /></button> : !compact && <button type="button" onClick={onToggleCollapse} title="جمع کردن منو" aria-label="جمع کردن منو" className="shrink-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 inline-flex items-center justify-center"><PanelRightClose className="w-5 h-5" /></button>}
      </div>
      {compact && <button type="button" onClick={onToggleCollapse} title="باز کردن منو" aria-label="باز کردن منو" className="mx-auto my-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 inline-flex items-center justify-center"><PanelRightOpen className="w-5 h-5" /></button>}
      <nav aria-label="بخش‌های سامانه" className="sidebar-navigation flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.filter(group => isNavGroupVisibleForPersona(group.id, activePersona)).map(group => {
          const subs = group.subItems?.filter(sub => isRouteVisibleForPersona(sub.routeKey, activePersona)) || [];
          if (subs.length === 0) return null;
          const single = subs.length === 1;
          const open = openGroups[group.id] ?? false;
          const active = subs.some(sub => sub.routeKey === currentRoute);
          const Icon = icons[group.iconName as keyof typeof icons] || Boxes;
          return (
            <div key={group.id}>
              <button
                type="button"
                title={group.title}
                aria-label={group.title}
                aria-expanded={!single || group.id === 'home' ? open && !compact : undefined}
                onClick={() => {
                  if (single && group.id !== 'home') { onNavigate(subs[0].routeKey); onCloseMobile?.(); }
                  else { if (compact) onToggleCollapse(); setOpenGroups(previous => ({ ...previous, [group.id]: compact || !open })); }
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors min-h-[44px] sm:min-h-[36px] ${single && active ? 'bg-primary-50 text-primary-800 font-bold border border-primary-100/80 shadow-xs' : 'text-slate-700 hover:bg-slate-100/80'}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon className={`shrink-0 ${single && active ? 'text-primary-700' : 'text-slate-500'}`} />
                  {!compact && <span>{group.title}</span>}
                </span>
                {!compact && (!single || group.id === 'home') && (
                  <ChevronDown className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!compact && open && (!single || group.id === 'home') && (
                <div className="mr-3 pr-2 border-r border-slate-200 py-1 space-y-1">
                  {subs.map(sub => {
                    const isSubActive = currentRoute === sub.routeKey;
                    const renderedTitle = (sub.routeKey === 'inbox' || sub.title.includes('کارتابل')) ? 'کارهای من' : sub.title;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        aria-current={isSubActive ? 'page' : undefined}
                        onClick={() => { onNavigate(sub.routeKey); onCloseMobile?.(); }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors min-h-[44px] sm:min-h-[36px] ${isSubActive ? 'bg-primary-50 text-primary-800 font-extrabold border border-primary-200/60 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        <span>{renderedTitle}</span>
                        {badgeCounts[sub.routeKey] !== undefined && (
                          <span className={`text-caption rounded-full px-2 shrink-0 font-medium ${isSubActive ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {toPersianDigits(badgeCounts[sub.routeKey]!)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {!compact && (
        <div className="p-3 border-t border-slate-100 text-caption text-slate-600 safe-bottom bg-slate-50/50">
          {isInstallable && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile?.();
                setShowInstallGuide(true);
              }}
              className="w-full flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-primary-700 font-bold p-2.5 mb-3 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-primary-700" />
              نصب برنامه
            </button>
          )}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-caption text-slate-500 truncate">
              {getPersonaSubtitle(activePersona) || activePersona.department}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 bg-white text-slate-600 border border-slate-200">
              {getPersonaTypeLabel(activePersona)}
            </span>
          </div>
          <p className="font-bold text-slate-900 text-sm truncate">
            {getPersonaDisplayName(activePersona)}
          </p>
        </div>
      )}
    </aside>
  );
  return <>
    <div className="desktop-sidebar hidden lg:block shrink-0" data-collapsed={isCollapsed}>
      <div className="sidebar-panel fixed top-0 bottom-0 right-0 z-30">{renderContent(isCollapsed)}</div>
    </div>
    <DialogSurface isOpen={!!isMobileOpen} onClose={() => onCloseMobile?.()} title="بخش‌های سامانه" className="drawer-surface lg:hidden">
      <div className="h-dvh w-full max-w-sm safe-top safe-bottom bg-white">{renderContent(false, true)}</div>
    </DialogSurface>
  </>;
};
