import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState } from 'react';
import {
  OrgUnit,
  OrgPosition,
  UserAccessProfile,
  DelegationRecord,
  MockPersona,
} from '../types';
import {
  MOCK_ORG_UNITS,
  MOCK_POSITIONS,
  MOCK_USER_PROFILES,
  MOCK_DELEGATIONS,
} from '../data/mockOrgData';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Chip, Badge } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { formatNumber } from '../utils/formatters';
import { Briefcase, Calendar, HelpCircle, Plus, UserPlus, CheckCircle2, Building2, UserX } from 'lucide-react';
import { getPersonaDisplayName, stripRoleSampleSuffix } from '../runtime/documentBasedPersonas';

interface OrgAccessViewProps {
  initialTab?: 'org_users' | 'org_responsibilities' | 'org_delegations' | 'access_matrix';
  activePersona: MockPersona;
  onOpenCreateUserModal?: () => void;
  onOpenAssignTaskModal?: (assigneeName?: string) => void;
}

export const OrgAccessView: React.FC<OrgAccessViewProps> = ({
  initialTab = 'org_users',
  activePersona,
  onOpenCreateUserModal,
  onOpenAssignTaskModal,
}) => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'org_users' | 'org_responsibilities' | 'org_delegations' | 'access_matrix'>(
    initialTab
  );

  const [users, setUsers] = useState<UserAccessProfile[]>([...MOCK_USER_PROFILES]);
  const [delegations, setDelegations] = useState<DelegationRecord[]>([...MOCK_DELEGATIONS]);
  const [units] = useState<OrgUnit[]>([...MOCK_ORG_UNITS]);
  const [positions] = useState<OrgPosition[]>([...MOCK_POSITIONS]);

  // Why access drawer state
  const [whyAccessUser, setWhyAccessUser] = useState<UserAccessProfile | null>(null);

  // New delegation modal
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delDelegateeName, setDelDelegateeName] = useState('آقای یوسفی');
  const [delScopeTitle, setDelScopeTitle] = useState('تأیید حواله خروج انبار اضطراری و تأمین تا سقف ۲ میلیارد ریال');
  const [delStartDate, setDelStartDate] = useState('۱۴۰۴/۰۶/۱۵');
  const [delEndDate, setDelEndDate] = useState('۱۴۰۴/۰۶/۳۱');
  const [delLimitRials, setDelLimitRials] = useState(2000000000);
  const [delReason, setDelReason] = useState('پوشش دوره مرخصی و مأموریت برون‌شهری');

  // Capability-based authorization checks
  const canManageUsers = activePersona.capabilities.includes('USER_MANAGE');
  const canManageResponsibilities = activePersona.capabilities.includes('RESPONSIBILITY_MANAGE');
  const canManageDelegations = activePersona.capabilities.includes('DELEGATION_MANAGE');
  const canAssignWork =
    activePersona.capabilities.includes('WORK_CREATE') || activePersona.capabilities.includes('WORK_ASSIGN');

  // Permission Simulation / Preview Modal
  const [isGrantRevokeModalOpen, setIsGrantRevokeModalOpen] = useState(false);
  const [simulationUser, setSimulationUser] = useState<UserAccessProfile | null>(null);
  const [simulatedAction, setSimulatedAction] = useState<'grant' | 'revoke'>('grant');

  // Assign Unit and Responsibility Modal State
  const [assigningUser, setAssigningUser] = useState<UserAccessProfile | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedLimitRials, setSelectedLimitRials] = useState('500000000');

  // Deactivated user IDs state
  const [deactivatedUserIds, setDeactivatedUserIds] = useState<Set<string>>(new Set(['usr-9']));

  const handleOpenAssignModal = (u: UserAccessProfile) => {
    setAssigningUser(u);
    setSelectedUnit(u.unit);
    setSelectedPosition(u.jobTitle);
    setSelectedLimitRials(String(u.financialLimitRials));
  };

  const handleSaveUnitAndResponsibility = () => {
    if (!assigningUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === assigningUser.id
          ? {
              ...u,
              unit: selectedUnit,
              jobTitle: selectedPosition,
              financialLimitRials: Number(selectedLimitRials) || u.financialLimitRials,
            }
          : u
      )
    );
    addToast(`واحد و سمت سازمانی ${assigningUser.name} با موفقیت به‌روزرسانی شد`, {
      description: `واحد: ${selectedUnit} • سمت: ${selectedPosition}`,
      tone: 'success',
    });
    setAssigningUser(null);
  };

  const handleToggleUserActive = (u: UserAccessProfile) => {
    const isCurrentlyDeactivated = deactivatedUserIds.has(u.id);
    setDeactivatedUserIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyDeactivated) {
        next.delete(u.id);
      } else {
        next.add(u.id);
      }
      return next;
    });

    if (isCurrentlyDeactivated) {
      addToast(`حساب کاربری «${u.name}» فعال گردید`, {
        description: 'دسترسی‌های ورود به سامانه و کارتابل برای این کاربر احیا شد.',
        tone: 'success',
      });
    } else {
      addToast(`حساب کاربری «${u.name}» غیرفعال شد`, {
        description: 'کلیه نشست‌های فعال و دسترسی‌های این کاربر تا اطلاع ثانوی مسدود گردید.',
        tone: 'warning',
      });
    }
  };

  const handleCreateDelegation = () => {
    const newDel: DelegationRecord = {
      id: `del-rec-${Date.now()}`,
      code: `DEL-1404-${Math.floor(10 + Math.random() * 90)}`,
      delegator: {
        id: activePersona.id,
        name: getPersonaDisplayName(activePersona),
        role: stripRoleSampleSuffix(activePersona.jobTitle),
        department: 'معاونت بازرگانی / عملیات',
      },
      delegatee: {
        id: 'usr-del',
        name: delDelegateeName,
        role: 'کارشناس ارشد عملیات',
        department: 'معاونت عملیات',
      },
      title: delScopeTitle,
      authorizedScope: delScopeTitle,
      startDateJalali: delStartDate,
      endDateJalali: delEndDate,
      status: 'active',
      approvalLimitRials: Number(delLimitRials),
      reason: delReason,
    };

    setDelegations([newDel, ...delegations]);
    setIsDelegationModalOpen(false);
    addToast('حکم تفویض اختیارات با موفقیت در سامانه ثبت و فعال شد', {
      description: `جانشینی از ${delStartDate} تا ${delEndDate} معتبر است.`,
      tone: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              ساختار سازمانی، تفویض اختیارات و ماتریس دسترسی
            </h2>
            <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              امنیت و تفکیک وظایف (SoD)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پایش دامنه‌های دسترسی مؤثر (فردی، واحدی، کل سازمان)، احکام جانشینی مدت‌دار و پاسخ به «چرا این دسترسی را دارد؟»
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateUserModal && canManageUsers && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={onOpenCreateUserModal}
            >
              + تعریف کاربر جدید
            </Button>
          )}

          {onOpenAssignTaskModal && canAssignWork && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenAssignTaskModal()}
            >
              + واگذاری وظیفه
            </Button>
          )}

          {activeTab === 'org_delegations' && canManageDelegations && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsDelegationModalOpen(true)}
            >
              ثبت حکم تفویض جانشینی جدید
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Chip
            label="پروفایل پرسنل و دسترسی مؤثر"
            count={users.length}
            isSelected={activeTab === 'org_users'}
            onClick={() => setActiveTab('org_users')}
          />
          <Chip
            label="احکام تفویض اختیارات و جانشینی"
            count={delegations.length}
            isSelected={activeTab === 'org_delegations'}
            onClick={() => setActiveTab('org_delegations')}
          />
          <Chip
            label="ساختار واحدها و پست‌ها"
            count={units.length + positions.length}
            isSelected={activeTab === 'org_responsibilities'}
            onClick={() => setActiveTab('org_responsibilities')}
          />
        </div>
      </div>

      {/* ================= TAB 1: USERS & EFFECTIVE ACCESS ================= */}
      {activeTab === 'org_users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.map((u) => {
              const isDeactivated = deactivatedUserIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className={`bg-white p-4 rounded-xl border shadow-none space-y-3 transition-colors ${
                    isDeactivated ? 'border-rose-200 bg-rose-50/20 opacity-80' : 'border-slate-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-extrabold text-slate-900">{u.name}</h3>
                        <span
                          className={`px-1.5 py-0.5 rounded text-caption font-bold ${
                            isDeactivated ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isDeactivated ? 'غیرفعال (مسدود)' : 'فعال'}
                        </span>
                      </div>
                      <div className="text-caption text-slate-500">{u.jobTitle}</div>
                      <div className="text-caption text-slate-500 font-mono">کد ملی: {u.nationalCode}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-caption font-bold ${
                        u.effectiveScope === 'organization'
                          ? 'bg-slate-50 text-slate-700'
                          : u.effectiveScope === 'unit'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      دامنه: {u.effectiveScope === 'organization' ? 'کل سازمان' : u.effectiveScope === 'unit' ? 'واحد سازمانی' : 'فردی'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">واحد سازمانی:</span>
                      <span className="font-bold text-slate-800">{u.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">سقف تأیید مالی:</span>
                      <span className="font-mono font-bold text-primary-700">
                        {formatNumber(u.financialLimitRials / 1000000)} میلیون ریال
                      </span>
                    </div>
                    {u.activeDelegation && (
                      <div className="pt-1.5 border-t border-slate-200 text-caption text-amber-800">
                        <span className="font-bold block">دارای حکم جانشینی فعال:</span>
                        <span>از طرف {u.activeDelegation.delegatorName} (تا {u.activeDelegation.validUntilJalali})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                        onClick={() => setWhyAccessUser(u)}
                      >
                        علت دسترسی
                      </Button>

                      {canManageResponsibilities && (
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<Briefcase className="w-3.5 h-3.5 text-primary-700" />}
                          onClick={() => handleOpenAssignModal(u)}
                        >
                          تخصیص واحد و سمت
                        </Button>
                      )}

                      {canManageUsers && (
                        <Button
                          size="xs"
                          variant={isDeactivated ? 'secondary' : 'destructive'}
                          leftIcon={isDeactivated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <UserX className="w-3.5 h-3.5" />}
                          onClick={() => handleToggleUserActive(u)}
                        >
                          {isDeactivated ? 'فعال‌سازی' : 'غیرفعال‌سازی'}
                        </Button>
                      )}

                      {canAssignWork && onOpenAssignTaskModal && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => onOpenAssignTaskModal(u.name)}
                        >
                          واگذاری وظیفه
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DATED DELEGATIONS ================= */}
      {activeTab === 'org_delegations' && (
        <div className="space-y-4">
          <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-xl text-xs text-primary-950 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">قانون جانشینی و تفویض اختیارات جوادیان:</div>
              <p className="text-primary-800 leading-relaxed mt-0.5 text-caption">
                هر تفویض الزاماً دارای تاریخ آغاز و پایان مشخص، سقف اختیارات مالی و عنوان دقیق است. پس از سررسید تاریخ پایان، تفویض به صورت خودکار منقضی شده و مسئولیت‌های جانشین ملغی می‌گردد.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
            <AdaptiveTable className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3 font-bold">عنوان تفویض و کد حکم</th>
                  <th className="p-3 font-bold">تفویض‌کننده (اصیل)</th>
                  <th className="p-3 font-bold">جانشین (وکیل)</th>
                  <th className="p-3 font-bold">بازه اعتبار زمانی</th>
                  <th className="p-3 font-bold">سقف ریالی مجاز</th>
                  <th className="p-3 font-bold">وضعیت</th>
                  <th className="p-3 font-bold text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delegations.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-slate-500 text-caption font-bold">{del.code}</div>
                      <div className="font-extrabold text-slate-900 mt-0.5">{del.title}</div>
                      <div className="text-slate-500 text-caption mt-0.5">{del.reason}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800">{del.delegator.name}</div>
                      <div className="text-slate-500 text-caption">{del.delegator.role}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-primary-700">{del.delegatee.name}</div>
                      <div className="text-slate-500 text-caption">{del.delegatee.role}</div>
                    </td>

                    <td className="p-3 font-mono">
                      <div className="text-slate-700">از: {del.startDateJalali}</div>
                      <div className="text-slate-500 text-caption">تا: {del.endDateJalali}</div>
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900">
                      {formatNumber(del.approvalLimitRials / 1000000)} میلیون ریال
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-caption font-bold ${
                          del.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {del.status === 'active' ? 'فعال و جاری' : 'منقضی‌شده'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {del.status === 'active' && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setDelegations((prev) =>
                              prev.map((d) => (d.id === del.id ? { ...d, status: 'expired' } : d))
                            );
                            addToast(`حکم تفویض ${del.code} لغو گردید`, { tone: 'warning' });
                          }}
                        >
                          لغو پیش از موعد
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdaptiveTable>
          </div>
        </div>
      )}

      {/* ================= TAB 3: UNITS & POSITIONS ================= */}
      {activeTab === 'org_responsibilities' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Units */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-700" />
                <span>واحدهای تابعه سازمان جوادیان</span>
              </h3>
              <div className="space-y-2 text-xs">
                {units.map((u) => (
                  <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 text-caption mt-0.5">مدیر واحد: {u.managerName}</div>
                    </div>
                    <span className="text-caption bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">
                      {u.staffCount} پرسنل
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Positions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary-700" />
                <span>پست‌های سازمانی و دامنه‌های پیش‌فرض</span>
              </h3>
              <div className="space-y-2 text-xs">
                {positions.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-slate-500 text-caption mt-0.5">{p.unitName} • {p.levelLabel}</div>
                    </div>
                    <span className="text-caption bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-bold">
                      {p.defaultScope === 'organization' ? 'کل سازمان' : p.defaultScope === 'unit' ? 'واحد' : 'فردی'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER: "WHY DO I HAVE THIS ACCESS?" ================= */}
      <Drawer
        isOpen={!!whyAccessUser}
        onClose={() => setWhyAccessUser(null)}
        title={whyAccessUser ? `منشأ و تبارشناسی دسترسی: ${whyAccessUser.name}` : ''}
        subtitle={whyAccessUser ? `${whyAccessUser.jobTitle} • ${whyAccessUser.unit}` : ''}
        width="lg"
        footer={
          <Button size="sm" variant="outline" onClick={() => setWhyAccessUser(null)}>
            بستن
          </Button>
        }
      >
        {whyAccessUser && (
          <div className="space-y-4 text-xs">
            {/* Effective Scope Summary */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">خلاصه دامنه دسترسی مؤثر:</span>
              <p className="text-slate-700 leading-relaxed">{whyAccessUser.scopeSummaryPersian}</p>
            </div>

            {/* List of Permissions with Explanations */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2.5">
                مجوزهای فعال و مبنای قانونی دریافت هر کدام:
              </h4>

              <div className="space-y-2.5">
                {whyAccessUser.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-none space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900">{perm.labelPersian}</div>
                      <span
                        className={`text-caption font-bold px-2 py-0.5 rounded ${
                          perm.inheritedFrom === 'delegation'
                            ? 'bg-amber-50 text-amber-800'
                            : perm.inheritedFrom === 'position'
                            ? 'bg-primary-50 text-primary-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {perm.inheritedFrom === 'delegation'
                          ? 'به واسطه تفویض جانشینی'
                          : perm.inheritedFrom === 'position'
                          ? 'مبتنی بر پست سازمانی'
                          : 'تخصیص مستقیم فردی'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-caption leading-relaxed">{perm.description}</p>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-caption text-slate-500">
                      <span>منبع انتساب: {perm.sourceName}</span>
                      {perm.scopeConstraint && (
                        <span className="font-bold text-primary-700">{perm.scopeConstraint}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ================= MODAL: GRANT / REVOKE SIMULATION ================= */}
      <ModalDialog
        isOpen={isGrantRevokeModalOpen}
        onClose={() => setIsGrantRevokeModalOpen(false)}
        title="شبیه‌سازی و پیش‌نمایش اثر تغییر دسترسی (Simulation)"
        width="md"
        footer={
          <div className="w-full flex justify-between">
            <Button size="sm" variant="outline" onClick={() => setIsGrantRevokeModalOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                addToast('شبیه‌سازی انجام شد: هیچ تداخل قانونی در تفکیک وظایف یافت نشد', {
                  tone: 'info',
                });
                setIsGrantRevokeModalOpen(false);
              }}
            >
              اجرای آزمایشی بررسی انطباق SoD
            </Button>
          </div>
        }
      >
        {simulationUser && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              این ابزار به مدیران اجازه می‌دهد پیش از اعمال تغییرات واقعی در سطح سازمان، اثر تغییر مجوز روی پرونده‌های باز و قوانین تفکیک وظایف (SoD) را پایش نمایند.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800">کاربر مورد آزمون:</span>
              <div className="text-slate-600">{simulationUser.name} ({simulationUser.jobTitle})</div>
            </div>

            <FormField label="عملیات مورد شبیه‌سازی">
              <SelectInput
                value={simulatedAction}
                onChange={(e) => setSimulatedAction(e.target.value as any)}
                options={[
                  { label: 'افزودن مجوز تأیید اسناد مالی و فاکتورها', value: 'grant' },
                  { label: 'سلب موقت دسترسی به انبار کهریزک', value: 'revoke' },
                ]}
              />
            </FormField>
          </div>
        )}
      </ModalDialog>

      {/* ================= MODAL: NEW DATED DELEGATION ================= */}
      <ModalDialog
        isOpen={isDelegationModalOpen}
        onClose={() => setIsDelegationModalOpen(false)}
        title="ثبت حکم تفویض اختیارات و جانشینی"
        width="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDelegationModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateDelegation}>
              صدور و ابلاغ حکم
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-caption leading-relaxed">
            تفویض‌کننده رسمی: <span className="font-bold">{getPersonaDisplayName(activePersona)}</span>. کلیه اقدامات جانشین در لاگ‌های امنیتی با ذکر نام هر دو نفر ثبت می‌گردد.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="نام کارمند جانشین" required>
              <TextInput
                value={delDelegateeName}
                onChange={(e) => setDelDelegateeName(e.target.value)}
              />
            </FormField>

            <FormField label="سقف ریالی مجاز در تفویض" required>
              <TextInput
                type="number"
                value={delLimitRials}
                onChange={(e) => setDelLimitRials(Number(e.target.value))}
              />
            </FormField>

            <FormField label="تاریخ آغاز (شمسی)" required>
              <TextInput
                value={delStartDate}
                onChange={(e) => setDelStartDate(e.target.value)}
              />
            </FormField>

            <FormField label="تاریخ پایان و ابطال خودکار (شمسی)" required>
              <TextInput
                value={delEndDate}
                onChange={(e) => setDelEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="دایره و عنوان اختیارات واگذارشده" required>
            <TextInput
              value={delScopeTitle}
              onChange={(e) => setDelScopeTitle(e.target.value)}
            />
          </FormField>

          <FormField label="علت و مستند تفویض">
            <TextareaInput
              rows={2}
              value={delReason}
              onChange={(e) => setDelReason(e.target.value)}
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= MODAL: ASSIGN UNIT & RESPONSIBILITY ================= */}
      <ModalDialog
        isOpen={!!assigningUser}
        onClose={() => setAssigningUser(null)}
        title={assigningUser ? `تخصیص واحد و سمت سازمانی: ${assigningUser.name}` : ''}
        width="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button size="sm" variant="outline" onClick={() => setAssigningUser(null)}>
              انصراف
            </Button>
            <Button size="sm" variant="primary" onClick={handleSaveUnitAndResponsibility}>
              ذخیره و انتساب سمت
            </Button>
          </div>
        }
      >
        {assigningUser && (
          <div className="space-y-3.5 text-xs text-right">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 text-caption leading-relaxed">
              انتساب واحد و مسئولیت سازمانی به منزله تعیین دامنه مؤثر دسترسی کاربر در پرونده‌ها و کارتابل واحد مربوطه است.
            </div>

            <FormField label="واحد سازمانی متبوع" required>
              <SelectInput
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                options={units.map((u) => ({ label: u.name, value: u.name }))}
              />
            </FormField>

            <FormField label="سمت و عنوان سازمانی (مسئولیت)" required>
              <SelectInput
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                options={positions.map((p) => ({ label: `${p.title} (${p.unitName})`, value: p.title }))}
              />
            </FormField>

            <FormField label="سقف تأیید مالی مجاز (ریال)" required>
              <TextInput
                type="number"
                value={selectedLimitRials}
                onChange={(e) => setSelectedLimitRials(e.target.value)}
              />
              <span className="text-caption text-slate-500 mt-1 block">
                معادل: {formatNumber(Number(selectedLimitRials) / 1000000)} میلیون ریال
              </span>
            </FormField>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};
