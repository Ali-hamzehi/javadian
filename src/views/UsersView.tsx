import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import {
  MockPersona,
  UserAccessProfile,
  UserAccountState,
  OrgUnit,
  OrgPosition,
} from '../types';
import { mockOrgStore } from '../data/mockOrgStore';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Chip, Badge } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { Forbidden403 } from '../components/design-system/SystemStates';
import { Users, UserPlus, Search, Building2, Eye, EyeOff, RotateCcw, Send, Phone, Mail, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';

interface UsersViewProps {
  activePersona: MockPersona;
  onOpenAssignTaskModal?: (assigneeName?: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  activePersona,
  onOpenAssignTaskModal,
}) => {
  const { addToast } = useToast();

  // Defense-in-depth capability check
  const isAuthorized = activePersona.capabilities.includes('USER_MANAGE');

  const [users, setUsers] = useState<UserAccessProfile[]>(mockOrgStore.getUsers());
  const [units] = useState<OrgUnit[]>(mockOrgStore.getUnits());
  const [positions] = useState<OrgPosition[]>(mockOrgStore.getPositions());

  useEffect(() => {
    return mockOrgStore.subscribe(() => {
      setUsers(mockOrgStore.getUsers());
    });
  }, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Reveal sensitive info modal/drawer state
  const [revealedNationalCodeUserId, setRevealedNationalCodeUserId] = useState<string | null>(null);
  const [revealedMobileUserId, setRevealedMobileUserId] = useState<string | null>(null);

  // Profile Drawer state
  const [profileUser, setProfileUser] = useState<UserAccessProfile | null>(null);

  // Change Account State Dialog
  const [stateChangeUser, setStateChangeUser] = useState<UserAccessProfile | null>(null);
  const [targetAccountState, setTargetAccountState] = useState<UserAccountState>('active');
  const [stateChangeReason, setStateChangeReason] = useState('');

  // Create User Wizard Modal state
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard fields
  const [newFullName, setNewFullName] = useState('');
  const [newPersonnelCode, setNewPersonnelCode] = useState('');
  const [newNationalCode, setNewNationalCode] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newExtension, setNewExtension] = useState('');
  const [newDirectManager, setNewDirectManager] = useState('');
  const [newUnitId, setNewUnitId] = useState(units[0]?.id || 'unit-sales');
  const [newPositionId, setNewPositionId] = useState(positions[0]?.id || 'pos-2');
  const [newInitialState, setNewInitialState] = useState<UserAccountState>('invited');
  const [wizardError, setWizardError] = useState<string | null>(null);

  if (!isAuthorized) {
    return (
      <Forbidden403
        missingCapabilities={['USER_MANAGE']}
        onNavigateToInbox={() => {}}
        onSwitchPersona={() => {}}
      />
    );
  }

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.personnelCode && u.personnelCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState =
      selectedStateFilter === 'ALL' || u.accountState === selectedStateFilter;

    const matchesUnit =
      selectedUnitFilter === 'ALL' || u.unitId === selectedUnitFilter || u.unit === selectedUnitFilter;

    return matchesSearch && matchesState && matchesUnit;
  });

  const getAccountStateBadge = (state?: UserAccountState) => {
    switch (state) {
      case 'active':
        return <Badge variant="success" label="فعال" />;
      case 'invited':
        return <Badge variant="info" label="دعوت‌شده" />;
      case 'suspended':
        return <Badge variant="warning" label="معلق" />;
      case 'locked':
        return <Badge variant="danger" label="قفل امنیتی" />;
      case 'archived':
        return <Badge variant="neutral" label="بایگانی" />;
      default:
        return <Badge variant="success" label="فعال" />;
    }
  };

  const handleOpenRevealConfirm = (userId: string, type: 'national' | 'mobile') => {
    if (type === 'national') {
      if (revealedNationalCodeUserId === userId) {
        setRevealedNationalCodeUserId(null);
      } else {
        setRevealedNationalCodeUserId(userId);
        addToast('افشای موقت شناسه ملی با ثبت در لاگ امنیتی ممیزی انجام شد.', 'warning');
      }
    } else {
      if (revealedMobileUserId === userId) {
        setRevealedMobileUserId(null);
      } else {
        setRevealedMobileUserId(userId);
        addToast('افشای موقت شماره همراه در لاگ سیستم ثبت گردید.', 'info');
      }
    }
  };

  const handleResetPassword = (user: UserAccessProfile) => {
    mockOrgStore.resetUserPassword(user.id, activePersona.name);
    addToast(
      `پیوند بازنشانی کلمه عبور به شماره ${user.maskedMobile || user.mobile} ارسال گردید (شبیه‌سازی پیامک فعال‌سازی).`,
      'success'
    );
  };

  const handleConfirmStateChange = () => {
    if (!stateChangeUser) return;
    if (!stateChangeReason.trim()) {
      addToast('لطفاً دلیل تغییر وضعیت حساب را وارد نمایید.', 'danger');
      return;
    }

    mockOrgStore.updateUserAccountState(
      stateChangeUser.id,
      targetAccountState,
      stateChangeReason,
      activePersona.name
    );

    addToast(`وضعیت حساب کاربری ${stateChangeUser.name} با موفقیت به «${targetAccountState}» تغییر یافت.`, 'success');
    setStateChangeUser(null);
    setStateChangeReason('');
  };

  const handleWizardSubmit = () => {
    if (!newFullName.trim() || !newPersonnelCode.trim() || !newNationalCode.trim() || !newMobile.trim()) {
      setWizardError('لطفاً کلیه فیلدهای الزامی مشخصات فردی و هویتی را تکمیل نمایید.');
      return;
    }

    const created = mockOrgStore.createUser({
      fullName: newFullName.trim(),
      personnelCode: newPersonnelCode.trim(),
      nationalCode: newNationalCode.trim(),
      mobile: newMobile.trim(),
      email: newEmail.trim() || undefined,
      internalExtension: newExtension.trim() || undefined,
      directManagerName: newDirectManager.trim() || undefined,
      unitId: newUnitId,
      positionId: newPositionId,
      accountState: newInitialState,
      actorName: activePersona.name,
    });

    addToast(
      `کاربر جدید «${created.name}» با کد پرسنلی ${created.personnelCode} ایجاد شد. طبق ضابطه، کاربر جدید فاقد دسترسی گسترده است تا زمان تخصیص مسئولیت.`,
      'success'
    );

    setIsCreateWizardOpen(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardStep(1);
    setNewFullName('');
    setNewPersonnelCode('');
    setNewNationalCode('');
    setNewMobile('');
    setNewEmail('');
    setNewExtension('');
    setNewDirectManager('');
    setNewUnitId(units[0]?.id || 'unit-sales');
    setNewPositionId(positions[0]?.id || 'pos-2');
    setNewInitialState('invited');
    setWizardError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="page-title text-xl sm:text-2xl font-bold text-slate-800">کاربران و پرسنل سازمانی</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                مدیریت اطلاعات هویتی، وضعیت حساب‌های کاربری و شناسنامه پرسنل شرکت جوادیان
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              resetWizard();
              setIsCreateWizardOpen(true);
            }}
          >
            تعریف پرسنل جدید
          </Button>
        </div>
      </div>

      {/* Information Banner on Architectural Separation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">تخصیص اختیارات و دسترسی‌ها: </span>
          تعریف کاربر صرفاً جهت ثبت مشخصات پرسنلی است. تخصیص اختیارات و مجوزهای تأیید از طریق بخش‌های «مسئولیت‌ها و پست‌ها» یا «جانشینی و تفویض» انجام می‌شود.
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="جستجو با نام، کد پرسنلی، سمت یا واحد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-700"
            >
              <option value="ALL">همه وضعیت‌های حساب</option>
              <option value="active">حساب‌های فعال</option>
              <option value="invited">در انتظار دعوت و ورود اولیه</option>
              <option value="suspended">معلق‌شده</option>
              <option value="locked">قفل امنیتی شده</option>
              <option value="archived">بایگانی‌شده</option>
            </select>
          </div>

          <div>
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-700"
            >
              <option value="ALL">همه واحدهای سازمانی</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            نمایش <span className="font-bold text-slate-700 mx-1">{filteredUsers.length}</span> نفر از مجموع {users.length} پرسنل
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">پرسنل / هویت</th>
                <th className="py-3 px-4">کد پرسنلی</th>
                <th className="py-3 px-4">شناسه ملی (حفاظت‌شده)</th>
                <th className="py-3 px-4">واحد سازمانی و سمت</th>
                <th className="py-3 px-4">ارتباطات سازمانی</th>
                <th className="py-3 px-4">وضعیت حساب</th>
                <th className="py-3 px-4 text-center">اقدامات مدیریتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    پرسنلی مطابق با فیلترهای جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isNationalRevealed = revealedNationalCodeUserId === user.id;
                  const isMobileRevealed = revealedMobileUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name}</div>
                            {user.directManagerName && (
                              <div className="text-caption text-slate-500">
                                مدیر: {user.directManagerName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Personnel Code */}
                      <td className="py-4 px-4 font-mono font-medium text-slate-700">
                        {user.personnelCode || user.personnelId || '---'}
                      </td>

                      {/* Masked National Code with Security Reveal */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800">
                            {isNationalRevealed ? user.nationalCode : user.maskedNationalCode || '۰۰۷***۳۲۱۱'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenRevealConfirm(user.id, 'national')}
                            title={isNationalRevealed ? 'پنهان‌سازی مجدد' : 'افشای موقت با ثبت لاگ امنیتی'}
                            className="text-slate-500 hover:text-primary-700 p-1 rounded transition-colors"
                           aria-label={isNationalRevealed ? 'پنهان‌سازی مجدد' : 'افشای موقت با ثبت لاگ امنیتی'}>
                            {isNationalRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {isNationalRevealed && (
                          <div className="text-caption text-amber-600 mt-0.5">افشا با لاگ امنیتی</div>
                        )}
                      </td>

                      {/* Unit & Position */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{user.jobTitle}</div>
                        <div className="text-caption text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {user.unit}
                        </div>
                      </td>

                      {/* Contacts */}
                      <td className="py-4 px-4 space-y-0.5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-mono text-caption">
                            {isMobileRevealed ? user.mobile : user.maskedMobile || '۰۹۱۲***'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenRevealConfirm(user.id, 'mobile')}
                            className="text-slate-500 hover:text-slate-700 p-0.5"
                            title="افشای موقت شماره"
                           aria-label="افشای موقت شماره">
                            <Eye className="w-3 h-3" />
                          </button>
                          {user.internalExtension && user.internalExtension !== '---' && (
                            <span className="text-caption bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                              داخلی {user.internalExtension}
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-2 text-caption text-slate-500">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="font-mono">{user.email}</span>
                          </div>
                        )}
                      </td>

                      {/* State */}
                      <td className="py-4 px-4">
                        {getAccountStateBadge(user.accountState)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setProfileUser(user)}
                            className="px-3 py-1.5 min-h-[36px] text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 font-semibold transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="مشاهده شناسنامه پرسنلی"
                            aria-label="مشاهده شناسنامه پرسنلی"
                          >
                            شناسنامه
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setStateChangeUser(user);
                              setTargetAccountState(user.accountState || 'active');
                              setStateChangeReason('');
                            }}
                            className="px-3 py-1.5 min-h-[36px] text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-300 font-semibold transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="تغییر وضعیت حساب"
                            aria-label="تغییر وضعیت حساب"
                          >
                            وضعیت
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-slate-500 hover:text-primary-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="ارسال مجدد دعوت‌نامه / بازنشانی رمز"
                            aria-label="ارسال مجدد دعوت‌نامه / بازنشانی رمز"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AdaptiveTable>
        </div>
      </div>

      {/* ================= MODAL: CHANGE ACCOUNT STATE ================= */}
      {stateChangeUser && (
        <ModalDialog
          isOpen={true}
          onClose={() => setStateChangeUser(null)}
          title={`تغییر وضعیت حساب کاربری: ${stateChangeUser.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">کد پرسنلی:</span>
                <span className="font-mono font-bold text-slate-800">{stateChangeUser.personnelCode}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">سمت و واحد:</span>
                <span className="text-slate-800">{stateChangeUser.jobTitle} • {stateChangeUser.unit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">وضعیت کنونی:</span>
                <span>{getAccountStateBadge(stateChangeUser.accountState)}</span>
              </div>
            </div>

            <FieldGroup>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">وضعیت جدید حساب</label>
              <select
                value={targetAccountState}
                onChange={(e) => setTargetAccountState(e.target.value as UserAccountState)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="active">فعال (دسترسی عادی برقرار)</option>
                <option value="invited">دعوت‌شده (در انتظار ورود اولیه)</option>
                <option value="suspended">معلق (مسدودسازی موقت به دلیل مرخصی یا بررسی اداری)</option>
                <option value="locked">قفل امنیتی (به دلیل گزارش تخلف یا خطای ورود)</option>
                <option value="archived">بایگانی (خاتمه همکاری / تسویه‌حساب نهایی)</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                علت تغییر وضعیت <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="دلایل ممیزی و اداری تغییر وضعیت این حساب را ثبت کنید..."
                value={stateChangeReason}
                onChange={(e) => setStateChangeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setStateChangeUser(null)}>
                انصراف
              </Button>
              <Button variant="primary" onClick={handleConfirmStateChange}>
                ثبت تغییر وضعیت در پرونده
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= MODAL: CREATE EMPLOYEE WIZARD ================= */}
      {isCreateWizardOpen && (
        <ModalDialog
          isOpen={true}
          onClose={() => setIsCreateWizardOpen(false)}
          title="فرآیند تعریف پرسنل و حساب کاربری جدید"
          size="lg"
        >
          <div className="space-y-5">
            {/* Step Indicators */}
            {/* Mobile Wizard Stepper */}
            <div className="sm:hidden flex items-center justify-between p-2.5 bg-primary-50 rounded-xl border border-primary-200 text-xs font-bold text-primary-900 mb-3">
              <span>مرحله {toPersianDigits(wizardStep)} از ۴</span>
              <span className="text-primary-700 font-medium">
                {['هویت و پرسنلی', 'ارتباطات و تماس', 'انتساب اولیه و وضعیت', 'بازبینی و تأیید'][wizardStep - 1]}
              </span>
            </div>

            {/* Desktop Wizard Stepper */}
            <div className="hidden sm:flex items-center justify-between border-b border-slate-200 pb-3">
              {[
                { s: 1, label: '۱. هویت و پرسنلی' },
                { s: 2, label: '۲. ارتباطات و تماس' },
                { s: 3, label: '۳. انتساب اولیه و وضعیت' },
                { s: 4, label: '۴. بازبینی و تأیید' },
              ].map((item) => (
                <div
                  key={item.s}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    wizardStep === item.s
                      ? 'text-primary-700 border-b-2 border-primary-600 pb-1'
                      : wizardStep > item.s
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                  }`}
                >
                  {wizardStep > item.s && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {wizardError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: IDENTITY */}
            {wizardStep === 1 && (
              <div className="space-y-3.5">
                <div className="text-xs text-slate-500">
                  اطلاعات هویتی پایه پرسنل را بر اساس شناسنامه و پرونده استخدامی وارد نمایید:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      نام و نام خانوادگی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: سهراب حسینی"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      کد پرسنلی یکتا <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: EMP-1015"
                      value={newPersonnelCode}
                      onChange={(e) => setNewPersonnelCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      شماره ملی (۱۰ رقمی) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸"
                      value={newNationalCode}
                      onChange={(e) => setNewNationalCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      شماره تلفن همراه <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    />
                  </FieldGroup>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACTS */}
            {wizardStep === 2 && (
              <div className="space-y-3.5">
                <div className="text-xs text-slate-500">
                  اطلاعات تماس سازمانی، صندوق پستی و خطوط ارتباطی درون‌شرکتی:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ایمیل سازمانی (اختیاری)</label>
                    <input
                      type="email"
                      placeholder="username@javadian.ir"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تلفن داخلی سازمانی</label>
                    <input
                      type="text"
                      placeholder="مثال: ۲۱۵"
                      value={newExtension}
                      onChange={(e) => setNewExtension(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                    />
                  </FieldGroup>

                  <FieldGroup className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">مدیر مستقیم / سرپرست واحد</label>
                    <input
                      type="text"
                      placeholder="نام مقام گزارش‌گیرنده مستقیم"
                      value={newDirectManager}
                      onChange={(e) => setNewDirectManager(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </FieldGroup>
                </div>
              </div>
            )}

            {/* STEP 3: ORG ASSIGNMENT & ACCOUNT STATE */}
            {wizardStep === 3 && (
              <div className="space-y-3.5">
                <div className="text-xs text-slate-500">
                  تعیین جایگاه چارت سازمانی و وضعیت اولیه فعال‌سازی حساب کاربری:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">واحد اداری متبوع</label>
                    <select
                      value={newUnitId}
                      onChange={(e) => setNewUnitId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                    </select>
                  </FieldGroup>

                  <FieldGroup>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">سمت / عنوان شغلی اولیه</label>
                    <select
                      value={newPositionId}
                      onChange={(e) => setNewPositionId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.levelLabel})
                        </option>
                      ))}
                    </select>
                  </FieldGroup>

                  <FieldGroup className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">وضعیت اولیه حساب کاربری</label>
                    <select
                      value={newInitialState}
                      onChange={(e) => setNewInitialState(e.target.value as UserAccountState)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="invited">دعوت‌شده (ارسال پیامک فعال‌سازی اولیه جهت ورود)</option>
                      <option value="active">فعال مستقیم (آماده ورود فوری به سیستم)</option>
                      <option value="suspended">معلق اولیه (در انتظار تأیید مدارک کارگزینی)</option>
                    </select>
                  </FieldGroup>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-caption text-slate-600">
                  <span className="font-bold">یادآوری امنیتی: </span>
                  انتساب واحد و سمت در این مرحله، فقط یک برچسب چارت است. برای اعطای قابلیت‌های عملیاتی نظیر تأیید حواله یا سفارش خرید، باید به صفحه «مسئولیت‌ها و پست‌ها» مراجعه نمایید.
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {wizardStep === 4 && (
              <div className="space-y-3.5">
                <div className="text-xs text-slate-600 font-semibold">خلاصه اطلاعات کاربر قبل از صدور حساب:</div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">نام و نام خانوادگی:</span>
                    <span className="font-bold text-slate-800">{newFullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">کد پرسنلی:</span>
                    <span className="font-mono font-bold text-slate-800">{newPersonnelCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">کد ملی:</span>
                    <span className="font-mono text-slate-800">{newNationalCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">تلفن همراه:</span>
                    <span className="font-mono text-slate-800">{newMobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">واحد و سمت انتسابی:</span>
                    <span className="text-slate-800">
                      {units.find((u) => u.id === newUnitId)?.name} • {positions.find((p) => p.id === newPositionId)?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">وضعیت حساب:</span>
                    <span>{getAccountStateBadge(newInitialState)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    آزمون پذیرش امنیتی: این کاربر پس از ایجاد، فقط دسترسی پایه به کارتابل شخصی دارد و هیچ مجوز حساسی به صورت خودکار به وی اعطا نخواهد شد.
                  </span>
                </div>
              </div>
            )}

            {/* Wizard Nav Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {wizardStep > 1 ? (
                <Button
                  variant="secondary"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                >
                  مرحله قبل
                </Button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <Button
                  variant="primary"
                  icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => {
                    setWizardError(null);
                    if (wizardStep === 1) {
                      if (!newFullName.trim() || !newPersonnelCode.trim() || !newNationalCode.trim() || !newMobile.trim()) {
                        setWizardError('لطفاً همه فیلدهای الزامی مرحله اول را تکمیل کنید.');
                        return;
                      }
                    }
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                >
                  مرحله بعد
                </Button>
              ) : (
                <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={handleWizardSubmit}>
                  تأیید و ایجاد نهایی حساب کاربری
                </Button>
              )}
            </div>
          </div>
        </ModalDialog>
      )}

      {/* ================= DRAWER: USER PROFILE ================= */}
      {profileUser && (
        <Drawer
          isOpen={true}
          onClose={() => setProfileUser(null)}
          title={`شناسنامه هویتی و پرسنلی: ${profileUser.name}`}
          size="md"
        >
          <div className="space-y-5 text-xs">
            {/* Identity Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{profileUser.name}</span>
                {getAccountStateBadge(profileUser.accountState)}
              </div>
              <div className="flex justify-between text-slate-600">
                <span>کد پرسنلی:</span>
                <span className="font-mono font-bold text-slate-900">{profileUser.personnelCode}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>شناسه ملی:</span>
                <span className="font-mono text-slate-800">{profileUser.nationalCode}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>شماره همراه:</span>
                <span className="font-mono text-slate-800">{profileUser.mobile}</span>
              </div>
              {profileUser.email && (
                <div className="flex justify-between text-slate-600">
                  <span>ایمیل:</span>
                  <span className="font-mono text-slate-800">{profileUser.email}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>واحد اداری:</span>
                <span className="font-medium text-slate-800">{profileUser.unit}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>سمت سازمانی:</span>
                <span className="font-medium text-slate-800">{profileUser.jobTitle}</span>
              </div>
              {profileUser.directManagerName && (
                <div className="flex justify-between text-slate-600">
                  <span>مدیر مستقیم:</span>
                  <span className="text-slate-800">{profileUser.directManagerName}</span>
                </div>
              )}
            </div>

            {/* Quick Action: Assign Task */}
            {onOpenAssignTaskModal && (
              <Button
                variant="secondary"
                className="w-full"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={() => {
                  onOpenAssignTaskModal(profileUser.name);
                  setProfileUser(null);
                }}
              >
                ارجاع وظیفه / کار جدید به این پرسنل
              </Button>
            )}

            {/* Inherited Permissions */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">قابلیت‌های عملیاتی تخصیص‌یافته</h4>
              {profileUser.permissions && profileUser.permissions.length > 0 ? (
                <div className="space-y-1.5">
                  {profileUser.permissions.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-caption">{p.labelPersian}</div>
                        <div className="text-caption text-slate-500 mt-0.5">{p.description}</div>
                        {p.scopeConstraint && (
                          <div className="text-caption text-primary-700 mt-0.5">محدوده: {p.scopeConstraint}</div>
                        )}
                      </div>
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
                            ? 'جانشینی'
                            : p.inheritedFrom === 'direct'
                            ? 'مستقیم'
                            : 'پست/مسئولیت'
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-center">
                  هیچ دسترسی عملیاتی فعالی برای این کاربر ثبت نشده است.
                </div>
              )}
            </div>

            {/* Audit History */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">سوابق وقایع امنیتی و پرسنلی (Audit Log)</h4>
              {profileUser.auditLog && profileUser.auditLog.length > 0 ? (
                <div className="space-y-2 border-r-2 border-slate-200 pr-3 mr-1">
                  {profileUser.auditLog.map((log) => (
                    <div key={log.id} className="text-caption">
                      <div className="flex items-center justify-between text-slate-500 text-caption">
                        <span>{log.actor}</span>
                        <span className="font-mono">{log.timestampJalali}</span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5">{log.action}</div>
                      <div className="text-slate-600 text-caption mt-0.5">{log.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-2">سابقه تغییری ثبت نشده است.</div>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
