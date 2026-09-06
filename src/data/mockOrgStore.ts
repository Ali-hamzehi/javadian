import {
  UserAccessProfile,
  OrgUnit,
  OrgPosition,
  ResponsibilityArea,
  ResponsibilityAssignment,
  DelegationRecord,
  DirectPermissionException,
  PermissionExplanation,
  Capability,
  AccessScope,
  UserAccountState,
  BaseAction,
  BaseScope,
} from '../types';

export const INITIAL_ORG_UNITS: OrgUnit[] = [
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

export const INITIAL_POSITIONS: OrgPosition[] = [
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
    title: 'مدیر ارشد عملیات و زنجیره توزیع',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'مدیریت ارشد عملیاتی',
    defaultScope: 'organization',
  },
  {
    id: 'pos-4',
    code: 'POS-04',
    title: 'کارشناس ارشد عملیات و زنجیره تأمین',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'کارشناسی ارشد و پیگیری میدانی',
    defaultScope: 'unit',
  },
  {
    id: 'pos-5',
    code: 'POS-05',
    title: 'سرپرست لجستیک و انبار مرکزی',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'سرپرستی اجرایی (صدور حواله و رسید)',
    defaultScope: 'unit',
  },
  {
    id: 'pos-6',
    code: 'POS-06',
    title: 'مدیر امور مالی و خزانه‌داری',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    levelLabel: 'مدیریت ارشد مالی (تأیید پرداخت و اعتبارات)',
    defaultScope: 'organization',
  },
  {
    id: 'pos-7',
    code: 'POS-07',
    title: 'کارشناس حسابداری و دریافت/پرداخت',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    levelLabel: 'کارشناس ثبت اسناد مالی',
    defaultScope: 'self',
  },
  {
    id: 'pos-8',
    code: 'POS-08',
    title: 'سرپرست فروش میدانی و نمایندگی‌ها',
    unitName: 'معاونت بازرگانی و فروش',
    levelLabel: 'سرپرستی منطقه‌ای فروش',
    defaultScope: 'unit',
  },
  {
    id: 'pos-9',
    code: 'POS-09',
    title: 'کارمند عملیات و لجستیک کالا',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    levelLabel: 'متصدی عملیات جاری',
    defaultScope: 'self',
  },
];

export const INITIAL_RESPONSIBILITY_AREAS: ResponsibilityArea[] = [
  {
    id: 'resp-ops-supply',
    code: 'RSP-OPS-01',
    title: 'تأمین و خرید مواد اولیه و روغن خام',
    description: 'بررسی سفارشات خرید، استعلام نرخ تانکرهای روغن خوراکی و پیگیری ترخیص',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    inheritedCapabilities: ['supply.read', 'supply.create', 'supply.manage'],
    defaultScope: 'organization',
    scopeConstraints: {
      processType: 'سفارشات تأمین روغن خام و ملزومات کارتن',
      maxAmountRials: 10000000000,
    },
  },
  {
    id: 'resp-wh-receipt',
    code: 'RSP-OPS-02',
    title: 'کنترل باسکول، رسید انبار و ثبت ورود کالا',
    description: 'تطبیق فیزیکی تانکرها و پالت‌ها، صدور قبض باسکول و ثبت رسید انبار مرکزی کهریزک و اصفهان',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    inheritedCapabilities: ['inventory.read', 'inventory.write', 'warehouse_receipt.create'],
    defaultScope: 'unit',
    scopeConstraints: {
      region: 'انبار مرکزی کهریزک و انبار اصفهان',
    },
  },
  {
    id: 'resp-log-trans',
    code: 'RSP-OPS-03',
    title: 'هماهنگی ترابری ناوگان و درخواست پرداخت کرایه حمل',
    description: 'هماهنگی بارنامه با رانندگان کفی/تانکر و ایجاد درخواست تسویه کرایه رانندگان',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    inheritedCapabilities: ['supply.read', 'finance.payment_request.create'],
    defaultScope: 'organization',
    scopeConstraints: {
      paymentCategory: 'کرایه حمل رانندگان و بارنامه‌های رسمی',
      maxAmountRials: 500000000,
    },
  },
  {
    id: 'resp-sales-orders',
    code: 'RSP-SAL-01',
    title: 'ثبت سفارشات فروش و مذاکره با خریداران',
    description: 'ثبت پیش‌فاکتور، تبدیل بسته‌بندی به تناژ و هماهنگی شرایط پرداخت مشتریان در سراسر کشور',
    unitId: 'unit-sales',
    unitName: 'معاونت بازرگانی و فروش',
    inheritedCapabilities: ['sales.read', 'sales.create', 'pricing.read', 'crm.write'],
    defaultScope: 'self',
    scopeConstraints: {
      processType: 'فروش به خریداران عمده و بنکداران',
    },
  },
  {
    id: 'resp-sales-local',
    code: 'RSP-SAL-02',
    title: 'مدیریت فروش منطقه‌ای و تسویه هزینه‌های میدانی',
    description: 'پیگیری فروش میدانی استان‌ها و صدور درخواست پرداخت خرد صرفاً برای کارگران تخلیه و رانندگان محلی',
    unitId: 'unit-sales',
    unitName: 'معاونت بازرگانی و فروش',
    inheritedCapabilities: ['sales.read', 'sales.create', 'field.read', 'finance.payment_request.create'],
    defaultScope: 'unit',
    scopeConstraints: {
      paymentCategory: 'فقط تسویه رانندگان محلی و کارگران تخلیه/بارگیری موقت',
      region: 'استان اصفهان، چهارمحال و مرکزی',
      maxAmountRials: 50000000, // سقف ۵۰ میلیون ریال
    },
  },
  {
    id: 'resp-comm-approve',
    code: 'RSP-SAL-03',
    title: 'تأیید تجاری، مصوبه نرخ و فروش خارج از ضابطه',
    description: 'بررسی تقاضاهای فروش زیر کف مصوب، تخفیفات پلکانی و اعطای سقف اعتبار به بنکداران بزرگ',
    unitId: 'unit-sales',
    unitName: 'معاونت بازرگانی و فروش',
    inheritedCapabilities: ['sales.approve', 'pricing.approve', 'approvals.view'],
    defaultScope: 'organization',
    scopeConstraints: {
      maxAmountRials: 50000000000,
    },
  },
  {
    id: 'resp-fin-payment',
    code: 'RSP-FIN-01',
    title: 'ثبت و تطبیق اسناد پرداخت جاری خزانه‌داری',
    description: 'بررسی پیش‌فاکتورها، تطبیق قبوض و ثبت درخواست صدور حواله بانکی به مدیر مالی',
    unitId: 'unit-fin',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    inheritedCapabilities: ['finance.read', 'finance.payment_request.create', 'finance.create_request'],
    defaultScope: 'unit',
    scopeConstraints: {
      paymentCategory: 'هزینه‌های جاری اداری و فاکتورهای تأمین قطعات',
      maxAmountRials: 300000000,
    },
  },
  {
    id: 'resp-fin-exec',
    code: 'RSP-FIN-02',
    title: 'تأیید مالی و اجرای تسویه حوالجات بانکی',
    description: 'تصویب نهایی اسناد پرداخت، تأیید چک و صدور دستور پرداخت به بانک‌های عامل',
    unitId: 'unit-fin',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    inheritedCapabilities: [
      'finance.read',
      'finance.payment_request.approve',
      'finance.payment_request.execute',
      'finance.approve',
      'finance.execute',
      'approvals.view',
    ],
    defaultScope: 'organization',
    scopeConstraints: {
      maxAmountRials: 10000000000,
    },
  },
  {
    id: 'resp-ops-general',
    code: 'RSP-OPS-04',
    title: 'عملیات انبار و ثبت کاردکس فیزیکی',
    description: 'جابجایی کالا در سالن‌های نگهداری و بارچینی پالت‌های روغن خانوار',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    inheritedCapabilities: ['inventory.read'],
    defaultScope: 'self',
  },
];

