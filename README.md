> گزارش آخرین تحویل و محدودیت‌های اعتبارسنجی: [UPDATE_REPORT_FA.md](UPDATE_REPORT_FA.md)

# سامانه عملیات جوادیان

**Installable Prototype PWA — No Production Backend**

نسخهٔ نمایشی قابل نصب با داده‌های ساختگی، بدون سرور عملیاتی، احراز هویت واقعی، اتصال مالی، بانک یا پارسینا. تعویض پرسونا فقط برای ارزیابی نقش‌هاست. رسید انبار همچنان `DEFERRED` است.

## اجرای محلی

پیش‌نیازها: Node.js 22 یا جدیدتر و Bun. نصب و قفل وابستگی‌ها با Bun مدیریت می‌شود.

```sh
bun install --frozen-lockfile
bun run dev
```

نیازی به کلید API یا فایل حاوی اطلاعات محرمانه نیست. `DISABLE_HMR` فقط یک گزینهٔ اختیاری محیط توسعه است. فونت‌ها محلی‌اند و نمایش حساب‌های دمو به سرویس تصویر خارجی وابسته نیست.

## بررسی و ساخت

```sh
bun run typecheck
bun run lint
bun run test
bun run build
```

`lint` موجود پروژه همان `tsc --noEmit` است؛ ESLint جداگانه در پروژه تنظیم نشده است. آزمون‌های اضافه‌شده، قواعد فروش و تأمین، کش سرویس‌ورکر و ساختار HTML اجزای رابط را بررسی می‌کنند؛ جایگزین تست مرورگر نیستند.

خروجی استاتیک در `dist/` ساخته می‌شود. راهنمای میزبانی مستقل در [DEPLOYMENT.md](DEPLOYMENT.md) است. در این مرحله هیچ استقراری انجام نشده است.

## گزارش‌ها

- [UI_UX_AUDIT.md](UI_UX_AUDIT.md)
- [DESIGN_TOKENS.md](DESIGN_TOKENS.md)
- [AI_ICON_REMOVAL_REPORT.md](AI_ICON_REMOVAL_REPORT.md)
- [RESPONSIVE_TEST_REPORT.md](RESPONSIVE_TEST_REPORT.md)
- [REGRESSION_REPORT.md](REGRESSION_REPORT.md)
- [CHANGED_FILES.md](CHANGED_FILES.md)

وضعیت نهایی و محدودیت شواهد تصویری را پیش از پذیرش در گزارش‌ها بخوانید.
