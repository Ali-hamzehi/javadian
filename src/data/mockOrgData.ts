import { OrgUnit, OrgPosition, UserAccessProfile, DelegationRecord } from '../types';

export const MOCK_ORG_UNITS: OrgUnit[] = [
  {
    id: 'unit-sales',
    code: 'UNT-101',
    name: 'معاونت بازرگانی و فروش',
    parentUnitName: 'مدیریت عامل',
    managerName: 'سهراب جوادیان',
    staffCount: 14,
  },
  {
    id: 'unit-ops',
    code: 'UNT-102',
    name: 'معاونت عملیات و زنجیره تأمین',
    parentUnitName: 'مدیریت عامل',
    managerName: 'مهندس حامد اسدی',
    staffCount: 38,
  },
  {
    id: 'unit-fin',
    code: 'UNT-103',
    name: 'مدیریت امور مالی و خزانه‌داری',
    parentUnitName: 'مدیریت عامل',
    managerName: 'دکتر فرزاد شریفی',
    staffCount: 9,
  },
  {
    id: 'unit-it',
    code: 'UNT-104',
    name: 'فناوری اطلاعات و امنیت داده',
    parentUnitName: 'معاونت توسعه سازمانی',
    managerName: 'نیما فرهادی',
    staffCount: 5,
  },
];

export const MOCK_POSITIONS: OrgPosition[] = [
  {
    id: 'pos-1',
    code: 'POS-01',
    title: 'معاون بازرگانی و عضو هیئت مدیره',
    unitName: 'معاونت بازرگانی و فروش',
    levelLabel: 'مدیریت ارشد (تصمیم‌گیرنده نهایی نرخ و اعتبار)',
    defaultScope: 'organization',
  },
  {
    id: 'pos-2',
    code: 'POS-02',
    title: 'کارشناس ارشد فروش و بازرگانی',
    unitName: 'معاونت بازرگانی و فروش',
    levelLabel: 'کارشناسی تخصصی (ثبت و پیگیری پرونده)',
    defaultScope: 'self',
  },
  {
    id: 'pos-3',
    code: 'POS-03',
    title: 'مدیر ارشد عملیات و زنجیره تأمین',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'مدیریت ارشد عملیاتی',
    defaultScope: 'organization',
  },
  {
    id: 'pos-4',
    code: 'POS-04',
    title: 'سرپرست لجستیک و انبار مرکزی',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'سرپرستی اجرایی (صدور حواله و رسید)',
    defaultScope: 'unit',
  },
  {
    id: 'pos-5',
    code: 'POS-05',
    title: 'مدیر امور مالی و بودجه',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    levelLabel: 'مدیریت ارشد مالی (تأیید پرداخت و اعتبارات)',
    defaultScope: 'organization',
  },
];

