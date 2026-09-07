import { MockPersona } from '../types';
import { MOCK_PERSONAS } from '../data/mockData';

export type DocumentedIdentityStatus = 'DOCUMENTED_PERSON' | 'DEMO_PLACEHOLDER';

export type PersonaCategory =
  | 'purchasing_logistics_warehouse' // عملیات خرید، لجستیک و انبار
  | 'sales_distribution'            // فروش و توزیع
  | 'finance_payments'               // مالی و پرداخت
  | 'management_hybrid';             // مدیریت و نقش‌های ترکیبی

export interface PersonaCategoryMeta {
  key: PersonaCategory;
  title: string;
  description: string;
  badge: string;
}

export const PERSONA_CATEGORIES: Record<PersonaCategory, PersonaCategoryMeta> = {
  purchasing_logistics_warehouse: {
    key: 'purchasing_logistics_warehouse',
    title: 'عملیات خرید، لجستیک و انبار',
    description: 'مدیریت ورود کالا، کاردکس انبار، هماهنگی حمل و داده‌های پایه کالا',
    badge: 'انبار و لجستیک',
  },
  sales_distribution: {
    key: 'sales_distribution',
    title: 'فروش و توزیع',
    description: 'فروش مویرگی، ویزیت میدانی، صدور پیش‌فاکتور و پیگیری مشتریان',
    badge: 'فروش',
  },
  finance_payments: {
    key: 'finance_payments',
    title: 'مالی و پرداخت',
    description: 'ثبت، بررسی مدارک، تأیید اسناد و اجرای تسویه دستورهای پرداخت',
    badge: 'مالی',
  },
  management_hybrid: {
    key: 'management_hybrid',
    title: 'مدیریت و نقش‌های ترکیبی',
    description: 'مدیریت عامل، تفویض اختیارات عملیاتی، جانشینی و کنترل سیستمی',
    badge: 'مدیریت',
  },
};

export interface DocumentBasedPersona extends MockPersona {
  displayName: string;
  documentStatus: DocumentedIdentityStatus;
  documentedStatus: DocumentedIdentityStatus;
  shortDisplayName: string;
  category: PersonaCategory;
  categoryTitle: string;
  documentedPosition: string;
  documentedResponsibility: string;
  activityScope: string;
  demoGoal: string; // یک جمله: «با این حساب چه چیزی را می‌توان دمو کرد؟»
  documentedEvidenceSource: string;
  isDocumentedPerson: boolean;
  isPlaceholder: boolean;
  paymentScope: {
    canCreate: boolean;
    allowedCategories: ('freight' | 'shipping' | 'worker_expense' | 'driver_expense' | 'supplier' | 'all')[];
    allowedRegion?: 'قم' | 'all';
    description: string;
    canApprove: boolean;
    canExecute: boolean;
  };
  warehouseScope: {
    canCreate: boolean;
    isPrimary: boolean;
    isFallback: boolean;
    fallbackReason?: string;
    description: string;
  };
  warehouseReceiptScope: {
    canCreate: boolean;
    isPrimary: boolean;
    isFallback: boolean;
    fallbackReason?: string;
    description: string;
  };
  managementScope: {
    isManager: boolean;
    hasDecisionDashboard: boolean;
    canApproveSales: boolean;
    canApprovePayments: boolean;
    canManageUsers: boolean;
    canManageResponsibilities: boolean;
    description: string;
  };
  allowedNavigation: string[];
  demoScenarios: string[];
  tbdNotes?: string[];
}

/**
 * Raw mapping of the 12 system persona IDs to their documented identities or demo placeholders.
 * All existing IDs are strictly preserved to maintain 100% data integrity with protected stores.
 */
export const DOCUMENT_BASED_PERSONAS_CONFIG: Record<
  string,
  Omit<DocumentBasedPersona, keyof MockPersona | 'displayName' | 'documentedStatus'> & {
    overrideName: string;
    overrideJobTitle: string;
    overrideDepartment: string;
    overrideBadgeNote: string;
  }
