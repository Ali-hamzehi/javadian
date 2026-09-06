import { MockPersona, PaymentCategory, PaymentContextType, PaymentRequestStatus, Person } from '../types';

export interface CategoryMeta {
  id: PaymentCategory;
  label: string;
  shortLabel: string;
  defaultContext: PaymentContextType;
  description: string;
  example: string;
  colorClass: string;
}

export const PAYMENT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'supplier',
    label: 'تأمین‌کننده کالا و مواد اولیه',
    shortLabel: 'تأمین‌کننده',
    defaultContext: 'company',
    description: 'تسویه پیش‌فاکتور یا فاکتور رسمی خرید روغن خام، ملزومات بسته‌بندی، کارتن و ظروف',
    example: 'پیش‌فاکتور خرید روغن خام کلزا از مجتمع دانه طلایی',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'freight',
    label: 'کرایه باربری و ترابری ناوگان',
    shortLabel: 'کرایه حمل',
    defaultContext: 'company',
    description: 'تسویه کرایه تریلی کفی، خاور و بارنامه بین‌شهری ناوگان حمل و ترابری باربری‌ها',
    example: 'بارنامه دولتی WB-ISF-99214 ترابران نوین',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'worker_expense',
    label: 'دستمزد کارگری و تخلیه/بارگیری',
    shortLabel: 'دستمزد کارگری',
    defaultContext: 'personal',
    description: 'حق‌الزحمه تیم‌های تخلیه دستی، پالت‌چینی، بارگیری شیفت شب و کارگران فصلی محلی',
    example: 'دستمزد ۴ نفر کارگر تخلیه شبانه انبار اصفهان',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'driver_expense',
    label: 'تنخواه و هزینه‌های جاده‌ای راننده',
    shortLabel: 'تنخواه راننده',
    defaultContext: 'personal',
    description: 'مساعده سوخت، عوارضی آزادراه، امداد فنی جاده و اقامت اضطراری رانندگان ناوگان',
    example: 'فاکتور مکانیک سیار و فیش عوارض آزادراهی',
    colorClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    id: 'finance_tax',
    label: 'مالیات، عوارض، بیمه و امور دولتی',
    shortLabel: 'مالیات و عوارض',
    defaultContext: 'company',
    description: 'شناسه قبض اظهارنامه ارزش افزوده، عملکرد، عوارض شهرداری، مالیات تکلیفی و تأمین اجتماعی',
    example: 'قبض الکترونیک مالیات بر ارزش افزوده فصل بهار',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    id: 'operational_expense',
    label: 'هزینه‌های جاری اداری و تنخواه انبار',
    shortLabel: 'هزینه جاری و تنخواه',
    defaultContext: 'personal',
    description: 'خرید لوازم مصرفی، تعمیرات اضطراری ابزار، ملزومات چاپ برچسب انبار و تنخواه شعبه',
    example: 'سرویس دوره‌ای جک پالت و اقلام مصرفی انبار کهریزک',
    colorClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export interface ScopeRuleItem {
  id: string;
  scopeName: string;
  applicableUnits: string;
  allowedCategories: PaymentCategory[];
  allowedContexts: PaymentContextType[];
  isConfigurable: boolean;
  notes: string;
  statusTag: 'مصوب_قطعی' | 'نیازمند_تنظیم_سازمان';
}