export const MOCK_USER_PROFILES: UserAccessProfile[] = [
  {
    id: 'usr-prof-rad',
    name: 'محسن راد',
    nationalCode: '۰۰۷۶۵۴۳۲۱۱',
    jobTitle: 'کارشناس ارشد عملیات (جانشین رسمی مدیر عملیات)',
    unit: 'مدیریت عملیات و زنجیره توزیع',
    effectiveScope: 'organization',
    scopeSummaryPersian: 'کل سازمان (به واسطه حکم فعال جانشینی مهندس اسدی)',
    financialLimitRials: 2000000000, // سقف ۲ میلیارد ریال
    allowedWarehouses: ['انبار کهریزک', 'انبار اصفهان', 'مخازن انبار شماره ۲'],
    allowedProductLines: ['انواع روغن‌های خوراکی خانوار', 'روغن‌های صنف و صنعت', 'کارتن‌های بسته‌بندی'],
    activeDelegation: {
      delegatorName: 'مهندس حامد اسدی (مدیر عملیات)',
      scopeTitle: 'تأیید حواله خروج اضطراری و درخواست‌های تأمین تا ۲ میلیارد ریال',
      validUntilJalali: '۱۴۰۴/۰۶/۳۱',
    },
    permissions: [
      {
        capability: 'supply.manage',
        labelPersian: 'مدیریت و صدور سفارش‌های تأمین',
        description: 'امکان ایجاد و تغییر سفارش خرید مواد اولیه',
        inheritedFrom: 'position',
        sourceName: 'پست کارشناس ارشد عملیات',
      },
      {
        capability: 'approvals.view',
        labelPersian: 'مشاهده و اقدام بر روی کارتابل تأییدات',
        description: 'تأیید درخواست‌های خرید و حواله خروج انبار',
        inheritedFrom: 'delegation',
        sourceName: 'تفویض جانشینی مهندس حامد اسدی (حکم شماره ۹۸۲)',
        scopeConstraint: 'سقف مبلغ ۲,۰۰۰,۰۰۰,۰۰۰ ریال',
      },
      {
        capability: 'inventory.read',
        labelPersian: 'مشاهده موجودی برخط انبارها',
        description: 'دسترسی به اسنپ‌شات کاردکس انبار کهریزک و اصفهان',
        inheritedFrom: 'position',
        sourceName: 'پست سازمانی',
      },
      {
        capability: 'sales.read',
        labelPersian: 'مشاهده سفارش‌های فروش مرتبط',
        description: 'جهت برنامه‌ریزی بسته‌بندی و زمان‌بندی بارگیری',
        inheritedFrom: 'direct',
        sourceName: 'تخصیص مستقیم توسط مدیر سیستم',
      },
    ],
  },
  {
    id: 'usr-prof-tehrani',
    name: 'علیرضا تهرانی',
    nationalCode: '۰۰۴۸۹۱۱۲۳۴',
    jobTitle: 'کارشناس ارشد فروش و بازرگانی',
    unit: 'معاونت بازرگانی و فروش',
    effectiveScope: 'self',
    scopeSummaryPersian: 'فقط رکوردهای خودم (پرتفوی مشتریان تخصیص‌یافته به خود)',
    financialLimitRials: 500000000,
    allowedWarehouses: ['انبار مرکزی کهریزک'],
    allowedProductLines: ['روغن سرخ‌کردنی', 'روغن پخت‌وپز', 'روغن مایع'],
    permissions: [
      {
        capability: 'sales.create',
        labelPersian: 'ثبت سفارش فروش جدید',
        description: 'ثبت قرارداد و صدور پیش‌فاکتور اولیه برای مشتریان',
        inheritedFrom: 'position',
        sourceName: 'پست کارشناس فروش',
      },
      {
        capability: 'pricing.read',
        labelPersian: 'مشاهده نرخ‌نامه و تخفیف پایه',
        description: 'مشاهده لیست قیمت روز و اعمال تخفیف تا سقف ۲٪',
        inheritedFrom: 'position',
        sourceName: 'پست کارشناس فروش',
        scopeConstraint: 'حداکثر ۲٪ تخفیف بدون نیاز به تأیید بازرگانی',
      },
      {
        capability: 'crm.write',
        labelPersian: 'ثبت وقایع تماس و جلسات مشتریان',
        description: 'ثبت یادداشت‌های مذاکره در پرونده مشتری',
        inheritedFrom: 'direct',
        sourceName: 'دسترسی عمومی واحد فروش',
      },
    ],
  },
  {
    id: 'usr-prof-sohrab',
    name: 'سهراب جوادیان',
    nationalCode: '۰۰۱۱۲۲۳۳۴۴',
    jobTitle: 'معاون بازرگانی و تأییدکننده تجاری',
    unit: 'معاونت بازرگانی و فروش',
    effectiveScope: 'organization',
    scopeSummaryPersian: 'کل سازمان (مشاهده و تصمیم‌گیری بر کلیه اسناد فروش و قراردادها)',
    financialLimitRials: 50000000000, // سقف ۵۰ میلیارد ریال
    allowedWarehouses: ['همه انبارها'],
    allowedProductLines: ['کلیه رده‌های محصولی شرکت'],
    permissions: [
      {
        capability: 'sales.approve',
        labelPersian: 'تأیید نهایی سفارش‌های خارج از ضابطه',
        description: 'تأیید تخفیفات خاص، فروش زیر کف قیمت و شرایط اعتباری مازاد',
        inheritedFrom: 'position',
        sourceName: 'پست معاونت بازرگانی (مصوبه هیئت مدیره)',
      },
      {
        capability: 'pricing.approve',
        labelPersian: 'تصویب نرخ‌نامه پایه و خط‌مشی قیمت‌گذاری',
        description: 'تغییر قیمت پایه کالاها در سامانه',
        inheritedFrom: 'position',
        sourceName: 'عضو هیئت مدیره و معاون بازرگانی',
      },
    ],
  },
];