> = {
  // 1. Arash (Logistics & Purchasing Coordinator)
  'p-warehouse': {
    overrideName: 'آرش',
    overrideJobTitle: 'مسئول لجستیک و هماهنگی خرید',
    overrideDepartment: 'انبار و لجستیک کالا',
    overrideBadgeNote: 'ثبت معمول رسید انبار • پرداخت فقط برای حمل بار',
    shortDisplayName: 'آرش',
    documentStatus: 'DOCUMENTED_PERSON',
    isDocumentedPerson: true,
    isPlaceholder: false,
    category: 'purchasing_logistics_warehouse',
    categoryTitle: 'عملیات خرید، لجستیک و انبار',
    documentedPosition: 'مسئول لجستیک و هماهنگی خرید (نام‌خانوادگی نامشخص در اسناد)',
    documentedResponsibility: 'مسئول اصلی لجستیک، هماهنگ‌کننده خریدها، ثبت معمول رسید انبار، ایجاد پرداخت منحصراً برای هزینه حمل بار.',
    activityScope: 'لجستیک، هماهنگی خرید، ثبت معمول رسید انبار، ایجاد پرداخت فقط برای حمل',
    demoGoal: 'ثبت رسید انبار ورودی، هماهنگی خرید و ثبت پرداخت منحصراً برای هزینه حمل بار (رد پرداخت‌های متفرقه)',
    documentedEvidenceSource: 'Untitled document (منبع اولیه مستقیم کسب‌وکار) — مسئول اصلی لجستیک و هماهنگ‌کننده خرید',
    paymentScope: {
      canCreate: true,
      allowedCategories: ['freight', 'shipping'],
      description: 'منحصراً مجاز به ثبت هزینه حمل بار (بارنامه). ثبت سایر سرفصل‌های پرداخت مجاز نیست.',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: true,
      isPrimary: true,
      isFallback: false,
      description: 'ایجادکننده معمول و اولیه فرم رسید انبار بر اساس بارنامه و باسکول',
    },
    warehouseReceiptScope: {
      canCreate: true,
      isPrimary: true,
      isFallback: false,
      description: 'ایجادکننده معمول و اولیه فرم رسید انبار بر اساس بارنامه و باسکول',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'نقش اجرایی انبار و هماهنگی خرید بدون دسترسی مدیریتی',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'supply_requests',
      'logistics',
      'inventory_receipts',
      'inventory_dispatch',
      'payment_requests',
      'warehouses',
      'suppliers',
    ],
    demoScenarios: [
      'ثبت رسید ورود کالا به انبار بر اساس بارنامه و قبض باسکول (مسئول اصلی)',
      'هماهنگی خرید اقلام و ثبت نیاز تدارکاتی',
      'ثبت درخواست پرداخت منحصراً برای کرایه حمل بار',
      'کنترل منفی: مسدودسازی ثبت پرداخت برای تعمیرات یا سایر سرفصل‌ها',
    ],
    tbdNotes: [
      'حق تأیید رسید انبار، پرداخت یا سفارش فروش برای او در اسناد تأیید نشده است.',
      'سند، نام خانوادگی یا عنوان استخدامی رسمی دقیق او را مشخص نکرده است.',
    ],
  },

  // 2. Mr. Yousefi (Multi-responsibility & Operational Fallback)
  'p-multi-delegate': {
    overrideName: 'آقای یوسفی',
    overrideJobTitle: 'جانشین عملیاتی و رابط تأمین',
    overrideDepartment: 'مدیریت عملیات و تأمین',
    overrideBadgeNote: 'جانشین آرش در رسید انبار • ارتباط و پرداخت تأمین‌کننده',
    shortDisplayName: 'آقای یوسفی',
    documentStatus: 'DOCUMENTED_PERSON',
    isDocumentedPerson: true,
    isPlaceholder: false,
    category: 'management_hybrid',
    categoryTitle: 'مدیریت و نقش‌های ترکیبی',
    documentedPosition: 'جانشین عملیاتی و رابط تأمین‌کنندگان (عنوان رسمی دقیق نامشخص)',
    documentedResponsibility: 'فرد چندمسئولیتی و جانشین عملیاتی؛ در نبود آرش می‌تواند فرم رسید انبار را ثبت کند؛ با تأمین‌کنندگان در ارتباط است و گاهی پرداخت تأمین‌کننده ایجاد می‌کند.',
    activityScope: 'ثبت رسید انبار فقط در حالت جانشینی آرش؛ ارتباط با تأمین‌کننده؛ ایجاد برخی پرداخت‌های تأمین‌کننده',
    demoGoal: 'جانشینی آرش در ثبت رسید انبار در نبود مسئول اصلی، ارتباط با تأمین‌کنندگان و ثبت پرداخت تأمین بدون دسترسی سراسری',
    documentedEvidenceSource: 'Untitled document & Discovery Register — فرد چندمسئولیتی و جانشین عملیاتی',
    paymentScope: {
      canCreate: true,
      allowedCategories: ['supplier'],
      description: 'مجاز به ایجاد پرداخت فقط برای تأمین‌کنندگان طرف قرارداد کالا و مواد اولیه',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: true,
      isPrimary: false,
      isFallback: true,
      fallbackReason: 'ثبت در غیاب آرش (مسئول اصلی لجستیک)',
      description: 'ثبت فرم رسید انبار منحصراً در حالت جانشینی؛ ثبت آرش به عنوان مسئول اصلی و یوسفی به عنوان اقدام‌کننده واقعی',
    },
    warehouseReceiptScope: {
      canCreate: true,
      isPrimary: false,
      isFallback: true,
      fallbackReason: 'ثبت در غیاب آرش (مسئول اصلی لجستیک)',
      description: 'ثبت فرم رسید انبار منحصراً در حالت جانشینی؛ ثبت آرش به عنوان مسئول اصلی و یوسفی به عنوان اقدام‌کننده واقعی',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'جانشین عملیاتی و رابط تأمین با اختیارات مشخص نیابتی',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'supply_requests',
      'logistics',
      'inventory_receipts',
      'inventory_dispatch',
      'payment_requests',
      'suppliers',
      'warehouses',
    ],
    demoScenarios: [
      'ثبت رسید انبار در غیاب آرش به عنوان جانشین عملیاتی',
      'پیگیری نیازمندی‌های خرید و ارتباط با تأمین‌کنندگان روغن خام',
      'ثبت پرداخت برای تأمین‌کنندگان طرف قرارداد',
      'سوئیچ مسئولیت فعال از پست اصلی به احکام جانشینی',
    ],
    tbdNotes: [
      'دائمی یا موردی‌بودن جانشینی او در اسناد نامشخص است (TBD_DELEGATION_PERMANENCE).',
      'مدیر همه‌کاره، ادمین یا تأییدکننده سراسری نیست.',
    ],
  },

  // 3. Mr. Montazeri (CEO with Operational Capabilities)
  'p-ops-dir': {
    overrideName: 'آقای منتظری',
    overrideJobTitle: 'مدیرعامل',
    overrideDepartment: 'مدیریت عامل',
    overrideBadgeNote: 'مدیریت عامل • صدور خروج/پیش‌نویس فروش • رسید در نبود مسئول',
    shortDisplayName: 'آقای منتظری',
    documentStatus: 'DOCUMENTED_PERSON',
    isDocumentedPerson: true,
    isPlaceholder: false,
    category: 'management_hybrid',
    categoryTitle: 'مدیریت و نقش‌های ترکیبی',
    documentedPosition: 'مدیرعامل',
    documentedResponsibility: 'علاوه بر وظایف مدیریتی، در نبود مسئول اصلی می‌تواند فرم رسید انبار را ثبت کند؛ می‌تواند فرم خروج از انبار/پیش‌نویس فاکتور فروش را ایجاد کند؛ با تأمین‌کنندگان در ارتباط است و گاهی دستور پرداخت ایجاد می‌کند.',
    activityScope: 'ایجاد اسناد عملیاتی (رسید در نبود مسئول، خروج انبار/پیش‌نویس فروش، پرداخت تأمین‌کننده) بدون دسترسی نامحدود خودکار',
    demoGoal: 'مشاهده داشبورد کلان، ثبت عملیاتی خروج انبار/پیش‌نویس فروش و پرداخت تأمین بدون دورزدن خودکار مراحل تأیید',
    documentedEvidenceSource: 'Untitled document & Discovery Register — مدیرعامل با قابلیت‌های عملیاتی مستند',
    paymentScope: {
      canCreate: true,
      allowedCategories: ['supplier'],
      description: 'امکان ایجاد دستور پرداخت مرتبط با تأمین‌کنندگان کالا (بدون تأیید خودکار درخواست خود)',
      canApprove: false, // In evidence, approval chain is TBD; CEO is not automatic universal approver
      canExecute: false,
    },
    warehouseScope: {
      canCreate: true,
      isPrimary: false,
      isFallback: true,
      fallbackReason: 'ثبت اضطراری در نبود مسئول اصلی انبار',
      description: 'ثبت رسید انبار در غیاب مسئول اصلی با ممیزی کامل اقدام‌کننده واقعی',
    },
    warehouseReceiptScope: {
      canCreate: true,
      isPrimary: false,
      isFallback: true,
      fallbackReason: 'ثبت اضطراری در نبود مسئول اصلی انبار',
      description: 'ثبت رسید انبار در غیاب مسئول اصلی با ممیزی کامل اقدام‌کننده واقعی',
    },
    managementScope: {
      isManager: true,
      hasDecisionDashboard: true,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'مدیرعامل با نظارت کلان، صدور پیش‌نویس خروج/فروش و پرداخت تأمین بدون دورزدن تأییدها',
    },
    allowedNavigation: [
      'ops_view',
      'inbox',
      'approvals',
      'notifications',
      'traceability',
      'sales_orders',
      'customers',
      'pricing',
      'supply_requests',
      'logistics',
      'inventory_receipts',
      'inventory_dispatch',
      'payment_requests',
      'products',
      'suppliers',
      'warehouses',
    ],
    demoScenarios: [
      'پایش شاخص‌های کلان سازمان و گلوگاه‌های عملیاتی در دیده‌بان مدیریت',
      'صدور پیش‌نویس فاکتور فروش یا حواله خروج از انبار',
      'ثبت دستور پرداخت برای تأمین‌کننده بدون حق خودتأییدی',
      'ثبت اضطراری فرم ورود کالا به انبار در نبود مسئول اصلی',
    ],
    tbdNotes: [
      'مدیرعامل بودن به معنای انجام خودکار تمام عملیات یا تأیید همه درخواست‌ها نیست.',
      'مسیر و ترتیب تأییدهای دقیق هنوز در اسناد باز است (TBD_PAYMENT_APPROVAL_THRESHOLDS).',
    ],
  },

  // 4. Mr. Naderi (Regional Field Sales - Qom Province Scoped)
  'p-field-sales': {
    overrideName: 'آقای نادری',
    overrideJobTitle: 'مسئول فروش مویرگی استان قم',
    overrideDepartment: 'واحد فروش مویرگی و بازاریابی میدانی (قم)',
    overrideBadgeNote: 'فروش مویرگی قم • پرداخت فقط کارگر و راننده قم',
    shortDisplayName: 'آقای نادری',
    documentStatus: 'DOCUMENTED_PERSON',
    isDocumentedPerson: true,
    isPlaceholder: false,
    category: 'sales_distribution',
    categoryTitle: 'فروش و توزیع',
    documentedPosition: 'مسئول فروش مویرگی استان قم',
    documentedResponsibility: 'مسئول فروش مویرگی استان قم. فقط برای برخی هزینه‌های داخل شهر قم مانند هزینه کارگرها و راننده‌ها امکان ایجاد درخواست/دستور پرداخت دارد.',
    activityScope: 'فروش مویرگی استان قم؛ ایجاد پرداخت فقط برای هزینه‌های محلی قم مانند کارگر و راننده',
    demoGoal: 'ثبت ویزیت و سفارش در استان قم، ایجاد پرداخت منحصراً برای کارگر و راننده در قم (رد پرداخت خارج از قم یا سایر سرفصل‌ها)',
    documentedEvidenceSource: 'Discovery Register & Requirements Spec V1 — مسئول فروش مویرگی استان قم',
    paymentScope: {
      canCreate: true,
      allowedCategories: ['worker_expense', 'driver_expense'],
      allowedRegion: 'قم',
      description: 'منحصراً مجاز به ثبت هزینه‌های کارگری تخلیه و راننده داخل استان قم. ثبت پرداخت خارج از قم یا سرفصل‌های تأمین‌کننده اکیداً رد می‌شود.',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد صلاحیت عملیات انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد صلاحیت عملیات انبار',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'مسئول فروش مویرگی استان قم فاقد اختیارات مدیریتی یا تصویب است.',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'sales_orders',
      'customers',
      'sales_calls',
      'visit_plans',
      'field_followups',
      'payment_requests',
    ],
    demoScenarios: [
      'ثبت ویزیت و برنامه روزانه مشتریان استان قم',
      'ثبت سفارش و پیش‌فاکتور فروش مویرگی در قم',
      'ثبت پرداخت برای کارگر تخلیه یا راننده داخل استان قم',
      'کنترل منفی: رد پرداخت‌های خارج از استان قم یا سرفصل‌های تأمین‌کننده',
    ],
    tbdNotes: [
      'دسترسی عمومی پرداخت شرکت، تأیید پرداخت، مدیریت انبار یا مدیریت سازمان برای او تعریف نشده است.',
    ],
  },

  // 5. Sales Specialist (Demo Placeholder)
  'p-sales': {
    overrideName: 'کارشناس فروش — نقش نمونه',
    overrideJobTitle: 'کارشناس فروش (نقش نمونه)',
    overrideDepartment: 'واحد فروش و بازرگانی داخلی',
    overrideBadgeNote: 'ایجاد خروج انبار/پیش‌نویس فاکتور فروش • بدون دسترسی مالی',
    shortDisplayName: 'کارشناس فروش',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'sales_distribution',
    categoryTitle: 'فروش و توزیع',
    documentedPosition: 'کارشناس فروش (عنوان شغلی عمومی دمو)',
    documentedResponsibility: 'افراد فعال در سطح فروش می‌توانند فرم خروج از انبار/پیش‌نویس فاکتور فروش را ایجاد کنند. بدون اختیار مدیریتی یا مالی عمومی.',
    activityScope: 'ایجاد خروج انبار/پیش‌نویس فاکتور فروش؛ بدون اختیار مدیریتی یا مالی عمومی',
    demoGoal: 'ثبت سفارش فروش، صدور پیش‌فاکتور، ایجاد پیش‌نویس خروج کالا و پیگیری در کارتابل «برای پیگیری»',
    documentedEvidenceSource: 'تعریف‌شده در چارت سازمانی — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد مجوز ایجاد پرداخت مالی شرکتی یا شخصی',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد مجوز ثبت رسید انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد مجوز ثبت رسید انبار',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'کارشناس فروش فاقد صلاحیت تصویب یا مدیریت است.',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'sales_orders',
      'customers',
      'sales_calls',
      'inventory_dispatch',
    ],
    demoScenarios: [
      'ثبت سفارش فروش جدید و صدور پیش‌فاکتور بر اساس نرخ مصوب',
      'ثبت سفارش استثنایی زیر کف قیمت و مشاهده برچسب نیازمند تأیید نرخ',
      'منع خودتأییدی: عدم امکان تأیید سفارش ثبت‌شده توسط خود کاربر',
      'ایجاد پیش‌نویس حواله خروج از انبار',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «علیرضا تهرانی»',
    ],
  },

  // 6. Finance Specialist (Demo Placeholder)
  'p-fin-spec': {
    overrideName: 'کارشناس مالی — نقش نمونه',
    overrideJobTitle: 'کارشناس مالی (نقش نمونه)',
    overrideDepartment: 'امور مالی و حسابداری',
    overrideBadgeNote: 'ایجاد و رسیدگی اولیه پرداخت‌های شرکتی • بدون اختیار تسویه نهایی',
    shortDisplayName: 'کارشناس مالی',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'finance_payments',
    categoryTitle: 'مالی و پرداخت',
    documentedPosition: 'کارشناس مالی (عنوان نقش دمو)',
    documentedResponsibility: 'ایجادکننده اصلی اکثر دستورهای پرداخت شرکت. بررسی اولیه مدارک، ثبت درخواست پرداخت شرکتی و کنترل ضمائم.',
    activityScope: 'ایجاد و رسیدگی اولیه بیشتر پرداخت‌های شرکت در محدوده موردنیاز پروتوتایپ',
    demoGoal: 'ثبت و پیگیری دستورهای پرداخت شرکتی و کنترل اسناد، با تفکیک دقیق از مرحله تأیید و تسویه بانکی',
    documentedEvidenceSource: 'تعریف‌شده در چارت سازمانی — نقش نمونه',
    paymentScope: {
      canCreate: true,
      allowedCategories: ['supplier', 'freight', 'worker_expense', 'driver_expense', 'all'],
      description: 'ثبت اولیه کلیه سرفصل‌های مجاز پرداخت شرکتی و ارجاع به مرحله بررسی و تأیید',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد عملیات انبارداری فیزیکی',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد عملیات انبارداری فیزیکی',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'کارشناس مالی فاقد اختیار تصویب نهایی یا تسویه بانکی است.',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'payment_requests',
    ],
    demoScenarios: [
      'ثبت اولیه دستور پرداخت شرکتی و پیوست اسناد مثبته',
      'بررسی اولیه بارنامه‌ها و پیش‌فاکتورهای تأمین‌کنندگان',
      'رعایت تفکیک وظایف: عدم امکان تأیید اسناد یا تسویه دستی',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «پروانه صالحی»',
    ],
  },

  // 7. Finance Approver / Director (Demo Placeholder)
  'p-fin-dir': {
    overrideName: 'تأییدکننده مالی — نقش نمونه',
    overrideJobTitle: 'تأییدکننده مالی (نقش نمونه)',
    overrideDepartment: 'مدیریت امور مالی و خزانه‌داری',
    overrideBadgeNote: 'بررسی و تأیید اسناد پرداخت • اجرای تسویه خزانه‌داری',
    shortDisplayName: 'تأییدکننده مالی',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'finance_payments',
    categoryTitle: 'مالی و پرداخت',
    documentedPosition: 'تأییدکننده مالی و خزانه‌داری (عنوان نقش دمو)',
    documentedResponsibility: 'بررسی و تأیید اسناد پرداخت، تصمیم‌گیری در کارتابل «تصمیم‌های من»، و ثبت شواهد تسویه واقعی (شماره پیگیری و فیش بانکی).',
    activityScope: 'بررسی و تأیید اسناد مالی و ارجاع به خزانه‌داری دمو؛ عدم انتساب به شخص واقعی',
    demoGoal: 'بررسی مستقل کارتابل پرداخت‌ها، تأیید یا عودت اسناد و ثبت تسویه دستی بدون ایجاد پرداخت‌های متفرقه',
    documentedEvidenceSource: 'تأییدکننده مالی جهت تکمیل گردش‌کار — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'تمرکز بر بررسی و تأیید پرداخت؛ مجاز به ایجاد پرداخت‌های متفرقه خارج از روال نیست',
      canApprove: true,
      canExecute: true,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد عملیات انبارداری فیزیکی',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد عملیات انبارداری فیزیکی',
    },
    managementScope: {
      isManager: true,
      hasDecisionDashboard: true,
      canApproveSales: false,
      canApprovePayments: true,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'تأییدکننده اسناد پرداخت و مجری تسویه خزانه‌داری',
    },
    allowedNavigation: [
      'inbox',
      'approvals',
      'notifications',
      'payment_requests',
    ],
    demoScenarios: [
      'بررسی درخواست‌های پرداخت در کارتابل تصمیم‌های در انتظار',
      'تصمیم‌گیری تأیید، عودت برای اصلاح یا رد پرداخت',
      'ثبت اطلاعات تسویه بانکی (شماره پیگیری و تاریخ واریز)',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «دکتر فرزاد شریفی»',
      'آستانه‌های دقیق مبالغ تصویب در اسناد باز است (TBD_PAYMENT_APPROVAL_THRESHOLDS).',
    ],
  },

  // 8. Warehouse Staff (Demo Placeholder)
  'p-ordinary': {
    overrideName: 'مسئول انبار — نقش نمونه',
    overrideJobTitle: 'کارشناس عملیات انبار (نقش نمونه)',
    overrideDepartment: 'انبار و لجستیک کالا',
    overrideBadgeNote: 'مشاهده کاردکس و موجودی • کارهای روزمره انبار',
    shortDisplayName: 'مسئول انبار',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'purchasing_logistics_warehouse',
    categoryTitle: 'عملیات خرید، لجستیک و انبار',
    documentedPosition: 'کارشناس عملیات انبار (نقش نمونه)',
    documentedResponsibility: 'عملیات انبار لازم برای سناریوی دمو؛ کاردکس و موجودی کالا؛ بدون دسترسی مالی یا مدیریتی.',
    activityScope: 'عملیات انبار لازم برای سناریوی دمو؛ نام شخص واقعی فرض نشود',
    demoGoal: 'مشاهده کارتابل ساده کارمندی (برای انجام و برای پیگیری)، کنترل موجودی اقلام بدون شلوغی مدیریتی',
    documentedEvidenceSource: 'تعریف‌شده در چارت سازمانی انبار — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد دسترسی مالی',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'صرفاً مشاهده کاردکس و کارتابل انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'صرفاً مشاهده کاردکس و کارتابل انبار',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'کارشناس عملیات انبار فاقد اختیارات مدیریتی یا مالی است.',
    },
    allowedNavigation: [
      'inbox',
      'notifications',
      'warehouses',
    ],
    demoScenarios: [
      'مشاهده کاردکس و موجودی انبارها',
      'انجام امور روزمره و گردش فیزیکی کالاها',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «رضا میرزایی»',
    ],
  },

  // 9. Commercial Approver (Demo Placeholder)
  'p-comm-approver': {
    overrideName: 'تأییدکننده بازرگانی — نقش نمونه',
    overrideJobTitle: 'تأییدکننده بازرگانی (نقش نمونه)',
    overrideDepartment: 'معاونت بازرگانی',
    overrideBadgeNote: 'تأیید مستقل سفارش‌های فروش • رعایت تفکیک وظایف (SoD)',
    shortDisplayName: 'تأییدکننده بازرگانی',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'management_hybrid',
    categoryTitle: 'مدیریت و نقش‌های ترکیبی',
    documentedPosition: 'تأییدکننده بازرگانی (نقش تفکیک وظایف دمو)',
    documentedResponsibility: 'بررسی و تأیید مستقل سفارش‌های فروش ثبت‌شده توسط فروشندگان؛ بررسی موارد دارای مغایرت قیمت یا تخفیف خارج از ضابطه.',
    activityScope: 'بررسی و تأیید مستقل سفارش‌های فروش؛ بدون ایجاد سفارش شخصی و بدون نقض تفکیک وظایف',
    demoGoal: 'بررسی کارتابل «تصمیم‌های من» برای سفارش‌های فروش ثبت‌شده و اعمال تصمیم مستقل (تأیید، عودت یا رد)',
    documentedEvidenceSource: 'تأییدکننده بازرگانی برای تفکیک وظایف — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد صلاحیت ثبت پرداخت',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد صلاحیت عملیات انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد صلاحیت عملیات انبار',
    },
    managementScope: {
      isManager: true,
      hasDecisionDashboard: true,
      canApproveSales: true,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'بررسی و تصویب مستقل سفارش‌های فروش و تخفیف‌های تجاری',
    },
    allowedNavigation: [
      'inbox',
      'approvals',
      'notifications',
      'sales_orders',
      'customers',
      'pricing',
    ],
    demoScenarios: [
      'بررسی سفارش‌های زیر قیمت مصوب در کارتابل تصمیم‌های در انتظار',
      'تصویب یا رد مستقل تخفیف‌های تجاری بر اساس تفکیک وظایف',
      'کنترل مغایرت‌های قیمت و اعتبارسنجی خریداران',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «سهراب جوادیان»',
    ],
  },

  // 10. System Administrator (Demo Placeholder)
  'p-admin-ops': {
    overrideName: 'مدیر سیستم — نقش نمونه',
    overrideJobTitle: 'راهبر سامانه (نقش نمونه)',
    overrideDepartment: 'مدیریت عملیات و امنیت فناوری',
    overrideBadgeNote: 'پیکربندی دسترسی‌ها • ساختار نقش‌ها و تفویض',
    shortDisplayName: 'مدیر سیستم',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'management_hybrid',
    categoryTitle: 'مدیریت و نقش‌های ترکیبی',
    documentedPosition: 'راهبر سامانه و فناوری اطلاعات (نقش نمونه)',
    documentedResponsibility: 'پیکربندی ماتریس دسترسی، کنترل کاربران، تعریف چارچوب‌های سازمانی و انتساب وظایف سیستمی.',
    activityScope: 'ساختار دسترسی و تنظیمات سیستمی؛ بدون اقدام در عملیات تجاری یا پرداخت مالی',
    demoGoal: 'مدیریت کاربران، مشاهده ساختار تفکیک وظایف، تنظیم احکام جانشینی بدون ایجاد اسناد خرید یا فروش',
    documentedEvidenceSource: 'نقش مدیریت سامانه — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد دسترسی به ایجاد اسناد پرداخت مالی',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد ثبت فیزیکی رسید انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد ثبت فیزیکی رسید انبار',
    },
    managementScope: {
      isManager: true,
      hasDecisionDashboard: true,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: true,
      canManageResponsibilities: true,
      description: 'راهبری سامانه، ماتریس دسترسی RBAC، مدیریت کاربران و احکام تفویض',
    },
    allowedNavigation: [
      'org_users',
      'access_matrix',
      'org_responsibilities',
      'org_delegations',
      'inbox',
      'notifications',
      'design_system_showcase',
    ],
    demoScenarios: [
      'پیکربندی کاربران و ماتریس دسترسی RBAC',
      'تنظیم احکام جانشینی و تفویض مسئولیت',
      'مشاهده ویترین اجزای دیزاین سیستم',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «مهندس آرش نیازی»',
    ],
  },

  // 11. Master Data Manager (Demo Placeholder)
  'p-master-data': {
    overrideName: 'مسئول اطلاعات پایه — نقش نمونه',
    overrideJobTitle: 'مدیریت کاتالوگ و نرخ پایه (نقش نمونه)',
    overrideDepartment: 'مدیریت زنجیره تأمین و اطلاعات پایه',
    overrideBadgeNote: 'کاتالوگ روغن خوراکی • نرخ‌های مصوب و اوزان',
    shortDisplayName: 'مسئول اطلاعات پایه',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'purchasing_logistics_warehouse',
    categoryTitle: 'عملیات خرید، لجستیک و انبار',
    documentedPosition: 'مدیریت اطلاعات پایه و کاتالوگ محصولات (نقش نمونه)',
    documentedResponsibility: 'تعریف و بروزرسانی کاتالوگ اقلام روغن خوراکی، اوزان بسته‌بندی، نرخ‌های مصوب فروش و کدهای کالا.',
    activityScope: 'کاتالوگ کالاها، اوزان و قیمت‌های پایه مصوب؛ بدون عملیات خرید یا فروش روزمره',
    demoGoal: 'مشاهده و تنظیم اقلام کاتالوگ روغن خوراکی، ضرایب کارتن و بطری و نرخ پایه فروش',
    documentedEvidenceSource: 'نقش مدیریت اطلاعات پایه — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد عملیات مالی',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'صرفاً تعریف کدهای اقلام کالا',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'صرفاً تعریف کدهای اقلام کالا',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'مدیریت اطلاعات پایه و کاتالوگ بدون اختیارات مدیریتی یا مالی',
    },
    allowedNavigation: [
      'products',
      'product_categories',
      'product_units',
      'pricing',
      'inbox',
      'notifications',
    ],
    demoScenarios: [
      'تعریف اقلام روغن خوراکی و ضرایب بسته‌بندی',
      'تنظیم نرخ پایه و حداقل قیمت مصوب فروش',
    ],
    tbdNotes: [
      'جایگزین نام نامستند «مهندس نیما شایان»',
    ],
  },

  // 12. No Access / Guest (Demo Placeholder)
  'p-no-access': {
    overrideName: 'کارآموز مهمان — نقش نمونه',
    overrideJobTitle: 'حساب بدون دسترسی (نقش نمونه)',
    overrideDepartment: 'دوره کارآموزی تابستانه',
    overrideBadgeNote: 'آزمون کنترل منفی دسترسی (صفحه ۴۰۳)',
    shortDisplayName: 'کارآموز مهمان',
    documentStatus: 'DEMO_PLACEHOLDER',
    isDocumentedPerson: false,
    isPlaceholder: true,
    category: 'purchasing_logistics_warehouse',
    categoryTitle: 'عملیات خرید، لجستیک و انبار',
    documentedPosition: 'کارآموز مهمان (نقش نمونه بدون مجوز)',
    documentedResponsibility: 'فاقد هرگونه دسترسی، مجوز یا صلاحیت در سامانه. صرفاً جهت تست سناریوی امنیتی ۴۰۳ و اعتبارسنجی عدم نشت داده.',
    activityScope: 'تست سناریوی ۴۰۳ و عدم مجوز؛ فاقد هرگونه دسترسی سازمانی',
    demoGoal: 'مشاهده صفحه خطای عدم دسترسی (۴۰۳) و اطمینان از مسدود بودن دسترسی‌ها و عدم نشت اطلاعات',
    documentedEvidenceSource: 'حساب کنترل منفی دسترسی — نقش نمونه',
    paymentScope: {
      canCreate: false,
      allowedCategories: [],
      description: 'فاقد هرگونه مجوز مالی',
      canApprove: false,
      canExecute: false,
    },
    warehouseScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد دسترسی به انبار',
    },
    warehouseReceiptScope: {
      canCreate: false,
      isPrimary: false,
      isFallback: false,
      description: 'فاقد دسترسی به انبار',
    },
    managementScope: {
      isManager: false,
      hasDecisionDashboard: false,
      canApproveSales: false,
      canApprovePayments: false,
      canManageUsers: false,
      canManageResponsibilities: false,
      description: 'فاقد هرگونه دسترسی مدیریتی',
    },
    allowedNavigation: [],
    demoScenarios: [
      'ورود به سامانه و مواجهه با صفحه خطای ۴۰۳',
      'اطمینان از مسدود بودن دسترسی‌ها و عدم نشت اطلاعات',
      'آزمون کنترل منفی بدون سوئیچ خودکار به نقش دیگر',
    ],
    tbdNotes: [
      'حساب بدون دسترسی جهت بررسی امنیت و رفتار خطا',
    ],
  },
};

