import { Capability, MockPersona } from '../types';

export type AppRouteKey =
  | 'inbox'
  | 'approvals'
  | 'notifications'
  | 'sales_orders'
  | 'customers'
  | 'pricing'
  | 'sales_calls'
  | 'supply_requests'
  | 'logistics'
  | 'inventory_receipts'
  | 'inventory_dispatch'
  | 'payment_requests'
  | 'visit_plans'
  | 'field_followups'
  | 'field_manager'
  | 'ops_view'
  | 'traceability'
  | 'integration_errors'
  | 'products'
  | 'product_categories'
  | 'product_units'
  | 'suppliers'
  | 'warehouses'
  | 'org_users'
  | 'org_responsibilities'
  | 'org_delegations'
  | 'access_matrix'
  | 'design_system_showcase';

export interface RouteDefinition {
  key: AppRouteKey;
  title: string;
  parentGroup: string;
  breadcrumbs: [string, string];
  requiredCapabilities: Capability[];
  description: string;
}

export const APP_ROUTES: Record<AppRouteKey, RouteDefinition> = {
  inbox: {
    key: 'inbox',
    title: 'کارتابل من (اقدام جاری)',
    parentGroup: 'خانه',
    breadcrumbs: ['خانه', 'کارتابل من'],
    requiredCapabilities: ['inbox.read'],
    description: 'مدیریت وظایف محوله، پاسخ به ۷ سؤال عملیاتی و ثبت اقدامات و موانع کاری',
  },
  approvals: {
    key: 'approvals',
    title: 'تأییدهای من',
    parentGroup: 'خانه',
    breadcrumbs: ['خانه', 'تأییدهای من'],
    requiredCapabilities: ['approvals.view'],
    description: 'کارتابل تصمیم‌گیری و تأیید/عودت اسناد تجاری، مالی و تدارکات بر اساس سقف اختیارات',
  },
  notifications: {
    key: 'notifications',
    title: 'اعلان‌ها و رویدادهای عملیاتی',
    parentGroup: 'خانه',
    breadcrumbs: ['خانه', 'اعلان‌ها و رویدادها'],
    requiredCapabilities: ['inbox.read'],
    description: 'رویدادهای ارجاع، بازگشت سند، ایجاد مانع عملیاتی و هشدارهای سامانه‌های واسط',
  },
  sales_orders: {
    key: 'sales_orders',
    title: 'سفارش‌های فروش',
    parentGroup: 'فروش',
    breadcrumbs: ['فروش', 'سفارش‌ها'],
    requiredCapabilities: ['sales.read'],
    description: 'ثبت سفارش چندمرحله‌ای، تبدیل بسته به تعداد و وزن خالص، سقف اعتبار و ارسال به تأیید بازرگانی',
  },
  customers: {
    key: 'customers',
    title: 'پرونده مشتریان و خریداران',
    parentGroup: 'فروش',
    breadcrumbs: ['فروش', 'مشتریان'],
    requiredCapabilities: ['sales.read'],
    description: 'اطلاعات حقوقی، رتبه اعتباری، آدرس‌های تخلیه، سابقه خرید و تضامین مالی مشتریان',
  },
  pricing: {
    key: 'pricing',
    title: 'قیمت‌های مرجع و نرخ مصوب',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'قیمت‌های مرجع'],
    requiredCapabilities: ['product.view', 'pricing.read', 'product.price_manage'],
    description: 'نرخ‌نامه مصوب محصولات روغنی، حداقل قیمت مجاز فروش (کف قیمت)، تاریخ‌های اعتبار و سوابق نرخ',
  },
  sales_calls: {
    key: 'sales_calls',
    title: 'درگاه ثبت دستی تماس و پیام (Manual Intake)',
    parentGroup: 'فروش',
    breadcrumbs: ['فروش', 'ثبت تماس و پیام'],
    requiredCapabilities: ['crm.write'],
    description: 'ساختاردهی پیام‌های غیررسمی تلفنی، واتساپ، تلگرام و پیامک و تبدیل به پرونده رسمی با ردیابی عطف',
  },
  supply_requests: {
    key: 'supply_requests',
    title: 'درخواست‌های تأمین کالا',
    parentGroup: 'تأمین و عملیات',
    breadcrumbs: ['تأمین و عملیات', 'درخواست تأمین'],
    requiredCapabilities: ['supply.read'],
    description: 'درخواست خرید روغن خام، ملزومات بسته‌بندی، تخصیص کارشناس خرید و جانشین (Fallback)',
  },
  logistics: {
    key: 'logistics',
    title: 'لجستیک و حمل‌ونقل ناوگان',
    parentGroup: 'تأمین و عملیات',
    breadcrumbs: ['تأمین و عملیات', 'لجستیک و حمل'],
    requiredCapabilities: ['supply.read'],
    description: 'هماهنگی راننده، نوع ناوگان، بارنامه بین‌شهری، کرایه حمل و ردیابی ناوگان کفی/تریلی',
  },
  inventory_receipts: {
    key: 'inventory_receipts',
    title: 'رسید انبار (ورود کالا)',
    parentGroup: 'تأمین و عملیات',
    breadcrumbs: ['تأمین و عملیات', 'رسید انبار'],
    requiredCapabilities: ['inventory.read'],
    description: 'تطبیق فیزیکی اقلام وارده با بارنامه، ثبت وزن باسکول، ثبت مغایرت یا آسیب‌دیدگی و تسویه کرایه',
  },
  inventory_dispatch: {
    key: 'inventory_dispatch',
    title: 'خروج انبار و تحویل سفارش',
    parentGroup: 'تأمین و عملیات',
    breadcrumbs: ['تأمین و عملیات', 'خروج انبار'],
    requiredCapabilities: ['inventory.read'],
    description: 'کنترل حواله فروش تأییدشده، بررسی موجودی انبارها، جمع‌آوری اقلام و ترخیص نهایی کالا',
  },
  payment_requests: {
    key: 'payment_requests',
    title: 'درخواست‌های پرداخت و تسویه مالی',
    parentGroup: 'مالی عملیاتی',
    breadcrumbs: ['مالی عملیاتی', 'درخواست‌های پرداخت'],
    requiredCapabilities: ['finance.read', 'finance.payment_request.create', 'sales.read', 'supply.read'],
    description: 'تسویه فاکتور شرکتی/شخصی، ماسک امنیتی شبا با لاگ افشا، تأیید مالی و اجرای دستی خارج از سیستم',
  },
  visit_plans: {
    key: 'visit_plans',
    title: 'برنامه ویزیت روزانه و مسیربندی',
    parentGroup: 'عملیات میدانی',
    breadcrumbs: ['عملیات میدانی', 'برنامه ویزیت'],
    requiredCapabilities: ['field.read'],
    description: 'نمای بهینه‌سازی‌شده موبایل، آغاز شیفت با پیام حفظ حریم خصوصی، مسیربندی و فهرست مشتریان',
  },
  field_followups: {
    key: 'field_followups',
    title: 'بازدید و پیگیری‌های میدانی',
    parentGroup: 'عملیات میدانی',
    breadcrumbs: ['عملیات میدانی', 'بازدید و پیگیری'],
    requiredCapabilities: ['field.read'],
    description: 'ثبت ورود/خروج، یادداشت صوتی، پیش‌نویس سفارش، ثبت فیش واریزی و همگام‌سازی آفلاین',
  },
  field_manager: {
    key: 'field_manager',
    title: 'دیده‌بان سرپرست فروش میدانی',
    parentGroup: 'عملیات میدانی',
    breadcrumbs: ['عملیات میدانی', 'دیده‌بان سرپرست'],
    requiredCapabilities: ['MANAGEMENT_VIEW'],
    description: 'پایش درصد تحقق برنامه، استثنائات فاقد نتیجه، پیگیری‌های معوق و خطاهای همگام‌سازی، بدون رصد خام مکانی',
  },
  ops_view: {
    key: 'ops_view',
    title: 'نمای عملیات و دیده‌بان گلوگاه‌ها',
    parentGroup: 'مدیریت',
    breadcrumbs: ['مدیریت', 'نمای عملیات و گلوگاه‌ها'],
    requiredCapabilities: ['MANAGEMENT_VIEW'],
    description: 'پایش تفکیکی سن پرونده‌ها، موانع عملیاتی، اولویت‌ها و دریل‌داون مستقیم به پرونده‌ها',
  },
  traceability: {
    key: 'traceability',
    title: 'ردگیری سرتاسری زنجیره (Traceability)',
    parentGroup: 'مدیریت',
    breadcrumbs: ['مدیریت', 'ردگیری سرتاسری زنجیره'],
    requiredCapabilities: ['MANAGEMENT_VIEW'],
    description: 'ردگیری فرآیندی سناریوی روغن خوراکی از تماس مشتری، سفارش، تأیید بازرگانی، تأمین، لجستیک و انبار تا پرداخت',
  },
  integration_errors: {
    key: 'integration_errors',
    title: 'خطاهای یکپارچه‌سازی سامانه‌ها',
    parentGroup: 'مدیریت',
    breadcrumbs: ['مدیریت', 'خطاهای یکپارچه‌سازی'],
    requiredCapabilities: ['MANAGEMENT_VIEW'],
    description: 'مانیتورینگ اتصالات به سامانه‌های مالی (پارسینا)، پایانه‌های پوز و توزین همراه با ارسال مجدد دستی',
  },
  products: {
    key: 'products',
    title: 'محصولات و کالاها',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'محصولات و کالاها'],
    requiredCapabilities: ['product.view'],
    description: 'کدینگ یکتای کالا، ضرایب تبدیل بسته‌بندی کارتن به بطری/قوطی، قیمت مصوب و واحد سنجش پایه',
  },
  product_categories: {
    key: 'product_categories',
    title: 'دسته‌بندی محصولات',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'دسته‌بندی محصولات'],
    requiredCapabilities: ['product.view'],
    description: 'دسته‌بندی‌های درختی روغن‌های خانوار، صنف و صنعت، ملزومات و تخصیص اقلام',
  },
  product_units: {
    key: 'product_units',
    title: 'واحدها و تبدیل واحد',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'واحدها و تبدیل واحد'],
    requiredCapabilities: ['product.view'],
    description: 'ماتریس واحدهای پایه، شمارشی و بسته‌بندی کارتن همراه با ضرایب تبدیل وزنی',
  },
  suppliers: {
    key: 'suppliers',
    title: 'تأمین‌کنندگان کالا و خدمات',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'تأمین‌کنندگان'],
    requiredCapabilities: ['supply.read'],
    description: 'مشخصات تأمین‌کنندگان مواد اولیه، رتبه کیفی، شرایط تسویه و شماره‌های تماس مستقیم',
  },
  warehouses: {
    key: 'warehouses',
    title: 'انبارها و سالن‌های نگهداری',
    parentGroup: 'اطلاعات پایه',
    breadcrumbs: ['اطلاعات پایه', 'انبارها و سالن‌ها'],
    requiredCapabilities: ['inventory.read'],
    description: 'مشخصات انبار مرکزی کهریزک، مراکز توزیع و سالن‌های نگهداری همراه با ظرفیت فیزیکی',
  },
  org_users: {
    key: 'org_users',
    title: 'کاربران و پرسنل سازمانی',
    parentGroup: 'سازمان و دسترسی',
    breadcrumbs: ['سازمان و دسترسی', 'کاربران و پرسنل'],
    requiredCapabilities: ['USER_MANAGE'],
    description: 'فهرست پرسنل، واحدهای اداری، پست‌های تصدی‌شده و سوابق احکام سازمانی',
  },
  org_responsibilities: {
    key: 'org_responsibilities',
    title: 'پست‌ها و ساختار مسئولیت‌ها',
    parentGroup: 'سازمان و دسترسی',
    breadcrumbs: ['سازمان و دسترسی', 'مسئولیت‌ها و پست‌ها'],
    requiredCapabilities: ['RESPONSIBILITY_MANAGE'],
    description: 'شرح وظایف و سقف اختیارات تأیید مالی/تجاری هر پست سازمانی در شرکت جوادیان',
  },
  org_delegations: {
    key: 'org_delegations',
    title: 'احکام تفویض و جانشینی',
    parentGroup: 'سازمان و دسترسی',
    breadcrumbs: ['سازمان و دسترسی', 'جانشینی و تفویض'],
    requiredCapabilities: ['DELEGATION_MANAGE'],
    description: 'تفویض رسمی مسئولیت‌ها، مدیریت جانشین‌های چندگانه و ثبت بازه اعتبار اختیارات',
  },
  access_matrix: {
    key: 'access_matrix',
    title: 'ماتریس دسترسی و مجوزها (RBAC)',
    parentGroup: 'سازمان و دسترسی',
    breadcrumbs: ['سازمان و دسترسی', 'مجوزها و دسترسی'],
    requiredCapabilities: ['USER_MANAGE'],
    description: 'نگاشت صریح قابلیت‌های سیستمی به نقش‌ها، تفکیک وظایف و جلوگیری از تداخل اختیارات',
  },
  design_system_showcase: {
    key: 'design_system_showcase',
    title: 'ویترین جامع اجزای دیزاین سیستم',
    parentGroup: 'دیزاین سیستم',
    breadcrumbs: ['دیزاین سیستم', 'ویترین اجزا'],
    requiredCapabilities: ['USER_MANAGE'],
    description: 'نمایش یکپارچه توکن‌های طراحی، تایپوگرافی، فرم‌ها، جداول، نشان‌ها و وضعیت‌های سیستم (مخصوص مدیر سیستم)',
  },
};

/**
 * Check whether a given persona is authorized to access a route
 */
export function canAccessRoute(routeKey: string, persona: MockPersona): boolean {
  const route = APP_ROUTES[routeKey as AppRouteKey];
  if (!route) return true;
  if (!route.requiredCapabilities || route.requiredCapabilities.length === 0) return true;
  return route.requiredCapabilities.some((cap) => persona.capabilities.includes(cap));
}