export const MOCK_DELEGATIONS: DelegationRecord[] = [
  {
    id: 'del-rec-1',
    code: 'DEL-1404-01',
    delegator: {
      id: 'p-ops-dir',
      name: 'مهندس حامد اسدی',
      role: 'مدیر ارشد عملیات و زنجیره توزیع',
      department: 'معاونت عملیات',
    },
    delegatee: {
      id: 'p-multi-delegate',
      name: 'محسن راد',
      role: 'کارشناس ارشد عملیات',
      department: 'معاونت عملیات',
    },
    title: 'تفویض وظایف مدیریت عملیات در دوره مأموریت خارجی',
    authorizedScope: 'تأیید حواله خروج انبار اضطراری و تأیید درخواست‌های تأمین تا سقف ۲ میلیارد ریال',
    startDateJalali: '۱۴۰۴/۰۶/۰۵',
    endDateJalali: '۱۴۰۴/۰۶/۳۱',
    status: 'active',
    approvalLimitRials: 2000000000,
    reason: 'سفر کاری جهت بازدید از نمایشگاه بین‌المللی صنایع غذایی و خطوط پیشرفته بسته‌بندی',
  },
  {
    id: 'del-rec-2',
    code: 'DEL-1404-02',
    delegator: {
      id: 'p-fin-dir',
      name: 'دکتر فرزاد شریفی',
      role: 'مدیر مالی',
      department: 'مدیریت مالی',
    },
    delegatee: {
      id: 'p-fin-spec',
      name: 'پروانه صالحی',
      role: 'کارشناس حسابداری',
      department: 'امور مالی',
    },
    title: 'تفویض موقت بررسی اولیه اسناد هزینه جاری و بارنامه‌ها',
    authorizedScope: 'تطبیق فاکتور و صدور پیش‌نویس حواله پرداخت تا سقف ۳۰۰ میلیون ریال',
    startDateJalali: '۱۴۰۴/۰۶/۱۰',
    endDateJalali: '۱۴۰۴/۰۶/۱۷',
    status: 'active',
    approvalLimitRials: 300000000,
    reason: 'پوشش غیبت همکار و تسریع در تسویه صورت‌حساب رانندگان ترابری',
  },
  {
    id: 'del-rec-3',
    code: 'DEL-1404-03',
    delegator: {
      id: 'p-comm-approver',
      name: 'سهراب جوادیان',
      role: 'معاونت بازرگانی',
      department: 'بازرگانی',
    },
    delegatee: {
      id: 'p-reg-sales',
      name: 'مهندس بهنام کمالی',
      role: 'مسئول فروش منطقه‌ای',
      department: 'فروش میدانی',
    },
    title: 'تفویض تأیید تخفیفات نمایندگی‌های منطقه مرکزی',
    authorizedScope: 'تأیید تخفیف تا سقف ۳٪ برای مشتریان رتبه الف استان اصفهان و مرکزی',
    startDateJalali: '۱۴۰۴/۰۵/۰۱',
    endDateJalali: '۱۴۰۴/۰۵/۳۰',
    status: 'expired',
    approvalLimitRials: 5000000000,
    reason: 'طرح تشویقی فروش تابستانه نمایندگان استانی (دوره پایان یافته)',
  },
];

export interface ResponsibilityAreaCatalogItem {
  id: string;
  code: string;
  title: string;
  unitName: string;
  primaryResponsiblePersonId: string;
  description: string;
}

export const MOCK_RESPONSIBILITY_AREAS: ResponsibilityAreaCatalogItem[] = [
  {
    id: 'resp-commercial',
    code: 'RSP-101',
    title: 'مسئولیت بازرگانی، فروش و خط‌مشی قیمت‌گذاری',
    unitName: 'معاونت بازرگانی و فروش',
    primaryResponsiblePersonId: 'p-comm-approver', // سهراب جوادیان
    description: 'تصویب قراردادهای فروش، تأیید تخفیفات تجاری و پایش رعایت نرخ مصوب روغن',
  },
  {
    id: 'resp-operations',
    code: 'RSP-102',
    title: 'مسئولیت برنامه‌ریزی عملیات و زنجیره تأمین',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    primaryResponsiblePersonId: 'p-ops-dir', // مهندس حامد اسدی
    description: 'تأمین دانه روغنی و روغن خام، تنظیم ظرفیت خطوط تولید و هماهنگی ترابری',
  },
  {
    id: 'resp-warehouse',
    code: 'RSP-103',
    title: 'مسئولیت لجستیک و انبار مرکزی کهریزک',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    primaryResponsiblePersonId: 'p-warehouse', // کامران داوودی
    description: 'مدیریت موجودی فیزیکی، تحویل بار، رسید انبار و صدور حواله خروج',
  },
  {
    id: 'resp-finance',
    code: 'RSP-104',
    title: 'مسئولیت امور مالی و خزانه‌داری',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    primaryResponsiblePersonId: 'p-fin-dir', // دکتر فرزاد شریفی
    description: 'کنترل اعتبارات مالی مشتریان، تسویه باربری‌ها و پرداخت به تأمین‌کنندگان',
  },
  {
    id: 'resp-field-sales',
    code: 'RSP-105',
    title: 'مسئولیت فروش مویرگی و بازاریابی میدانی',
    unitName: 'معاونت بازرگانی و فروش',
    primaryResponsiblePersonId: 'p-field-sales', // سینا کریمی
    description: 'ویزیت دوره‌ای بنکداران و فروشگاه‌ها، ثبت سفارش و وصول مطالبات در محل',
  },
  {
    id: 'resp-system-admin',
    code: 'RSP-106',
    title: 'مسئولیت امنیت داده، کاربران و فرآیندهای سازمانی',
    unitName: 'فناوری اطلاعات و امنیت داده',
    primaryResponsiblePersonId: 'p-admin-ops', // مهندس آرش نیازی
    description: 'مدیریت حساب‌ها، ثبت احکام جانشینی و پایش حاکمیتی فرآیندهای کسب‌وکار',
  },
];
