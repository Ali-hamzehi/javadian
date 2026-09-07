import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import {
  MockPersona,
  ResponsibilityArea,
  ResponsibilityAssignment,
  UserAccessProfile,
  OrgPosition,
  OrgUnit,
} from '../types';
import { mockOrgStore } from '../data/mockOrgStore';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Badge, Chip } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { Forbidden403 } from '../components/design-system/SystemStates';
import { Briefcase, Layers, Plus, Search, ShieldCheck, UserCheck, Info } from 'lucide-react';

interface ResponsibilitiesViewProps {
  activePersona: MockPersona;
}

export const ResponsibilitiesView: React.FC<ResponsibilitiesViewProps> = ({ activePersona }) => {
  const { addToast } = useToast();

  const isAuthorized = activePersona.capabilities.includes('RESPONSIBILITY_MANAGE');

  const [responsibilities, setResponsibilities] = useState<ResponsibilityArea[]>(
    mockOrgStore.getResponsibilities()
  );
  const [assignments, setAssignments] = useState<ResponsibilityAssignment[]>(
    mockOrgStore.getAssignments()
  );
  const [users, setUsers] = useState<UserAccessProfile[]>(mockOrgStore.getUsers());
  const [positions] = useState<OrgPosition[]>(mockOrgStore.getPositions());
  const [units] = useState<OrgUnit[]>(mockOrgStore.getUnits());

  useEffect(() => {
    return mockOrgStore.subscribe(() => {
      setResponsibilities(mockOrgStore.getResponsibilities());
      setAssignments(mockOrgStore.getAssignments());
      setUsers(mockOrgStore.getUsers());
    });
  }, []);

  // Sub-tabs: 'assignments' (احکام تخصیص پرسنل) vs 'catalog' (کاتالوگ حوزه‌های مسئولیت) vs 'positions' (پست‌های چارت)
  const [activeTab, setActiveTab] = useState<'assignments' | 'catalog' | 'positions'>('assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Modal: Assign Responsibility
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState(users[0]?.id || '');
  const [targetRespId, setTargetRespId] = useState(responsibilities[0]?.id || '');
  const [isPrimaryType, setIsPrimaryType] = useState(false);
  const [startDateJalali, setStartDateJalali] = useState('۱۴۰۴/۰۶/۱۵');
  const [endDateJalali, setEndDateJalali] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Revoke Assignment Dialog
  const [revokingAssignment, setRevokingAssignment] = useState<ResponsibilityAssignment | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Selected Area Detail Drawer
  const [selectedRespArea, setSelectedRespArea] = useState<ResponsibilityArea | null>(null);

  if (!isAuthorized) {
    return (
      <Forbidden403
        missingCapabilities={['RESPONSIBILITY_MANAGE']}
        onNavigateToInbox={() => {}}
        onSwitchPersona={() => {}}
      />
    );
  }

  // Handle Assign Responsibility
  const handleConfirmAssignment = () => {
    if (!targetUserId || !targetRespId) {
      addToast('لطفاً کاربر و حوزه مسئولیت را انتخاب کنید.', 'danger');
      return;
    }

    const success = mockOrgStore.assignResponsibility({
      userId: targetUserId,
      responsibilityId: targetRespId,
      isPrimary: isPrimaryType,
      startDateJalali: startDateJalali.trim() || 'هم‌اکنون',
      endDateJalali: endDateJalali.trim() || undefined,
      assignedBy: activePersona.name,
      notes: assignmentNotes.trim() || undefined,
    });

    if (success) {
      const selectedUser = users.find((u) => u.id === targetUserId);
      const selectedResp = responsibilities.find((r) => r.id === targetRespId);
      addToast(
        `حوزه مسئولیت «${selectedResp?.title}» با موفقیت به ${selectedUser?.name} تخصیص یافت و قابلیت‌های مرتبط فعال شدند.`,
        'success'
      );
      setIsAssignModalOpen(false);
      setAssignmentNotes('');
    }
  };

  // Handle Revoke Assignment
  const handleConfirmRevoke = () => {
    if (!revokingAssignment) return;
    if (!revokeReason.trim()) {
      addToast('لطفاً علت لغو این مسئولیت را وارد نمایید.', 'danger');
      return;
    }

    mockOrgStore.revokeResponsibilityAssignment(
      revokingAssignment.id,
      activePersona.name,
      revokeReason.trim()
    );

    addToast(`مسئولیت «${revokingAssignment.responsibilityTitle}» از پرسنل لغو گردید.`, 'success');
    setRevokingAssignment(null);
    setRevokeReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="page-title text-xl sm:text-2xl font-bold text-slate-800">مسئولیت‌ها و پست‌های سازمانی</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                تفکیک عناوین چارت سازمانی از حوزه‌های صلاحیت عملیاتی، چندمسئولیتی پرسنل و ممیزی اختیارات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTargetUserId(users[0]?.id || '');
              setTargetRespId(responsibilities[0]?.id || '');
              setIsPrimaryType(false);
              setIsAssignModalOpen(true);
            }}
          >
            تخصیص مسئولیت جدید به پرسنل
          </Button>
        </div>
      </div>

      {/* Concept Clarification Banner */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-800 mt-0.5 shrink-0" />
        <div className="text-xs text-teal-950 leading-relaxed space-y-1">
          <div>
            <span className="font-bold">تفکیک بنیادی «پست چارت» از «حوزه مسئولیت»: </span>
            عنوان شغلی (پست سازمانی) صرفاً جایگاه پرسنل را در ساختار اداری معین می‌کند (مانند کارشناس ارشد عملیات).
            اختیارات عملیاتی (نظیر صدور رسید انبار، هماهنگی بارنامه، تسویه کرایه یا تأیید تخفیف) از طریق «حوزه‌های مسئولیت» به فرد واگذار می‌شوند.
          </div>
          <div className="text-caption text-teal-800">
            مدیران می‌توانند بدون تغییر ساختار سازمانی یا اختراع عناوین شغلی کاذب، چندین حوزه مسئولیت با بازه زمانی معین را به یک همکار بسپارند (مانند همکار چندمسئولیتی «آقای یوسفی» یا مسئولیت کرایه حمل برای «آرش»).
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-teal-600 text-teal-700 bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>احکام تخصیص مسئولیت به پرسنل ({assignments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-teal-600 text-teal-700 bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>کاتالوگ حوزه‌های مسئولیت و قابلیت‌های موروثی ({responsibilities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'positions'
              ? 'border-teal-600 text-teal-700 bg-teal-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>پست‌های چارت سازمانی ({positions.length})</span>
        </button>
      </div>

      {/* TAB 1: ASSIGNMENTS VIEW */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="جستجو با نام پرسنل یا حوزه مسئولیت..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="text-xs text-slate-500">
              مجموع احکام فعال: <span className="font-bold text-teal-700 font-mono">{assignments.filter((a) => a.status === 'active').length}</span> حکم
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <AdaptiveTable className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">پرسنل منتسب</th>
                    <th className="py-3 px-4">حوزه مسئولیت عملیاتی</th>
                    <th className="py-3 px-4">نوع مسئولیت</th>
                    <th className="py-3 px-4">بازه اعتبار حکم</th>
                    <th className="py-3 px-4">صادرکننده حکم</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4 text-center">اقدامات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assignments
                    .filter(
                      (a) =>
                        a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.responsibilityTitle.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((asg) => {
                      const user = users.find((u) => u.id === asg.userId);
                      const resp = responsibilities.find((r) => r.id === asg.responsibilityId);

                      return (
                        <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">{asg.userName}</div>
                            {user && (
                              <div className="text-caption text-slate-500">
                                {user.jobTitle} • {user.unit}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-800">{asg.responsibilityTitle}</div>
                            {asg.notes && (
                              <div className="text-caption text-slate-500 italic mt-0.5">{asg.notes}</div>
                            )}
                            {resp?.scopeConstraints && (
                              <div className="text-caption text-primary-700 mt-0.5">
                                {resp.scopeConstraints.paymentCategory && (
                                  <div>محدوده رده: {resp.scopeConstraints.paymentCategory}</div>
                                )}
                                {resp.scopeConstraints.maxAmountRials && (
                                  <div>سقف: {resp.scopeConstraints.maxAmountRials.toLocaleString('fa-IR')} ریال</div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            {asg.isPrimary ? (
                              <Badge variant="info" label="مسئولیت اصلی" />
                            ) : (
                              <Badge variant="neutral" label="مسئولیت ثانویه / جانبی" />
                            )}
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-600">
                            <div>از: {asg.startDateJalali}</div>
                            {asg.endDateJalali && <div className="text-slate-500">تا: {asg.endDateJalali}</div>}
                          </td>

                          <td className="py-4 px-4 text-slate-600 font-medium">
                            {asg.assignedBy}
                          </td>

                          <td className="py-4 px-4">
                            {asg.status === 'active' ? (
                              <Badge variant="success" label="فعال و نافذ" />
                            ) : asg.status === 'revoked' ? (
                              <Badge variant="danger" label="لغوشده" />
                            ) : (
                              <Badge variant="neutral" label="منقضی" />
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            {asg.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevokingAssignment(asg);
                                  setRevokeReason('');
                                }}
                                className="px-3 py-1.5 min-h-[36px] text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-300 font-semibold transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="لغو مسئولیت سازمانی"
                                aria-label="لغو مسئولیت سازمانی"
                              >
                                لغو مسئولیت
                              </button>
                            ) : (
                              <span className="text-caption text-slate-500">بدون اقدام</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </AdaptiveTable>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSIBILITIES CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responsibilities.map((resp) => (
              <div
                key={resp.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {resp.code}
                    </span>
                    <Badge variant="neutral" label={resp.unitName} />
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{resp.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{resp.description}</p>

                  {/* Scope Constraints */}
                  {resp.scopeConstraints && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-caption space-y-1 text-slate-700">
                      <div className="font-semibold text-slate-800">قیود و دامنه‌های عملیاتی:</div>
                      {resp.scopeConstraints.paymentCategory && (
                        <div>• رده پرداخت: {resp.scopeConstraints.paymentCategory}</div>
                      )}
                      {resp.scopeConstraints.region && <div>• منطقه: {resp.scopeConstraints.region}</div>}
                      {resp.scopeConstraints.processType && (
                        <div>• فرآیند: {resp.scopeConstraints.processType}</div>
                      )}
                      {resp.scopeConstraints.maxAmountRials && (
                        <div>
                          • سقف ریالی: {resp.scopeConstraints.maxAmountRials.toLocaleString('fa-IR')} ریال
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inherited Capabilities */}
                  <div>
                    <div className="text-caption font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>قابلیت‌های موروثی این مسئولیت:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {resp.inheritedCapabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 text-caption font-mono bg-teal-50 text-teal-800 rounded border border-teal-200"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    پرسنل منتسب:{' '}
                    <span className="font-bold text-slate-700">
                      {assignments.filter((a) => a.responsibilityId === resp.id && a.status === 'active').length} نفر
                    </span>
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedRespArea(resp)}
                  >
                    مشاهده جزییات
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POSITIONS LIST */}
      {activeTab === 'positions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">
              عناوین چارت سازمانی شرکت جوادیان (پست‌های استخدامی)
            </div>
            <div className="text-xs text-slate-500">
              تعداد عناوین تعریف‌شده: <span className="font-bold font-mono">{positions.length}</span>
            </div>
          </div>
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">کد ردیف</th>
                <th className="py-3 px-4">عنوان پست چارت</th>
                <th className="py-3 px-4">واحد اداری</th>
                <th className="py-3 px-4">سطح ارشدیت اداری</th>
                <th className="py-3 px-4">دامنه دید پیش‌فرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-500">{pos.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{pos.title}</td>
                  <td className="py-3 px-4 text-slate-600">{pos.unitName}</td>
                  <td className="py-3 px-4 text-slate-600">{pos.levelLabel}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        pos.defaultScope === 'organization'
                          ? 'warning'
                          : pos.defaultScope === 'unit'
                          ? 'info'
                          : 'neutral'
                      }
                      label={
                        pos.defaultScope === 'organization'
                          ? 'کل سازمان'
                          : pos.defaultScope === 'unit'
                          ? 'واحد متبوع'
                          : 'شخصی'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdaptiveTable>
        </div>
      )}

      {/* ================= MODAL: ASSIGN RESPONSIBILITY ================= */}
      {isAssignModalOpen && (
        <ModalDialog
          isOpen={true}
          onClose={() => setIsAssignModalOpen(false)}
          title="تخصیص حوزه مسئولیت جدید به پرسنل"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">انتخاب پرسنل هدف</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.personnelCode}) — {u.jobTitle}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">انتخاب حوزه مسئولیت عملیاتی</label>
              <select
                value={targetRespId}
                onChange={(e) => setTargetRespId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {responsibilities.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.code}) — واحد {r.unitName}
                  </option>
                ))}
              </select>
            </FieldGroup>

            {/* Preview of inherited capabilities */}
            {(() => {
              const selectedResp = responsibilities.find((r) => r.id === targetRespId);
              if (!selectedResp) return null;
              return (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="font-semibold text-slate-800 text-caption">
                    قابلیت‌های موروثی که به پرسنل اعطا خواهد شد:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedResp.inheritedCapabilities.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 text-caption font-mono bg-teal-50 text-teal-800 rounded border border-teal-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {selectedResp.scopeConstraints && (
                    <div className="text-caption text-slate-500 pt-1 border-t border-slate-200">
                      دامنه و محدوده:{' '}
                      {selectedResp.scopeConstraints.paymentCategory || selectedResp.scopeConstraints.region || 'ندارد'}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">نوع انتساب</label>
                <select
                  value={isPrimaryType ? 'primary' : 'secondary'}
                  onChange={(e) => setIsPrimaryType(e.target.value === 'primary')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="secondary">مسئولیت ثانویه / جانبی</option>
                  <option value="primary">مسئولیت اصلی</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">تاریخ شروع اعتبار</label>
                <input
                  type="text"
                  placeholder="۱۴۰۴/۰۶/۱۵"
                  value={startDateJalali}
                  onChange={(e) => setStartDateJalali(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">یادداشت اداری و توجیه تخصیص</label>
              <textarea
                rows={2}
                placeholder="توضیح دلایل انتساب، مصوبه مدیریت یا ماموریت محوله..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" onClick={handleConfirmAssignment}>
                تأیید و صدور حکم تخصیص
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= MODAL: REVOKE ASSIGNMENT ================= */}
      {revokingAssignment && (
        <ModalDialog
          isOpen={true}
          onClose={() => setRevokingAssignment(null)}
          title="لغو رسمی مسئولیت پرسنل"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800">
              آیا از لغو مسئولیت «{revokingAssignment.responsibilityTitle}» از همکار «
              {revokingAssignment.userName}» اطمینان دارید؟ با لغو این مسئولیت، کلیه قابلیت‌های موروثی مربوطه بلافاصله سلب خواهند شد.
            </div>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">
                علت لغو مسئولیت <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="دلایل تغییر چارت یا خاتمه مأموریت را ثبت نمایید..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setRevokingAssignment(null)}>
                انصراف
              </Button>
              <Button variant="danger" onClick={handleConfirmRevoke}>
                تأیید لغو و سلب دسترسی‌ها
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= DRAWER: RESPONSIBILITY DETAIL ================= */}
      {selectedRespArea && (
        <Drawer
          isOpen={true}
          onClose={() => setSelectedRespArea(null)}
          title={`شناسنامه حوزه مسئولیت: ${selectedRespArea.title}`}
          size="md"
        >
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">کد شناسایی:</span>
                <span className="font-mono font-bold text-slate-800">{selectedRespArea.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">واحد سازمانی:</span>
                <span className="font-medium text-slate-800">{selectedRespArea.unitName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">دامنه پیش‌فرض:</span>
                <span className="font-medium text-slate-800">
                  {selectedRespArea.defaultScope === 'organization'
                    ? 'کل سازمان'
                    : selectedRespArea.defaultScope === 'unit'
                    ? 'واحد سازمانی'
                    : selectedRespArea.defaultScope === 'self'
                    ? 'شخصی'
                    : selectedRespArea.defaultScope}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">شرح اختیارات عملیاتی</h4>
              <p className="text-slate-600 leading-relaxed">{selectedRespArea.description}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">قابلیت‌های موروثی</h4>
              <div className="space-y-1.5">
                {selectedRespArea.inheritedCapabilities.map((cap) => (
                  <div key={cap} className="p-2 bg-white rounded border border-slate-200 font-mono text-teal-800">
                    {cap}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">پرسنل دارای این مسئولیت</h4>
              <div className="space-y-2">
                {assignments
                  .filter((a) => a.responsibilityId === selectedRespArea.id && a.status === 'active')
                  .map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{a.userName}</div>
                        <div className="text-caption text-slate-500">
                          {a.isPrimary ? 'مسئولیت اصلی' : 'مسئولیت جانبی'} • از تاریخ {a.startDateJalali}
                        </div>
                      </div>
                      <Badge variant="success" label="فعال" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