export const INITIAL_RESPONSIBILITY_ASSIGNMENTS: ResponsibilityAssignment[] = [
  // محسن راد (Multi-responsibility)
  {
    id: 'asg-rad-1',
    userId: 'usr-prof-rad',
    userName: 'محسن راد',
    responsibilityId: 'resp-ops-supply',
    responsibilityTitle: 'تأمین و خرید مواد اولیه و روغن خام',
    isPrimary: true,
    startDateJalali: '۱۴۰۳/۰۷/۰۱',
    assignedBy: 'مهندس حامد اسدی',
    status: 'active',
  },
  {
    id: 'asg-rad-2',
    userId: 'usr-prof-rad',
    userName: 'محسن راد',
    responsibilityId: 'resp-wh-receipt',
    responsibilityTitle: 'کنترل باسکول، رسید انبار و ثبت ورود کالا',
    isPrimary: false,
    startDateJalali: '۱۴۰۳/۱۰/۱۵',
    assignedBy: 'مهندس حامد اسدی',
    status: 'active',
    notes: 'مسئولیت جانبی حل مغایرت باسکول و تأیید فنی تانکرها',
  },
  // علیرضا تهرانی (فروش)
  {
    id: 'asg-tehrani-1',
    userId: 'usr-prof-tehrani',
    userName: 'علیرضا تهرانی',
    responsibilityId: 'resp-sales-orders',
    responsibilityTitle: 'ثبت سفارشات فروش و مذاکره با خریداران',
    isPrimary: true,
    startDateJalali: '۱۴۰۲/۰۴/۱۵',
    assignedBy: 'سهراب جوادیان',
    status: 'active',
  },
  // کامران داوودی (لجستیک و انبار - قابلیت ثبت رسید و تسویه کرایه بارنامه)
  {
    id: 'asg-davoodi-1',
    userId: 'usr-prof-davoodi',
    userName: 'کامران داوودی',
    responsibilityId: 'resp-wh-receipt',
    responsibilityTitle: 'کنترل باسکول، رسید انبار و ثبت ورود کالا',
    isPrimary: true,
    startDateJalali: '۱۴۰۲/۰۲/۰۱',
    assignedBy: 'مهندس حامد اسدی',
    status: 'active',
  },
  {
    id: 'asg-davoodi-2',
    userId: 'usr-prof-davoodi',
    userName: 'کامران داوودی',
    responsibilityId: 'resp-log-trans',
    responsibilityTitle: 'هماهنگی ترابری ناوگان و درخواست پرداخت کرایه حمل',
    isPrimary: false,
    startDateJalali: '۱۴۰۲/۰۸/۱۰',
    assignedBy: 'مهندس حامد اسدی',
    status: 'active',
    notes: 'تخصیص مسئولیت صدور درخواست پرداخت کرایه تانکرها و بارنامه بدون نیاز به تغییر عنوان شغلی',
  },
  // سهراب جوادیان (معاونت بازرگانی)
  {
    id: 'asg-sohrab-1',
    userId: 'usr-prof-sohrab',
    userName: 'سهراب جوادیان',
    responsibilityId: 'resp-comm-approve',
    responsibilityTitle: 'تأیید تجاری، مصوبه نرخ و فروش خارج از ضابطه',
    isPrimary: true,
    startDateJalali: '۱۴۰۱/۰۱/۱۵',
    assignedBy: 'هیئت مدیره',
    status: 'active',
  },
  // بهنام کمالی (فروش منطقه‌ای با دسترسی مشروط پرداخت خرد)
  {
    id: 'asg-kamali-1',
    userId: 'usr-prof-kamali',
    userName: 'مهندس بهنام کمالی',
    responsibilityId: 'resp-sales-local',
    responsibilityTitle: 'مدیریت فروش منطقه‌ای و تسویه هزینه‌های میدانی',
    isPrimary: true,
    startDateJalali: '۱۴۰۳/۰۳/۰۱',
    assignedBy: 'سهراب جوادیان',
    status: 'active',
    notes: 'دارای اختیار پرداخت صرفاً برای رانندگان محلی و کارگران تا سقف ۵۰ میلیون ریال',
  },
  // پروانه صالحی (مالی)
  {
    id: 'asg-salehi-1',
    userId: 'usr-prof-salehi',
    userName: 'پروانه صالحی',
    responsibilityId: 'resp-fin-payment',
    responsibilityTitle: 'ثبت و تطبیق اسناد پرداخت جاری خزانه‌داری',
    isPrimary: true,
    startDateJalali: '۱۴۰۲/۱۱/۰۱',
    assignedBy: 'دکتر فرزاد شریفی',
    status: 'active',
  },
  // فرزاد شریفی (مدیر مالی)
  {
    id: 'asg-sharifi-1',
    userId: 'usr-prof-sharifi',
    userName: 'دکتر فرزاد شریفی',
    responsibilityId: 'resp-fin-exec',
    responsibilityTitle: 'تأیید مالی و اجرای تسویه حوالجات بانکی',
    isPrimary: true,
    startDateJalali: '۱۴۰۱/۰۶/۰۱',
    assignedBy: 'مدیرعامل',
    status: 'active',
  },
  // رضا میرزایی (کارمند عادی)
  {
    id: 'asg-mirzaei-1',
    userId: 'usr-prof-mirzaei',
    userName: 'رضا میرزایی',
    responsibilityId: 'resp-ops-general',
    responsibilityTitle: 'عملیات انبار و ثبت کاردکس فیزیکی',
    isPrimary: true,
    startDateJalali: '۱۴۰۳/۰۵/۱۰',
    assignedBy: 'کامران داوودی',
    status: 'active',
  },
];

