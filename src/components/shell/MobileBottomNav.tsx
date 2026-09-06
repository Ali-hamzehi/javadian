import React from 'react';
import {
  Inbox,
  ShoppingBag,
  Truck,
  CheckSquare,
  Bell,
  MoreHorizontal,
  MapPin,
  BarChart3,
  Boxes,
} from 'lucide-react';
import { canAccessRoute } from '../../routes/routesConfig';
import { MockPersona } from '../../types';
import { mockRepository } from '../../runtime/workflow';
import { toPersianDigits } from '../../utils/formatters';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (routeKey: string) => void;
  onOpenMore: () => void;
  activePersona: MockPersona;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenMore,
  activePersona,
}) => {
  const scopedCounts = mockRepository.computeScopedTaskCounts(activePersona);
  const caps = activePersona.capabilities;

  // Determine Primary Destination #2 based on persona capabilities
  let dest2 = {
    routeKey: 'sales_orders',
    label: 'سفارشات',
    icon: ShoppingBag,
    badge: scopedCounts.orders > 0 ? scopedCounts.orders : undefined,
  };

  if (caps.includes('field_sales' as any) || activePersona.personaKey === 'field_sales_visitor') {
    dest2 = {
      routeKey: 'visit_plans',
      label: 'ویزیت‌ها',
      icon: MapPin,
      badge: scopedCounts.visitPlans > 0 ? scopedCounts.visitPlans : undefined,
    };
  } else if (caps.includes('SUPPLY_REQUEST_CREATE' as any) || caps.includes('SUPPLY_REQUEST_VIEW' as any)) {
    dest2 = {
      routeKey: 'supply_requests',
      label: 'تأمین',
      icon: Boxes,
      badge: scopedCounts.supplyReqs > 0 ? scopedCounts.supplyReqs : undefined,
    };
  } else if (caps.includes('DISPATCH_VIEW' as any) || caps.includes('LOGISTICS_VIEW' as any)) {
    dest2 = {
      routeKey: 'logistics',
      label: 'لجستیک',
      icon: Truck,
      badge: undefined,
    };
  } else if (caps.includes('MANAGEMENT_VIEW' as any) || caps.includes('ops_view' as any)) {
    dest2 = {
      routeKey: 'ops_view',
      label: 'عملیات',
      icon: BarChart3,
      badge: undefined,
    };
  }

  // Primary Destination #3: Approvals (if available) or Sales
  const hasApprovals = scopedCounts.approvals > 0 || caps.includes('PRICE_BELOW_APPROVE' as any) || activePersona.isManager;
  const dest3 = hasApprovals
    ? {
        routeKey: 'approvals',
        label: 'تأییدیه‌ها',
        icon: CheckSquare,
        badge: scopedCounts.approvals > 0 ? scopedCounts.approvals : undefined,
      }
    : {
        routeKey: 'sales_orders',
        label: 'فروش',
        icon: ShoppingBag,
        badge: scopedCounts.orders > 0 ? scopedCounts.orders : undefined,
      };

  const navItems = [
    {
      routeKey: 'inbox',
      label: 'کارتابل',
      icon: Inbox,
      badge: scopedCounts.mine > 0 ? scopedCounts.mine : undefined,
      isAction: false,
    },
    {
      routeKey: dest2.routeKey,
      label: dest2.label,
      icon: dest2.icon,
      badge: dest2.badge,
      isAction: false,
    },
    {
      routeKey: dest3.routeKey,
      label: dest3.label,
      icon: dest3.icon,
      badge: dest3.badge,
      isAction: false,
    },
    {
      routeKey: 'notifications',
      label: 'اعلان‌ها',
      icon: Bell,
      badge: scopedCounts.notifications > 0 ? scopedCounts.notifications : undefined,
      isAction: false,
    },
    {
      routeKey: 'more',
      label: 'بیشتر',
      icon: MoreHorizontal,
      badge: undefined,
      isAction: true,
    },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی موبایل"
      className="mobile-navigation lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {navItems.filter((item, index, items) =>
          (item.isAction || canAccessRoute(item.routeKey, activePersona)) &&
          items.findIndex(candidate => candidate.routeKey === item.routeKey) === index
        ).map((item) => {
          const isActive = !item.isAction && currentRoute === item.routeKey;
          const Icon = item.icon;

          return (
            <button
              key={item.routeKey}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if (item.isAction) {
                  onOpenMore();
                } else {
                  onNavigate(item.routeKey);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 min-w-0 min-h-[48px] transition-colors relative cursor-pointer select-none ${
                isActive ? 'text-primary-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform `} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -left-2 bg-rose-600 text-white text-caption font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-none">
                    {toPersianDigits(item.badge)}
                  </span>
                )}
              </div>

              <span className="text-caption mt-1 whitespace-nowrap leading-none truncate max-w-[62px]">
                {item.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 w-4 h-0.5 bg-primary-700 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