/**
 * Decorates an existing MockPersona with verified document-based identity and scope information.
 */
export function adaptPersona(persona: MockPersona): DocumentBasedPersona {
  const cfg = DOCUMENT_BASED_PERSONAS_CONFIG[persona.id];
  if (!cfg) {
    // Fallback if unknown persona id
    return {
      ...persona,
      displayName: persona.name,
      documentStatus: 'DEMO_PLACEHOLDER',
      documentedStatus: 'DEMO_PLACEHOLDER',
      shortDisplayName: persona.name,
      isDocumentedPerson: false,
      isPlaceholder: true,
      category: 'purchasing_logistics_warehouse',
      categoryTitle: 'عملیات خرید، لجستیک و انبار',
      documentedPosition: persona.jobTitle,
      documentedResponsibility: persona.department,
      activityScope: persona.jobTitle,
      demoGoal: `ارزیابی نقش ${persona.name}`,
      documentedEvidenceSource: 'منبع سند نامشخص — حساب آزمایشی',
      paymentScope: {
        canCreate: false,
        allowedCategories: [],
        description: 'فاقد دسترسی تأییدشده',
        canApprove: false,
        canExecute: false,
      },
      warehouseScope: {
        canCreate: false,
        isPrimary: false,
        isFallback: false,
        description: 'فاقد دسترسی',
      },
      warehouseReceiptScope: {
        canCreate: false,
        isPrimary: false,
        isFallback: false,
        description: 'فاقد دسترسی',
      },
      managementScope: {
        isManager: false,
        hasDecisionDashboard: false,
        canApproveSales: false,
        canApprovePayments: false,
        canManageUsers: false,
        canManageResponsibilities: false,
        description: 'فاقد دسترسی',
      },
      allowedNavigation: [],
      demoScenarios: [],
    };
  }

  return {
    ...persona,
    name: cfg.overrideName,
    displayName: cfg.overrideName,
    jobTitle: cfg.overrideJobTitle,
    department: cfg.overrideDepartment,
    badgeNote: cfg.overrideBadgeNote,
    documentedStatus: cfg.documentStatus,
    warehouseScope: cfg.warehouseScope,
    managementScope: cfg.managementScope,
    allowedNavigation: cfg.allowedNavigation,
    demoScenarios: cfg.demoScenarios,
    ...cfg,
  };
}