export const INITIAL_USER_PROFILES: UserAccessProfile[] = [
  {
    id: 'usr-prof-rad',
    personnelCode: 'EMP-1009',
    personnelId: 'EMP-1009',
    name: 'محسن راد',
    nationalCode: '۰۰۷۶۵۴۳۲۱۱',
    maskedNationalCode: '۰۰۷***۳۲۱۱',
    mobile: '۰۹۱۲۳۴۵۶۷۸۹',
    maskedMobile: '۰۹۱۲***۶۷۸۹',
    internalExtension: '۲۱۴',
    email: 'rad@javadian.ir',
    directManagerName: 'مهندس حامد اسدی',
    jobTitle: 'کارشناس ارشد عملیات و زنجیره تأمین',
    unit: 'معاونت عملیات و زنجیره تأمین',
    unitId: 'unit-ops',
    positionId: 'pos-4',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'organization',
    scopeSummaryPersian: 'کل سازمان (به واسطه حکم فعال جانشینی مهندس اسدی)',
    financialLimitRials: 2000000000,
    hireDateJalali: '۱۴۰۱/۰۲/۱۵',
    lastLoginJalali: 'امروز ۰۸:۴۵',
    allowedWarehouses: ['انبار مرکزی کهریزک', 'انبار اصفهان', 'مخازن انبار شماره ۲'],
    allowedProductLines: ['انواع روغن‌های خوراکی خانوار', 'روغن‌های صنف و صنعت', 'کارتن‌های بسته‌بندی'],
    primaryResponsibilityId: 'resp-ops-supply',
    secondaryResponsibilityIds: ['resp-wh-receipt'],
    activeDelegation: {
      delegatorName: 'مهندس حامد اسدی (مدیر عملیات)',
      scopeTitle: 'تأیید حواله خروج اضطراری و تأمین تا ۲ میلیارد ریال',
      validUntilJalali: '۱۴۰۴/۰۶/۳۱',
    },
    permissions: [
      {
        capability: 'supply.manage',
        labelPersian: 'مدیریت و صدور سفارش‌های تأمین',
        description: 'امکان ایجاد و پیگیری سفارش خرید مواد اولیه و تانکرهای روغن خوراکی',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت تأمین و خرید مواد اولیه',
      },
      {
        capability: 'approvals.view',
        labelPersian: 'مشاهده و اقدام بر روی کارتابل تأییدات',
        description: 'تأیید درخواست‌های خرید و حواله خروج انبار',
        inheritedFrom: 'delegation',
        sourceName: 'تفویض جانشینی مهندس حامد اسدی (حکم شماره DEL-1404-01)',
        scopeConstraint: 'سقف مبلغ ۲,۰۰۰,۰۰۰,۰۰۰ ریال',
      },
      {
        capability: 'inventory.read',
        labelPersian: 'مشاهده موجودی برخط انبارها',
        description: 'دسترسی به اسنپ‌شات کاردکس انبار کهریزک و اصفهان',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت کنترل باسکول و ورود کالا',
      },
      {
        capability: 'warehouse_receipt.create',
        labelPersian: 'صدور رسید انبار (ورود کالا)',
        description: 'ثبت رسید اقلام وارده به انبار کهریزک',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت کنترل باسکول و ورود کالا',
      },
      {
        capability: 'sales.read',
        labelPersian: 'مشاهده سفارش‌های فروش مرتبط',
        description: 'جهت برنامه‌ریزی بسته‌بندی و زمان‌بندی بارگیری تانکرها',
        inheritedFrom: 'direct',
        sourceName: 'تخصیص مستقیم استثنا توسط مدیر سیستم (شماره عطف SEC-881)',
      },
    ],
    auditLog: [
      {
        id: 'aud-1',
        timestampJalali: '۱۴۰۴/۰۶/۰۵ ۱۱:۲۰',
        action: 'فعال‌سازی تفویض جانشینی',
        actor: 'مهندس حامد اسدی',
        description: 'ثبت حکم جانشینی DEL-1404-01 به مدت ۲۶ روز',
      },
      {
        id: 'aud-2',
        timestampJalali: '۱۴۰۳/۱۰/۱۵ ۰۹:۰۰',
        action: 'تخصیص مسئولیت ثانویه',
        actor: 'مهندس آرش نیازی',
        description: 'تخصیص مسئولیت کنترل باسکول و رسید انبار',
      },
    ],
  },
  {
    id: 'usr-prof-tehrani',
    personnelCode: 'EMP-1002',
    personnelId: 'EMP-1002',
    name: 'علیرضا تهرانی',
    nationalCode: '۰۰۴۸۹۱۱۲۳۴',
    maskedNationalCode: '۰۰۴***۱۲۳۴',
    mobile: '۰۹۱۲۰۹۸۷۶۵۴',
    maskedMobile: '۰۹۱۲***۷۶۵۴',
    internalExtension: '۳۰۲',
    email: 'tehrani@javadian.ir',
    directManagerName: 'سهراب جوادیان',
    jobTitle: 'کارشناس ارشد فروش و بازرگانی',
    unit: 'معاونت بازرگانی و فروش',
    unitId: 'unit-sales',
    positionId: 'pos-2',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'self',
    scopeSummaryPersian: 'فقط رکوردهای خودم (پرتفوی مشتریان تخصیص‌یافته به خود)',
    financialLimitRials: 500000000,
    hireDateJalali: '۱۴۰۲/۰۴/۱۵',
    lastLoginJalali: 'امروز ۰۹:۱۵',
    allowedWarehouses: ['انبار مرکزی کهریزک'],
    allowedProductLines: ['روغن سرخ‌کردنی', 'روغن پخت‌وپز', 'روغن مایع خوراکی'],
    primaryResponsibilityId: 'resp-sales-orders',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'sales.create',
        labelPersian: 'ثبت سفارش فروش جدید',
        description: 'ثبت قرارداد و صدور پیش‌فاکتور اولیه برای مشتریان',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت ثبت سفارشات فروش',
      },
      {
        capability: 'pricing.read',
        labelPersian: 'مشاهده نرخ‌نامه و تخفیف پایه',
        description: 'مشاهده لیست قیمت روز و اعمال تخفیف تا سقف ۲٪',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت ثبت سفارشات فروش',
        scopeConstraint: 'حداکثر ۲٪ تخفیف بدون نیاز به تأیید بازرگانی',
      },
      {
        capability: 'crm.write',
        labelPersian: 'ثبت وقایع تماس و مذاکرات مشتریان',
        description: 'ثبت یادداشت‌های تماس و جلسات در پرونده مشتری',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت ثبت سفارشات فروش',
      },
    ],
    auditLog: [
      {
        id: 'aud-t1',
        timestampJalali: '۱۴۰۲/۰۴/۱۵ ۰۸:۰۰',
        action: 'ایجاد حساب کاربری',
        actor: 'مهندس آرش نیازی',
        description: 'تعریف کاربر جدید با حداقل دسترسی و سپس تخصیص مسئولیت فروش',
      },
    ],
  },
  {
    id: 'usr-prof-davoodi',
    personnelCode: 'EMP-1005',
    personnelId: 'EMP-1005',
    name: 'کامران داوودی',
    nationalCode: '۰۳۸۷۷۶۵۴۳۲',
    maskedNationalCode: '۰۳۸***۵۴۳۲',
    mobile: '۰۹۳۵۱۱۱۴۴۵۵',
    maskedMobile: '۰۹۳۵***۴۴۵۵',
    internalExtension: '۱۱۸',
    email: 'davoodi@javadian.ir',
    directManagerName: 'مهندس حامد اسدی',
    jobTitle: 'سرپرست لجستیک و انبار مرکزی',
    unit: 'معاونت عملیات و زنجیره تأمین',
    unitId: 'unit-ops',
    positionId: 'pos-5',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'unit',
    scopeSummaryPersian: 'کل واحد انبار و لجستیک (انبار کهریزک و اصفهان)',
    financialLimitRials: 500000000,
    hireDateJalali: '۱۴۰۲/۰۲/۰۱',
    lastLoginJalali: 'امروز ۰۷:۳۰',
    allowedWarehouses: ['انبار مرکزی کهریزک', 'انبار اصفهان'],
    primaryResponsibilityId: 'resp-wh-receipt',
    secondaryResponsibilityIds: ['resp-log-trans'],
    permissions: [
      {
        capability: 'warehouse_receipt.create',
        labelPersian: 'صدور رسید انبار رسمی',
        description: 'تطبیق بارنامه و توزین باسکول و ثبت رسید نهایی ورود کالا',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت کنترل باسکول و رسید انبار',
      },
      {
        capability: 'inventory.read',
        labelPersian: 'مشاهده کاردکس و موجودی انبارها',
        description: 'دسترسی کامل به کاردکس فیزیکی انبار کهریزک',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت کنترل باسکول و رسید انبار',
      },
      {
        capability: 'inventory.write',
        labelPersian: 'ثبت خروج و تحویل بار حواله',
        description: 'ترخیص کالا و تحویل به ناوگان حمل',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت کنترل باسکول و رسید انبار',
      },
      {
        capability: 'finance.payment_request.create',
        labelPersian: 'ایجاد درخواست پرداخت تسویه کرایه حمل',
        description: 'صدور درخواست پرداخت کرایه تانکرها بر اساس بارنامه و رسید انبار',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت هماهنگی ترابری ناوگان و تسویه کرایه',
        scopeConstraint: 'فقط رده کرایه حمل رانندگان تا سقف ۵۰۰ میلیون ریال',
      },
    ],
  },
  {
    id: 'usr-prof-sohrab',
    personnelCode: 'EMP-1003',
    personnelId: 'EMP-1003',
    name: 'سهراب جوادیان',
    nationalCode: '۰۰۱۱۲۲۳۳۴۴',
    maskedNationalCode: '۰۰۱***۳۳۴۴',
    mobile: '۰۹۱۲۱۱۱۰۰۹۹',
    maskedMobile: '۰۹۱۲***۰۰۹۹',
    internalExtension: '۱۰۱',
    email: 'sohrab@javadian.ir',
    directManagerName: 'مدیرعامل و هیئت مدیره',
    jobTitle: 'معاونت بازرگانی و عضو هیئت مدیره',
    unit: 'معاونت بازرگانی و فروش',
    unitId: 'unit-sales',
    positionId: 'pos-1',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'organization',
    scopeSummaryPersian: 'کل سازمان (مشاهده و تصمیم‌گیری بر کلیه اسناد فروش، نرخ و تخفیفات)',
    financialLimitRials: 50000000000,
    hireDateJalali: '۱۴۰۱/۰۱/۱۵',
    lastLoginJalali: 'امروز ۰۸:۰۰',
    primaryResponsibilityId: 'resp-comm-approve',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'sales.approve',
        labelPersian: 'تأیید نهایی سفارش‌های خارج از ضابطه',
        description: 'تأیید فروش زیر کف قیمت مصوب، تخفیفات خاص و شرایط اعتباری مازاد',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت تأیید تجاری و مصوبه نرخ',
      },
      {
        capability: 'pricing.approve',
        labelPersian: 'تصویب نرخ‌نامه پایه و خط‌مشی قیمت‌گذاری',
        description: 'تغییر قیمت پایه مصوب محصولات روغنی در سامانه',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت تأیید تجاری و مصوبه نرخ',
      },
      {
        capability: 'approvals.view',
        labelPersian: 'دسترسی کامل به کارتابل تأییدات بازرگانی',
        description: 'مشاهده درخواست‌های بازبینی شده و امضای سفارشات',
        inheritedFrom: 'position',
        sourceName: 'پست معاونت بازرگانی',
      },
    ],
  },
  {
    id: 'usr-prof-kamali',
    personnelCode: 'EMP-1011',
    personnelId: 'EMP-1011',
    name: 'مهندس بهنام کمالی',
    nationalCode: '۱۲۸۴۵۶۷۸۹۰',
    maskedNationalCode: '۱۲۸***۷۸۹۰',
    mobile: '۰۹۱۳۲۲۲۵۵۸۸',
    maskedMobile: '۰۹۱۳***۵۵۸۸',
    internalExtension: '۳۰۵',
    email: 'kamali@javadian.ir',
    directManagerName: 'سهراب جوادیان',
    jobTitle: 'سرپرست فروش میدانی و نمایندگی‌ها',
    unit: 'معاونت بازرگانی و فروش',
    unitId: 'unit-sales',
    positionId: 'pos-8',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'unit',
    scopeSummaryPersian: 'حوزه استانی منطقه مرکزی (اصفهان و یزد)',
    financialLimitRials: 50000000,
    hireDateJalali: '۱۴۰۳/۰۳/۰۱',
    lastLoginJalali: 'دیروز ۱۶:۲۰',
    primaryResponsibilityId: 'resp-sales-local',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'sales.create',
        labelPersian: 'ثبت سفارش میدانی و پیش‌فاکتور',
        description: 'ثبت درخواست‌های خریداران استانی',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت فروش منطقه‌ای',
      },
      {
        capability: 'finance.payment_request.create',
        labelPersian: 'درخواست پرداخت تسویه هزینه‌های میدانی',
        description: 'تسویه دستمزد کارگران فصلی تخلیه و رانندگان ترانزیت محلی',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت فروش منطقه‌ای',
        scopeConstraint: 'صرفاً رده کارگران موقت و رانندگان محلی تا سقف ۵۰ میلیون ریال',
      },
    ],
  },
  {
    id: 'usr-prof-salehi',
    personnelCode: 'EMP-1004',
    personnelId: 'EMP-1004',
    name: 'پروانه صالحی',
    nationalCode: '۰۰۳۴۵۶۷۸۹۹',
    maskedNationalCode: '۰۰۳***۷۸۹۹',
    mobile: '۰۹۱۲۹۹۹۳۳۲۲',
    maskedMobile: '۰۹۱۲***۳۳۲۲',
    internalExtension: '۴۰۲',
    email: 'salehi@javadian.ir',
    directManagerName: 'دکتر فرزاد شریفی',
    jobTitle: 'کارشناس حسابداری و دریافت/پرداخت',
    unit: 'مدیریت امور مالی و خزانه‌داری',
    unitId: 'unit-fin',
    positionId: 'pos-7',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'unit',
    scopeSummaryPersian: 'واحد حسابداری و خزانه‌داری',
    financialLimitRials: 300000000,
    hireDateJalali: '۱۴۰۲/۱۱/۰۱',
    lastLoginJalali: 'امروز ۱۰:۱۰',
    primaryResponsibilityId: 'resp-fin-payment',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'finance.payment_request.create',
        labelPersian: 'ثبت درخواست پرداخت مالی',
        description: 'ثبت پیش‌نویس دستور پرداخت و کنترل اسناد مثبته',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت ثبت اسناد پرداخت',
      },
      {
        capability: 'finance.read',
        labelPersian: 'مشاهده کارتابل مالی و فاکتورها',
        description: 'بررسی وضعیت اسناد در انتظار بررسی خزانه‌داری',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت ثبت اسناد پرداخت',
      },
    ],
  },
  {
    id: 'usr-prof-sharifi',
    personnelCode: 'EMP-1006',
    personnelId: 'EMP-1006',
    name: 'دکتر فرزاد شریفی',
    nationalCode: '۰۰۶۱۱۲۲۳۳۴',
    maskedNationalCode: '۰۰۶***۲۳۳۴',
    mobile: '۰۹۱۲۸۸۸۴۴۱۱',
    maskedMobile: '۰۹۱۲***۴۴۱۱',
    internalExtension: '۴۰۱',
    email: 'sharifi@javadian.ir',
    directManagerName: 'مدیرعامل',
    jobTitle: 'مدیر امور مالی و خزانه‌داری',
    unit: 'مدیریت امور مالی و خزانه‌داری',
    unitId: 'unit-fin',
    positionId: 'pos-6',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'organization',
    scopeSummaryPersian: 'کل سازمان (تصویب و اجرای اسناد پرداخت)',
    financialLimitRials: 10000000000,
    hireDateJalali: '۱۴۰۱/۰۶/۰۱',
    lastLoginJalali: 'امروز ۰۸:۲۰',
    primaryResponsibilityId: 'resp-fin-exec',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'finance.payment_request.approve',
        labelPersian: 'تأیید اسناد پرداخت مالی',
        description: 'تصویب حواله‌های پرداختی شرکت تا سقف ۱۰ میلیارد ریال',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت تأیید مالی و اجرای خزانه‌داری',
      },
      {
        capability: 'finance.payment_request.execute',
        labelPersian: 'اجرای تسویه و صدور فیش بانکی',
        description: 'ثبت اطلاعات شبا و ارسال نهایی به سامانه حسابداری پارسینا',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت تأیید مالی و اجرای خزانه‌داری',
      },
    ],
  },
  {
    id: 'usr-prof-mirzaei',
    personnelCode: 'EMP-1008',
    personnelId: 'EMP-1008',
    name: 'رضا میرزایی',
    nationalCode: '۰۰۵۴۳۲۱۶۷۸',
    maskedNationalCode: '۰۰۵***۱۶۷۸',
    mobile: '۰۹۳۰۴۴۴۷۷۸۸',
    maskedMobile: '۰۹۳۰***۷۷۸۸',
    internalExtension: '۱۱۵',
    email: 'mirzaei@javadian.ir',
    directManagerName: 'کامران داوودی',
    jobTitle: 'کارمند عملیات و لجستیک کالا',
    unit: 'معاونت عملیات و زنجیره تأمین',
    unitId: 'unit-ops',
    positionId: 'pos-9',
    accountState: 'active',
    status: 'active',
    effectiveScope: 'self',
    scopeSummaryPersian: 'صرفاً کارتابل وظایف شخصی محوله',
    financialLimitRials: 0,
    hireDateJalali: '۱۴۰۳/۰۵/۱۰',
    lastLoginJalali: 'دیروز ۱۷:۰۰',
    primaryResponsibilityId: 'resp-ops-general',
    secondaryResponsibilityIds: [],
    permissions: [
      {
        capability: 'inbox.read',
        labelPersian: 'مشاهده کارتابل شخصی کارهای من',
        description: 'انجام وظایف روزمره محوله از سوی سرپرست انبار',
        inheritedFrom: 'direct',
        sourceName: 'دسترسی پایه کاربری',
      },
      {
        capability: 'inventory.read',
        labelPersian: 'مشاهده موجودی کالاهای انبار کهریزک',
        description: 'بررسی جانمایی پالت‌ها در قفسه‌ها',
        inheritedFrom: 'position',
        sourceName: 'مسئولیت عملیات انبار و ثبت کاردکس',
      },
    ],
  },
  {
    id: 'usr-prof-inv1',
    personnelCode: 'EMP-1012',
    personnelId: 'EMP-1012',
    name: 'سارا نجفی',
    nationalCode: '۰۰۸۲۲۳۳۴۴۵',
    maskedNationalCode: '۰۰۸***۳۴۴۵',
    mobile: '۰۹۱۹۵۵۵۶۶۷۷',
    maskedMobile: '۰۹۱۹***۶۶۷۷',
    internalExtension: '۳۰۹',
    email: 's.najafi@javadian.ir',
    directManagerName: 'علیرضا تهرانی',
    jobTitle: 'کارشناس پیگیری سفارشات فروش (تازه استخدام)',
    unit: 'معاونت بازرگانی و فروش',
    unitId: 'unit-sales',
    positionId: 'pos-2',
    accountState: 'invited',
    status: 'active',
    stateReason: 'دعوت‌نامه فعال‌سازی حساب از طریق پیامک ارسال شده و در انتظار ورود اولیه است.',
    effectiveScope: 'self',
    scopeSummaryPersian: 'فاقد دسترسی تا زمان پذیرش دعوت‌نامه و تکمیل دوره آزمایشی',
    financialLimitRials: 0,
    hireDateJalali: '۱۴۰۴/۰۶/۰۱',
    primaryResponsibilityId: undefined,
    secondaryResponsibilityIds: [],
    permissions: [],
  },
  {
    id: 'usr-prof-susp1',
    personnelCode: 'EMP-1013',
    personnelId: 'EMP-1013',
    name: 'امید مرادی',
    nationalCode: '۰۰۹۳۳۴۴۵۵۶',
    maskedNationalCode: '۰۰۹***۴۵۵۶',
    mobile: '۰۹۳۶۷۷۷۸۸۹۹',
    maskedMobile: '۰۹۳۶***۸۸۹۹',
    internalExtension: '۱۱۶',
    email: 'o.moradi@javadian.ir',
    directManagerName: 'کامران داوودی',
    jobTitle: 'متصدی باسکول و انبار',
    unit: 'معاونت عملیات و زنجیره تأمین',
    unitId: 'unit-ops',
    positionId: 'pos-9',
    accountState: 'suspended',
    status: 'suspended',
    stateReason: 'تعلیق موقت حساب به دلیل مرخصی بدون حقوق سه ماهه (مصوبه منابع انسانی)',
    effectiveScope: 'self',
    scopeSummaryPersian: 'حساب در وضعیت تعلیق قرار دارد؛ کلیه دسترسی‌ها موقتاً مسدود است.',
    financialLimitRials: 0,
    hireDateJalali: '۱۴۰۲/۰۶/۰۱',
    primaryResponsibilityId: 'resp-ops-general',
    secondaryResponsibilityIds: [],
    permissions: [],
  },
  {
    id: 'usr-prof-lock1',
    personnelCode: 'EMP-1014',
    personnelId: 'EMP-1014',
    name: 'پویا صابری',
    nationalCode: '۰۱۰۰۵۵۶۶۷۷',
    maskedNationalCode: '۰۱۰***۶۶۷۷',
    mobile: '۰۹۱۲۶۶۶۳۳۴۴',
    maskedMobile: '۰۹۱۲***۳۳۴۴',
    internalExtension: '۴۰۸',
    email: 'p.saberi@javadian.ir',
    directManagerName: 'دکتر فرزاد شریفی',
    jobTitle: 'کمک حسابدار خزانه‌داری',
    unit: 'مدیریت امور مالی و خزانه‌داری',
    unitId: 'unit-fin',
    positionId: 'pos-7',
    accountState: 'locked',
    status: 'suspended',
    stateReason: 'قفل امنیتی خودکار پس از ۵ بار تلاش ناموفق برای ورود به سیستم',
    effectiveScope: 'self',
    scopeSummaryPersian: 'قفل امنیتی فعال — نیازمند تأیید بازگشایی توسط مدیر سیستم',
    financialLimitRials: 0,
    hireDateJalali: '۱۴۰۳/۰۱/۱۵',
    primaryResponsibilityId: 'resp-fin-payment',
    secondaryResponsibilityIds: [],
    permissions: [],
  },
];