export const ORG_PAYMENT_SCOPE_RULES: ScopeRuleItem[] = [
  {
    id: 'rule-fin',
    scopeName: 'تیم مالی و خزانه‌داری (مرجع عمومی ثبت)',
    applicableUnits: 'مدیریت مالی، حسابداری، خزانه‌داری',
    allowedCategories: ['supplier', 'freight', 'worker_expense', 'driver_expense', 'finance_tax', 'operational_expense'],
    allowedContexts: ['company', 'personal'],
    isConfigurable: false,
    notes: 'اختیار کامل ثبت در کلیه سرفصل‌های شرکتی و شخصی، مشروط به تفکیک وظایف و عدم خود-تأییدی.',
    statusTag: 'مصوب_قطعی',
  },
  {
    id: 'rule-supply-del',
    scopeName: 'مسئولیت تفویض‌شده تأمین کالا (خرید مواد اولیه)',
    applicableUnits: 'تدارکات، بازرگانی خارجی، جانشین معاونت تأمین',
    allowedCategories: ['supplier'],
    allowedContexts: ['company'],
    isConfigurable: true,
    notes: 'صرفاً مجاز به ثبت دستور پرداخت پیش‌فاکتور و فاکتور نهایی تأمین‌کنندگان مواد اولیه و اقلام بسته‌بندی.',
    statusTag: 'مصوب_قطعی',
  },
  {
    id: 'rule-logistics',
    scopeName: 'حوزه لجستیک و ترابری ناوگان',
    applicableUnits: 'سرپرستی انبار و لجستیک، هماهنگ‌کننده ناوگان',
    allowedCategories: ['freight'],
    allowedContexts: ['company'],
    isConfigurable: true,
    notes: 'صرفاً مجاز به ثبت کرایه حمل و بارنامه باربری‌ها. امکان ثبت هزینه‌های تأمین کالا، مالیاتی یا تنخواه اداری را ندارد.',
    statusTag: 'مصوب_قطعی',
  },
  {
    id: 'rule-local-sales',
    scopeName: 'حوزه فروش محلی و منطقه‌ای (هزینه‌های کارگری و راننده)',
    applicableUnits: 'کارشناسان فروش شعب و بازرگانی داخلی',
    allowedCategories: ['worker_expense', 'driver_expense'],
    allowedContexts: ['personal'],
    isConfigurable: true,
    notes: 'صرفاً مجاز به ثبت تنخواه رانندگان و حق‌الزحمه کارگران تخلیه محلی طبق سقف مصوب شعبه. اجازه ثبت فاکتور تأمین‌کننده، کرایه باربری یا مالیات را ندارد.',
    statusTag: 'مصوب_قطعی',
  },
  {
    id: 'rule-unresolved',
    scopeName: 'سایر پرسنل و کارمندان عمومی سازمان',
    applicableUnits: 'سایر واحدهای ستادی بدون حدود اختیارات ابلاغی',
    allowedCategories: [],
    allowedContexts: [],
    isConfigurable: true,
    notes: 'تعریف حدود اختیارات و سقف مبالغ برای این دسته از کاربران منوط به تصویب آیین‌نامه معاملات شرکت جوادیان است.',
    statusTag: 'نیازمند_تنظیم_سازمان',
  },
];

export interface PersonaPaymentScope {
  canCreate: boolean;
  allowedCategories: PaymentCategory[];
  allowedContexts: PaymentContextType[];
  scopeTitle: string;
  scopeBadgeText: string;
  isRestricted: boolean;
  restrictionReason?: string;
  canApprove: boolean;
  canExecute: boolean;
  canViewUnmaskedPersonalData: boolean;
  ruleTag: 'مصوب_قطعی' | 'نیازمند_تنظیم_سازمان';
}

/**
 * Dynamically resolves the payment request scope and permissions for any persona
 * strictly following the initial evidence and acceptance criteria:
 * - Finance team: General primary creators (all categories)
 * - Supplier-facing delegated responsibility: supplier-related payments only
 * - Logistics responsibility: transport/freight payments only
 * - Local sales responsibility: scoped local worker/driver expenses only
 * - Other users: None / «نیازمند تنظیم سازمان»
 */