/**
 * Returns all mock personas adapted to document-based reality, maintaining original IDs.
 */
export function getDocumentBasedPersonas(): DocumentBasedPersona[] {
  return MOCK_PERSONAS.map(adaptPersona);
}

/**
 * Get a specific persona by ID with document enrichment.
 */
export function getDocumentBasedPersonaById(id: string): DocumentBasedPersona | undefined {
  const found = MOCK_PERSONAS.find((p) => p.id === id);
  if (!found) return undefined;
  return adaptPersona(found);
}

/**
 * Returns personas grouped by the 4 required business categories.
 */
export function getPersonasByCategory(): Record<PersonaCategory, DocumentBasedPersona[]> {
  const all = getDocumentBasedPersonas();
  const result: Record<PersonaCategory, DocumentBasedPersona[]> = {
    purchasing_logistics_warehouse: [],
    sales_distribution: [],
    finance_payments: [],
    management_hybrid: [],
  };

  for (const p of all) {
    if (result[p.category]) {
      result[p.category].push(p);
    }
  }

  return result;
}


/**
 * Validates warehouse receipt creation action and returns appropriate role type.
 * Enforces:
 * - Arash: primary creator.
 * - Yousefi: fallback creator (acting in absence of Arash).
 * - Montazeri: fallback creator (acting in absence of primary responsible).
 * - Others: denied.
 */
