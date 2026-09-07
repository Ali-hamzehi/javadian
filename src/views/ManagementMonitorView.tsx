import { FieldGroup } from '../components/design-system/FieldGroup';
import React, { useState } from 'react';
import { BarChart3, AlertOctagon, Clock, CheckCircle, CheckCircle2, Filter, Server, MapPin, ExternalLink, ShieldCheck, Activity, ShoppingBag, Truck, CreditCard, Database, ArrowLeft, GitBranch, UserCheck, ChevronDown, ChevronUp, Link2, HelpCircle, Bell, AlertTriangle } from 'lucide-react';
import { MockPersona, OperationalDrillRecord, OperationalUnit, TraceabilityStep } from '../types';
import { MOCK_OPERATIONAL_DRILL_RECORDS } from '../data/mockOperationsPrompt4';
import { DETERMINISTIC_TRACEABILITY_SCENARIO } from '../data/mockTraceabilityScenario';
import { Button } from '../components/design-system/Button';
import { Modal } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { toPersianDigits, formatRials } from '../utils/formatters';
import { getPersonaDisplayName } from '../runtime/documentBasedPersonas';

interface ManagementMonitorViewProps {
  activePersona: MockPersona;
  initialMode?: 'ops_view' | 'integration_errors' | 'traceability';
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const ManagementMonitorView: React.FC<ManagementMonitorViewProps> = ({
  activePersona,
  initialMode = 'ops_view',
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();

  const [activeMode, setActiveMode] = useState<'ops_view' | 'integration_errors' | 'traceability'>(initialMode);
  const [records, setRecords] = useState<OperationalDrillRecord[]>(MOCK_OPERATIONAL_DRILL_RECORDS);

  // Drill-down modal for KPI cards
  const [drillModalTitle, setDrillModalTitle] = useState<string | null>(null);
  const [drillRecords, setDrillRecords] = useState<OperationalDrillRecord[]>([]);

  // Expanded row in drill table
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>('drill-1');

  // Manager Actions Modals
  const [activeLinkedRecord, setActiveLinkedRecord] = useState<OperationalDrillRecord | null>(null);
  const [reassigningRecord, setReassigningRecord] = useState<OperationalDrillRecord | null>(null);
  const [newAssigneeName, setNewAssigneeName] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  const [resolvingBlockerRecord, setResolvingBlockerRecord] = useState<OperationalDrillRecord | null>(null);
  const [blockerResolutionNote, setBlockerResolutionNote] = useState<string>('');

  // Selected Traceability Step
  const [selectedTraceStep, setSelectedTraceStep] = useState<TraceabilityStep>(
    DETERMINISTIC_TRACEABILITY_SCENARIO.steps[5] // default to current bottleneck (Step 6: REC-1404-088)
  );

  // Filter bar
  const [filterUnit, setFilterUnit] = useState<OperationalUnit>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'blocked' | 'waiting_approval' | 'overdue' | 'integration_failed'
  >('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'normal'>('all');
  const [filterType, setFilterType] = useState<'all' | 'price_exceptions' | 'field_tasks'>('all');

  // Retrying integration state
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Permission check: capability gate
  const hasManagementPermission = activePersona.capabilities.includes('MANAGEMENT_VIEW');

  // Live operational overview calculations (all 8 requested sections)
  const waitingApprovals = records.filter((r) => r.status === 'waiting_approval');
  const blockedRecords = records.filter((r) => r.status === 'blocked');
  const overdueRecords = records.filter((r) => r.status === 'overdue');
  const priceExceptions = records.filter((r) => r.isPriceException);
  const supplyLogistics = records.filter((r) => r.unit === 'supply' || r.unit === 'logistics');
  const warehouseInOut = records.filter((r) => r.unit === 'warehouse');
  const paymentsAwaiting = records.filter((r) => r.unit === 'finance');
  const fieldFollowups = records.filter((r) => r.isFieldTask || r.unit === 'field');
  const integrationFailures = records.filter(
    (r) => r.status === 'integration_failed' || r.unit === 'integrations'
  );

  // Filtered drill list
  const filteredRecords = records.filter((r) => {
    if (activeMode === 'integration_errors') {
      return r.status === 'integration_failed' || r.unit === 'integrations';
    }
    if (filterUnit !== 'all' && r.unit !== filterUnit) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterOwner !== 'all' && r.ownerName !== filterOwner) return false;
    if (filterRegion !== 'all' && r.cityOrRegion !== filterRegion) return false;
    if (filterPriority !== 'all' && r.priority !== filterPriority) return false;
    if (filterType === 'price_exceptions' && !r.isPriceException) return false;
    if (filterType === 'field_tasks' && !r.isFieldTask && r.unit !== 'field') return false;
    return true;
  });

  const openDrillModal = (title: string, matchingRecords: OperationalDrillRecord[]) => {
    setDrillModalTitle(title);
    setDrillRecords(matchingRecords);
  };

  // Manager Action: Remind
  const handleSendReminder = (rec: OperationalDrillRecord) => {
    const targetPerson = rec.currentAssigneeName || rec.ownerName;
    addToast(`پیام یادآوری فوری برای «${targetPerson}» ارسال شد`, {
      description: `پیگیری پرونده ${rec.code} در کارهای من و پیامک سازمانی متصدی ثبت شد.`,
      tone: 'info',
    });
  };

  // Manager Action: Reassign
  const handleConfirmReassign = () => {
    if (!reassigningRecord || !newAssigneeName) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === reassigningRecord.id
          ? {
              ...r,
              currentAssigneeName: newAssigneeName,
              whatHappened: `${r.whatHappened} [تغییر متصدی به ${newAssigneeName} توسط مدیر]`,
            }
          : r
      )
    );

    addToast(`متصدی پرونده ${reassigningRecord.code} تغییر یافت`, {
      description: `پرونده به «${newAssigneeName}» ارجاع و در کارهای من وی مستقر گردید.`,
      tone: 'success',
    });

    setReassigningRecord(null);
    setNewAssigneeName('');
    setReassignReason('');
  };