export function resolvePersonaPaymentScope(persona: MockPersona): PersonaPaymentScope {
  const caps = persona.capabilities || [];
  const pId = persona.id;
  const roleLower = ((persona.jobTitle || '') as string).toLowerCase();
  const dept = persona.department || '';

  // 1. Finance Team (Finance Specialist, Finance Director, Treasurer)
  const isFinanceTeam =
    pId === 'p-fin-spec' ||
    pId === 'p-fin-dir' ||
    caps.includes('finance.payment_request.create') ||
    caps.includes('finance.create_request') ||
    caps.includes('finance.payment_request.approve') ||
    caps.includes('finance.payment_request.execute');

  if (isFinanceTeam) {
    return {
      canCreate: true,
      allowedCategories: ['supplier', 'freight', 'worker_expense', 'driver_expense', 'finance_tax', 'operational_expense'],
      allowedContexts: ['company', 'personal'],
      scopeTitle: 'تیم مالی و خزانه‌داری',
      scopeBadgeText: 'ثبت عمومی — کلیه سرفصل‌های مالی',
      isRestricted: false,
      canApprove: caps.includes('finance.payment_request.approve') || pId === 'p-fin-dir',
      canExecute: caps.includes('finance.payment_request.execute') || pId === 'p-fin-dir' || pId === 'p-fin-spec',
      canViewUnmaskedPersonalData: true,
      ruleTag: 'مصوب_قطعی',
    };
  }

  // 2. Multi-delegate holding supplier-facing delegated responsibility (e.g. محسن راد / del-2 جانشین معاونت تأمین)
  const isSupplierFacingDelegate =
    pId === 'p-multi-delegate' ||
    roleLower.includes('تأمین') ||
    dept.includes('تأمین');

  if (isSupplierFacingDelegate) {
    return {
      canCreate: true,
      allowedCategories: ['supplier'],
      allowedContexts: ['company'],
      scopeTitle: 'مسئولیت تفویض‌شده تأمین کالا',
      scopeBadgeText: 'محدود به سرفصل تأمین‌کنندگان کالا',
      isRestricted: true,
      restrictionReason: 'طبق حکم جانشینی تأمین، این کاربر صرفاً مجاز به ثبت درخواست پرداخت برای تأمین‌کنندگان کالا و مواد اولیه است.',
      canApprove: caps.includes('approvals.view') || caps.includes('supply.manage'),
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  // 3. Logistics Responsibility (e.g. کامران داوودی - سرپرست لجستیک و انبار)
  const isLogisticsResponsibility =
    pId === 'p-warehouse' ||
    pId === 'p-logistics' ||
    caps.includes('warehouse_receipt.create') ||
    dept.includes('لجستیک') ||
    dept.includes('انبار');

  if (isLogisticsResponsibility) {
    return {
      canCreate: true,
      allowedCategories: ['freight'],
      allowedContexts: ['company'],
      scopeTitle: 'حوزه لجستیک و حمل‌ونقل',
      scopeBadgeText: 'محدود به کرایه حمل و باربری',
      isRestricted: true,
      restrictionReason: 'بر اساس ماتریس حدود اختیارات، مسئول لجستیک منحصراً مجاز به ثبت کرایه حمل بارنامه است و امکان ایجاد سایر سرفصل‌ها را ندارد.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  // 4. Local Sales Responsibility (e.g. علیرضا تهرانی - کارشناس فروش محلی)
  const isLocalSalesResponsibility =
    pId === 'p-sales' ||
    dept.includes('فروش') ||
    dept.includes('بازرگانی داخلی') ||
    caps.includes('sales.create');

  if (isLocalSalesResponsibility) {
    return {
      canCreate: true,
      allowedCategories: ['worker_expense', 'driver_expense'],
      allowedContexts: ['personal'],
      scopeTitle: 'فروش محلی و منطقه‌ای',
      scopeBadgeText: 'محدود به دستمزد کارگری و تنخواه راننده محلی',
      isRestricted: true,
      restrictionReason: 'کارشناس فروش محلی منحصراً مجاز به ثبت هزینه‌های کارگری تخلیه و تنخواه رانندگان محلی است.',
      canApprove: false,
      canExecute: false,
      canViewUnmaskedPersonalData: false,
      ruleTag: 'مصوب_قطعی',
    };
  }

  // 5. Operations Director / Admin (Can monitor and view)
  if (pId === 'p-ops-dir' || pId === 'p-admin-ops') {
    return {
      canCreate: false,
      allowedCategories: [],
      allowedContexts: [],
      scopeTitle: 'مدیریت ارشد و نظارت عملیات',
      scopeBadgeText: 'نظارت و حاکمیت سازمانی',
      isRestricted: true,
      restrictionReason: 'مدیران ارشد جهت حفظ اصل تفکیک وظایف (SoD)، مستقیماً درخواست پرداخت اولیه ثبت نمی‌کنند.',
      canApprove: true,
      canExecute: false,
      canViewUnmaskedPersonalData: true,
      ruleTag: 'مصوب_قطعی',
    };
  }

  // 6. Default / Ordinary employee / Unassigned
  return {
    canCreate: false,
    allowedCategories: [],
    allowedContexts: [],
    scopeTitle: 'کارمند عادی فاقد حدود اختیارات مالی',
    scopeBadgeText: 'فاقد مجوز ثبت پرداخت',
    isRestricted: true,
    restrictionReason: 'تعریف سرفصل و مجوز ثبت پرداخت برای این نقش سازمانی «نیازمند تنظیم سازمان» است.',
    canApprove: false,
    canExecute: false,
    canViewUnmaskedPersonalData: false,
    ruleTag: 'نیازمند_تنظیم_سازمان',
  };
}

export interface StatusLifecycleMeta {
  status: PaymentRequestStatus;
  label: string;
  badgeClass: string;
  borderClass: string;
  defaultNextAction: string;
  defaultBallHolder: string;
  description: string;
}

export const PAYMENT_STATUS_LIFECYCLE_META: Record<PaymentRequestStatus, StatusLifecycleMeta> = {
  draft: {
    status: 'draft',
    label: 'پیش‌نویس اولیه',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300',
    defaultNextAction: 'تکمیل مدارک و ارسال رسمی به واحد حسابداری',
    defaultBallHolder: 'متقاضی اولیه درخواست',
    description: 'پرونده به صورت پیش‌نویس ذخیره شده و هنوز به جریان رسمی مالی ارسال نشده است.',
  },
  submitted: {
    status: 'submitted',
    label: 'ارسال به حسابداری',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
    borderClass: 'border-blue-400',
    defaultNextAction: 'تطبیق فاکتور و کد اقتصادی در سامانه مؤدیان و کنترل پیش‌فاکتور',
    defaultBallHolder: 'پروانه صالحی (کارشناس حسابداری و رسیدگی)',
    description: 'درخواست توسط متقاضی ثبت شده و در نوبت کارتابل رسیدگی کارشناس حسابداری قرار دارد.',
  },
  under_review: {
    status: 'under_review',
    label: 'در حال رسیدگی حسابداری',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300',
    borderClass: 'border-indigo-400',
    defaultNextAction: 'تکمیل کاربرگ تطبیق و ارسال به مدیر مالی جهت صدور دستور پرداخت',
    defaultBallHolder: 'پروانه صالحی (کارشناس حسابداری)',
    description: 'اسناد و مستندات پرداخت توسط کارشناس رسیدگی اسناد در حال اعتبارسنجی است.',
  },
  approved: {
    status: 'approved',
    label: 'تأیید شده / آماده تخصیص',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400',
    defaultNextAction: 'تخصیص حساب مبدأ در خزانه‌داری و صدور دستور حواله بانکی',
    defaultBallHolder: 'دکتر فرزاد شریفی (مدیر مالی) / سعید محمدی (خزانه‌داری)',
    description: 'مدیر مالی پرداخت را تأیید کرده و پرونده در صف تخصیص نقدینگی خزانه‌داری قرار گرفته است.',
  },
  ready: {
    status: 'ready',
    label: 'آماده پرداخت خزانه‌داری',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderClass: 'border-emerald-400',
    defaultNextAction: 'اجرای حواله ساتنا/پایا در اینترنت‌بانک و بارگذاری فیش بانکی',
    defaultBallHolder: 'سعید محمدی (کارشناس خزانه‌داری)',
    description: 'تنخواه یا منابع بانکی مشخص شده و منتظر اجرای عملیات بانکی است.',
  },
  ready_for_payment: {
    status: 'ready_for_payment',
    label: 'آماده پرداخت خزانه‌داری',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderClass: 'border-emerald-400',
    defaultNextAction: 'اجرای حواله ساتنا/پایا در اینترنت‌بانک و ثبت شناسه رهگیری',
    defaultBallHolder: 'سعید محمدی (کارشناس خزانه‌داری)',
    description: 'منابع حساب بانکی تخصیص یافته و کارشناس خزانه‌داری در حال اجرای حواله است.',
  },
  pending: {
    status: 'pending',
    label: 'در حال حواله بانکی',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    borderClass: 'border-cyan-400',
    defaultNextAction: 'دریافت تأییدیه چرخه پایا/ساتنا و بارگذاری فیش واریز',
    defaultBallHolder: 'سامانه بانکی / کارشناس خزانه‌داری',
    description: 'دستور پرداخت به سیستم بانک ارسال شده و در انتظار تکمیل چرخه تسویه است.',
  },
  payment_pending: {
    status: 'payment_pending',
    label: 'در حال حواله بانکی',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    borderClass: 'border-cyan-400',
    defaultNextAction: 'دریافت شناسه پیگیری بانکی و درج رسید تسویه',
    defaultBallHolder: 'سامانه بانکی / کارشناس خزانه‌داری',
    description: 'حواله به پورتال بانک ارسال شده و در صف پردازش شتاب/پایا قرار دارد.',
  },
  paid: {
    status: 'paid',
    label: 'تسویه و پرداخت شد',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
    borderClass: 'border-teal-400',
    defaultNextAction: 'بایگانی اسناد تسویه و تطبیق صورت‌حساب بانکی',
    defaultBallHolder: 'پروانه صالحی (کارشناس حسابداری و ثبت اسناد)',
    description: 'عملیات بانکی با موفقیت اجرا شده، شناسه پیگیری و فیش بانکی ضمیمه گردید و پرونده تسویه شد.',
  },
  closed: {
    status: 'closed',
    label: 'مختومه و بایگانی',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    borderClass: 'border-slate-400',
    defaultNextAction: 'پرونده مختومه شده است — اقدام بعدی وجود ندارد',
    defaultBallHolder: 'بایگانی اسناد مالی',
    description: 'تمام مراحل اجرایی و ثبت مالی تکمیل گردیده و پرونده در بایگانی قطعی قرار دارد.',
  },
  returned: {
    status: 'returned',
    label: 'عودت جهت رفع نقص',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300',
    borderClass: 'border-orange-400',
    defaultNextAction: 'اصلاح مدارک، بارگذاری مجدد تصویر بارنامه یا پیش‌فاکتور و ارسال مجدد',
    defaultBallHolder: 'متقاضی اولیه درخواست',
    description: 'پرونده به دلیل ناخوانا بودن مدارک یا نقص اطلاعات به متقاضی برگشت داده شد.',
  },
  rejected: {
    status: 'rejected',
    label: 'رد شده / عدم اقدام',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    borderClass: 'border-rose-400',
    defaultNextAction: 'پرونده مختومه شده است — علت رد در توضیحات قید شده',
    defaultBallHolder: 'بایگانی رسیدگی',
    description: 'درخواست پرداخت به دلیل عدم انطباق با مصوبات مالی یا ابطال سفارش رد گردید.',
  },
  blocked: {
    status: 'blocked',
    label: 'مسدود شده (نقض تفکیک وظایف)',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-400 font-bold',
    borderClass: 'border-rose-500',
    defaultNextAction: 'ارجاع به مدیر مالی ارشد یا کارگروه نظارت جهت رفع تعارض و تعیین تأییدکننده مستقل',
    defaultBallHolder: 'مدیریت ارشد مالی و نظارت بر رعایت مقررات',
    description: 'فرایند به دلیل تلاش برای خود-تأییدی یا عدم تطابق سرفصل اختیارات متوقف و مسدود شده است.',
  },
  cancelled: {
    status: 'cancelled',
    label: 'لغو شده توسط کاربر',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    borderClass: 'border-slate-300',
    defaultNextAction: 'فاقد اقدام بعدی',
    defaultBallHolder: '—',
    description: 'درخواست توسط کاربر ثبت‌کننده قبل از رسیدگی لغو گردید.',
  },
};