export interface WarehouseReceiptValidationResult {
  allowed: boolean;
  roleType: 'primary' | 'fallback' | 'denied';
  isPrimary: boolean;
  isFallback: boolean;
  actorAuditName: string;
  primaryResponsibleName: string;
  reason?: string;
}

export function validateWarehouseReceiptAction(
  personaId: string,
  isFallbackScenario: boolean = false
): WarehouseReceiptValidationResult {
  const persona = getDocumentBasedPersonaById(personaId);
  if (!persona) {
    return {
      allowed: false,
      roleType: 'denied',
      isPrimary: false,
      isFallback: false,
      actorAuditName: 'نامشخص',
      primaryResponsibleName: 'آرش',
      reason: 'کاربر نامعتبر است.',
    };
  }

  if (personaId === 'p-warehouse') {
    return {
      allowed: true,
      roleType: 'primary',
      isPrimary: true,
      isFallback: false,
      actorAuditName: 'آرش',
      primaryResponsibleName: 'آرش',
    };
  }

  if (personaId === 'p-multi-delegate') {
    return {
      allowed: true,
      roleType: 'fallback',
      isPrimary: false,
      isFallback: true,
      actorAuditName: 'آقای یوسفی (جانشین عملیاتی)',
      primaryResponsibleName: 'آرش (مسئول اصلی لجستیک)',
      reason: 'ثبت در حالت جانشینی در غیاب آرش (مسئول اصلی)',
    };
  }

  if (personaId === 'p-ops-dir') {
    return {
      allowed: true,
      roleType: 'fallback',
      isPrimary: false,
      isFallback: true,
      actorAuditName: 'آقای منتظری (مدیرعامل)',
      primaryResponsibleName: 'آرش (مسئول اصلی لجستیک)',
      reason: 'ثبت عملیاتی در نبود مسئول اصلی انبار',
    };
  }

  return {
    allowed: false,
    roleType: 'denied',
    isPrimary: false,
    isFallback: false,
    actorAuditName: persona.name,
    primaryResponsibleName: 'آرش',
    reason: 'این حساب در اسناد کسب‌وکار صلاحیت ایجاد فرم رسید انبار را ندارد.',
  };
}

