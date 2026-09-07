import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import {
  MockPersona,
  DelegationRecord,
  UserAccessProfile,
  ResponsibilityArea,
  Capability,
} from '../types';
import { mockOrgStore } from '../data/mockOrgStore';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Badge, Chip } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { Forbidden403 } from '../components/design-system/SystemStates';
import { UserCheck, Plus, Search, AlertTriangle, XCircle, Scale, History } from 'lucide-react';

interface DelegationsViewProps {
  activePersona: MockPersona;
}

export const DelegationsView: React.FC<DelegationsViewProps> = ({ activePersona }) => {
  const { addToast } = useToast();

  const isAuthorized = activePersona.capabilities.includes('DELEGATION_MANAGE');

  const [delegations, setDelegations] = useState<DelegationRecord[]>(mockOrgStore.getDelegations());
  const [users, setUsers] = useState<UserAccessProfile[]>(mockOrgStore.getUsers());
  const [responsibilities] = useState<ResponsibilityArea[]>(mockOrgStore.getResponsibilities());

  useEffect(() => {
    return mockOrgStore.subscribe(() => {
      setDelegations(mockOrgStore.getDelegations());
      setUsers(mockOrgStore.getUsers());
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Timeline / Detail Drawer
  const [selectedDelegation, setSelectedDelegation] = useState<DelegationRecord | null>(null);

  // Revocation Modal
  const [revokingDelegation, setRevokingDelegation] = useState<DelegationRecord | null>(null);
  const [revocationReason, setRevocationReason] = useState('');

  // Create Delegation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [delegatorId, setDelegatorId] = useState(users[0]?.id || '');
  const [delegateeId, setDelegateeId] = useState(users[1]?.id || '');
  const [targetRespId, setTargetRespId] = useState(responsibilities[0]?.id || '');
  const [authorizedScope, setAuthorizedScope] = useState('تأیید حواله خروج انبار و صدور درخواست تأمین');
  const [startDateJalali, setStartDateJalali] = useState('۱۴۰۴/۰۶/۱۵');
  const [endDateJalali, setEndDateJalali] = useState('۱۴۰۴/۰۶/۳۱');
  const [approvalLimitRials, setApprovalLimitRials] = useState<number>(2000000000);
  const [delegationReason, setDelegationReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isAuthorized) {
    return (
      <Forbidden403
        missingCapabilities={['DELEGATION_MANAGE']}
        onNavigateToInbox={() => {}}
        onSwitchPersona={() => {}}
      />
    );
  }

  // Filtered list
  const filteredDelegations = delegations.filter((del) => {
    const matchesSearch =
      del.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.delegator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.delegatee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.authorizedScope.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || del.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DelegationRecord['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" label="فعال و نافذ" />;
      case 'future':
      case 'scheduled':
        return <Badge variant="info" label="زمان‌بندی‌شده (آتی)" />;
      case 'expired':
        return <Badge variant="neutral" label="منقضی‌شده" />;
      case 'revoked':
        return <Badge variant="danger" label="ابطال پیش از موعد" />;
    }
  };

  const handleConfirmRevocation = () => {
    if (!revokingDelegation) return;
    if (!revocationReason.trim()) {
      addToast('ثبت علت ابطال حکم الزامی است.', 'danger');
      return;
    }

    mockOrgStore.revokeDelegation(
      revokingDelegation.id,
      activePersona.name,
      revocationReason.trim()
    );

    addToast(
      `حکم تفویض شماره ${revokingDelegation.code} با موفقیت لغو شد و دسترسی‌های تفویضی فوراً سلب گردیدند.`,
      'success'
    );
    setRevokingDelegation(null);
    setRevocationReason('');
  };

  const handleCreateDelegation = () => {
    setModalError(null);

    if (delegatorId === delegateeId) {
      setModalError('شخص اصیل (واگذارکننده) و جانشین (دریافت‌کننده) نمی‌توانند یکسان باشند.');
      return;
    }

    if (!delegationReason.trim()) {
      setModalError('لطفاً دلیل رسمی تفویض اختیارات را وارد کنید.');
      return;
    }

    const delegatorUser = users.find((u) => u.id === delegatorId);
    const delegateeUser = users.find((u) => u.id === delegateeId);
    const selectedResp = responsibilities.find((r) => r.id === targetRespId);

    if (!delegatorUser || !delegateeUser) return;

    const newRecord = mockOrgStore.createDelegation({
      delegatorId: delegatorUser.id,
      delegatorName: delegatorUser.name,
      delegatorRole: delegatorUser.jobTitle,
      delegateeId: delegateeUser.id,
      delegateeName: delegateeUser.name,
      delegateeRole: delegateeUser.jobTitle,
      responsibilityId: selectedResp?.id,
      responsibilityTitle: selectedResp?.title || 'اختیارات سازمانی',
      authorizedCapabilities: selectedResp?.inheritedCapabilities || ['supply.manage', 'approvals.view'],
      authorizedScope: authorizedScope.trim(),
      startDateJalali: startDateJalali.trim(),
      endDateJalali: endDateJalali.trim(),
      approvalLimitRials,
      reason: delegationReason.trim(),
      actorName: activePersona.name,
    });

    addToast(
      `حکم تفویض شماره ${newRecord.code} برای ${delegateeUser.name} با موفقیت صادر و فعال شد.`,
      'success'
    );

    setIsCreateModalOpen(false);
    setDelegationReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="page-title text-xl sm:text-2xl font-bold text-slate-800">جانشینی و تفویض اختیارات</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                صدور احکام زمان‌بندی‌شده، کنترل مسئولیت نهایی اصیل، ممیزی شفاف اقدامات و ابطال پیش از موعد
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setModalError(null);
              setIsCreateModalOpen(true);
            }}
          >
            صدور حکم تفویض جدید
          </Button>
        </div>
      </div>

      {/* Core Principle Banner: No Silent Transfer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-800 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-950 leading-relaxed space-y-1">
          <div className="font-bold">
            اصل مسئولیت نهایی و عدم انتقال خاموش مالکیت (No Silent Transfer of Ownership):
          </div>
          <div>
            تفویض اختیار هرگز موجب سلب مسئولیت نهایی اصیل (واگذارکننده) نمی‌گردد. کلیه اقداماتی که جانشین تحت این حکم به انجام می‌رساند،
            به وضوح با برچسب اقدام‌کننده واقعی ثبت و تفکیک می‌شود تا هم در کارتابل و هم در گزارش‌های ممیزی و اسناد مالی، زنجیره پاسخگویی شفاف باشد.
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو با شماره حکم، نام اصیل، جانشین یا عنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-700"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="active">فقط احکام فعال و نافذ</option>
            <option value="future">احکام آتی و زمان‌بندی‌شده</option>
            <option value="expired">احکام منقضی‌شده</option>
            <option value="revoked">احکام ابطال‌شده پیش از موعد</option>
          </select>

          <div className="text-xs text-slate-500 whitespace-nowrap">
            مجموع: <span className="font-bold text-slate-800 font-mono">{filteredDelegations.length}</span> حکم
          </div>
        </div>
      </div>

      {/* Delegations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">شماره حکم</th>
                <th className="py-3 px-4">مقام اصیل (واگذارکننده)</th>
                <th className="py-3 px-4">جانشین (دریافت‌کننده)</th>
                <th className="py-3 px-4">موضوع و دامنه اختیارات</th>
                <th className="py-3 px-4">بازه اعتبار زمانی</th>
                <th className="py-3 px-4">وضعیت حکم</th>
                <th className="py-3 px-4">تعداد اقدامات ثبت‌شده</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    حکمی مطابق با معیارهای جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {del.code}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{del.delegator.name}</div>
                      <div className="text-caption text-slate-500">{del.delegator.role}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-primary-900">{del.delegatee.name}</div>
                      <div className="text-caption text-primary-700">{del.delegatee.role}</div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 truncate">{del.title}</div>
                      <div className="text-caption text-slate-500 mt-0.5">{del.authorizedScope}</div>
                      {del.approvalLimitRials && (
                        <div className="text-caption text-amber-700 mt-0.5 font-medium">
                          سقف ریالی: {del.approvalLimitRials.toLocaleString('fa-IR')} ریال
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div>از: {del.startDateJalali}</div>
                      <div>تا: {del.endDateJalali}</div>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(del.status)}
                    </td>

                    <td className="py-4 px-4 font-mono font-semibold text-slate-700 text-center">
                      {del.actionsCount || 0} اقدام
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDelegation(del)}
                          className="px-3 py-1.5 min-h-[36px] text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 font-semibold transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="مشاهده گاه‌شمار تفویض"
                          aria-label="مشاهده گاه‌شمار تفویض"
                        >
                          گاه‌شمار
                        </button>

                        {del.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokingDelegation(del);
                              setRevocationReason('');
                            }}
                            className="px-3 py-1.5 min-h-[36px] text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-300 font-semibold transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="ابطال حکم تفویض اختیار"
                            aria-label="ابطال حکم تفویض اختیار"
                          >
                            ابطال حکم
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdaptiveTable>
        </div>
      </div>

      {/* ================= MODAL: CREATE DELEGATION ================= */}
      {isCreateModalOpen && (
        <ModalDialog
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          title="صدور حکم جدید تفویض اختیارات و جانشینی"
          size="md"
        >
          <div className="space-y-4 text-xs">
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">مقام اصیل (واگذارکننده)</label>
                <select
                  value={delegatorId}
                  onChange={(e) => setDelegatorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.jobTitle}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">جانشین (دریافت‌کننده)</label>
                <select
                  value={delegateeId}
                  onChange={(e) => setDelegateeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.jobTitle}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">حوزه اختیارات مورد تفویض</label>
              <select
                value={targetRespId}
                onChange={(e) => setTargetRespId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {responsibilities.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.code})
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">شرح دقیق دامنه و حدود اختیارات</label>
              <input
                type="text"
                value={authorizedScope}
                onChange={(e) => setAuthorizedScope(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="grid grid-cols-3 gap-3">
              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">تاریخ شروع</label>
                <input
                  type="text"
                  placeholder="۱۴۰۴/۰۶/۱۵"
                  value={startDateJalali}
                  onChange={(e) => setStartDateJalali(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">تاریخ پایان</label>
                <input
                  type="text"
                  placeholder="۱۴۰۴/۰۶/۳۱"
                  value={endDateJalali}
                  onChange={(e) => setEndDateJalali(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-semibold text-slate-700 mb-1.5">سقف مالی (ریال)</label>
                <input
                  type="number"
                  value={approvalLimitRials}
                  onChange={(e) => setApprovalLimitRials(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">
                دلیل اداری تفویض اختیارات <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="مرخصی، مأموریت کاری، پوشش بار ترافیکی انبار و..."
                value={delegationReason}
                onChange={(e) => setDelegationReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" onClick={handleCreateDelegation}>
                صدور و فعال‌سازی حکم
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= MODAL: REVOKE DELEGATION ================= */}
      {revokingDelegation && (
        <ModalDialog
          isOpen={true}
          onClose={() => setRevokingDelegation(null)}
          title={`ابطال پیش از موعد حکم شماره ${revokingDelegation.code}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800 leading-relaxed">
              آیا از ابطال رسمی حکم تفویض میان <span className="font-bold">{revokingDelegation.delegator.name}</span> و{' '}
              <span className="font-bold">{revokingDelegation.delegatee.name}</span> اطمینان دارید؟
              با ثبت این اقدام، کلیه دسترسی‌های جانشینی فوراً حذف و در لاگ ممیزی امنیتی درج خواهد شد.
            </div>

            <FieldGroup>
              <label className="block font-semibold text-slate-700 mb-1.5">
                علت ابطال پیش از موعد حکم <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="دلایل لغو، بازگشت زودهنگام اصیل یا گزارش‌های ممیزی..."
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setRevokingDelegation(null)}>
                انصراف
              </Button>
              <Button variant="danger" onClick={handleConfirmRevocation}>
                تأیید ابطال رسمی حکم
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= DRAWER: AUDIT TIMELINE ================= */}
      {selectedDelegation && (
        <Drawer
          isOpen={true}
          onClose={() => setSelectedDelegation(null)}
          title={`گاه‌شمار و ممیزی حکم: ${selectedDelegation.code}`}
          size="md"
        >
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">{selectedDelegation.code}</span>
                {getStatusBadge(selectedDelegation.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">واگذارکننده (اصیل):</span>
                <span className="font-bold text-slate-900">{selectedDelegation.delegator.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">جانشین (اقدام‌کننده):</span>
                <span className="font-bold text-primary-900">{selectedDelegation.delegatee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">بازه اعتبار:</span>
                <span className="font-mono text-slate-700">
                  {selectedDelegation.startDateJalali} تا {selectedDelegation.endDateJalali}
                </span>
              </div>
              {selectedDelegation.approvalLimitRials && (
                <div className="flex justify-between">
                  <span className="text-slate-500">سقف مالی:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {selectedDelegation.approvalLimitRials.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1.5">موضوع و شرح حدود اختیارات</h4>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedDelegation.authorizedScope}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-1.5">علت توجیهی صدور</h4>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {selectedDelegation.reason}
              </p>
            </div>

            {selectedDelegation.revocationReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>علت ابطال پیش از موعد حکم:</span>
                </div>
                <div>{selectedDelegation.revocationReason}</div>
                <div className="text-caption text-rose-600 pt-1 border-t border-rose-200 flex justify-between">
                  <span>ابطال توسط: {selectedDelegation.revokedBy}</span>
                  <span>تاریخ: {selectedDelegation.revokedAtJalali}</span>
                </div>
              </div>
            )}

            {/* Audit Timeline */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>رویدادهای ثبت‌شده در طول عمر حکم (Audit Timeline)</span>
              </h4>

              {selectedDelegation.auditEvents && selectedDelegation.auditEvents.length > 0 ? (
                <div className="space-y-3 border-r-2 border-slate-200 pr-3 mr-1">
                  {selectedDelegation.auditEvents.map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="w-2 h-2 rounded-full bg-primary-700 absolute -right-[17px] top-1.5" />
                      <div className="flex items-center justify-between text-caption text-slate-500 font-mono">
                        <span>{ev.actor}</span>
                        <span>{ev.timestampJalali}</span>
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">{ev.action}</div>
                      <div className="text-slate-600 text-caption mt-0.5">{ev.details}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-3 bg-slate-50 rounded-lg">
                  رویداد ممیزی ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