  // Manager Action: Resolve Blocker
  const handleConfirmResolveBlocker = () => {
    if (!resolvingBlockerRecord) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === resolvingBlockerRecord.id
          ? {
              ...r,
              status: 'in_progress',
              statusDescription: 'مانع رفع شد: ' + (blockerResolutionNote || 'تاییدیه مدیریتی ثبت شد.'),
              blockerReason: undefined,
            }
          : r
      )
    );

    addToast(`مانع پرونده ${resolvingBlockerRecord.code} برطرف شد`, {
      description: 'پرونده از وضعیت مسدود خارج شد و گردش فرآیند ادامه یافت.',
      tone: 'success',
    });

    setResolvingBlockerRecord(null);
    setBlockerResolutionNote('');
  };

  const handleRetryIntegration = (recSourceSystem: string) => {
    setRetryingId(recSourceSystem);
    setTimeout(() => {
      setRetryingId(null);
      addToast(`درخواست اتصال مجدد به «${recSourceSystem}» با موفقیت ارسال شد`, {
        description: 'کد رهگیری دریافت شد؛ صف درخواست‌ها در حال بازپردازش است.',
        tone: 'success',
      });
    }, 1200);
  };

  // Capability Gate Banner
  if (!hasManagementPermission) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">عدم دسترسی به دیده‌بان مدیریتی</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          کاربر گرامی ({getPersonaDisplayName(activePersona)})، مشاهده دیده‌بان عملیاتی و پایش گلوگاه‌های سازمان نیازمند
          دسترسی <span className="font-mono font-bold text-slate-800">MANAGEMENT_VIEW</span> است. لطفاً
          از بخش بالای صفحه، نقش کاربری را به یکی از مدیران (مانند آقای منتظری یا مدیر سیستم) تغییر
          دهید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-primary-50 text-primary-700 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="page-title text-xl sm:text-2xl font-black text-slate-900">
                دیده‌بان عملیاتی مدیریت و پایش گلوگاه‌ها
              </h1>
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                پاسخ‌گویی به ۷ پرسش کلیدی بدون نیاز به تماس با پرسنل
              </span>
            </div>
            <p className="text-xs text-slate-600">
              کجاست؟ مسئول کیست؟ توپ دست کیست؟ از چه زمانی؟ چه اتفاقی افتاده؟ چرا مسدود است؟ اقدام بعدی چیست؟
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveMode('ops_view')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'ops_view'
                  ? 'bg-white text-slate-900 shadow-none'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-primary-700" />
              <span>نمای عملیات و گلوگاه‌ها</span>
            </button>

            <button
              onClick={() => setActiveMode('traceability')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'traceability'
                  ? 'bg-white text-emerald-800 shadow-none border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              <span>ردگیری سرتاسری زنجیره (Traceability)</span>
            </button>

            <button
              onClick={() => setActiveMode('integration_errors')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'integration_errors'
                  ? 'bg-white text-slate-800 shadow-none'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-slate-600" />
              <span>وضعیت اتصال سامانه‌ها</span>
            </button>
          </div>
        </div>

        {/* Ethical Management Policy */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>قاعده محوری ارزیابی انسانی:</strong> شاخص‌های این دیده‌بان جهت پایش جریان فرآیند، کشف
            گلوگاه‌های سازمانی و هماهنگی زنجیره ارزش طراحی شده‌اند. <em>شمارش خام تسک‌ها یا ردیابی مکانی
            بدون زمینه کیفی، در خط‌مشی سازمانی جوادیان به عنوان ملاک ارزیابی رد شده است.</em>
          </p>
        </div>
      </div>

      {/* ================= MODE 1: OPERATIONAL MONITOR ================= */}
      {activeMode === 'ops_view' && (
        <>
          {/* Overview Sections (4 Core Clickable KPI Cards for Executive Overview) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Waiting Decisions */}
            <div
              onClick={() => {
                setFilterStatus('waiting_approval');
                setFilterUnit('all');
              }}
              className={`bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-none hover:shadow-xs group ${
                filterStatus === 'waiting_approval'
                  ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-200'
                  : 'border-slate-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">تصمیم‌های در انتظار</span>
                <Clock className="w-4 h-4 text-primary-700" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary-900">{toPersianDigits(waitingApprovals.length)}</span>
                <span className="text-caption text-slate-500">پرونده منتظر تصمیم</span>
              </div>
              <span className="mt-2 text-caption text-primary-700 flex items-center gap-1 font-semibold">
                <span>فیلتر و مشاهده لیست</span>
                <ArrowLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 2. Blocked Work */}
            <div
              onClick={() => {
                setFilterStatus('blocked');
                setFilterUnit('all');
              }}
              className={`bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-none hover:shadow-xs group ${
                filterStatus === 'blocked'
                  ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200'
                  : 'border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">کارهای مسدود</span>
                <AlertOctagon className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-900">{toPersianDigits(blockedRecords.length)}</span>
                <span className="text-caption text-rose-700">دارای مانع یا توقف</span>
              </div>
              <span className="mt-2 text-caption text-rose-600 flex items-center gap-1 font-semibold">
                <span>فیلتر و مشاهده لیست</span>
                <ArrowLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 3. Overdue Work */}
            <div
              onClick={() => {
                setFilterStatus('overdue');
                setFilterUnit('all');
              }}
              className={`bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-none hover:shadow-xs group ${
                filterStatus === 'overdue'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">کارهای معوق</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-900">{toPersianDigits(overdueRecords.length)}</span>
                <span className="text-caption text-amber-700">سررسید گذشته</span>
              </div>
              <span className="mt-2 text-caption text-amber-700 flex items-center gap-1 font-semibold">
                <span>فیلتر و مشاهده لیست</span>
                <ArrowLeft className="w-3 h-3" />
              </span>
            </div>

            {/* 4. Team Tracking */}
            <div
              onClick={() => {
                setFilterStatus('all');
                setFilterUnit('all');
              }}
              className={`bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-none hover:shadow-xs group ${
                filterStatus === 'all' && filterUnit === 'all'
                  ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-200'
                  : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">پیگیری تیم</span>
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-sky-900">{toPersianDigits(records.length)}</span>
                <span className="text-caption text-sky-700">کل پرونده‌های تیم</span>
              </div>
              <span className="mt-2 text-caption text-sky-700 flex items-center gap-1 font-semibold">
                <span>نمایش همه پرونده‌ها</span>
                <ArrowLeft className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Drill-down Filters & Record Explorer */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-none">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary-700" />
                  <span>لیست پرونده‌های عملیاتی و وضعیت پیگیری</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  پایش وضعیت پرونده‌ها، متصدی فعلی، علت توقف و ثبت تصمیمات و یادآوری‌ها
                </p>
              </div>

              <div className="flex items-center gap-2">
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    حذف فیلتر وضعیت
                  </button>
                )}
                <span className="text-xs font-mono bg-white px-3 py-1 rounded border border-slate-200 text-slate-700 font-bold self-start sm:self-auto">
                  {toPersianDigits(filteredRecords.length)} پرونده تحت پایش
                </span>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="p-3 bg-slate-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value as any)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">همه واحدها</option>
                <option value="sales">واحد فروش</option>
                <option value="supply">واحد تأمین</option>
                <option value="logistics">واحد لجستیک</option>
                <option value="warehouse">انبار و باسکول</option>
                <option value="finance">مالی و پرداخت</option>
                <option value="field">عملیات میدانی</option>
                <option value="integrations">یکپارچه‌سازی</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="blocked">مسدود (دارای مانع)</option>
                <option value="waiting_approval">معطل تأیید</option>
                <option value="overdue">دارای تأخیر زمانی</option>
                <option value="integration_failed">خطای ارتباط سامانه</option>
              </select>

              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">همه مسئولین</option>
                <option value="آرش (مسئول لجستیک)">آرش</option>
                <option value="آقای نادری (مسئول فروش قم)">آقای نادری</option>
                <option value="آقای یوسفی (جانشین عملیاتی)">آقای یوسفی</option>
                <option value="آقای منتظری (مدیرعامل)">آقای منتظری</option>
                <option value="کارشناس فروش">کارشناس فروش</option>
                <option value="کارشناس مالی">کارشناس مالی</option>
                <option value="تأییدکننده بازرگانی">تأییدکننده بازرگانی</option>
                <option value="تأییدکننده مالی">تأییدکننده مالی</option>
              </select>

              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">همه مناطق / شهرها</option>
                <option value="تهران">تهران</option>
                <option value="اصفهان">اصفهان</option>
                <option value="کهریزک">کهریزک</option>
                <option value="سراسری">سراسری</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value="urgent">فوری و اضطراری</option>
                <option value="high">اولویت بالا</option>
                <option value="normal">عادی</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="p-1.5 rounded border border-slate-200 bg-white"
              >
                <option value="all">تمام پرونده‌ها</option>
                <option value="price_exceptions">فقط استثنای قیمت</option>
                <option value="field_tasks">فقط امور میدانی</option>
              </select>
            </div>

            {/* Records List Answering the 7 Operational Questions */}
            <div className="divide-y divide-slate-100">
              {filteredRecords.map((item) => {
                const isExpanded = expandedRecordId === item.id;
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3 text-xs">
                    {/* Summary Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                            {item.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{item.title}</span>

                          {item.status === 'blocked' && (
                            <span className="text-caption font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                              مسدود (دارای مانع)
                            </span>
                          )}
                          {item.status === 'waiting_approval' && (
                            <span className="text-caption font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              معطل تأیید
                            </span>
                          )}
                          {item.status === 'overdue' && (
                            <span className="text-caption font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                              تأخیر زمانی
                            </span>
                          )}
                          {item.status === 'integration_failed' && (
                            <span className="text-caption font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              خطای سامانه
                            </span>
                          )}
                          {item.isPriceException && (
                            <span className="text-caption font-bold bg-primary-100 text-primary-800 px-2 py-0.5 rounded border border-primary-200">
                              استثنای نرخ زیر کف
                            </span>
                          )}
                        </div>

                        <p className="text-slate-600 leading-relaxed">{item.statusDescription}</p>

                        <div className="flex items-center gap-4 text-slate-500 text-caption flex-wrap pt-0.5">
                          <span>
                            واحد: <strong>{item.process}</strong>
                          </span>
                          <span>
                            طرف حساب: <strong>{item.customerOrParty}</strong>
                          </span>
                          <span>
                            منطقه: <strong>{item.cityOrRegion}</strong>
                          </span>
                          <span>
                            مدت توقف: <strong>{toPersianDigits(item.ageHours)} ساعت</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right-Hand Manager Controls */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {/* Who currently has the ball badge */}
                        <div className="bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-lg text-right">
                          <span className="text-caption text-amber-800 font-semibold block">
                            مسئول اقدام فعلی
                          </span>
                          <span className="font-bold text-amber-950 text-xs">
                            {item.currentAssigneeName || item.ownerName}
                          </span>
                        </div>

                        {/* Open Record */}
                        {onNavigateToRoute && (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => onNavigateToRoute(item.routeKey, item.code)}
                            leftIcon={<ExternalLink className="w-3 h-3" />}
                          >
                            ورود به پرونده
                          </Button>
                        )}

                        {/* Expand / Collapse 7 Questions */}
                        <button
                          onClick={() => setExpandedRecordId(isExpanded ? null : item.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                          title={isExpanded ? 'بستن جزئیات ۷ پرسش' : 'مشاهده پاسخ ۷ پرسش کلیدی'}
                         aria-label={isExpanded ? 'بستن جزئیات ۷ پرسش' : 'مشاهده پاسخ ۷ پرسش کلیدی'}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* ================= 7 OPERATIONAL QUESTIONS PANEL ================= */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-primary-700" />
                            <span>پاسخ دیده‌بان به ۷ پرسش کلیدی مدیر (Operational Transparency):</span>
                          </span>
                          <span className="text-caption text-slate-500 font-mono">
                            زمان ثبت توقف: {item.sinceJalali || 'ثبت در شیفت جاری'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* 1. Where is the work? */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-caption text-slate-500 block font-bold">۱. کجاست؟ (Where)</span>
                            <p className="font-semibold text-slate-800">{item.process}</p>
                            <span className="text-caption text-slate-500">کد پرونده: {item.code}</span>
                          </div>

                          {/* 2. Who owns it? */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-caption text-slate-500 block font-bold">۲. مسئول کیست؟ (Owner)</span>
                            <p className="font-semibold text-slate-800">{item.ownerName}</p>
                            <span className="text-caption text-slate-500">طرف حساب: {item.customerOrParty}</span>
                          </div>

                          {/* 3. Who currently has the ball? */}
                          <div className="bg-white p-3 rounded-lg border border-amber-300 bg-amber-50/20 space-y-1">
                            <span className="text-caption text-amber-700 block font-bold">
                              ۳. توپ دست کیست؟ (Current Assignee)
                            </span>
                            <p className="font-bold text-amber-900">
                              {item.currentAssigneeName || item.ownerName}
                            </p>
                            <span className="text-caption text-slate-500">
                              سن توقف پرونده: {toPersianDigits(item.ageHours)} ساعت
                            </span>
                          </div>

                          {/* 4. What happened? */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 md:col-span-2 lg:col-span-1">
                            <span className="text-caption text-slate-500 block font-bold">
                              ۴. چه اتفاقی افتاده؟ (What Happened)
                            </span>
                            <p className="text-slate-700 leading-relaxed text-caption">
                              {item.whatHappened || item.statusDescription}
                            </p>
                          </div>

                          {/* 5. Why is it blocked? */}
                          <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/20 space-y-1 md:col-span-2 lg:col-span-1">
                            <span className="text-caption text-rose-700 block font-bold">
                              ۵. چرا مسدود است؟ (Blocker Reason)
                            </span>
                            <p className="text-rose-900 leading-relaxed text-caption">
                              {item.blockerReason || 'فاقد مانع مسدودکننده حاد؛ در جریان گردش کار روتین.'}
                            </p>
                          </div>

                          {/* 6 & 7. Next Action & Next Assignee */}
                          <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/20 space-y-1 md:col-span-2 lg:col-span-1">
                            <span className="text-caption text-emerald-700 block font-bold">
                              ۶ و ۷. اقدام بعدی چیست و متولی آن کیست؟
                            </span>
                            <p className="text-emerald-950 font-semibold text-caption leading-relaxed">
                              {item.nextAction || 'تکمیل فرآیند در مرحله جاری'}
                            </p>
                            <span className="text-caption text-emerald-800 font-bold block pt-0.5">
                              متولی اقدام: {item.nextActionAssignee || item.currentAssigneeName || item.ownerName}
                            </span>
                          </div>
                        </div>

                        {/* Manager Actions Toolbar */}
                        <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Manager Action: Remind */}
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleSendReminder(item)}
                              leftIcon={<Bell className="w-3 h-3 text-amber-600" />}
                            >
                              ارسال یادآوری به متصدی
                            </Button>

                            {/* Manager Action: Reassign */}
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setReassigningRecord(item);
                                setNewAssigneeName(item.currentAssigneeName || item.ownerName);
                              }}
                              leftIcon={<UserCheck className="w-3 h-3 text-primary-700" />}
                            >
                              ارجاع / تغییر متصدی
                            </Button>

                            {/* Manager Action: Resolve Blocker */}
                            {item.status === 'blocked' && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setResolvingBlockerRecord(item)}
                                leftIcon={<CheckCircle className="w-3 h-3 text-emerald-600" />}
                              >
                                رفع مانع و تصمیم‌گیری مدیریتی
                              </Button>
                            )}

                            {/* Manager Action: Open Linked Work */}
                            {item.linkedRecords && item.linkedRecords.length > 0 && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setActiveLinkedRecord(item)}
                                leftIcon={<Link2 className="w-3 h-3 text-blue-600" />}
                              >
                                اسناد متصل ({toPersianDigits(item.linkedRecords.length)})
                              </Button>
                            )}
                          </div>

                          <span className="text-caption text-slate-500">
                            اولویت رسیدگی:{' '}
                            <strong className="text-slate-800">
                              {item.priority === 'urgent'
                                ? 'اضطراری'
                                : item.priority === 'high'
                                ? 'بالا'
                                : 'عادی'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ================= MODE 2: CROSS-MODULE TRACEABILITY DEMO ================= */}
      {activeMode === 'traceability' && (
        <div className="space-y-4">
          {/* Scenario Overview Banner */}
          <div className="bg-white rounded-xl border border-emerald-200 p-4 sm:p-5 shadow-none space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    سناریوی قطعی و معین صنعت روغن خوراکی
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {DETERMINISTIC_TRACEABILITY_SCENARIO.scenarioCode}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {DETERMINISTIC_TRACEABILITY_SCENARIO.scenarioTitle}
                </h2>
                <p className="text-xs text-slate-600">
                  مشتری: <strong>{DETERMINISTIC_TRACEABILITY_SCENARIO.customerName}</strong> • ارزش کل قرارداد:{' '}
                  <strong>{formatRials(DETERMINISTIC_TRACEABILITY_SCENARIO.dealValueRials)}</strong>
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-right max-w-xs">
                <span className="text-caption text-amber-800 font-bold block">مرحله گلوگاه فعلی سازمان:</span>
                <span className="text-xs font-black text-amber-950">
                  {DETERMINISTIC_TRACEABILITY_SCENARIO.currentBottleneckStage}
                </span>
              </div>
            </div>

            {/* 8-Stage Progress Stepper Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-2">
                <span>پیشرفت کل زنجیره ارزش (۵ از ۸ مرحله تکمیل شده):</span>
                <span className="font-mono text-emerald-700">۶۲.۵٪</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[62.5%]" />
                <div className="bg-amber-400 h-full w-[12.5%] " />
                <div className="bg-slate-200 h-full w-[25%]" />
              </div>
            </div>

            {/* Stepper Buttons Horizontal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 text-xs">
              {DETERMINISTIC_TRACEABILITY_SCENARIO.steps.map((step) => {
                const isSelected = selectedTraceStep.stepNumber === step.stepNumber;
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => setSelectedTraceStep(step)}
                    className={`p-3 rounded-lg border text-right transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-none ring-1 ring-emerald-500'
                        : step.status === 'completed'
                        ? 'border-slate-200 bg-white hover:bg-slate-50'
                        : step.status === 'in_progress'
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-slate-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-caption font-bold text-slate-500">#{step.stepNumber}</span>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : step.status === 'in_progress' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="font-bold text-slate-900 truncate text-caption">{step.code}</div>
                    <div className="text-caption text-slate-500 truncate">{step.stageName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Stage Comprehensive Inspection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    مرحله {selectedTraceStep.stepNumber} از ۸
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedTraceStep.code}</span>
                  {selectedTraceStep.status === 'completed' ? (
                    <span className="text-caption font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      تکمیل‌شده
                    </span>
                  ) : selectedTraceStep.status === 'in_progress' ? (
                    <span className="text-caption font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      در جریان عملیات
                    </span>
                  ) : (
                    <span className="text-caption font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      در انتظار رسیدن فرآیند
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">{selectedTraceStep.title}</h3>
                <span className="text-xs text-slate-500 block">
                  واحد متولی: <strong>{selectedTraceStep.unit}</strong> • زمان ثبت: {selectedTraceStep.timeline}
                </span>
              </div>

              {/* Direct Jump to Module */}
              {onNavigateToRoute && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigateToRoute(selectedTraceStep.routeKey, selectedTraceStep.code)}
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  ورود به بخش {selectedTraceStep.unit}
                </Button>
              )}
            </div>

            {/* 4 Pillars of Cross-Module Traceability */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* 1. Responsible Party vs Current Assignee */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-caption text-slate-500 font-bold block">مسئول و دارنده توپ:</span>
                <div>
                  <span className="text-caption text-slate-500 block">مسئول پرونده:</span>
                  <strong className="text-slate-800">{selectedTraceStep.responsibleParty}</strong>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-caption text-amber-700 block font-bold">توپ دست کیست؟:</span>
                  <strong className="text-amber-900">{selectedTraceStep.currentAssignee}</strong>
                </div>
              </div>

              {/* 2. Timeline & Duration */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-caption text-slate-500 font-bold block">خط زمانی و سابقه:</span>
                <div>
                  <span className="text-caption text-slate-500 block">ثبت اولیه:</span>
                  <span className="text-slate-800">{selectedTraceStep.timeline}</span>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <span className="text-caption text-slate-500 block">مدت توقف / اجرا:</span>
                  <strong className="text-slate-900">{selectedTraceStep.ageOrDuration}</strong>
                </div>
              </div>

              {/* 3. Next Action */}
              <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-200 space-y-1.5 md:col-span-2">
                <span className="text-caption text-emerald-800 font-bold block">اقدام بعدی و متولی آن:</span>
                <p className="text-emerald-950 font-semibold leading-relaxed">{selectedTraceStep.nextAction}</p>
                <span className="text-caption text-emerald-800 font-bold block pt-1 border-t border-emerald-200">
                  متولی اقدام بعدی: {selectedTraceStep.nextActionOwner}
                </span>
              </div>
            </div>

            {/* Summary & Key Parameters */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">شرح تفصیلی رویداد مرحله:</span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {selectedTraceStep.summary}
              </p>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {selectedTraceStep.keyDetails.map((detail, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-xs">
                    <span className="text-caption text-slate-500 block">{detail.label}</span>
                    <strong className="text-slate-800">{detail.value}</strong>
                  </div>
                ))}
              </div>

              {/* Blocker Notice (if any) */}
              {selectedTraceStep.blockerOrNote && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>نکته کنترلی / گلوگاه:</strong> {selectedTraceStep.blockerOrNote}
                  </p>
                </div>
              )}
            </div>

            {/* Linked Records Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-primary-700" />
                  <span>اسناد و زنجیره متصل:</span>
                </span>
                {selectedTraceStep.linkedRecords.map((lr, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (onNavigateToRoute) onNavigateToRoute(lr.routeKey, lr.code);
                    }}
                    className="px-3 py-1 bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200 rounded-md font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>
                      {lr.relation}: {lr.code}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ))}
              </div>

              <span className="text-caption text-slate-500">
                وضعیت تسویه پارسینا:{' '}
                <strong className="text-slate-800">
                  {selectedTraceStep.stepNumber === 8
                    ? 'ثبت نشده در سیستم مالی (در انتظار اتصال حسابداری)'
                    : 'مطابق روال فرآیند'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODE 3: INTEGRATION STATUS ================= */}
      {activeMode === 'integration_errors' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900">
              وضعیت درگاه‌ها و یکپارچه‌سازی با سامانه‌های برون‌سازمانی
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              وضعیت اتصال سامانه‌های مالی، حسابداری و ترابری — کلیه ارتباطات برون‌سازمانی غیربرخط می‌باشند.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parsina ERP Status */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-slate-500" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">نرم‌افزار حسابداری پارسینا (ERP)</h4>
                      <span className="text-caption text-slate-500">سند فاکتور و مانده بدهی مشتریان</span>
                    </div>
                  </div>
                  <span className="text-caption font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">
                    اتصال فعال نیست
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium">وضعیت ثبت سند:</span>
                    <span className="font-semibold text-slate-800">ثبت نشده در سیستم مالی</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-slate-600 leading-relaxed">
                    این بخش نمایشی است و هنوز به بانک یا پارسینا متصل نیست.
                  </div>
                </div>
              </div>

              {/* RMTO Waybill Gateway */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-slate-500" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">درگاه بارنامه دولتی راهداری (RMTO)</h4>
                      <span className="text-caption text-slate-500">استعلام شناسه و مجوز تردد ناوگان</span>
                    </div>
                  </div>
                  <span className="text-caption font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">
                    اتصال فعال نیست
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="pt-1 text-slate-600 leading-relaxed">
                    اتصال سرویس استعلام بارنامه فعال نیست؛ شناسه‌های دستی صرفاً به‌عنوان مرجع عملیاتی ثبت می‌شوند.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              هیچ خطای ارتباطی برخط ثبت نشده است؛ سرویس‌های خارجی هنوز متصل نیستند و کلیه فرآیندها در نسخه مستقل فعلی مدیریت می‌شوند.
            </div>
          </div>
        </div>
      )}

      {/* ================= DRILL-DOWN RECORDS MODAL ================= */}
      {drillModalTitle && (
        <Modal isOpen={true} onClose={() => setDrillModalTitle(null)} title={drillModalTitle} size="lg">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-600 flex items-center justify-between">
              <span>تعداد پرونده‌های منطبق با این شاخص:</span>
              <strong className="text-slate-900 font-mono text-sm">{toPersianDigits(drillRecords.length)}</strong>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {drillRecords.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {item.code}
                      </span>
                      <span className="font-bold text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.statusDescription}</p>
                    <div className="text-caption text-slate-500 flex items-center gap-3 pt-0.5">
                      <span>مسئول: {item.ownerName}</span>
                      <span>توپ دست: {item.currentAssigneeName || item.ownerName}</span>
                      <span>توقف: {toPersianDigits(item.ageHours)} ساعت</span>
                    </div>
                  </div>

                  {onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setDrillModalTitle(null);
                        onNavigateToRoute(item.routeKey, item.code);
                      }}
                      leftIcon={<ExternalLink className="w-3 h-3" />}
                    >
                      ورود به پرونده
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 text-right">
              <Button size="sm" variant="outline" onClick={() => setDrillModalTitle(null)}>
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= LINKED RECORDS MODAL ================= */}
      {activeLinkedRecord && (
        <Modal
          isOpen={true}
          onClose={() => setActiveLinkedRecord(null)}
          title={`اسناد متصل به پرونده ${activeLinkedRecord.code}`}
          size="md"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              پرونده «{activeLinkedRecord.title}» به اسناد عملیاتی زیر پیوند دارد:
            </p>

            <div className="divide-y divide-slate-100">
              {activeLinkedRecord.linkedRecords?.map((lr, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-caption text-slate-500 block">{lr.relationLabel}:</span>
                    <strong className="font-mono text-slate-900 text-sm">{lr.code}</strong>
                    <span className="text-slate-600 block text-xs">{lr.title}</span>
                  </div>

                  {onNavigateToRoute && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setActiveLinkedRecord(null);
                        onNavigateToRoute(lr.routeKey, lr.code);
                      }}
                      leftIcon={<ExternalLink className="w-3 h-3" />}
                    >
                      مشاهده سند
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 text-right">
              <Button size="sm" variant="outline" onClick={() => setActiveLinkedRecord(null)}>
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= REASSIGN MODAL ================= */}
      {reassigningRecord && (
        <Modal
          isOpen={true}
          onClose={() => setReassigningRecord(null)}
          title={`تغییر متصدی پرونده ${reassigningRecord.code}`}
          size="md"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              عنوان: <strong>{reassigningRecord.title}</strong>
            </p>

            <FieldGroup>
              <label className="block text-slate-700 font-bold mb-1">انتخاب متصدی جدید:</label>
              <select
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="تأییدکننده بازرگانی">تأییدکننده بازرگانی</option>
                <option value="کارشناس فروش">کارشناس فروش</option>
                <option value="آقای یوسفی (جانشین عملیاتی و رابط تأمین)">آقای یوسفی (جانشین عملیاتی و رابط تأمین)</option>
                <option value="آرش (مسئول لجستیک و هماهنگی خرید)">آرش (مسئول لجستیک و هماهنگی خرید)</option>
                <option value="تأییدکننده مالی">تأییدکننده مالی</option>
                <option value="کارشناس مالی">کارشناس مالی</option>
                <option value="مدیر سیستم">مدیر سیستم</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block text-slate-700 font-bold mb-1">دلیل ارجاع یا تغییر متصدی:</label>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="مثلاً: جهت تسریع در فرآیند به دلیل مرخصی متصدی قبلی..."
                className="w-full p-2 rounded-lg border border-slate-200 bg-white min-h-[70px]"
              />
            </FieldGroup>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setReassigningRecord(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirmReassign}>
                ثبت ارجاع کار
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= RESOLVE BLOCKER MODAL ================= */}
      {resolvingBlockerRecord && (
        <Modal
          isOpen={true}
          onClose={() => setResolvingBlockerRecord(null)}
          title={`رفع مانع و تصمیم‌گیری مدیریتی: ${resolvingBlockerRecord.code}`}
          size="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
              <span className="font-bold block">مانع فعلی:</span>
              <p className="leading-relaxed mt-0.5">{resolvingBlockerRecord.blockerReason}</p>
            </div>

            <FieldGroup>
              <label className="block text-slate-700 font-bold mb-1">شرح تصمیم و دستور رفع مانع:</label>
              <textarea
                value={blockerResolutionNote}
                onChange={(e) => setBlockerResolutionNote(e.target.value)}
                placeholder="مثلاً: با اخذ تعهد کتبی و تسویه ۳۰ روزه با ادامه فرآیند موافقت شد..."
                className="w-full p-2 rounded-lg border border-slate-200 bg-white min-h-[80px]"
              />
            </FieldGroup>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setResolvingBlockerRecord(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirmResolveBlocker}>
                ثبت رفع مانع و ادامه فرآیند
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
