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
  CreditCard,
} from 'lucide-react';
import { canAccessRoute } from '../../routes/routesConfig';
import { MockPersona } from '../../types';
import { mockRepository } from '../../runtime/workflow';
import { toPersianDigits } from '../../utils/formatters';
import { isRouteVisibleForPersona } from '../../utils/roleExperience';

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
  const caps = activePersona.capabilities || [];

  // Determine single primary operational action based on role and capabilities
  const getRoleAction = () => {
    // 1. Approvals (for managers or persons with pending approvals)
    if (
      (scopedCounts.approvals > 0 || activePersona.isManager || caps.includes('approvals.view' as any) || caps.includes('PRICE_BELOW_APPROVE' as any)) &&
      canAccessRoute('approvals', activePersona) &&
      isRouteVisibleForPersona('approvals', activePersona)
    ) {
      return {
        routeKey: 'approvals',
        label: 'تأییدیه‌ها',
        icon: CheckSquare,
        badge: scopedCounts.approvals > 0 ? scopedCounts.approvals : undefined,
      };
    }

    // 2. Field sales / Visitor
    if (
      (caps.includes('field_sales' as any) || activePersona.personaKey === 'field_sales_visitor') &&
      canAccessRoute('visit_plans', activePersona) &&
      isRouteVisibleForPersona('visit_plans', activePersona)
    ) {
      return {
        routeKey: 'visit_plans',
        label: 'ویزیت‌ها',
        icon: MapPin,
        badge: scopedCounts.visitPlans > 0 ? scopedCounts.visitPlans : undefined,
      };
    }

    // 3. Supply / Procurement
    if (
      (caps.includes('SUPPLY_REQUEST_CREATE' as any) || caps.includes('SUPPLY_REQUEST_VIEW' as any) || caps.includes('supply.create' as any)) &&
      canAccessRoute('supply_requests', activePersona) &&
      isRouteVisibleForPersona('supply_requests', activePersona)
    ) {
      return {
        routeKey: 'supply_requests',
        label: 'تأمین',
        icon: Boxes,
        badge: scopedCounts.supplyReqs > 0 ? scopedCounts.supplyReqs : undefined,
      };
    }

    // 4. Warehouse Receipts
    if (
      (caps.includes('RECEIPT_VIEW' as any) || caps.includes('warehouse_receipt.create' as any)) &&
      canAccessRoute('inventory_receipts', activePersona) &&
      isRouteVisibleForPersona('inventory_receipts', activePersona)
    ) {
      return {
        routeKey: 'inventory_receipts',
        label: 'رسید انبار',
        icon: Boxes,
        badge: undefined,
      };
    }

    // 5. Logistics / Dispatch
    if (
      (caps.includes('DISPATCH_VIEW' as any) || caps.includes('LOGISTICS_VIEW' as any) || caps.includes('inventory.read' as any)) &&
      canAccessRoute('logistics', activePersona) &&
      isRouteVisibleForPersona('logistics', activePersona)
    ) {
      return {
        routeKey: 'logistics',
        label: 'لجستیک',
        icon: Truck,
        badge: undefined,
      };
    }

    // 6. Payment requests
    if (
      (caps.includes('PAYMENT_REQUEST_CREATE' as any) || caps.includes('finance.create_request' as any) || caps.includes('finance.payment_request.create' as any)) &&
      canAccessRoute('payment_requests', activePersona) &&
      isRouteVisibleForPersona('payment_requests', activePersona)
    ) {
      return {
        routeKey: 'payment_requests',
        label: 'پرداخت‌ها',
        icon: CreditCard,
        badge: scopedCounts.payRequests > 0 ? scopedCounts.payRequests : undefined,
      };
    }

    // 7. Operations View (Manager)
    if (
      (caps.includes('MANAGEMENT_VIEW' as any) || caps.includes('ops_view' as any)) &&
      canAccessRoute('ops_view', activePersona) &&
      isRouteVisibleForPersona('ops_view', activePersona)
    ) {
      return {
        routeKey: 'ops_view',
        label: 'عملیات',
        icon: BarChart3,
        badge: undefined,
      };
    }

    // 8. Sales Orders (only if authorized and visible)
    if (canAccessRoute('sales_orders', activePersona) && isRouteVisibleForPersona('sales_orders', activePersona)) {
      return {
        routeKey: 'sales_orders',
        label: 'سفارشات',
        icon: ShoppingBag,
        badge: scopedCounts.orders > 0 ? scopedCounts.orders : undefined,
      };
    }

    // 9. Customers (Master data)
    if (canAccessRoute('customers', activePersona) && isRouteVisibleForPersona('customers', activePersona)) {
      return {
        routeKey: 'customers',
        label: 'مشتریان',
        icon: ShoppingBag,
        badge: undefined,
      };
    }

    // 10. Organization Users
    if (canAccessRoute('org_users', activePersona) && isRouteVisibleForPersona('org_users', activePersona)) {
      return {
        routeKey: 'org_users',
        label: 'کاربران',
        icon: CheckSquare,
        badge: undefined,
      };
    }

    return null;
  };

  const roleAction = getRoleAction();

  // Exactly 4 primary destinations (or 3 if no secondary role action exists)
  const navItems = [
    {
      routeKey: 'inbox',
      label: 'کارهای من',
      icon: Inbox,
      badge: scopedCounts.mine > 0 ? scopedCounts.mine : undefined,
      isAction: false,
    },
    ...(roleAction ? [{
      routeKey: roleAction.routeKey,
      label: roleAction.label,
      icon: roleAction.icon,
      badge: roleAction.badge,
      isAction: false,
    }] : []),
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
      className="mobile-navigation lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
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
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 min-w-0 min-h-[48px] rounded-xl transition-all cursor-pointer select-none ${
                isActive ? 'text-[#6558d9] font-bold bg-[#f0eeff]' : 'text-[#697082] hover:text-[#1a202c]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 transition-transform shrink-0" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -left-2 bg-[#c74b55] text-white text-caption font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-none">
                    {toPersianDigits(item.badge)}
                  </span>
                )}
              </div>

              <span className="text-caption mt-1 truncate max-w-[72px] leading-tight text-center block">
                {item.label}
              </span>

              {isActive && (
                <span className="w-4 h-0.5 bg-[#6558d9] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