export const INITIAL_DELEGATIONS: DelegationRecord[] = [
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
      id: 'usr-prof-rad',
      name: 'محسن راد',
      role: 'کارشناس ارشد عملیات',
      department: 'معاونت عملیات',
    },
    responsibilityId: 'resp-ops-supply',
    responsibilityTitle: 'تأمین و خرید مواد اولیه و روغن خام',
    title: 'تفویض وظایف مدیریت عملیات در دوره مأموریت خارجی',
    authorizedScope: 'تأیید حواله خروج انبار اضطراری و تأیید درخواست‌های تأمین تا سقف ۲ میلیارد ریال',
    authorizedCapabilities: ['approvals.view', 'supply.manage'],
    startDateJalali: '۱۴۰۴/۰۶/۰۵',
    endDateJalali: '۱۴۰۴/۰۶/۳۱',
    status: 'active',
    approvalLimitRials: 2000000000,
    reason: 'سفر کاری جهت بازدید از نمایشگاه بین‌المللی صنایع غذایی و خطوط پیشرفته بسته‌بندی',
    actionsCount: 8,
    auditEvents: [
      {
        id: 'da-1',
        timestampJalali: '۱۴۰۴/۰۶/۰۵ ۰۸:۳۰',
        action: 'صدور حکم تفویض',
        actor: 'مهندس حامد اسدی',
        details: 'تنظیم بازه زمانی تا ۱۴۰۴/۰۶/۳۱ با سقف ۲ میلیارد ریال',
      },
      {
        id: 'da-2',
        timestampJalali: '۱۴۰۴/۰۶/۰۸ ۱۴:۱۰',
        action: 'اقدام تحت تفویض',
        actor: 'محسن راد (به جانشینی مهندس اسدی)',
        details: 'تأیید حواله خروج اضطراری انبار کهریزک برای سفارش ORD-1404-0981',
      },
    ],
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
      id: 'usr-prof-salehi',
      name: 'پروانه صالحی',
      role: 'کارشناس حسابداری',
      department: 'امور مالی',
    },
    responsibilityId: 'resp-fin-payment',
    responsibilityTitle: 'ثبت و تطبیق اسناد پرداخت جاری خزانه‌داری',
    title: 'تفویض موقت بررسی اولیه اسناد هزینه جاری و بارنامه‌ها',
    authorizedScope: 'تطبیق فاکتور و صدور پیش‌نویس حواله پرداخت تا سقف ۳۰۰ میلیون ریال',
    authorizedCapabilities: ['finance.read', 'finance.payment_request.create'],
    startDateJalali: '۱۴۰۴/۰۶/۱۰',
    endDateJalali: '۱۴۰۴/۰۶/۱۷',
    status: 'active',
    approvalLimitRials: 300000000,
    reason: 'پوشش غیبت همکار و تسریع در تسویه صورت‌حساب رانندگان ترابری ناوگان',
    actionsCount: 3,
    auditEvents: [
      {
        id: 'da-3',
        timestampJalali: '۱۴۰۴/۰۶/۱۰ ۰۹:۰۰',
        action: 'صدور حکم تفویض',
        actor: 'دکتر فرزاد شریفی',
        details: 'تفویض جهت تسویه کرایه بارنامه‌های معوق رانندگان',
      },
    ],
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
      id: 'usr-prof-kamali',
      name: 'مهندس بهنام کمالی',
      role: 'سرپرست فروش منطقه‌ای',
      department: 'فروش میدانی',
    },
    responsibilityId: 'resp-sales-local',
    responsibilityTitle: 'مدیریت فروش منطقه‌ای',
    title: 'تفویض تأیید تخفیفات نمایندگی‌های منطقه مرکزی',
    authorizedScope: 'تأیید تخفیف تا سقف ۳٪ برای مشتریان رتبه الف استان اصفهان و مرکزی',
    authorizedCapabilities: ['pricing.approve'],
    startDateJalali: '۱۴۰۴/۰۵/۰۱',
    endDateJalali: '۱۴۰۴/۰۵/۳۰',
    status: 'expired',
    approvalLimitRials: 5000000000,
    reason: 'طرح تشویقی فروش تابستانه روغن خوراکی خانوار در شعب استانی',
    actionsCount: 14,
    auditEvents: [
      {
        id: 'da-4',
        timestampJalali: '۱۴۰۴/۰۵/۰۱ ۰۸:۰۰',
        action: 'صدور حکم تفویض',
        actor: 'سهراب جوادیان',
        details: 'تفویض تخفیفات برای طرح تابستانه',
      },
      {
        id: 'da-5',
        timestampJalali: '۱۴۰۴/۰۵/۳۱ ۰۰:۰۰',
        action: 'انقضای سیستمی حکم',
        actor: 'سامانه مرکزی',
        details: 'پایان مهلت قانونی اعتبار حکم تفویض و حذف خودکار دسترسی‌های جانشینی',
      },
    ],
  },
  {
    id: 'del-rec-4',
    code: 'DEL-1404-04',
    delegator: {
      id: 'p-ops-dir',
      name: 'مهندس حامد اسدی',
      role: 'مدیر ارشد عملیات',
      department: 'معاونت عملیات',
    },
    delegatee: {
      id: 'usr-prof-davoodi',
      name: 'کامران داوودی',
      role: 'سرپرست لجستیک و انبار مرکزی',
      department: 'معاونت عملیات',
    },
    responsibilityId: 'resp-ops-supply',
    responsibilityTitle: 'تأمین و خرید مواد اولیه و روغن خام',
    title: 'سرپرستی موقت عملیات انبارداری در تعطیلات تقویمی آتی',
    authorizedScope: 'مدیریت ورود و خروج اضطراری و تأیید بارگیری شبانه تانکرها',
    authorizedCapabilities: ['supply.manage', 'inventory.write'],
    startDateJalali: '۱۴۰۴/۰۷/۰۱',
    endDateJalali: '۱۴۰۴/۰۷/۱۰',
    status: 'future',
    approvalLimitRials: 1000000000,
    reason: 'پوشش کشیک عملیاتی انبار مرکزی در دوره اورهال فصلی مخازن روغن',
    actionsCount: 0,
    auditEvents: [
      {
        id: 'da-6',
        timestampJalali: '۱۴۰۴/۰۶/۱۲ ۱۶:۰۰',
        action: 'ثبت حکم تفویض آتی',
        actor: 'مهندس حامد اسدی',
        details: 'ثبت حکم برای فعال‌سازی خودکار در تاریخ ۱۴۰۴/۰۷/۰۱',
      },
    ],
  },
  {
    id: 'del-rec-5',
    code: 'DEL-1404-05',
    delegator: {
      id: 'p-comm-approver',
      name: 'سهراب جوادیان',
      role: 'معاونت بازرگانی',
      department: 'بازرگانی',
    },
    delegatee: {
      id: 'usr-prof-tehrani',
      name: 'علیرضا تهرانی',
      role: 'کارشناس ارشد فروش',
      department: 'واحد فروش',
    },
    responsibilityId: 'resp-comm-approve',
    responsibilityTitle: 'تأیید تجاری و مصوبه نرخ',
    title: 'تفویض موردی تأیید تخفیفات فصلی به کارشناس فروش',
    authorizedScope: 'تأیید تخفیف تا سقف ۲.۵٪ برای قراردادهای بنکداری تهران',
    authorizedCapabilities: ['pricing.approve'],
    startDateJalali: '۱۴۰۴/۰۶/۰۱',
    endDateJalali: '۱۴۰۴/۰۶/۲۰',
    status: 'revoked',
    approvalLimitRials: 1000000000,
    reason: 'پوشش دوره نمایشگاه بین‌المللی تهران',
    revocationReason: 'ابطال پیش از موعد به دلیل تداخل با اصل تفکیک وظایف (SoD) و گزارش مغایرت نرخ بازرگانی',
    revokedAtJalali: '۱۴۰۴/۰۶/۰۸ ۱۰:۱۵',
    revokedBy: 'سهراب جوادیان',
    actionsCount: 2,
    auditEvents: [
      {
        id: 'da-7',
        timestampJalali: '۱۴۰۴/۰۶/۰۱ ۰۹:۰۰',
        action: 'صدور حکم تفویض',
        actor: 'سهراب جوادیان',
        details: 'تفویض موقت اختیارات تخفیف',
      },
      {
        id: 'da-8',
        timestampJalali: '۱۴۰۴/۰۶/۰۸ ۱۰:۱۵',
        action: 'ابطال رسمی حکم تفویض',
        actor: 'سهراب جوادیان',
        details: 'ابطال قطعی اختیارات با علت: نقض تفکیک وظایف و ثبت در پرونده ممیزی',
      },
    ],
  },
];

