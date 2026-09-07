export type RoleFilterCategory = 'all' | 'ops_warehouse' | 'sales' | 'finance' | 'management';

export interface CleanRoleMeta {
  id: string;
  name: string;
  jobTitle: string;
  category: Exclude<RoleFilterCategory, 'all'>;
  isDocumented: boolean;
  badgeText: string;
  keyCapabilities: [string, string];
  accessSummary: string;
}

export const ROLE_FILTER_TABS: { key: RoleFilterCategory; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'ops_warehouse', label: 'عملیات و انبار' },
  { key: 'sales', label: 'فروش' },
  { key: 'finance', label: 'مالی' },
  { key: 'management', label: 'مدیریت' },
];

export const CLEAN_ROLE_METAS: Record<string, CleanRoleMeta> = {
  // ۱. عملیات و انبار
  'p-warehouse': {
    id: 'p-warehouse',
    name: 'آرش',
    jobTitle: 'مسئول لجستیک و هماهنگی خرید',
    category: 'ops_warehouse',
    isDocumented: true,
    badgeText: 'نقش سازمانی',
    keyCapabilities: [
      'ثبت رسید انبار بر اساس بارنامه و باسکول',
      'ثبت درخواست پرداخت برای هزینه حمل بار',
    ],
    accessSummary: 'رسید ورود کالا را ثبت کنید و برای هزینه‌های کرایه حمل بارنامه درخواست پرداخت تشکیل دهید.',
  },
  'p-ordinary': {
    id: 'p-ordinary',
    name: 'مسئول انبار',
    jobTitle: 'واحد عملیات و نگهداری کالا',
    category: 'ops_warehouse',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'مشاهده کاردکس و موجودی لحظه‌ای کالاها',
      'انجام امور روزمره و گردش فیزیکی انبار',
    ],
    accessSummary: 'موجودی لحظه‌ای انبارها و گردش اقلام را بررسی کنید.',
  },
  'p-master-data': {
    id: 'p-master-data',
    name: 'مسئول اطلاعات پایه',
    jobTitle: 'واحد فناوری اطلاعات و کاتالوگ',
    category: 'ops_warehouse',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'تعریف کاتالوگ و مشخصات اوزان اقلام روغن',
      'تنظیم نرخ‌های پایه و مصوب فروش محصولات',
    ],
    accessSummary: 'اقلام کاتالوگ، اوزان بسته‌بندی، ضرایب کارتن و نرخ پایه مصوب را تنظیم نمایید.',
  },

  // ۲. فروش
  'p-field-sales': {
    id: 'p-field-sales',
    name: 'آقای نادری',
    jobTitle: 'مسئول فروش مویرگی استان قم',
    category: 'sales',
    isDocumented: true,
    badgeText: 'نقش سازمانی',
    keyCapabilities: [
      'ویزیت و ثبت سفارش مشتریان استان قم',
      'ثبت پرداخت هزینه‌های کارگری و رانندگان قم',
    ],
    accessSummary: 'برنامه‌های ویزیت و پیش‌فاکتورهای استان قم را مدیریت کنید و پرداخت کارگر و راننده محلی قم ثبت نمایید.',
  },
  'p-sales': {
    id: 'p-sales',
    name: 'کارشناس فروش',
    jobTitle: 'واحد فروش و بازرگانی داخلی',
    category: 'sales',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'ثبت سفارش و صدور پیش‌فاکتور فروش',
      'ایجاد پیش‌نویس خروج کالا از انبار',
    ],
    accessSummary: 'سفارش‌های مشتریان را ثبت نموده و پیش‌نویس خروج کالا صادر کنید.',
  },

  // ۳. مالی
  'p-fin-spec': {
    id: 'p-fin-spec',
    name: 'کارشناس مالی',
    jobTitle: 'واحد امور مالی و حسابداری',
    category: 'finance',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'بررسی مدارک و ثبت اولیه دستورهای پرداخت',
      'کنترل اسناد مالی و ارجاع به مرحله تصویب',
    ],
    accessSummary: 'مدارک و ضمائم فاکتورها را بررسی کرده و درخواست‌های پرداخت شرکتی را ثبت اولیه کنید.',
  },
  'p-fin-dir': {
    id: 'p-fin-dir',
    name: 'تأییدکننده مالی',
    jobTitle: 'مدیریت مالی و خزانه‌داری',
    category: 'finance',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'بررسی و تأیید نهایی اسناد پرداخت',
      'اجرای تسویه بانکی و ثبت فیش واریز',
    ],
    accessSummary: 'دستورهای پرداخت را تأیید نموده و شماره پیگیری و فیش تسویه حساب بانکی را ثبت نمایید.',
  },

  // ۴. مدیریت
  'p-ops-dir': {
    id: 'p-ops-dir',
    name: 'آقای منتظری',
    jobTitle: 'مدیرعامل',
    category: 'management',
    isDocumented: true,
    badgeText: 'نقش سازمانی',
    keyCapabilities: [
      'پایش داشبورد کلان عملیات و عملکرد سازمان',
      'صدور حواله خروج و ثبت رسید جانشین',
    ],
    accessSummary: 'شاخص‌های کلان سازمان را رصد کنید و در غیاب مسئول، رسید انبار یا پیش‌نویس فروش صادر نمایید.',
  },
  'p-multi-delegate': {
    id: 'p-multi-delegate',
    name: 'آقای یوسفی',
    jobTitle: 'جانشین عملیاتی و رابط تأمین',
    category: 'management',
    isDocumented: true,
    badgeText: 'نقش سازمانی',
    keyCapabilities: [
      'جانشین ثبت رسید انبار در غیاب مسئول اصلی',
      'هماهنگی با تأمین‌کنندگان و ثبت پرداخت تأمین',
    ],
    accessSummary: 'در نبود آرش فرم رسید انبار را ثبت کنید و با تأمین‌کنندگان کالا ارتباط و ثبت پرداخت داشته باشید.',
  },
  'p-comm-approver': {
    id: 'p-comm-approver',
    name: 'تأییدکننده بازرگانی',
    jobTitle: 'معاونت بازرگانی و فروش',
    category: 'management',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'بررسی و تأیید مستقل سفارش‌های فروش',
      'کنترل مغایرت قیمت و سقف تخفیف مجاز',
    ],
    accessSummary: 'سفارش‌های فروش ارجاع‌شده را بررسی و تأیید کنید تا تفکیک وظایف با فروشندگان رعایت شود.',
  },
  'p-admin-ops': {
    id: 'p-admin-ops',
    name: 'مدیر سیستم',
    jobTitle: 'مدیریت فناوری و زیرساخت',
    category: 'management',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'مدیریت کاربران و انتساب نقش‌های سازمانی',
      'تنظیم احکام تفویض اختیار و جانشینی',
    ],
    accessSummary: 'کاربران را تعریف و ویرایش کرده و احکام تفویض اختیار جانشینی را ثبت کنید.',
  },
  'p-no-access': {
    id: 'p-no-access',
    name: 'کارآموز مهمان',
    jobTitle: 'واحد آموزش و کارآموزی',
    category: 'management',
    isDocumented: false,
    badgeText: 'نقش نمونه',
    keyCapabilities: [
      'شبیه‌سازی ورود بدون صلاحیت سازمانی',
      'آزمون کنترل‌های امنیتی و صفحه خطای ۴۰۳',
    ],
    accessSummary: 'عدم دسترسی به بخش‌های مختلف و رفتار صفحه ۴۰۳ را بیازمایید.',
  },
};
