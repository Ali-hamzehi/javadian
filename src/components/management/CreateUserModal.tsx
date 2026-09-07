import { FieldGroup } from '../design-system/FieldGroup';
import React, { useState } from 'react';
import { OrgUnit, OrgPosition, UserAccessProfile, MockPersona } from '../../types';
import { MOCK_ORG_UNITS, MOCK_POSITIONS } from '../../data/mockOrgData';
import { CheckCircle2, AlertCircle, Briefcase, KeyRound, ArrowRight, ArrowLeft, Check, UserPlus } from 'lucide-react';
import { Button } from '../design-system/Button';
import { TextInput, SelectInput, FormField } from '../design-system/FormControls';
import { Modal } from '../design-system/ModalAndDrawer';
import { toPersianDigits } from '../../utils/formatters';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: UserAccessProfile) => void;
  existingUsers: UserAccessProfile[];
  onAssignTask?: (userName: string) => void;
  onConfigureAdvancedAccess?: (userId: string) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  existingUsers,
  onAssignTask,
  onConfigureAdvancedAccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserAccessProfile | null>(null);

  // Step 1: Base Information
  const [fullName, setFullName] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [contact, setContact] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Step 2: Login Credentials & Access Status
  const [username, setUsername] = useState('');
  const [initialStatus, setInitialStatus] = useState<'active' | 'suspended'>('active');

  // Step 3: Organizational Position & Responsibilities
  const [orgUnitId, setOrgUnitId] = useState(MOCK_ORG_UNITS[0]?.id || '');
  const [positionId, setPositionId] = useState(MOCK_POSITIONS[0]?.id || '');
  const [primaryResponsibility, setPrimaryResponsibility] = useState('کارشناس امور محوله واحد');
  const [fallbackResponsibility, setFallbackResponsibility] = useState('');

  // Validation Error
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setStep(1);
    setIsSuccess(false);
    setCreatedUser(null);
    setFullName('');
    setPersonnelId('');
    setContact('');
    setIsActive(true);
    setUsername('');
    setInitialStatus('active');
    setPrimaryResponsibility('کارشناس امور محوله واحد');
    setFallbackResponsibility('');
    setValidationError(null);
  };

  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setValidationError('لطفاً نام و نام خانوادگی را وارد کنید.');
        return;
      }
      if (!personnelId.trim()) {
        setValidationError('لطفاً شناسه پرسنلی معتبر وارد کنید.');
        return;
      }
      // Check duplicate personnel ID
      const duplicateId = existingUsers.some(
        (u) => u.personnelId.trim() === personnelId.trim()
      );
      if (duplicateId) {
        setValidationError('این شناسه پرسنلی قبلاً در سامانه ثبت شده است. شناسه دیگری وارد کنید.');
        return;
      }
      // Suggest username if empty
      if (!username) {
        const pinyinLike = personnelId.trim();
        setUsername(`user_${pinyinLike}`);
      }
      setStep(2);
    } else if (step === 2) {
      if (!username.trim()) {
        setValidationError('لطفاً نام کاربری را وارد کنید.');
        return;
      }
      // Check duplicate username
      const duplicateUser = existingUsers.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (duplicateUser) {
        setValidationError('این نام کاربری از قبل وجود دارد. لطفاً نام دیگری برگزینید.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!primaryResponsibility.trim()) {
        setValidationError('مسئولیت اصلی فرد باید مشخص شود.');
        return;
      }
      setStep(4);
    }
  };

  const handleCreate = () => {
    const selectedUnit = MOCK_ORG_UNITS.find((u) => u.id === orgUnitId) || MOCK_ORG_UNITS[0];
    const selectedPosition = MOCK_POSITIONS.find((p) => p.id === positionId) || MOCK_POSITIONS[0];

    const newUser: UserAccessProfile = {
      id: `usr-${Date.now()}`,
      personnelId: personnelId.trim(),
      nationalCode: personnelId.trim(),
      name: fullName.trim(),
      username: username.trim().toLowerCase(),
      status: initialStatus,
      email: contact.includes('@') ? contact.trim() : `${username.trim()}@javadian.ir`,
      mobile: !contact.includes('@') ? contact.trim() : '۰۹۱۲۳۴۵۶۷۸۹',
      contact: contact.trim(),
      unit: selectedUnit.name,
      jobTitle: selectedPosition.title,
      effectiveScope: 'unit',
      scopeSummaryPersian: `واحد ${selectedUnit.name} (پست ${selectedPosition.title})`,
      financialLimitRials: 100000000,
      permissions: [
        {
          capability: 'inbox.read',
          labelPersian: 'فهرست کارهای من و اقدامات جاری',
          description: 'دسترسی به وظایف ارجاع‌شده شخصی',
          inheritedFrom: 'direct',
          sourceName: 'تخصیص اولیه سیستمی',
        },
      ],
      activeDelegation: fallbackResponsibility
        ? {
            delegatorName: 'مدیر واحد',
            scopeTitle: fallbackResponsibility,
            validUntilJalali: '۱۴۰۴/۱۲/۲۹',
          }
        : undefined,
    };

    onUserCreated(newUser);
    setCreatedUser(newUser);
    setIsSuccess(true);
  };

  const selectedUnit = MOCK_ORG_UNITS.find((u) => u.id === orgUnitId);
  const selectedPosition = MOCK_POSITIONS.find((p) => p.id === positionId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="افزودن کاربر و تعریف جایگاه سازمانی"
    >
      <div className="space-y-4 text-right">
        {/* Stepper Wizard Indicator */}
        {!isSuccess && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            {[
              { num: 1, title: 'اطلاعات پایه' },
              { num: 2, title: 'ورود و دسترسی' },
              { num: 3, title: 'جایگاه سازمانی' },
              { num: 4, title: 'بررسی و ایجاد' },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary-700 text-white shadow-none'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : toPersianDigits(s.num)}
                  </div>
                  <span
                    className={`text-caption hidden sm:inline ${
                      isCurrent ? 'font-bold text-primary-900' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Success State Screen */}
        {isSuccess && createdUser ? (
          <div className="py-4 text-center space-y-4 animate-in  duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                حساب کاربری «{createdUser.name}» با موفقیت ایجاد شد
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                نام کاربری: <code className="font-mono text-primary-700 font-bold">{createdUser.username}</code> • شناسه پرسنلی: {createdUser.personnelId}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">واحد سازمانی:</span>
                <span className="font-bold">{createdUser.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">پست سازمانی:</span>
                <span className="font-bold">{createdUser.jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">وضعیت دسترسی:</span>
                <span className="font-bold text-emerald-700">فعال (آماده دریافت وظایف)</span>
              </div>
            </div>

            {/* Next Action Choices */}
            <div className="pt-2 space-y-2 text-right">
              <span className="text-xs font-bold text-slate-700 block">اقدام بعدی را انتخاب کنید:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={() => {
                    if (onAssignTask) onAssignTask(createdUser.name);
                    resetForm();
                    onClose();
                  }}
                >
                  <Briefcase className="w-3.5 h-3.5 ml-1 text-primary-700" />
                  واگذاری اولین وظیفه به این کاربر
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={() => {
                    if (onConfigureAdvancedAccess) onConfigureAdvancedAccess(createdUser.id);
                    resetForm();
                    onClose();
                  }}
                >
                  <KeyRound className="w-3.5 h-3.5 ml-1 text-amber-600" />
                  تعیین دسترسی‌های پیشرفته و SoD
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                >
                  بازگشت به فهرست کاربران
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Step-by-Step Form Content */
          <div>
            {step === 1 && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  اطلاعات فردی و شناسنامه پرسنلی کاربر را وارد نمایید.
                </div>

                <FormField label="نام و نام خانوادگی" required>
                  <TextInput
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: حسین احمدی"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="شناسه پرسنلی" required>
                    <TextInput
                      value={personnelId}
                      onChange={(e) => setPersonnelId(e.target.value)}
                      placeholder="مثال: 1045"
                    />
                  </FormField>

                  <FormField label="شماره تماس یا ایمیل">
                    <TextInput
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="مثال: 09121234567"
                    />
                  </FormField>
                </div>

                <FieldGroup className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-primary-700 focus:ring-primary-500 w-4 h-4"
                    />
                    <span>حساب پرسنلی بلافاصله پس از ثبت فعال شود</span>
                  </label>
                </FieldGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3.5">
                <div className="bg-primary-50/60 p-3 rounded-xl border border-primary-100 text-xs text-primary-900">
                  شناسه ورود جهت اتصال به سامانه و احراز هویت را تعیین کنید. رمز عبور اولیه توسط مدیر سیستم از طریق پیامک به همکار ارسال می‌شود.
                </div>

                <FormField label="نام کاربری (شناسه ورود)" required>
                  <TextInput
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ahmadi"
                  />
                </FormField>

                <FormField label="وضعیت اولیه ورود">
                  <SelectInput
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as any)}
                    options={[
                      { label: 'فعال — ورود مجاز به سامانه', value: 'active' },
                      { label: 'معلق — نیازمند فعال‌سازی بعدی', value: 'suspended' },
                    ]}
                  />
                </FormField>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">توجه امنیتی در نمونه اولیه:</span>
                  <p className="text-caption leading-relaxed text-amber-800">
                    رمز عبور واقعی در این پروتوتایپ نمایش داده یا ذخیره نمی‌شود. کاربر پس از اولین ورود ملزم به تنظیم گذرواژه دو مرحله‌ای سازمانی خواهد بود.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  انتساب به واحد اداری، عنوان شغلی و مشخص نمودن مسئولیت‌های اصلی و جانشین.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="واحد سازمانی" required>
                    <SelectInput
                      value={orgUnitId}
                      onChange={(e) => setOrgUnitId(e.target.value)}
                      options={MOCK_ORG_UNITS.map((u) => ({
                        label: `${u.name} (${u.code})`,
                        value: u.id,
                      }))}
                    />
                  </FormField>

                  <FormField label="پست سازمانی" required>
                    <SelectInput
                      value={positionId}
                      onChange={(e) => setPositionId(e.target.value)}
                      options={MOCK_POSITIONS.map((p) => ({
                        label: p.title,
                        value: p.id,
                      }))}
                    />
                  </FormField>
                </div>

                <FormField label="شرح مسئولیت اصلی" required>
                  <TextInput
                    value={primaryResponsibility}
                    onChange={(e) => setPrimaryResponsibility(e.target.value)}
                    placeholder="مثال: کارشناس ثبت حواله‌های انبار کهریزک"
                  />
                </FormField>

                <FormField label="مسئولیت جانشین اختیاری (Fallback)">
                  <TextInput
                    value={fallbackResponsibility}
                    onChange={(e) => setFallbackResponsibility(e.target.value)}
                    placeholder="مثال: جانشین شیفت عصر انبار مرکزی کهریزک"
                  />
                </FormField>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                  لطفاً خلاصه مشخصات حساب را پیش از صدور و فعال‌سازی در سامانه مرور کنید.
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">نام کامل:</span>
                    <span className="font-extrabold text-slate-900">{fullName}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">شناسه پرسنلی:</span>
                    <span className="font-bold text-slate-800">{personnelId}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">نام کاربری:</span>
                    <span className="font-bold font-mono text-primary-700">{username}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">واحد و پست:</span>
                    <span className="font-bold text-slate-800">
                      {selectedUnit?.name} • {selectedPosition?.title}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">مسئولیت اصلی:</span>
                    <span className="font-bold text-slate-800">{primaryResponsibility}</span>
                  </div>
                  {fallbackResponsibility && (
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-500">مسئولیت جانشین:</span>
                      <span className="font-medium text-amber-800">{fallbackResponsibility}</span>
                    </div>
                  )}
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-500">وضعیت دسترسی:</span>
                    <span className="font-bold text-emerald-700">
                      {initialStatus === 'active' ? 'فعال' : 'معلق'}
                    </span>
                  </div>
                </div>

                <p className="text-caption text-slate-500">
                  * پس از ایجاد، این کاربر به صورت خودکار به کارهای من کارهای من دسترسی خواهد داشت و می‌توانید اولین کار را به او ارجاع دهید.
                </p>
              </div>
            )}

            {/* Stepper Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setValidationError(null);
                    setStep((prev) => (prev - 1) as any);
                  }}
                >
                  مرحله قبل
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  onClick={handleNext}
                >
                  گام بعدی
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={handleCreate}
                >
                  ایجاد کاربر
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