/**
 * Reactive Mock Organization Store
 */
class MockOrgStore {
  private units: OrgUnit[] = [...INITIAL_ORG_UNITS];
  private positions: OrgPosition[] = [...INITIAL_POSITIONS];
  private responsibilities: ResponsibilityArea[] = [...INITIAL_RESPONSIBILITY_AREAS];
  private assignments: ResponsibilityAssignment[] = [...INITIAL_RESPONSIBILITY_ASSIGNMENTS];
  private users: UserAccessProfile[] = [...INITIAL_USER_PROFILES];
  private delegations: DelegationRecord[] = [...INITIAL_DELEGATIONS];
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public getUnits(): OrgUnit[] {
    return [...this.units];
  }

  public getPositions(): OrgPosition[] {
    return [...this.positions];
  }

  public getResponsibilities(): ResponsibilityArea[] {
    return [...this.responsibilities];
  }

  public getAssignments(): ResponsibilityAssignment[] {
    return [...this.assignments];
  }

  public getUsers(): UserAccessProfile[] {
    return [...this.users];
  }

  public getUserById(id: string): UserAccessProfile | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getDelegations(): DelegationRecord[] {
    return [...this.delegations];
  }

  // ================= USERS MANAGEMENT =================

  public createUser(payload: {
    fullName: string;
    personnelCode: string;
    nationalCode: string;
    mobile: string;
    email?: string;
    internalExtension?: string;
    directManagerName?: string;
    unitId: string;
    positionId: string;
    accountState: UserAccountState;
    actorName: string;
  }): UserAccessProfile {
    const unit = this.units.find((u) => u.id === payload.unitId);
    const position = this.positions.find((p) => p.id === payload.positionId);

    const maskedNat = payload.nationalCode.length >= 6
      ? `${payload.nationalCode.slice(0, 3)}***${payload.nationalCode.slice(-4)}`
      : '***';
    const maskedMob = payload.mobile.length >= 7
      ? `${payload.mobile.slice(0, 4)}***${payload.mobile.slice(-4)}`
      : '***';

    const newUser: UserAccessProfile = {
      id: `usr-${Date.now()}`,
      personnelCode: payload.personnelCode,
      personnelId: payload.personnelCode,
      name: payload.fullName,
      nationalCode: payload.nationalCode,
      maskedNationalCode: maskedNat,
      mobile: payload.mobile,
      maskedMobile: maskedMob,
      email: payload.email || `${payload.personnelCode.toLowerCase()}@javadian.ir`,
      internalExtension: payload.internalExtension || '---',
      directManagerName: payload.directManagerName || unit?.managerName || 'مدیر واحد',
      jobTitle: position?.title || 'کارمند سازمانی',
      unit: unit?.name || 'سازمان',
      unitId: payload.unitId,
      positionId: payload.positionId,
      accountState: payload.accountState,
      status: payload.accountState === 'active' ? 'active' : 'suspended',
      effectiveScope: 'self',
      scopeSummaryPersian: 'فقط رکوردهای خودم (پایه جدید بدون مجوز گسترده)',
      financialLimitRials: 0,
      hireDateJalali: '۱۴۰۴/۰۶/۱۵',
      permissions: [
        {
          capability: 'inbox.read',
          labelPersian: 'مشاهده کارتابل کارهای من',
          description: 'دسترسی پایه شخصی ورود به سامانه و ثبت اقدامات محوله',
          inheritedFrom: 'direct',
          sourceName: 'دسترسی پایه استاندارد کاربر جدید',
        },
      ],
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          timestampJalali: 'هم‌اکنون',
          action: 'ایجاد حساب کاربری',
          actor: payload.actorName,
          description: `تعریف پرسنل جدید با شناسه ${payload.personnelCode}. بر اساس ضابطه امنیتی، کاربر فاقد دسترسی گسترده است تا زمان تخصیص مسئولیت.`,
        },
      ],
    };

    this.users.unshift(newUser);
    this.notify();
    return newUser;
  }

  public updateUserAccountState(
    userId: string,
    newState: UserAccountState,
    reason: string,
    actorName: string
  ): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    const oldState = user.accountState;
    user.accountState = newState;
    user.status = newState === 'active' ? 'active' : 'suspended';
    user.stateReason = reason;

    user.auditLog = user.auditLog || [];
    user.auditLog.unshift({
      id: `aud-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: `تغییر وضعیت حساب از ${oldState} به ${newState}`,
      actor: actorName,
      description: `علت ثبت‌شده: ${reason}`,
    });

    this.notify();
    return true;
  }

  public resetUserPassword(userId: string, actorName: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    user.auditLog = user.auditLog || [];
    user.auditLog.unshift({
      id: `aud-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: 'ارسال پیوند بازنشانی کلمه عبور',
      actor: actorName,
      description: `پیامک امنیتی حاوی لینک فعال‌سازی مجدد به شماره ${user.maskedMobile || user.mobile} ارسال گردید.`,
    });

    this.notify();
    return true;
  }

  // ================= RESPONSIBILITIES MANAGEMENT =================

  public assignResponsibility(payload: {
    userId: string;
    responsibilityId: string;
    isPrimary: boolean;
    startDateJalali: string;
    endDateJalali?: string;
    assignedBy: string;
    notes?: string;
  }): boolean {
    const user = this.users.find((u) => u.id === payload.userId);
    const resp = this.responsibilities.find((r) => r.id === payload.responsibilityId);
    if (!user || !resp) return false;

    // Remove existing if assigned to avoid duplicate
    this.assignments = this.assignments.filter(
      (a) => !(a.userId === payload.userId && a.responsibilityId === payload.responsibilityId)
    );

    const newAssignment: ResponsibilityAssignment = {
      id: `asg-${Date.now()}`,
      userId: payload.userId,
      userName: user.name,
      responsibilityId: payload.responsibilityId,
      responsibilityTitle: resp.title,
      isPrimary: payload.isPrimary,
      startDateJalali: payload.startDateJalali,
      endDateJalali: payload.endDateJalali,
      assignedBy: payload.assignedBy,
      status: 'active',
      notes: payload.notes,
    };

    this.assignments.unshift(newAssignment);

    // Update user's primary/secondary responsibilities
    if (payload.isPrimary) {
      user.primaryResponsibilityId = payload.responsibilityId;
    } else {
      user.secondaryResponsibilityIds = user.secondaryResponsibilityIds || [];
      if (!user.secondaryResponsibilityIds.includes(payload.responsibilityId)) {
        user.secondaryResponsibilityIds.push(payload.responsibilityId);
      }
    }

    // Add inherited permissions to user
    resp.inheritedCapabilities.forEach((cap) => {
      const existing = user.permissions.find((p) => p.capability === cap);
      if (!existing) {
        user.permissions.push({
          capability: cap,
          labelPersian: `قابلیت ${cap}`,
          description: `اعطا شده از حوزه مسئولیت: «${resp.title}»`,
          inheritedFrom: 'position',
          sourceName: `حوزه مسئولیت ${resp.title}`,
        });
      }
    });

    user.auditLog = user.auditLog || [];
    user.auditLog.unshift({
      id: `aud-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: `تخصیص مسئولیت ${payload.isPrimary ? 'اصلی' : 'ثانویه'}`,
      actor: payload.assignedBy,
      description: `تخصیص حوزه «${resp.title}» به ${user.name}. قابلیت‌های مرتبط اضافه شدند.`,
    });

    this.notify();
    return true;
  }

  public revokeResponsibilityAssignment(assignmentId: string, actorName: string, reason: string): boolean {
    const asg = this.assignments.find((a) => a.id === assignmentId);
    if (!asg) return false;

    asg.status = 'revoked';
    const user = this.users.find((u) => u.id === asg.userId);
    const resp = this.responsibilities.find((r) => r.id === asg.responsibilityId);

    if (user && resp) {
      if (asg.isPrimary && user.primaryResponsibilityId === resp.id) {
        user.primaryResponsibilityId = undefined;
      } else if (user.secondaryResponsibilityIds) {
        user.secondaryResponsibilityIds = user.secondaryResponsibilityIds.filter((id) => id !== resp.id);
      }

      // Remove inherited permissions from this specific responsibility
      user.permissions = user.permissions.filter(
        (p) => !(p.inheritedFrom === 'position' && p.sourceName?.includes(resp.title))
      );

      user.auditLog = user.auditLog || [];
      user.auditLog.unshift({
        id: `aud-${Date.now()}`,
        timestampJalali: 'هم‌اکنون',
        action: 'لغو مسئولیت',
        actor: actorName,
        description: `لغو حوزه «${resp.title}» با علت: ${reason}`,
      });
    }

    this.notify();
    return true;
  }

  // ================= DELEGATIONS MANAGEMENT =================

  public createDelegation(payload: {
    delegatorId: string;
    delegatorName: string;
    delegatorRole: string;
    delegateeId: string;
    delegateeName: string;
    delegateeRole: string;
    responsibilityId?: string;
    responsibilityTitle: string;
    authorizedCapabilities: Capability[];
    authorizedScope: string;
    startDateJalali: string;
    endDateJalali: string;
    approvalLimitRials?: number;
    reason: string;
    actorName: string;
  }): DelegationRecord {
    const code = `DEL-1404-${String(this.delegations.length + 1).padStart(2, '0')}`;
    const newDel: DelegationRecord = {
      id: `del-rec-${Date.now()}`,
      code,
      delegator: {
        id: payload.delegatorId,
        name: payload.delegatorName,
        role: payload.delegatorRole,
        department: 'سازمان',
      },
      delegatee: {
        id: payload.delegateeId,
        name: payload.delegateeName,
        role: payload.delegateeRole,
        department: 'سازمان',
      },
      responsibilityId: payload.responsibilityId,
      responsibilityTitle: payload.responsibilityTitle,
      title: `تفویض اختیارات «${payload.responsibilityTitle}» به ${payload.delegateeName}`,
      authorizedScope: payload.authorizedScope,
      authorizedCapabilities: payload.authorizedCapabilities,
      startDateJalali: payload.startDateJalali,
      endDateJalali: payload.endDateJalali,
      status: 'active',
      approvalLimitRials: payload.approvalLimitRials,
      reason: payload.reason,
      actionsCount: 0,
      auditEvents: [
        {
          id: `da-${Date.now()}`,
          timestampJalali: 'هم‌اکنون',
          action: 'صدور رسمی حکم تفویض',
          actor: payload.actorName,
          details: `صدور حکم توسط ${payload.delegatorName} برای ${payload.delegateeName} با علت: ${payload.reason}`,
        },
      ],
    };

    this.delegations.unshift(newDel);

    // Apply active delegation to delegatee profile
    const delegateeUser = this.users.find((u) => u.id === payload.delegateeId);
    if (delegateeUser) {
      delegateeUser.activeDelegation = {
        delegatorName: payload.delegatorName,
        scopeTitle: payload.authorizedScope,
        validUntilJalali: payload.endDateJalali,
      };

      // Add delegated permissions
      payload.authorizedCapabilities.forEach((cap) => {
        const existing = delegateeUser.permissions.find((p) => p.capability === cap);
        if (!existing) {
          delegateeUser.permissions.push({
            capability: cap,
            labelPersian: `قابلیت ${cap}`,
            description: `تفویض شده از جانب ${payload.delegatorName} (حکم شماره ${code})`,
            inheritedFrom: 'delegation',
            sourceName: `حکم تفویض ${code}`,
            scopeConstraint: payload.approvalLimitRials
              ? `سقف مبلغ ${payload.approvalLimitRials.toLocaleString('fa-IR')} ریال`
              : undefined,
          });
        }
      });

      delegateeUser.auditLog = delegateeUser.auditLog || [];
      delegateeUser.auditLog.unshift({
        id: `aud-${Date.now()}`,
        timestampJalali: 'هم‌اکنون',
        action: 'دریافت اختیارات جانشینی',
        actor: payload.actorName,
        description: `حکم شماره ${code} صادر گردید. اعتبار تا ${payload.endDateJalali}.`,
      });
    }

    this.notify();
    return newDel;
  }

  public revokeDelegation(delegationId: string, actorName: string, reason: string): boolean {
    const del = this.delegations.find((d) => d.id === delegationId);
    if (!del) return false;

    del.status = 'revoked';
    del.revocationReason = reason;
    del.revokedAtJalali = 'هم‌اکنون';
    del.revokedBy = actorName;

    del.auditEvents = del.auditEvents || [];
    del.auditEvents.unshift({
      id: `da-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: 'ابطال رسمی حکم تفویض',
      actor: actorName,
      details: `ابطال پیش از موعد اختیارات با علت: ${reason}`,
    });

    // Remove active delegation from delegatee profile
    const delegateeUser = this.users.find((u) => u.id === del.delegatee.id);
    if (delegateeUser) {
      if (delegateeUser.activeDelegation?.scopeTitle === del.authorizedScope) {
        delegateeUser.activeDelegation = undefined;
      }
      // Remove permissions inherited from this delegation
      delegateeUser.permissions = delegateeUser.permissions.filter(
        (p) => !(p.inheritedFrom === 'delegation' && p.sourceName?.includes(del.code))
      );

      delegateeUser.auditLog = delegateeUser.auditLog || [];
      delegateeUser.auditLog.unshift({
        id: `aud-${Date.now()}`,
        timestampJalali: 'هم‌اکنون',
        action: 'ابطال اختیارات جانشینی',
        actor: actorName,
        description: `حکم شماره ${del.code} لغو گردید. کلیه دسترسی‌های تفویضی فوراً حذف شدند.`,
      });
    }

    this.notify();
    return true;
  }

  // ================= PERMISSION EXCEPTIONS & EXPLANATION =================

  public addDirectException(payload: {
    userId: string;
    capability: Capability;
    actionType: 'GRANT' | 'RESTRICT';
    reason: string;
    scopeConstraint?: string;
    actorName: string;
  }): boolean {
    const user = this.users.find((u) => u.id === payload.userId);
    if (!user) return false;

    user.directExceptions = user.directExceptions || [];
    const newEx: DirectPermissionException = {
      id: `ex-${Date.now()}`,
      userId: payload.userId,
      capability: payload.capability,
      actionType: payload.actionType,
      grantedBy: payload.actorName,
      reason: payload.reason,
      grantedAtJalali: 'هم‌اکنون',
      scopeConstraint: payload.scopeConstraint,
    };

    user.directExceptions.unshift(newEx);

    if (payload.actionType === 'GRANT') {
      const existing = user.permissions.find((p) => p.capability === payload.capability);
      if (!existing) {
        user.permissions.push({
          capability: payload.capability,
          labelPersian: `قابلیت ${payload.capability}`,
          description: `تخصیص مستقیم توسط مدیر سیستم (${payload.reason})`,
          inheritedFrom: 'direct',
          sourceName: 'تخصیص مستقیم استثنا توسط مدیر سیستم',
          scopeConstraint: payload.scopeConstraint,
        });
      }
    } else {
      user.permissions = user.permissions.filter((p) => p.capability !== payload.capability);
    }

    user.auditLog = user.auditLog || [];
    user.auditLog.unshift({
      id: `aud-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: payload.actionType === 'GRANT' ? 'اعطای استثنای دسترسی مستقیم' : 'محدودسازی مستقیم دسترسی',
      actor: payload.actorName,
      description: `قابلیت ${payload.capability} با علت: ${payload.reason}`,
    });

    this.notify();
    return true;
  }

  public removeDirectException(userId: string, exceptionId: string, actorName: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user || !user.directExceptions) return false;

    const found = user.directExceptions.find((e) => e.id === exceptionId);
    if (!found) return false;

    user.directExceptions = user.directExceptions.filter((e) => e.id !== exceptionId);
    if (found.actionType === 'GRANT') {
      user.permissions = user.permissions.filter(
        (p) => !(p.inheritedFrom === 'direct' && p.capability === found.capability)
      );
    }

    user.auditLog = user.auditLog || [];
    user.auditLog.unshift({
      id: `aud-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      action: 'حذف استثنای دسترسی مستقیم',
      actor: actorName,
      description: `استثنای مربوط به قابلیت ${found.capability} حذف شد.`,
    });

    this.notify();
    return true;
  }
}

export const mockOrgStore = new MockOrgStore();
