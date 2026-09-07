import React, { useState } from 'react';
import { Button } from '../components/design-system/Button';
import { StatusBadge, PriorityBadge, OwnershipBadge, Chip } from '../components/design-system/Badges';
import { PersonDisplay } from '../components/design-system/PersonDisplay';
import {
  FormField,
  TextInput,
  RialInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  Switch,
  ValidationSummary,
} from '../components/design-system/FormControls';
import { BlockerPanel, NextActionPanel } from '../components/design-system/BlockerAndNextAction';
import { OperationalSevenQuestions } from '../components/design-system/OperationalSevenQuestions';
import { Timeline } from '../components/design-system/Timeline';
import { CommentsSection, AttachmentsSection } from '../components/design-system/CommentsAndAttachments';
import { ModalDialog, ConfirmationModal, Drawer } from '../components/design-system/ModalAndDrawer';
import {
  Skeleton,
  TableSkeleton,
  EmptyState,
  OfflineBanner,
  Forbidden403,
  NotFound404,
  ConflictState,
} from '../components/design-system/SystemStates';
import { useToast } from '../components/design-system/ToastContext';
import { MOCK_RECORDS } from '../data/mockData';
import { Palette, Type } from 'lucide-react';

export const DesignSystemShowcaseView: React.FC = () => {
  const { addToast } = useToast();

  // Interactive demo states
  const [demoRial, setDemoRial] = useState<number>(450000000);
  const [demoText, setDemoText] = useState('');
  const [demoSwitch, setDemoSwitch] = useState(true);
  const [demoCheck, setDemoCheck] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  // Modal demo states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  // Active showcase sub-section tab
  const [activeSection, setActiveSection] = useState<
    'foundations' | 'buttons' | 'forms' | 'badges_people' | 'operational_panels' | 'states'
  >('foundations');

  const sampleRecord = MOCK_RECORDS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Offline banner simulation toggle */}
      {showOffline && (
        <OfflineBanner onReconnect={() => { setShowOffline(false); addToast('اتصال با سرور برقرار شد', { tone: 'success' }); }} />
      )}

      {/* Showcase Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                دیزاین سیستم و کتابخانه اختصاصی سامانه عملیات جوادیان
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              طراحی شده بر مبنای فونت وزیرمتن (Vazirmatn)، چیدمان راست‌به‌چپ (RTL)، سیستم فواصل ۸ پیکسلی، پالت رنگ‌های کنترل‌شده، و پاسخ مستقیم به ۷ سؤال اساسی عملیاتی.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showOffline ? 'destructive' : 'outline'}
              onClick={() => setShowOffline(!showOffline)}
            >
              {showOffline ? 'پنهان‌سازی بنر آفلاین' : 'تست وضعیت آفلاین'}
            </Button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4 overflow-x-auto pb-1">
          <Chip
            label="۱. مبانی طراحی و توکن‌ها"
            isSelected={activeSection === 'foundations'}
            onClick={() => setActiveSection('foundations')}
          />
          <Chip
            label="۲. دکمه‌ها و تعاملات"
            isSelected={activeSection === 'buttons'}
            onClick={() => setActiveSection('buttons')}
          />
          <Chip
            label="۳. فرم‌ها و ورودی ریال"
            isSelected={activeSection === 'forms'}
            onClick={() => setActiveSection('forms')}
          />
          <Chip
            label="۴. نشان‌ها و افراد"
            isSelected={activeSection === 'badges_people'}
            onClick={() => setActiveSection('badges_people')}
          />
          <Chip
            label="۵. هفت سؤال و پنل موانع"
            isSelected={activeSection === 'operational_panels'}
            onClick={() => setActiveSection('operational_panels')}
          />
          <Chip
            label="۶. وضعیت‌های سیستمی و خطاها"
            isSelected={activeSection === 'states'}
            onClick={() => setActiveSection('states')}
          />
        </div>
      </div>

      {/* ================= SECTION 1: FOUNDATIONS ================= */}
      {activeSection === 'foundations' && (
        <div className="space-y-6">
          {/* Color Palette */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs font-bold text-slate-900">پالت رنگ اختصاصی (Restrained Palette)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 text-white space-y-1">
                <span className="font-bold block">Navy / Ink</span>
                <span className="text-caption text-slate-500 font-mono">#0f172a</span>
                <span className="text-caption block opacity-80">ساختار، سایدبار و متن</span>
              </div>
              <div className="p-3 rounded-lg bg-primary-700 text-white space-y-1">
                <span className="font-bold block">Indigo Primary</span>
                <span className="text-caption text-primary-200 font-mono">#4f46e5</span>
                <span className="text-caption block opacity-80">اقدام اصلی و برند</span>
              </div>
              <div className="p-3 rounded-lg bg-teal-600 text-white space-y-1">
                <span className="font-bold block">Teal Success</span>
                <span className="text-caption text-teal-200 font-mono">#0d9488</span>
                <span className="text-caption block opacity-80">تکمیل و موفقیت</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-500 text-slate-950 space-y-1">
                <span className="font-bold block">Amber Waiting</span>
                <span className="text-caption text-amber-950 font-mono">#f59e0b</span>
                <span className="text-caption block opacity-80">در انتظار و هشدار</span>
              </div>
              <div className="p-3 rounded-lg bg-rose-600 text-white space-y-1">
                <span className="font-bold block">Red Danger</span>
                <span className="text-caption text-rose-200 font-mono">#e11d48</span>
                <span className="text-caption block opacity-80">مانع بحرانی و توقف</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 space-y-1">
                <span className="font-bold block">Cool Neutral</span>
                <span className="text-caption text-slate-500 font-mono">#f8fafc</span>
                <span className="text-caption block opacity-80">سطوح پس‌زمینه</span>
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs font-bold text-slate-900">سلسله‌مراتب تایپوگرافی (Vazirmatn Font Scale)</h3>
            </div>
            <div className="space-y-3 divide-y divide-slate-100 text-right">
              <div className="pt-2 flex items-center justify-between">
                <h1 className="text-xl font-extrabold text-slate-900">عنوان اصلی و سرصفحه صفحه (Heading 1)</h1>
                <span className="text-xs text-slate-500 font-mono">20px / Bold 800</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">عنوان بخش‌ها و کارت‌های عملیات (Heading 2)</h2>
                <span className="text-xs text-slate-500 font-mono">16px / Bold 700</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">عنوان جدول، برچسب‌ها و فیلدها (Subheading)</h3>
                <span className="text-xs text-slate-500 font-mono">14px / Semibold 600</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <p className="text-xs text-slate-700 leading-relaxed max-w-lg">
                  متن بدنه و توضیحات پرونده‌های عملیاتی؛ به همراه ارقام فارسی دقیق (۱۲,۵۰۰,۰۰۰ ریال).
                </p>
                <span className="text-xs text-slate-500 font-mono">12px / Regular 400</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-caption text-slate-500 font-mono">
                  کدهای رهگیری سیستمی: ORD-1404-0981
                </span>
                <span className="text-xs text-slate-500 font-mono">11px / Monospace</span>
              </div>
            </div>
          </div>

          {/* 8px Spacing Grid */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">سیستم فواصل ۸ پیکسلی (8px Spacing Rhythm)</h3>
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-700 rounded-xs" />
                <span>8px (p-2 / gap-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-700 rounded-xs" />
                <span>16px (p-4 / gap-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-700 rounded-xs" />
                <span>24px (p-6 / gap-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-700 rounded-xs" />
                <span>32px (p-8 / gap-8)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: BUTTONS ================= */}
      {activeSection === 'buttons' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
            <h3 className="text-xs font-bold text-slate-900">انواع دکمه‌ها و حالات تعاملی</h3>

            {/* Variants */}
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">گونه‌های ظاهری (Variants):</span>
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="primary">اقدام اصلی (Primary)</Button>
                <Button variant="secondary">اقدام ثانویه (Secondary)</Button>
                <Button variant="outline">خط دور (Outline)</Button>
                <Button variant="subtle">ملایم (Subtle)</Button>
                <Button variant="ghost">شبح (Ghost)</Button>
                <Button variant="destructive">حذف یا توقف (Destructive)</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold block">اندازه‌ها (Sizes):</span>
              <div className="flex items-center gap-3 flex-wrap">
                <Button size="sm">اندازه کوچک (sm)</Button>
                <Button size="md">اندازه استاندارد (md)</Button>
                <Button size="lg">اندازه بزرگ (lg)</Button>
              </div>
            </div>

            {/* Loading & Disabled */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold block">حالت بارگذاری و غیرفعال:</span>
              <div className="flex items-center gap-3 flex-wrap">
                <Button isLoading={demoLoading} onClick={() => setDemoLoading(!demoLoading)}>
                  {demoLoading ? 'در حال ارسال درخواست...' : 'تست حالت بارگذاری'}
                </Button>
                <Button disabled variant="primary">غیرفعال (Disabled)</Button>
                <Button
                  variant="outline"
                  onClick={() => addToast('پیام اعلان تستی ظاهر شد', { tone: 'success' })}
                >
                  نمایش تست Toast پیام موفقیت
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: FORMS ================= */}
      {activeSection === 'forms' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6">
          <h3 className="text-xs font-bold text-slate-900">کنترل‌های ورودی و اعتبارسنجی فرم‌ها</h3>

          {/* Validation Summary Demo */}
          {showValidation && (
            <ValidationSummary
              title="خطاهای اعتبارسنجی فرم"
              errors={[
                'وارد کردن مبلغ قطعی پیش‌پرداخت الزامی است.',
                'سقف اعتبار مشتری بیش از حد مجاز است.',
              ]}
              onDismiss={() => setShowValidation(false)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="عنوان درخواست عملیاتی" required hint="حداکثر ۱۰۰ کاراکتر">
              <TextInput
                placeholder="مثال: خرید قطعات یدکی..."
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
              />
            </FormField>

            <FormField label="مبلغ معامله / ارزش برآورد (با پسوند خودکار ریال)" required>
              <RialInput
                value={demoRial}
                onChange={(v) => setDemoRial(v)}
              />
            </FormField>

            <FormField label="واحد سازمانی درخواست‌کننده">
              <SelectInput
                options={[
                  { label: 'کارخانه شماره ۱ - خط تصفیه و پرکنی روغن', value: 'f1' },
                  { label: 'کارخانه شماره ۲ - سالن بسته‌بندی کارتن', value: 'f2' },
                  { label: 'انبار مرکزی کهریزک', value: 'w1' },
                  { label: 'دفتر مرکزی - فروش و بازرگانی', value: 'hq' },
                ]}
              />
            </FormField>

            <FormField label="توضیحات تکمیلی و پیوست">
              <TextareaInput rows={2} placeholder="توضیحات لازم را وارد کنید..." />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Checkbox
              id="chk-sample"
              checked={demoCheck}
              onChange={setDemoCheck}
              label="تأیید بررسی اولیه مدارک انبار"
              description="اسناد مربوطه با سیستم توزین تطبیق داده شده است."
            />

            <Switch
              checked={demoSwitch}
              onChange={setDemoSwitch}
              label="ارسال پیامک اطلاع‌رسانی به راننده"
              description="در زمان صدور حواله، شماره بارنامه پیامک گردد."
            />
          </div>
        </div>
      )}

      {/* ================= SECTION 4: BADGES & PEOPLE ================= */}
      {activeSection === 'badges_people' && (
        <div className="space-y-6">
          {/* Badges */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">نشان‌های وضعیت (Status Badges)</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status="draft" />
              <StatusBadge status="pending_review" />
              <StatusBadge status="pending_approval" />
              <StatusBadge status="blocked" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="completed" />
              <StatusBadge status="rejected" />
            </div>

            <h3 className="text-xs font-bold text-slate-900 pt-3 border-t border-slate-100">
              نشان‌های اولویت (Priority Badges)
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <PriorityBadge priority="critical" />
              <PriorityBadge priority="high" />
              <PriorityBadge priority="normal" />
              <PriorityBadge priority="low" />
            </div>

            <h3 className="text-xs font-bold text-slate-900 pt-3 border-t border-slate-100">
              نشان مالکیت پرونده (Ownership Badge) با مدت توقف و جانشینی
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <OwnershipBadge ownerName="آرش" durationHours={4} />
              <OwnershipBadge
                ownerName="آقای یوسفی"
                durationHours={18}
                isDelegated={true}
                delegatorName="آرش"
              />
            </div>
          </div>

          {/* People display */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">نمایش مشخصات شخص و زمینه جانشینی</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <PersonDisplay person={sampleRecord.creator} />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <PersonDisplay
                  person={sampleRecord.currentOwner}
                  isDelegate={true}
                  delegatorName="آقای منتظری"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 5: OPERATIONAL PANELS ================= */}
      {activeSection === 'operational_panels' && (
        <div className="space-y-6">
          {/* 7 Questions Complete Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                کارت جامع پاسخ به ۷ سؤال بنیادین عملیات جوادیان
              </h3>
              <span className="text-caption text-slate-500">موتور شفافیت فرآیندی</span>
            </div>
            <OperationalSevenQuestions record={sampleRecord} />
          </div>

          {/* Blocker & Next Action Panels Standalone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">نمونه پنل مانع عملیاتی فعال (Blocker Panel):</h4>
              <BlockerPanel
                blocker={sampleRecord.blocker}
                onResolve={() => addToast('مانع برطرف شد', { tone: 'success' })}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">نمونه پنل اقدام بعدی (Next Action Panel):</h4>
              <NextActionPanel
                nextAction={sampleRecord.nextAction}
                onExecute={() => addToast('اقدام بعدی کلید خورد', { tone: 'info' })}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">تاریخچه کامل رویدادها (Timeline Audit Trail)</h3>
            <Timeline events={sampleRecord.timeline} />
          </div>
        </div>
      )}

      {/* ================= SECTION 6: STATES & MODALS ================= */}
      {activeSection === 'states' && (
        <div className="space-y-6">
          {/* Modal / Drawer test triggers */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">پنجره‌های محاوره‌ای، تأیید و دراور RTL</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                تست دیالوگ عمومی (Modal Dialog)
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setIsConfirmOpen(true)}>
                تست دیالوگ تأیید حذف (Confirmation)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                تست کشوی راست (RTL Drawer)
              </Button>
            </div>
          </div>

          {/* Skeletons */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">حالت بارگذاری اسکلتی (Skeleton Loading)</h3>
            <TableSkeleton rows={2} />
          </div>

          {/* Empty State */}
          <EmptyState
            title="هیچ رکوردی در این پوشه ثبت نشده است"
            description="برای شروع فرآیند، از دکمه ثبت سفارش جدید استفاده نمایید."
            actionText="ثبت رکورد جدید"
            onAction={() => addToast('فرم ثبت سفارش جدید فراخوانی شد', { tone: 'info' })}
          />

          {/* 403 Forbidden State */}
          <Forbidden403
            missingCapabilities={['pricing.approve', 'sales.approve']}
            onSwitchPersona={() => addToast('جهت تغییر دسترسی، از منوی حالت نمایشی در هدر استفاده کنید.', { tone: 'info' })}
          />

          {/* Concurrency Conflict State */}
          <ConflictState
            currentValue="تأیید با تخفیف ۵ درصدی و موعد پرداخت ۴۵ روزه"
            serverValue="تأیید مشروط به تسویه نقدی کامل توسط تأییدکننده مالی"
            modifiedBy="تأییدکننده مالی"
            onResolve={(action) =>
              addToast(
                action === 'overwrite' ? 'تغییرات شما بازنویسی شد' : 'داده‌های سرور همگام‌سازی شد',
                { tone: 'warning' }
              )
            }
          />
        </div>
      )}

      {/* Demo Modal Dialog */}
      <ModalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="عنوان پنجره دیالوگ نمونه"
        footer={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button size="sm" variant="primary" onClick={() => setIsModalOpen(false)}>
              ذخیره تغییرات
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-700 leading-relaxed">
          این یک دیالوگ دسترسی‌پذیر با قابلیت بستن از طریق کلید Esc و پس‌زمینه تارشده است.
        </p>
      </ModalDialog>

      {/* Demo Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          addToast('عملیات با موفقیت انجام شد', { tone: 'success' });
        }}
        title="تأیید حذف رکورد"
        message="آیا از لغو این پرونده عملیاتی اطمینان کامل دارید؟ این اقدام قابل بازگشت نیست."
        confirmText="بله، لغو شود"
        variant="destructive"
      />

      {/* Demo Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="کشوی اطلاعات عملیاتی (RTL Side Drawer)"
        subtitle="فرم کنترل و فیلترهای پیشرفته"
        footer={
          <Button size="sm" variant="primary" onClick={() => setIsDrawerOpen(false)}>
            اعمال و بستن کشو
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            دراور راست‌به‌چپ مطابق با اصول طراحی استاندارد فارسی در سمت راست صفحه باز می‌شود و اجازه مرور سریع جزییات را بدون خروج از جریان کاری فراهم می‌سازد.
          </p>
        </div>
      </Drawer>
    </div>
  );
};
