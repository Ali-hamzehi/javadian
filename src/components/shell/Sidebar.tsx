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
    <aside className="flex flex-col h-full bg-white text-slate-800 border-l border-[#e6e8ef] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="sidebar-brand px-4 border-b border-[#e6e8ef] flex items-center gap-3 shrink-0 h-[64px]">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#6558d9] shadow-[0_8px_18px_rgba(101,88,217,0.28)] flex items-center justify-center text-white font-black text-lg" aria-hidden="true">ج</div>
        {!compact && <div className="min-w-0 flex-1"><p className="sidebar-brand-name text-sm font-black text-[#1a202c]">سامانه جوادیان</p><p className="text-[10px] text-[#697082]">مدیریت عملیات، فروش و فرایندها</p></div>}
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
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-all min-h-[44px] sm:min-h-[38px] relative ${single && active ? 'bg-[#f0eeff] text-[#4b3eb9] font-bold border border-[#e4dfff] before:content-[\'\'] before:absolute before:right-0 before:top-2 before:bottom-2 before:w-1 before:rounded-l before:bg-[#6558d9]' : 'text-[#697082] hover:bg-[#fbfbfd] hover:text-[#1a202c]'}`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-all ${single && active ? 'bg-[#6558d9] text-white shadow-[0_4px_12px_rgba(101,88,217,0.25)]' : 'text-[#697082]'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {!compact && <span className="font-bold text-xs sm:text-sm">{group.title}</span>}
                </span>
                {!compact && (!single || group.id === 'home') && (
                  <ChevronDown className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                )}
              </button>
              {!compact && open && (!single || group.id === 'home') && (
                <div className="mr-3 pr-2 border-r border-[#e6e8ef] py-1 space-y-1">
                  {subs.map(sub => {
                    const isSubActive = currentRoute === sub.routeKey;
                    const renderedTitle = (sub.routeKey === 'inbox' || sub.title.includes('کارتابل')) ? 'کارهای من' : sub.title;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        aria-current={isSubActive ? 'page' : undefined}
                        onClick={() => { onNavigate(sub.routeKey); onCloseMobile?.(); }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all min-h-[40px] relative ${isSubActive ? 'bg-[#f0eeff] text-[#4b3eb9] font-bold border border-[#e4dfff] before:content-[\'\'] before:absolute before:right-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-l before:bg-[#6558d9]' : 'text-[#697082] hover:bg-[#fbfbfd] hover:text-[#1a202c]'}`}
                      >
                        <span>{renderedTitle}</span>
                        {badgeCounts[sub.routeKey] !== undefined && (
                          <span className={`text-caption rounded-full px-2 py-0.5 shrink-0 font-bold ${isSubActive ? 'bg-[#6558d9] text-white' : 'bg-[#f0eeff] text-[#6558d9]'}`}>
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
        <div className="p-3 border-t border-[#e6e8ef] text-caption text-slate-600 safe-bottom bg-[#fbfbfd]">
          {isInstallable && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile?.();
                setShowInstallGuide(true);
              }}
              className="w-full flex items-center gap-2 rounded-xl bg-white hover:bg-[#f0eeff] border border-[#e6e8ef] text-[#6558d9] font-bold p-2.5 mb-3 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-[#6558d9]" />
              نصب برنامه
            </button>
          )}
          <div className="bg-white border border-[#e6e8ef] rounded-xl p-2.5 flex items-center gap-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#f0eeff] text-[#6558d9] font-black text-sm flex items-center justify-center shrink-0">
              {getPersonaDisplayName(activePersona).charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[#1a202c] text-xs truncate">
                {getPersonaDisplayName(activePersona)}
              </p>
              <p className="text-[10px] text-[#697082] truncate mt-0.5">
                {getPersonaSubtitle(activePersona) || activePersona.department}
              </p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-[#f0eeff] text-[#6558d9] border border-[#e4dfff]">
              {getPersonaTypeLabel(activePersona)}
            </span>
          </div>
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