export interface PaymentCreationValidationResult {
  valid: boolean;
  allowed: boolean;
  reason?: string;
}

/**
 * Validates whether a given persona is authorized to create a payment request
 * for the specified category and region.
 */
export function validatePaymentCreationScope(
  personaId: string,
  category: string,
  cityOrRegion?: string
): PaymentCreationValidationResult {
  const normCategory = (category || '').toLowerCase();
  const normCity = (cityOrRegion || '').trim();

  // 1. Arash: logistics coordinator - ONLY freight / حمل بار
  if (personaId === 'p-warehouse') {
    const isFreight =
      normCategory.includes('freight') ||
      normCategory.includes('حمل') ||
      normCategory.includes('باربری');
    if (isFreight) {
      return { valid: true, allowed: true };
    }
    return {
      valid: false,
      allowed: false,
      reason: 'طبق ضوابط سازمانی، آرش منحصراً مجاز به ایجاد پرداخت برای هزینه حمل بار است.',
    };
  }

  // 2. Mr. Naderi: field sales Qom - strictly worker/driver expenses within Qom
  if (personaId === 'p-field-sales') {
    const isQom = !normCity || normCity.includes('قم') || normCity.toLowerCase().includes('qom');
    if (!isQom) {
      return {
        valid: false,
        allowed: false,
        reason: 'حوزه مسئولیت آقای نادری منحصراً استان قم است و امکان ثبت پرداخت خارج از قم را ندارد.',
      };
    }
    const isWorkerOrDriver =
      normCategory.includes('worker') ||
      normCategory.includes('driver') ||
      normCategory.includes('کارگر') ||
      normCategory.includes('راننده');
    if (isWorkerOrDriver) {
      return { valid: true, allowed: true };
    }
    return {
      valid: false,
      allowed: false,
      reason: 'آقای نادری فقط برای هزینه‌های کارگر و راننده در قم مجاز به ایجاد پرداخت است.',
    };
  }

  // 3. Mr. Yousefi: supplier payments
  if (personaId === 'p-multi-delegate') {
    const isSupplier =
      normCategory.includes('supplier') ||
      normCategory.includes('raw_material') ||
      normCategory.includes('packaging') ||
      normCategory.includes('تأمین');
    if (isSupplier) {
      return { valid: true, allowed: true };
    }
    return {
      valid: false,
      allowed: false,
      reason: 'آقای یوسفی فقط برای موارد مرتبط با تأمین‌کنندگان کالا مجاز به ایجاد پرداخت است.',
    };
  }

  // 4. Mr. Montazeri: CEO - supplier payments
  if (personaId === 'p-ops-dir') {
    const isSupplier =
      normCategory.includes('supplier') ||
      normCategory.includes('raw_material') ||
      normCategory.includes('تأمین');
    if (isSupplier) {
      return { valid: true, allowed: true };
    }
    return {
      valid: false,
      allowed: false,
      reason: 'مدیرعامل در سرفصل‌های تأمین‌کنندگان مجاز به ثبت دستور پرداخت است.',
    };
  }

  // 5. Finance specialist placeholder: general company payments
  if (personaId === 'p-fin-spec') {
    return { valid: true, allowed: true };
  }

  // 6. Finance approver placeholder: review/approve only, cannot create (SoD)
  if (personaId === 'p-fin-dir') {
    return {
      valid: false,
      allowed: false,
      reason: 'تأییدکننده مالی جهت رعایت تفکیک وظایف درخواست پرداخت ثبت نمی‌کند.',
    };
  }

  // All other personas (e.g. sales specialist): not permitted
  return {
    valid: false,
    allowed: false,
    reason: 'این حساب سازمانی صلاحیت ثبت پرداخت مالی ندارد.',
  };
}


