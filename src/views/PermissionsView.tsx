import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import {
  MockPersona,
  UserAccessProfile,
  Capability,
  BaseAction,
  BaseScope,
  PermissionExplanation,
  DirectPermissionException,
} from '../types';
import { mockOrgStore } from '../data/mockOrgStore';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Badge, Chip } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { Forbidden403 } from '../components/design-system/SystemStates';
import { ShieldCheck, Plus, HelpCircle, AlertTriangle, Scale } from 'lucide-react';

interface PermissionsViewProps {
  activePersona: MockPersona;
}

// Matrix of Functional Capabilities mapped to Actions and Default Scopes
interface CapabilityMeta {
  key: Capability;
  namePersian: string;
  category: 'فروش و قیمت‌گذاری' | 'عملیات و انبارداری' | 'مالی و خزانه‌داری' | 'مدیریت و حاکمیت';
  action: BaseAction;
  defaultScope: BaseScope;
  constraintsLabel?: string;
  hasSoDRestriction?: boolean;
  sodRulePersian?: string;
}

const CAPABILITY_CATALOG: CapabilityMeta[] = [
  // Commercial
  {
    key: 'sales.create',
    namePersian: 'ثبت سفارش فروش و پیش‌فاکتور',
    category: 'فروش و قیمت‌گذاری',
    action: 'CREATE',
    defaultScope: 'SELF',
    constraintsLabel: 'مشتریان پرتفوی کارشناس یا نمایندگی منطقه‌ای',
    hasSoDRestriction: true,
    sodRulePersian: 'تفکیک وظایف (SoD): ثبت‌کننده سفارش نمی‌تواند تأییدکننده همان سفارش باشد.',
  },
  {
    key: 'sales.read',
    namePersian: 'مشاهده کارتابل سفارشات و قراردادها',
    category: 'فروش و قیمت‌گذاری',
    action: 'VIEW',
    defaultScope: 'UNIT',
  },
  {
    key: 'sales.approve',
    namePersian: 'تصویب سفارشات و شرایط اعتباری',
    category: 'فروش و قیمت‌گذاری',
    action: 'APPROVE',
    defaultScope: 'ORGANIZATION',
    constraintsLabel: 'سقف مبلغ تا ۵۰ میلیارد ریال',
    hasSoDRestriction: true,
    sodRulePersian: 'منع خودتأییدی: تأییدکننده مجاز به تصویب پیش‌فاکتور ثبت‌شده توسط خود نیست.',
  },
  {
    key: 'pricing.approve',
    namePersian: 'تصویب نرخ مصوب و تخفیف زیر کف',
    category: 'فروش و قیمت‌گذاری',
    action: 'APPROVE',
    defaultScope: 'ORGANIZATION',
    constraintsLabel: 'نرخ‌نامه مصوب روغن خوراکی',
  },
  // Supply & Inventory
  {
    key: 'warehouse_receipt.create',
    namePersian: 'صدور رسید انبار رسمی و قبض باسکول',
    category: 'عملیات و انبارداری',
    action: 'CREATE',
    defaultScope: 'UNIT',
    constraintsLabel: 'انبار کهریزک و انبار اصفهان',
  },
  {
    key: 'inventory.read',
    namePersian: 'مشاهده موجودی و کاردکس کالاها',
    category: 'عملیات و انبارداری',
    action: 'VIEW',
    defaultScope: 'UNIT',
  },
  {
    key: 'inventory.write',
    namePersian: 'ترخیص فیزیکی و تحویل بار حواله',
    category: 'عملیات و انبارداری',
    action: 'UPDATE',
    defaultScope: 'UNIT',
  },
  {
    key: 'supply.manage',
    namePersian: 'مدیریت و صدور سفارش‌های تأمین روغن خام',
    category: 'عملیات و انبارداری',
    action: 'CREATE',
    defaultScope: 'ORGANIZATION',
    constraintsLabel: 'سفارشات روغن خام و کارتن',
  },
  // Finance
  {
    key: 'finance.payment_request.create',
    namePersian: 'صدور درخواست پرداخت / تسویه کرایه بارنامه',
    category: 'مالی و خزانه‌داری',
    action: 'CREATE',
    defaultScope: 'UNIT',
    constraintsLabel: 'کرایه حمل رانندگان و هزینه‌های جاری اداری',
    hasSoDRestriction: true,
    sodRulePersian: 'تفکیک وظایف (SoD): متقاضی پرداخت نمی‌تواند تأییدکننده یا پرداخت‌کننده سند باشد.',
  },
  {
    key: 'finance.payment_request.approve',
    namePersian: 'تأیید مالی و تصویب دستور پرداخت',
    category: 'مالی و خزانه‌داری',
    action: 'APPROVE',
    defaultScope: 'ORGANIZATION',
    constraintsLabel: 'تا سقف ۱۰ میلیارد ریال',
    hasSoDRestriction: true,
    sodRulePersian: 'منع خودتأییدی: تأیید اسناد خود ثبت‌شده مجاز نیست.',
  },
  {
    key: 'finance.payment_request.execute',
    namePersian: 'اجرای تسویه بانکی و ثبت حواله شبا',
    category: 'مالی و خزانه‌داری',
    action: 'ADMIN',
    defaultScope: 'ORGANIZATION',
  },
  // Management
  {
    key: 'approvals.view',
    namePersian: 'دسترسی به کارتابل تصمیم‌گیری و امضا',
    category: 'مدیریت و حاکمیت',
    action: 'APPROVE',
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'USER_MANAGE',
    namePersian: 'مدیریت کاربران و انتسابات پرسنلی',
    category: 'مدیریت و حاکمیت',
    action: 'ADMIN',
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'RESPONSIBILITY_MANAGE',
    namePersian: 'تخصیص حوزه‌های مسئولیت سازمانی',
    category: 'مدیریت و حاکمیت',
    action: 'ADMIN',
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'DELEGATION_MANAGE',
    namePersian: 'صدور و ابطال احکام جانشینی و تفویض',
    category: 'مدیریت و حاکمیت',
    action: 'ADMIN',
    defaultScope: 'ORGANIZATION',
  },
];

