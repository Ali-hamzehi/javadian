# Initial UI/UX audit — supplied ZIP

Final status: **UI/UX Responsive Refinement — PARTIAL**. Product remains **Installable Prototype PWA — No Production Backend**.

## Findings before source changes
- React 19, TypeScript, Vite 6, Tailwind 4, Lucide; Bun text lockfile. Existing lint command is TypeScript checking; no separate lint config or test suite.
- Strengths: local Vazirmatn fonts, RTL document, shared buttons/fields/modals/drawers, role-aware desktop sidebar, purpose-built inbox mobile cards, explicit prototype and deferred states, same-origin service worker with static allowlist.
- Typography: hundreds of text-xs and arbitrary 9/10/11px classes; full counts in docs/BASELINE_INVENTORY.json. Meaningful labels, hints and badges are too small.
- Accessibility: FormField often has no id and does not connect descendants; custom Switch is a clickable div; dialogs handle Escape but do not trap or restore focus; several custom overlays lack dialog roles; clickable inbox rows/cards have no keyboard action. Icon buttons frequently rely on title or have no name.
- Mobile: desktop sidebar already uses hidden md:block (historical 119px collapse is not yet reproduced). Header packs title, persona, notification and profile actions in one row. Persona menu has fixed 320px width. Mobile drawer inherits desktop collapsed state and lacks an internal close button. Bottom-nav destinations can duplicate sales or bypass route eligibility.
- Desktop: fixed-width sidebar brand and collapse control compete for space; wide data tables have no visible scroll affordance; controls as short as 32px. Forms are already broadly grouped with responsive grids.
- Visual density: nested panels, short line heights and tiny badges; arbitrary spacing and strong card shadows.
- Color: widespread indigo primary and purple accents; status, role and decorative color overlap. No official brand guide found. Existing Javadian ج PWA mark is retained.
- AI elements: Sparkles in login (two controls), persona switcher, next-action panel and update banner; six further unused imports. These represent real non-AI actions and will be replaced or removed, retaining behavior. No actual assistant workflow found.
- Portability: README and .env.example incorrectly require Gemini/AI Studio. Runtime has no Google SDK imports; external avatar URLs exist in mock data.

## Protected areas
All src/data, src/types, route capability predicates and authorization/calculation utilities are preserved. No integration, authentication, inventory or lifecycle changes. Keep all service-worker allowlists and PWA assets. No deployment.

## Decisions
Use restrained teal action tokens with navy shell and separate blue/amber/green/red semantics. Raise typography in source, centralize dimensions and states, repair shared form and overlay accessibility, then verify actual UI. Preserve architecture, package manifest and lockfile.

## Open risks before verification
Build, runtime, target viewport and behavioral checks pending. Native iOS install, software keyboard and real-device safe areas require device testing. Shared repairs must also account for bespoke customer overlays.

## Final implementation and rationale

- Navy sidebar and light canvas retained. Primary actions now use restrained named teal tokens; shared business feedback uses separate semantic colors. White small text uses primary-700 rather than brighter teal.
- Original source had 882 text-xs occurrences plus 528 × 11px, 455 × 10px, 8 × 9px and 1 × 8px arbitrary text classes. Tiny classes became 12px caption tokens; operational text uses 13–14px desktop and 16px below 1024px. Map text no longer scales into tiny phone text.
- The mobile/desktop shell boundary is 1024px to avoid squeezing tablet content beside a fixed sidebar. Drawer content is independent of desktop collapse, and navigation follows the existing permission predicate. No capability rules changed.
- FormField context and FieldGroup instance IDs connect reusable controls and 174 legacy field groups to labels. Errors expose associated descriptions. Thirty existing icon controls received explicit names in the source migration; new shared controls are also named.
- Native dialog surfaces consolidate focus/inert/Escape behavior and bound content to 100dvh. Modal scroll lock is intentional; no body overflow-hiding rule was used to mask a layout defect. Nested-dialog history guards require browser acceptance.
- AdaptiveTable annotates cells from their actual headers and retains original values/handlers. Dense mobile tables become cards; comparison matrices retain deliberate scrolling. Existing custom mobile cards remain.
- Demo persona avatars render local monograms instead of requesting remote images. The underlying persona data is unchanged. Original PWA marks are retained as supplied.
- Readiness and integration disclosures are preserved; no backend, production auth, inventory authority, settlement or deployment capability was added.
- Setup and self-hosting documentation now describe the actual static, root-path PWA without AI Studio/Gemini requirements.

## Verification outcome and unresolved risks

Initial and final TypeScript/build commands passed. Final tests: 15/15. Thirty-one protected files match the original ZIP; 110 non-shell event handlers are unchanged. See REGRESSION_REPORT.md for exact boundaries.