/**
 * Dynamically resolves the payment request scope and permissions strictly matching
 * documented reality for the 12 demo personas.
 */
export function getDocumentPersonaPaymentScope(persona: MockPersona): import('../data/mockPaymentConfig').PersonaPaymentScope {
  const pId = persona.id;

  if (pId === 'p-warehouse') {
    return {
      canCreate: true,
      allowedCategories: ['freight'],
      allowedContexts: ['company'],
      scopeTitle: 'آرش — مسئول لجستیک و هماهنگی خرید',
      scopeBadgeText: 'محدود به کرایه حمل بارنامه',
      isRestricted: true,
      restrictionReason: 'طبق ضوابط سازمانی، آرش فقط برای «هزینه حمل بار» مجاز به ایجاد پرداخت است و امکان ثبت پرداخت‌های دیگر (مانند تأمین‌کننده یا دستمزد) را ندارد.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-field-sales') {
    return {
      canCreate: true,
      allowedCategories: ['worker_expense', 'driver_expense'],
      allowedContexts: ['personal'],
      scopeTitle: 'آقای نادری — مسئول فروش مویرگی استان قم',
      scopeBadgeText: 'محدود به کارگر و راننده استان قم',
      isRestricted: true,
      restrictionReason: 'طبق ضوابط سازمانی، آقای نادری فقط مجاز به ایجاد پرداخت برای هزینه‌های داخل شهر قم مانند کارگر و راننده است.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-sales') {
    return {
      canCreate: false,
      allowedCategories: [],
      allowedContexts: [],
      scopeTitle: 'کارشناس فروش (نقش نمونه)',
      scopeBadgeText: 'فاقد دسترسی پرداخت',
      isRestricted: true,
      restrictionReason: 'طبق ضوابط سازمانی، کارشناس فروش فاقد اختیار ایجاد درخواست پرداخت مالی است.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-multi-delegate') {
    return {
      canCreate: true,
      allowedCategories: ['supplier'],
      allowedContexts: ['company'],
      scopeTitle: 'آقای یوسفی — جانشین عملیاتی و رابط تأمین',
      scopeBadgeText: 'محدود به تأمین‌کنندگان کالا',
      isRestricted: true,
      restrictionReason: 'طبق ضوابط سازمانی، آقای یوسفی منحصراً مجاز به ایجاد پرداخت برای تأمین‌کنندگان کالا است.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-ops-dir') {
    return {
      canCreate: true,
      allowedCategories: ['supplier'],
      allowedContexts: ['company'],
      scopeTitle: 'آقای منتظری — مدیرعامل',
      scopeBadgeText: 'پرداخت تأمین‌کنندگان کالا',
      isRestricted: true,
      restrictionReason: 'مدیرعامل امکان صدور دستور پرداخت برای تأمین‌کنندگان کالا را دارد، اما فاقد حق خودتأییدی یا دورزدن مراحل مالی است.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: true,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-fin-spec') {
    return {
      canCreate: true,
      allowedCategories: ['supplier', 'freight', 'worker_expense', 'driver_expense', 'finance_tax', 'operational_expense'],
      allowedContexts: ['company', 'personal'],
      scopeTitle: 'کارشناس مالی (نقش نمونه)',
      scopeBadgeText: 'ثبت عمومی — کلیه سرفصل‌های شرکتی',
      isRestricted: false,
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: true,
      ruleTag: 'مصوب_قطعی',
    };
  }

  if (pId === 'p-fin-dir') {
    return {
      canCreate: false,
      allowedCategories: [],
      allowedContexts: [],
      scopeTitle: 'تأییدکننده مالی (نقش نمونه)',
      scopeBadgeText: 'بررسی، تأیید و تسویه مالی',
      isRestricted: true,
      restrictionReason: 'جهت رعایت تفکیک وظایف (SoD)، تأییدکننده مالی درخواست پرداخت جدید ثبت نمی‌کند.',
      canApprove: true,
      canExecute: true,
      canViewUnmaskedPersonalData: true,
      ruleTag: 'مصوب_قطعی',
    };
  }

  const docPersona = getDocumentBasedPersonaById(pId);
  return {
    canCreate: false,
    allowedCategories: [],
    allowedContexts: [],
    scopeTitle: docPersona?.name || persona.name,
    scopeBadgeText: 'فاقد دسترسی پرداخت',
    isRestricted: true,
    restrictionReason: 'این نقش سازمانی صلاحیت ثبت پرداخت ندارد.',
    canApprove: false,
    canExecute: false,
    canViewUnmaskedPersonalData: false,
    ruleTag: 'مصوب_قطعی',
  };
}

/**
 * Returns clean document-grounded display name for any person in the prototype.
 * Supports string, object, and persona ID.
 */
export function getDisplayPersonaName(
  person: { id?: string; name?: string } | string | null | undefined
): string {
  if (!person) return '';
  if (typeof person === 'string') {
    return cleanPersonNameString(person);
  }
  if (person.id) {
    const docPersona = getDocumentBasedPersonaById(person.id);
    if (docPersona) return docPersona.name;
  }
  return cleanPersonNameString(person.name || '');
}

/**
 * Normalizes any person name string by replacing legacy or fake demo names
 * with their canonical documented identity or standard role title.
 */
export function cleanPersonNameString(rawName: string): string {
  if (!rawName) return '';
  let result = rawName;

  const replacements: [RegExp, string][] = [
    [/مهندس آرش نیازی/g, 'مدیر سیستم — نقش نمونه'],
    [/آرش نیازی/g, 'مدیر سیستم — نقش نمونه'],
    [/کامران داوودی/g, 'آرش'],
    [/محسن راد/g, 'آقای یوسفی'],
    [/مهندس حامد اسدی/g, 'آقای منتظری'],
    [/حامد اسدی/g, 'آقای منتظری'],
    [/سینا کریمی/g, 'آقای نادری'],
    [/پروانه صالحی/g, 'کارشناس مالی — نقش نمونه'],
    [/دکتر فرزاد شریفی/g, 'تأییدکننده مالی — نقش نمونه'],
    [/فرزاد شریفی/g, 'تأییدکننده مالی — نقش نمونه'],
    [/سعید محمدی/g, 'مجری خزانه‌داری — نقش نمونه'],
    [/علیرضا تهرانی/g, 'کارشناس فروش — نقش نمونه'],
    [/سهراب جوادیان/g, 'تأییدکننده بازرگانی — نقش نمونه'],
    [/رضا میرزایی/g, 'مسئول انبار — نقش نمونه'],
    [/مهندس نیما شایان/g, 'مسئول اطلاعات پایه — نقش نمونه'],
    [/نیما شایان/g, 'مسئول اطلاعات پایه — نقش نمونه'],
  ];

  for (const [regex, replacement] of replacements) {
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Returns clean document-grounded role / job title for any person or role string.
 */
export function getDisplayPersonaRole(
  personOrRole: { id?: string; role?: string; jobTitle?: string } | string | null | undefined
): string {
  if (!personOrRole) return '';
  if (typeof personOrRole === 'object' && personOrRole.id) {
    const docPersona = getDocumentBasedPersonaById(personOrRole.id);
    if (docPersona) return docPersona.jobTitle;
  }

  const rawRole =
    typeof personOrRole === 'string'
      ? personOrRole
      : personOrRole.jobTitle || personOrRole.role || '';

  if (!rawRole) return '';

  const roleReplacements: [RegExp, string][] = [
    [/سرپرست لجستیک و انبارداری/g, 'مسئول لجستیک و هماهنگی خرید'],
    [/سرپرست لجستیک/g, 'مسئول لجستیک و هماهنگی خرید'],
    [/معاون عملیات و انبار/g, 'مدیرعامل'],
    [/معاونت بازرگانی و فروش/g, 'تأییدکننده بازرگانی — نقش نمونه'],
    [/معاونت بازرگانی/g, 'تأییدکننده بازرگانی — نقش نمونه'],
    [/مدیر ارشد مالی/g, 'تأییدکننده مالی — نقش نمونه'],
    [/مدیر مالی/g, 'تأییدکننده مالی — نقش نمونه'],
    [/کارشناس عملیات میدانی و فروش/g, 'مسئول فروش مویرگی استان قم'],
    [/سرپرست تأمین و زنجیره لجستیک/g, 'جانشین عملیاتی و رابط تأمین'],
    [/کاربر آزمایشی محدود/g, 'کارآموز مهمان — نقش نمونه'],
    [/کاربر سیستم/g, 'کارآموز مهمان — نقش نمونه'],
    [/مدیر ارشد سیستم/g, 'مدیر سیستم — نقش نمونه'],
  ];

  let result = rawRole;
  for (const [regex, replacement] of roleReplacements) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Canonical Persona Map and List exports for unified application-wide access.
 */
export const CANONICAL_PERSONA_LIST: DocumentBasedPersona[] = getDocumentBasedPersonas();

export const CANONICAL_PERSONA_MAP: Record<string, DocumentBasedPersona> = CANONICAL_PERSONA_LIST.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, DocumentBasedPersona>
);