export const PermissionsView: React.FC<PermissionsViewProps> = ({ activePersona }) => {
  const { addToast } = useToast();

  const isAuthorized = activePersona.capabilities.includes('USER_MANAGE');

  const [users, setUsers] = useState<UserAccessProfile[]>(mockOrgStore.getUsers());

  useEffect(() => {
    return mockOrgStore.subscribe(() => {
      setUsers(mockOrgStore.getUsers());
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');

  // "Why this access?" Drawer State
  const [drilldownUser, setDrilldownUser] = useState<UserAccessProfile | null>(null);

  // Direct Exception Modal
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionUserId, setExceptionUserId] = useState(users[0]?.id || '');
  const [exceptionCapability, setExceptionCapability] = useState<Capability>('sales.read');
  const [exceptionType, setExceptionType] = useState<'GRANT' | 'RESTRICT'>('GRANT');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionCeilingRials, setExceptionCeilingRials] = useState<number>(500000000);
  const [exceptionError, setExceptionError] = useState<string | null>(null);

  // Admin effective ceiling simulation (e.g. 20,000,000,000 Rials)
  const ADMIN_EFFECTIVE_CEILING_RIALS = 20000000000;

  if (!isAuthorized) {
    return (
      <Forbidden403
        missingCapabilities={['USER_MANAGE']}
        onNavigateToInbox={() => {}}
        onSwitchPersona={() => {}}
      />
    );
  }

  // Handle adding direct exception with admin ceiling check
  const handleAddException = () => {
    setExceptionError(null);

    if (!exceptionReason.trim()) {
      setExceptionError('ثبت توجیه اداری و علت استثنا الزامی است.');
      return;
    }

    // Ceilings check: Admin cannot grant beyond their own effective ceiling!
    if (exceptionCeilingRials > ADMIN_EFFECTIVE_CEILING_RIALS) {
      setExceptionError(
        `خطای سقف اختیارات: شما مجاز به اعطای اختیارات فراتر از سقف مؤثر اداری خود (${ADMIN_EFFECTIVE_CEILING_RIALS.toLocaleString(
          'fa-IR'
        )} ریال) نیستید.`
      );
      return;
    }

    const success = mockOrgStore.addDirectException({
      userId: exceptionUserId,
      capability: exceptionCapability,
      actionType: exceptionType,
      reason: exceptionReason.trim(),
      scopeConstraint:
        exceptionType === 'GRANT'
          ? `سقف مالی: ${exceptionCeilingRials.toLocaleString('fa-IR')} ریال`
          : undefined,
      actorName: activePersona.name,
    });

    if (success) {
      const user = users.find((u) => u.id === exceptionUserId);
      addToast(
        `استثنای دسترسی برای «${user?.name}» با موفقیت ثبت گردید و در شناسنامه امنیتی درج شد.`,
        'success'
      );
      setIsExceptionModalOpen(false);
      setExceptionReason('');
    }
  };

  const getActionBadge = (action: BaseAction) => {
    switch (action) {
      case 'VIEW':
        return <span className="px-2 py-0.5 text-caption font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">مشاهده (VIEW)</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 text-caption font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">ایجاد (CREATE)</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 text-caption font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">ویرایش (UPDATE)</span>;
      case 'APPROVE':
        return <span className="px-2 py-0.5 text-caption font-bold bg-amber-50 text-amber-800 rounded border border-amber-200">تأیید (APPROVE)</span>;
      case 'CANCEL':
        return <span className="px-2 py-0.5 text-caption font-bold bg-rose-50 text-rose-700 rounded border border-rose-200">ابطال (CANCEL)</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-caption font-bold bg-slate-50 text-slate-700 rounded border border-slate-200">مدیریت (ADMIN)</span>;
    }
  };

  const getScopeBadge = (scope: BaseScope) => {
    switch (scope) {
      case 'SELF':
        return <Badge variant="neutral" label="فقط شخصی (SELF)" />;
      case 'UNIT':
        return <Badge variant="info" label="واحد متبوع (UNIT)" />;
      case 'ORGANIZATION':
        return <Badge variant="warning" label="سراسر سازمان (ORG)" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">مجوزها و ماتریس دسترسی</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                تفکیک نوع اقدام از دامنه مشاهده، اعمال اصل تفکیک وظایف (SoD)، منع خودتأییدی و زنجیره استدلال دسترسی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setExceptionUserId(users[0]?.id || '');
              setExceptionError(null);
              setIsExceptionModalOpen(true);
            }}
          >
            ثبت استثنای دسترسی مستقیم
          </Button>
        </div>
      </div>

      {/* Separation of Duties (SoD) & Anti-Self-Approval Banner */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <Scale className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
        <div className="text-xs text-rose-950 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>حاکمیت اصل تفکیک وظایف (Separation of Duties - SoD) و منع مطلق خودتأییدی:</span>
            <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-caption rounded-full font-mono">
              قفل تفکیک وظایف — فعال
            </span>
          </div>
          <div>
            در هیچ نقطه‌ای از سیستم، کاربر ثبت‌کننده سفارش (نظیر علیرضا تهرانی) یا صادرکننده درخواست پرداخت (نظیر پروانه صالحی یا کامران داوودی) قادر به تأیید نهایی یا صدور حواله برای رکورد ثبت‌شده توسط خود نخواهد بود؛ حتی اگر بالاترین مسئولیت یا تفویض اختیارات سازمانی را دارا باشد.
          </div>
        </div>
      </div>

      {/* User Selection & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <FieldGroup className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">بررسی پرسنل:</label>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="ALL">همه پرسنل سازمانی</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.personnelCode}) — {u.jobTitle}
              </option>
            ))}
          </select>
        </FieldGroup>

        <div className="text-xs text-slate-500">
          برای ردیابی منشأ هر مجوز، بر روی دکمه «چرا این دسترسی را دارد؟» در هر سطر کلیک کنید.
        </div>
      </div>

      {/* Access Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700">
            ماتریس قابلیت‌های سیستم (تفکیک نوع اقدام از دامنه دید)
          </div>
          <div className="text-xs text-slate-500">
            تعداد قابلیت‌های کلیدی: <span className="font-bold font-mono">{CAPABILITY_CATALOG.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <AdaptiveTable essential className="w-full text-right text-xs">
            <thead className="sticky top-0 bg-slate-100 z-20 text-slate-700 font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th className="py-3 px-4 sticky right-0 bg-slate-100 z-30 shadow-[1px_0_0_0_#e2e8f0]">عنوان قابلیت / شناسه فنی</th>
                <th className="py-3 px-4">رده کارکردی</th>
                <th className="py-3 px-4">نوع اقدام مجاز</th>
                <th className="py-3 px-4">دامنه دید پیش‌فرض</th>
                <th className="py-3 px-4">قیود و الزامات تفکیک وظایف (SoD)</th>
                <th className="py-3 px-4 text-center">پرسنل دارنده مجوز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {CAPABILITY_CATALOG.map((cap) => {
                // Find users who have this capability
                const holdingUsers = users.filter((u) =>
                  u.permissions?.some((p) => p.capability === cap.key)
                );

                // If filter is active
                if (selectedUserFilter !== 'ALL') {
                  const hasUser = holdingUsers.some((u) => u.id === selectedUserFilter);
                  if (!hasUser) return null;
                }

                return (
                  <tr key={cap.key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 sticky right-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      <div className="font-bold text-slate-900">{cap.namePersian}</div>
                      <div className="text-caption font-mono text-slate-500 mt-0.5">{cap.key}</div>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {cap.category}
                    </td>

                    <td className="py-4 px-4">
                      {getActionBadge(cap.action)}
                    </td>

                    <td className="py-4 px-4">
                      {getScopeBadge(cap.defaultScope)}
                    </td>

                    <td className="py-4 px-4">
                      {cap.hasSoDRestriction && (
                        <div className="flex items-start gap-1 text-caption text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{cap.sodRulePersian}</span>
                        </div>
                      )}
                      {cap.constraintsLabel && !cap.hasSoDRestriction && (
                        <div className="text-caption text-slate-500">
                          قید عملیاتی: {cap.constraintsLabel}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {holdingUsers.length === 0 ? (
                          <span className="text-caption text-slate-500">فاقد منتسب</span>
                        ) : (
                          holdingUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setDrilldownUser(u)}
                              className="px-2 py-0.5 text-caption bg-primary-50 text-primary-700 hover:bg-primary-100 rounded border border-primary-200 font-medium transition-colors flex items-center gap-1"
                              title="مشاهده شناسنامه و علت اعطای دسترسی"
                             aria-label="مشاهده شناسنامه و علت اعطای دسترسی">
                              <span>{u.name}</span>
                              <HelpCircle className="w-3 h-3 text-primary-400" />
                            </button>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdaptiveTable>
        </div>
      </div>

      {/* ================= DRAWER: "WHY THIS ACCESS?" EXPLANATION ================= */}
      {drilldownUser && (
        <Drawer
          isOpen={true}
          onClose={() => setDrilldownUser(null)}
          title={`زنجیره استدلال دسترسی: ${drilldownUser.name}`}
          size="md"
        >
          <div className="space-y-5 text-xs">
            {/* User Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{drilldownUser.name}</span>
                <span className="font-mono text-slate-500">{drilldownUser.personnelCode}</span>
              </div>
              <div className="text-slate-600">
                {drilldownUser.jobTitle} • واحد {drilldownUser.unit}
              </div>
              <div className="text-slate-500 text-caption">
                دامنه مؤثر: <span className="font-semibold text-slate-800">{drilldownUser.scopeSummaryPersian}</span>
              </div>
            </div>

            {/* Questions Banner */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-primary-900 leading-relaxed">
              <span className="font-bold">«چرا این کاربر این مجوزها را دارد؟» </span>
              سیستم به صورت شفاف منشأ هر قابلیت را بر اساس ۳ ستون قانونی (حوزه مسئولیت، تخصیص مستقیم استثنا، و تفویض جانشینی) تبیین می‌نماید:
            </div>

            {/* List of Permissions with Explanations */}
            <div className="space-y-3">
              {drilldownUser.permissions && drilldownUser.permissions.length > 0 ? (
                drilldownUser.permissions.map((p, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{p.labelPersian}</span>
                      <Badge
                        variant={
                          p.inheritedFrom === 'delegation'
                            ? 'warning'
                            : p.inheritedFrom === 'direct'
                            ? 'info'
                            : 'neutral'
                        }
                        label={
                          p.inheritedFrom === 'delegation'
                            ? 'ناشی از تفویض جانشینی'
                            : p.inheritedFrom === 'direct'
                            ? 'استثنای دسترسی مستقیم'
                            : 'ناشی از حوزه مسئولیت سازمانی'
                        }
                      />
                    </div>

                    <div className="font-mono text-caption text-slate-500">{p.capability}</div>
                    <div className="text-slate-600 text-caption leading-relaxed">{p.description}</div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-caption space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">منبع استناد:</span>
                        <span className="font-medium text-slate-800">{p.sourceName || 'حوزه سازمانی'}</span>
                      </div>
                      {p.scopeConstraint && (
                        <div className="flex justify-between text-primary-700">
                          <span>قید عملیاتی:</span>
                          <span className="font-medium">{p.scopeConstraint}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl">
                  کاربر فاقد هرگونه مجوز عملیاتی ویژه است.
                </div>
              )}
            </div>

            {/* Direct Exceptions List (if any) */}
            {drilldownUser.directExceptions && drilldownUser.directExceptions.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 mb-2">استثنائات مستقیم ثبت‌شده توسط مدیریت</h4>
                <div className="space-y-2">
                  {drilldownUser.directExceptions.map((ex) => (
                    <div key={ex.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                      <div className="flex justify-between font-bold text-amber-900">
                        <span>{ex.capability}</span>
                        <span>{ex.actionType === 'GRANT' ? 'اعطای مازاد' : 'محدودسازی'}</span>
                      </div>
                      <div className="text-slate-600 text-caption">{ex.reason}</div>
                      <div className="text-slate-500 text-caption flex justify-between pt-1 border-t border-amber-200">
                        <span>صادرکننده: {ex.grantedBy}</span>
                        <span className="font-mono">{ex.grantedAtJalali}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ================= MODAL: DIRECT EXCEPTION ================= */}
      {isExceptionModalOpen && (
        <ModalDialog
          isOpen={true}
          onClose={() => setIsExceptionModalOpen(false)}
          title="ثبت استثنای دسترسی مستقیم پرسنل"
          size="md"
        >
          <div className="space-y-4 text-xs">
            {exceptionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{exceptionError}</span>
              </div>
            )}

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">انتخاب پرسنل</label>
              <select
                value={exceptionUserId}
                onChange={(e) => setExceptionUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.personnelCode}) — {u.jobTitle}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">قابلیت مورد نظر</label>
                <select
                  value={exceptionCapability}
                  onChange={(e) => setExceptionCapability(e.target.value as Capability)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                >
                  {CAPABILITY_CATALOG.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.namePersian} ({c.key})
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">نوع استثنا</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="GRANT">اعطای دسترسی مستقیم مازاد (GRANT)</option>
                  <option value="RESTRICT">سلب / محدودسازی مستقیم (RESTRICT)</option>
                </select>
              </FieldGroup>
            </div>

            {exceptionType === 'GRANT' && (
              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  سقف مالی مجاز به ریال (حداکثر تا سقف مدیر: ۲۰,۰۰۰,۰۰۰,۰۰۰ ریال)
                </label>
                <input
                  type="number"
                  value={exceptionCeilingRials}
                  onChange={(e) => setExceptionCeilingRials(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                />
              </FieldGroup>
            )}

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">
                علت و توجیه اداری استثنا <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="شماره مصوبه هیئت مدیره یا دلایل ممیزی را ثبت کنید..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsExceptionModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" onClick={handleAddException}>
                ثبت استثنا در پرونده ممیزی
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
