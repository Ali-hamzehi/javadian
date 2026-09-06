import React from 'react';
import { MockPersona, Capability } from '../types';
import { mockRepository } from '../runtime/workflow';
import { ResponsiveTable } from '../components/design-system/ResponsiveTable';
import { Forbidden403, EmptyState } from '../components/design-system/SystemStates';
import { Button } from '../components/design-system/Button';
import { useToast } from '../components/design-system/ToastContext';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  MapPin,
  BarChart3,
  Database,
  ShieldCheck,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface RoutePlaceholderViewProps {
  routeKey: string;
  activePersona: MockPersona;
  onNavigateToInboxWithRecord: (recordId: string) => void;
  onSwitchPersonaRequested: () => void;
}

export const RoutePlaceholderView: React.FC<RoutePlaceholderViewProps> = ({
  routeKey,
  activePersona,
  onNavigateToInboxWithRecord,
  onSwitchPersonaRequested,
}) => {
  const { addToast } = useToast();

  // Define route metadata and required capabilities
  const getRouteMeta = () => {
    switch (routeKey) {
      case 'sales_orders':
        return {
          title: 'مدیریت سفارش‌های فروش و مشتریان',
          subtitle: 'فهرست قراردادها، حواله‌ها، سقف اعتباری و پیگیری تحویل کالا',
          requiredCaps: ['sales.read'] as Capability[],
          typeFilter: 'sales_order' as const,
          icon: <ShoppingBag className="w-5 h-5 text-primary-700" />,
        };
      case 'customers':
        return {
          title: 'پرونده مشتریان و طرف‌های حساب تجاری',
          subtitle: 'اطلاعات حقوقی، سقف اعتبار باز، سابقه خرید و تضامین معتبر',
          requiredCaps: ['sales.read'] as Capability[],
          icon: <ShoppingBag className="w-5 h-5 text-primary-700" />,
        };
      case 'pricing':
        return {
          title: 'نرخ‌نامه، قیمت‌ها و تخفیفات خاص',
          subtitle: 'لیست قیمت مصوب انواع روغن خوراکی خانوار و صنف و صنعت به همراه سقف تخفیف مجاز',
          requiredCaps: ['pricing.read'] as Capability[],
          icon: <ShoppingBag className="w-5 h-5 text-primary-700" />,
        };
      case 'sales_calls':
        return {
          title: 'ثبت تماس و پیام‌های بازرگانی (CRM)',
          subtitle: 'پیگیری تماس‌های روزانه خریداران، بنکداران و هماهنگی‌های تلفنی',
          requiredCaps: ['crm.write'] as Capability[],
          icon: <ShoppingBag className="w-5 h-5 text-primary-700" />,
        };
      case 'supply_requests':
        return {
          title: 'درخواست‌های تأمین و خرید کالا',
          subtitle: 'سفارشات خرید و تأمین روغن خوراکی، دانه‌های روغنی و ملزومات بسته‌بندی',
          requiredCaps: ['supply.read'] as Capability[],
          typeFilter: 'supply_request' as const,
          icon: <Truck className="w-5 h-5 text-amber-600" />,
        };
      case 'logistics':
        return {
          title: 'لجستیک، هماهنگی باربری و ترابری ناوگان',
          subtitle: 'ردیابی بارنامه‌های بین‌شهری، تأمین کامیون کفی و کنترل زمان‌بندی تحویل',
          requiredCaps: ['supply.read'] as Capability[],
          icon: <Truck className="w-5 h-5 text-amber-600" />,
        };
      case 'inventory_receipts':
        return {
          title: 'رسید ورود به انبار',
          subtitle: 'کنترل فیزیکی اقلام وارده، ثبت باسکول و گزارش عدم مغایرت',
          requiredCaps: ['inventory.read'] as Capability[],
          icon: <Truck className="w-5 h-5 text-emerald-600" />,
        };
      case 'inventory_dispatch':
        return {
          title: 'حواله‌های خروج انبار و بارگیری',
          subtitle: 'صدور برگ خروج، ثبت پالت‌ها و امضای تحویل‌گیرنده نهایی',
          requiredCaps: ['inventory.read'] as Capability[],
          typeFilter: 'inventory_dispatch' as const,
          icon: <Truck className="w-5 h-5 text-primary-700" />,
        };
      case 'payment_requests':
        return {
          title: 'درخواست‌های پرداخت و تسویه مالی',
          subtitle: 'صدور حواله پایا/ساتنا، کارمزد باربری، تسویه فاکتور تأمین‌کننده و پیش‌پرداخت',
          requiredCaps: ['finance.read'] as Capability[],
          typeFilter: 'payment_request' as const,
          icon: <CreditCard className="w-5 h-5 text-sky-600" />,
        };
      case 'visit_plans':
      case 'field_followups':
        return {
          title: 'برنامه ویزیت و ممیزی میدانی',
          subtitle: 'تقویم بازرسی نمایندگی‌ها، ارزیابی کیفیت انبارش و تطبیق موجودی میدانی',
          requiredCaps: ['field.read'] as Capability[],
          typeFilter: 'field_visit' as const,
          icon: <MapPin className="w-5 h-5 text-teal-600" />,
        };
      case 'ops_view':
        return {
          title: 'نمای متمرکز عملیات و مانیتورینگ گلوگاه‌ها',
          subtitle: 'دید یکپارچه وضعیت سفارشات، نرخ موانع فعال و زمان توقف پرونده‌ها',
          requiredCaps: ['ops_view', 'management.read'] as Capability[],
          icon: <BarChart3 className="w-5 h-5 text-primary-700" />,
        };
      case 'integration_errors':
        return {
          title: 'پایش و خطاهای یکپارچه‌سازی سامانه‌ها',
          subtitle: 'لاگ تبادل اطلاعات با سیستم حسابداری، سامانه مودیان و پیام‌رسان‌ها',
          requiredCaps: ['management.read'] as Capability[],
          icon: <BarChart3 className="w-5 h-5 text-rose-600" />,
        };
      case 'products':
      case 'suppliers':
      case 'warehouses':
        return {
          title: 'اطلاعات پایه: کالاها، انبارها و تأمین‌کنندگان',
          subtitle: 'کدینگ یکتای اقلام، سالن‌های انبار کهریزک و مشخصات طرف‌های قرارداد',
          requiredCaps: ['sales.read', 'supply.read', 'inventory.read'] as Capability[],
          icon: <Database className="w-5 h-5 text-slate-700" />,
        };
      case 'org_users':
      case 'org_responsibilities':
      case 'org_delegations':
      case 'access_matrix':
        return {
          title: 'سازمان، ساختار مسئولیت‌ها و احکام جانشینی',
          subtitle: 'مدیریت ماتریس دسترسی‌ها، تفویض جانشینی چندمسئولیتی و کارتابل‌ها',
          requiredCaps: ['org.read', 'access.read'] as Capability[],
          icon: <ShieldCheck className="w-5 h-5 text-primary-700" />,
        };
      default:
        return {
          title: 'بخش عملیاتی',
          subtitle: 'نمای اطلاعاتی سامانه عملیات جوادیان',
          requiredCaps: [] as Capability[],
          icon: <Database className="w-5 h-5 text-primary-700" />,
        };
    }
  };

  const meta = getRouteMeta();

  // Check capability
  const hasAccess =
    meta.requiredCaps.length === 0 ||
    meta.requiredCaps.some((c) => activePersona.capabilities.includes(c));

  if (!hasAccess) {
    return (
      <Forbidden403
        missingCapabilities={meta.requiredCaps}
        onSwitchPersona={onSwitchPersonaRequested}
      />
    );
  }

  // If specific records exist for this section
  const relevantRecords = meta.typeFilter
    ? mockRepository.getAllRecords().filter((r) => r.type === meta.typeFilter)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-slate-100 shrink-0">{meta.icon}</div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">{meta.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => addToast('اطلاعات این بخش به‌روزرسانی شد', { tone: 'info' })}
          >
            بروزرسانی
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => addToast('فرم ایجاد این بخش در فازهای بعدی متصل می‌شود', { tone: 'info' })}
          >
            ایجاد رکورد جدید
          </Button>
        </div>
      </div>

      {/* Content based on records */}
      {relevantRecords.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              پرونده‌های فعال در این بخش ({relevantRecords.length})
            </span>
            <span className="text-caption text-slate-500">جهت مشاهده ۷ سؤال روی هر ردیف کلیک کنید</span>
          </div>
          <ResponsiveTable
            records={relevantRecords}
            onSelectRecord={(rec) => onNavigateToInboxWithRecord(rec.id)}
          />
        </div>
      ) : (
        <EmptyState
          title={`نمای عملیاتی ${meta.title}`}
          description="داده‌های این بخش با سامانه جامع متصل و آماده است. می‌توانید از بخش کارتابل من پرونده‌های نیازمند اقدام فوری را بررسی نمایید."
          actionText="مشاهده در کارتابل من"
          onAction={() => onNavigateToInboxWithRecord('')}
        />
      )}
    </div>
  );
};