Browser access failed with ERR_BLOCKED_BY_CLIENT even though preview health was confirmed, and failed again on the allowed retry. Thus none of the requested viewport/zoom/device UI checks or seven screenshots is complete. No WCAG 2.2 AA conformance, zero-overflow or console-cleanliness claim is made.

Remaining risks include composed-screen contrast and density, bespoke field groups/badges outside shared primitives, native dialog nesting and browser Back, mobile keyboard/safe areas, and actual PWA install/update behavior. The retained monolithic bundle still triggers Vite's >500KB warning. The existing dependency manifest also retains its duplicate Vite declaration and unused Google SDK dependency; no dependency graph change was needed for this pass.

This source is an implemented refinement ready for visual review, not an accepted responsive release. The required acceptance matrix is in RESPONSIVE_TEST_REPORT.md.

---

## Enterprise Card-Based UI/UX & Localization Overhaul (فاز تحول سازمانی کارت‌محور)

### دستاوردهای پیاده‌سازی شده بر اساس نیازمندی‌های سازمانی و بومی:
1. **طراحی پلاک ملی خودروهای باری و ناوگان ایران (`IranianPlate.tsx`):**
   - پیاده‌سازی استاندارد پلاک ملی جمهوری اسلامی ایران شامل نوار آبی و پرچم سه رنگ با نشان الله، حروف فارسی (ع، ب، ت، ل، د، ج)، کد دو رقمی استان/منطقه و تفکیک رنگ پلاک عمومی (زرد برای ناوگان باری) و پلاک شخصی (سفید).
   - تعبیه در کارتابل ترخیص انبار، مدیریت لجستیک و ترابری، پیش‌نمایش زنده در فرم ثبت حواله/بارنامه و شناسنامه‌های تفصیلی.
2. **فرمت دوگانه هوشمند ریال و تومان (`currencyUtils.ts` و `CurrencyAmount.tsx`):**
   - نمایش همزمان مبالغ به هر دو واحد رایج تجاری ایران: ریال رسمی حسابداری و تومان محاوره‌ای/تراز تجاری، همراه با واحدهای فشرده (میلیون تومان و میلیارد تومان).
   - ادغام در سفارشات فروش، نرخ‌نامه محصولات، کرایه باربری، فاکتورهای فروش و صدور حواله‌ها.
3. **معماری کارت سازمانی ۳ لایه استاندارد (`EnterpriseCard.tsx`):**
   - استانداردسازی کارت‌ها با لایه‌های Header (شناسه، تاریخ شمسی، وضعیت و برچسب‌ها)، Body (اطلاعات اصلی، آدرس، حجم و پلاک خودرو)، و Footer (مبالغ دوگانه و دکمه‌های اقدام سریع).
   - اضافه شدن دکمه تغییر نما (View Switcher: کارت‌ها / جدول) در بخش‌های «رسید انبار»، «خروج و ترخیص انبار»، «لجستیک و ترابری» و «سفارش‌های فروش».
4. **نوار اقدام چسبان پایین کشوها (Sticky Action Footer):**
   - بازطراحی پاورقی کشوهای عملیاتی (`WorkItemDetailDrawer.tsx` و حواله‌ها) با دکمه‌های اقدام سریع (تأیید، رد، بازگشت جهت اصلاح، اعلام مانع، ارجاع سازمانی) به صورت چسبان (Sticky) در انتهای صفحه، بدون نیاز به اسکرول طولانی.
5. **ماتریس دسترسی و مجوزها با هدر و ستون چسبان (`PermissionsView.tsx`):**
   - شناور شدن سرستون‌ها (`sticky top-0`) و ثابت ماندن ستون عناوین قابلیت‌ها در سمت راست (`sticky right-0` با جهت راست‌به‌چپ)، برای اسکرول افقی و عمودی بدون گم شدن زمینه ردیف‌ها.
6. **دسته‌بندی بازشونده منوی ناوبری (`Sidebar.tsx`):**
   - باز شدن هوشمند دسته‌بندی والد بر اساس صفحه جاری (`currentRoute`) برای حفظ موقعیت ذهنی کاربر و امکان جمع/باز کردن آکاردئونی گروه‌های منو.
7. **نگهداری پیش‌نویس فرم‌ها (`useFormAutosave.ts`):**
   - ذخیره‌سازی خودکار داده‌های نیمه‌کاره در فرم‌های ثبت سفارش و بارنامه در صورت قطعی اتصال یا رفرش ناخواسته صفحه.
8. **تطابق ۱۰۰٪ با آزمون‌های رگرسیون و معماری حفاظت‌شده:**
   - عدم دستکاری حتی یک بایت از ۳۱ فایل محافظت‌شده در `docs/PROTECTED_SOURCE_SHA256.json`.
   - قبولی کامل آزمون‌های رگرسیون و رابط کاربری (15/15 تست موفق) و بیلد نهایی بدون خطا (`npm run build`).
