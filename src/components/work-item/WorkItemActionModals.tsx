import { FieldGroup } from '../design-system/FieldGroup';
import React, { useState, useEffect } from 'react';
import { Person, RecordAttachment, MockPersona, OperationalRecord } from '../../types';
import { MOCK_PERSONAS } from '../../data/mockData';
import { MOCK_DELEGATIONS } from '../../data/mockOrgData';
import { toPersianDigits } from '../../utils/formatters';
import { getEligibleAssignees, getAuthoritativeEligibleAssignees } from '../../utils/workItemAuthorization';
import { ModalDialog } from '../design-system/ModalAndDrawer';
import { Button } from '../design-system/Button';
import { TextInput, TextareaInput, SelectInput, FormField } from '../design-system/FormControls';
import { CheckCircle2, AlertTriangle, XCircle, UploadCloud, FileText, Trash2, ShieldAlert } from 'lucide-react';

// -------------------------------------------------------------
// 1. Complete Work Item Modal (with mandatory Work Result)
// -------------------------------------------------------------
interface CompleteWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: {
    resultSummary: string;
    outcomeType: 'success' | 'partial' | 'alternative_solution';
    attachments: RecordAttachment[];
  }) => void;
  expectedOutcome?: string;
  hasApprover?: boolean;
  approverName?: string;
}

export const CompleteWorkItemModal: React.FC<CompleteWorkItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expectedOutcome,
  hasApprover,
  approverName,
}) => {
  const [resultSummary, setResultSummary] = useState('');
  const [outcomeType, setOutcomeType] = useState<'success' | 'partial' | 'alternative_solution'>('success');
  const [mockFiles, setMockFiles] = useState<RecordAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddMockFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: RecordAttachment = {
        id: `att-comp-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc',
        uploadedBy: 'شما (مجری کار)',
        uploadedAtJalali: 'هم‌اکنون',
      };
      setMockFiles([...mockFiles, newAtt]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setMockFiles(mockFiles.filter((f) => f.id !== id));
  };

  const handleSubmit = () => {
    if (!resultSummary.trim()) {
      setError('ثبت شرح نتیجه کار (Work Result) جهت تکمیل الزامی است.');
      return;
    }
    setError(null);
    onSubmit({
      resultSummary: resultSummary.trim(),
      outcomeType,
      attachments: mockFiles,
    });
    setResultSummary('');
    setMockFiles([]);
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={hasApprover ? 'ثبت نتیجه و ارسال جهت تأیید نهایی' : 'ثبت نتیجه و تکمیل قطعی کار'}
      size="lg"
    >
      <div className="space-y-4">
        {expectedOutcome && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">معیار و نتیجه مورد انتظار (Definition of Done): </span>
            <span>{expectedOutcome}</span>
          </div>
        )}

        {hasApprover && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <span className="font-bold">نکته مسیر تأیید: </span>
            این کار دارای تأییدکننده مسئول ({approverName || 'مقام مربوطه'}) است. پس از ثبت نتیجه، کار به تأییدهای من وی منتقل می‌شود.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <FormField label="نوع خروجی حاصل‌شده" required>
          <SelectInput
            value={outcomeType}
            onChange={(e) => setOutcomeType(e.target.value as any)}
            options={[
              { value: 'success', label: 'موفقیت کامل و تحقق ۱۰۰٪ نتیجه مورد انتظار' },
              { value: 'partial', label: 'تحقق بخشی از نتیجه (با ذکر علل محدودیت)' },
              { value: 'alternative_solution', label: 'ارائه راه‌حل جایگزین مصوب' },
            ]}
          />
        </FormField>

        <FormField
          label="شرح نتیجه کار (Work Result) — مستندات و گزارش خروجی"
          required
          hint="توضیح دهید کار چگونه انجام شد، چه ارقامی تأیید گردید و چه خروجی ملموسی تولید شد."
        >
          <TextareaInput
            value={resultSummary}
            onChange={(e) => {
              setResultSummary(e.target.value);
              if (error) setError(null);
            }}
            placeholder="مثال: بازرسی فیزیکی ۲۰ پالت انجام شد. پلمپ‌ها بررسی و هیچ‌گونه نشتی یا نقص لیبل مشاهده نگردید. شماره بچ A-402 در فرم ثبت شد."
            rows={4}
          />
        </FormField>

        {/* Mock Attachment Upload */}
        <FieldGroup className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            پیوست مدارک و مستندات خروجی (اختیاری)
          </label>
          <FieldGroup className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer transition-colors border border-slate-300">
              <UploadCloud className="w-4 h-4 text-slate-600" />
              <span>انتخاب فایل سند / تصویر خروجی</span>
              <input type="file" className="hidden" onChange={handleAddMockFile} />
            </label>
            <span className="text-caption text-slate-500">حداکثر حجم فایل: ۱۰ مگابایت</span>
          </FieldGroup>

          {mockFiles.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {mockFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-700" />
                    <span className="font-medium text-slate-800">{file.name}</span>
                    <span className="text-slate-600 text-caption">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-rose-600 hover:text-rose-800 p-1"
                    title="حذف فایل"
                   aria-label="حذف فایل">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FieldGroup>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!resultSummary.trim()}>
            {hasApprover ? 'ارسال جهت بررسی و تأیید نهایی' : 'ثبت نتیجه و خاتمه کار'}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 2. Report Blocker Modal
// -------------------------------------------------------------
interface ReportBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; severity: 'warning' | 'critical'; resolutionPlan?: string }) => void;
}

export const ReportBlockerModal: React.FC<ReportBlockerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning');
  const [resolutionPlan, setResolutionPlan] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('درج علت دقیق مانع عملیاتی الزامی است.');
      return;
    }
    setError(null);
    onSubmit({
      reason: reason.trim(),
      severity,
      resolutionPlan: resolutionPlan.trim() || undefined,
    });
    setReason('');
    setResolutionPlan('');
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت مانع عملیاتی و توقف کار"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
          ثبت مانع سبب انتقال کار به وضعیت <span className="font-bold">مسدود</span> می‌شود و به اطلاع صاحب کار و مدیران می‌رسد.
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <FormField label="شدت مانع" required>
          <SelectInput
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            options={[
              { value: 'warning', label: 'هشدار — کار با تأخیر مواجه است اما کاملاً قفل نشده' },
              { value: 'critical', label: 'بحرانی — توقف کامل کار تا زمان اقدام رفع مانع' },
            ]}
          />
        </FormField>

        <FormField label="علت دقیق مانع و گلوگاه" required>
          <TextareaInput
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="مثال: قطعی باسکول دیجیتال و عدم امکان وزن‌کشی / خرابی دستگاه نمونه‌برداری آزمایشگاه"
            rows={3}
          />
        </FormField>

        <FormField label="اقدام پیشنهادی جهت رفع مانع (اختیاری)">
          <TextInput
            value={resolutionPlan}
            onChange={(e) => setResolutionPlan(e.target.value)}
            placeholder="مثال: هماهنگی اعزام تکنسین پشتیبان یا استفاده از باسکول شماره ۲"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="danger" onClick={handleSubmit}>
            ثبت مانع و مسدودسازی
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 3. Return Work Item Modal (Mandatory Reason)
// -------------------------------------------------------------
interface ReturnWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  targetPersonName?: string;
  isApprovalReview?: boolean;
}

export const ReturnWorkItemModal: React.FC<ReturnWorkItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetPersonName,
  isApprovalReview,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('ذکر علت الزامی بازگشت پرونده اجباری است.');
      return;
    }
    setError(null);
    onSubmit(reason.trim());
    setReason('');
  };

  const recipientDisplay = targetPersonName || (isApprovalReview ? 'علیرضا تهرانی' : 'ثبت‌کننده / مجری');

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isApprovalReview ? 'بازگشت سفارش جهت بازنگری و اصلاح' : 'برگشت کار جهت اصلاح نواقص (Return)'}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
          {isApprovalReview ? (
            <span>
              سفارش برای اصلاح به کارهای من <span className="font-bold">{recipientDisplay}</span> بازگردانده می‌شود.
            </span>
          ) : (
            <span>
              کار به کارهای من <span className="font-bold">{recipientDisplay}</span> در تب{' '}
              <span className="font-bold">«برگشتی‌ها»</span> بازگردانده می‌شود تا نواقص رفع شود.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <FormField
          label="دلیل بازگشت و موارد نیازمند اصلاح"
          required
          hint="موارد نیازمند اصلاح از قبیل اصلاح قیمت پیشنهادی، تکمیل مستندات اعتبار یا شرایط تسویه را ثبت نمایید."
        >
          <TextareaInput
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="مثال: اصلاح قیمت پیشنهادی، تکمیل مستندات اعتبار مشتری یا بازنگری شرایط تسویه"
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="warning"
            onClick={handleSubmit}
            disabled={!reason.trim()}
          >
            {isApprovalReview ? 'ثبت بازگشت و ارجاع به ثبت‌کننده' : 'برگشت قطعی کار'}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 4. Set Waiting Status Modal
// -------------------------------------------------------------
interface SetWaitingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const SetWaitingModal: React.FC<SetWaitingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('ذکر علت انتظار یا تعلیق الزامی است.');
      return;
    }
    setError(null);
    onSubmit(reason.trim());
    setReason('');
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تعلیق کار (در انتظار اقدام دیگران / مرجع بیرونی)"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 leading-relaxed">
          وضعیت کار به <span className="font-bold">معلق / در انتظار</span> تغییر می‌یابد تا مشخص باشد کار در حال حاضر متوقف اقدام نهاد یا شخص دیگری است.
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <FormField label="علت تعلیق و منتظر چه اقدامی هستید؟" required>
          <TextareaInput
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="مثال: در انتظار ارسال نمونه پلمپ‌شده از سوی آزمایشگاه مرجع همکار"
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            ثبت تعلیق کار
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 5. Reassign Work Item Modal (Preserving Owner)
// -------------------------------------------------------------
interface ReassignWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newAssignee: Person, reason?: string, isDelegation?: boolean, allowSupervisorSelfAssignment?: boolean) => void;
  onRequestCrossUnit?: (reason: string, proposedUnit?: string, proposedPerson?: string) => void;
  currentOwnerName?: string;
  actor: MockPersona;
  taskUnit?: string;
  record?: OperationalRecord;
  currentAssigneeId?: string;
}

export const ReassignWorkItemModal: React.FC<ReassignWorkItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onRequestCrossUnit,
  currentOwnerName,
  actor,
  taskUnit,
  record,
  currentAssigneeId,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [reason, setReason] = useState('');
  const [allowSupervisorSelfAssignment, setAllowSupervisorSelfAssignment] = useState(true);
  const [isCrossUnitMode, setIsCrossUnitMode] = useState(false);
  const [crossUnitReason, setCrossUnitReason] = useState('');
  const [crossUnitProposedUnit, setCrossUnitProposedUnit] = useState('معاونت عملیات و زنجیره تأمین');
  const [crossUnitProposedPerson, setCrossUnitProposedPerson] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Authoritative candidate evaluation
  const effectiveUnit = record?.unit || taskUnit || '';
  const effectiveAssigneeId = currentAssigneeId || record?.currentAssignee?.id || record?.currentOwner?.id;

  const eligibleCandidates = getAuthoritativeEligibleAssignees(actor, record || effectiveUnit, {
    allowSupervisorSelfAssignment,
    excludePersonId: effectiveAssigneeId,
  });

  const selectedCandidate = eligibleCandidates.find((c) => c.person.id === selectedPersonId);

  // Active delegation check
  const activeDelegation = MOCK_DELEGATIONS.find(
    (d) => d.delegatee.id === selectedPersonId && d.status === 'active'
  );
  const isDelegation = Boolean(selectedCandidate?.evidence?.delegation_id) || activeDelegation !== undefined;

  const handleStandardSubmit = () => {
    if (!selectedCandidate) {
      setError('لطفاً همکار مجری جدید را انتخاب نمایید.');
      return;
    }
    if (!reason.trim()) {
      setError('درج علت ارجاع کار جهت ثبت در ردپای حسابرسی الزامی است.');
      return;
    }
    setError(null);
    onSubmit(
      {
        id: selectedCandidate.person.id,
        name: selectedCandidate.person.name,
        role: selectedCandidate.person.jobTitle,
        department: selectedCandidate.person.department,
        avatar: selectedCandidate.person.avatar,
        isActingDelegate: isDelegation,
      },
      reason.trim(),
      isDelegation,
      allowSupervisorSelfAssignment
    );
    setSelectedPersonId('');
    setReason('');
  };

  const handleCrossUnitSubmit = () => {
    if (!crossUnitReason.trim()) {
      setError('درج علت درخواست ارجاع بین‌واحدی الزامی است.');
      return;
    }
    if (onRequestCrossUnit) {
      onRequestCrossUnit(crossUnitReason.trim(), crossUnitProposedUnit.trim(), crossUnitProposedPerson.trim());
    }
    setError(null);
    setIsCrossUnitMode(false);
    setCrossUnitReason('');
    setCrossUnitProposedPerson('');
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={() => {
        setIsCrossUnitMode(false);
        setError(null);
        onClose();
      }}
      title={isCrossUnitMode ? 'درخواست ارجاع بین‌واحدی (نیازمند مصوبه سازمانی)' : 'ارجاع کار به همکار دیگر (بازتخصیص مجری)'}
      size="md"
    >
      <div className="space-y-4">
        {/* CROSS-UNIT MODE */}
        {isCrossUnitMode ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary-200 bg-primary-50/80 p-3 text-xs text-primary-950 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-primary-900">
                <ShieldAlert className="w-4 h-4 text-primary-700 shrink-0" />
                <span>فرآیند ارجاع بین‌واحدی (Cross-Unit Reassignment)</span>
              </div>
              <p className="text-caption text-primary-800">
                ارجاع وظیفه به خارج از واحد «{effectiveUnit}» مستلزم تأیید مدیر دارای اختیارات سازمانی است. تا زمان تصویب نهایی، مجری فعلی بدون تغییر باقی خواهد ماند.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <FormField label="واحد مقصد پیشنهادی" required>
              <TextInput
                value={crossUnitProposedUnit}
                onChange={(e) => setCrossUnitProposedUnit(e.target.value)}
                placeholder="مثال: معاونت عملیات و زنجیره تأمین"
              />
            </FormField>

            <FormField label="نام کارشناس یا همکار پیشنهادی (اختیاری)">
              <TextInput
                value={crossUnitProposedPerson}
                onChange={(e) => setCrossUnitProposedPerson(e.target.value)}
                placeholder="مثال: مهندس محسن راد یا کارشناس اعزامی"
              />
            </FormField>

            <FormField label="علت تفصیلی درخواست ارجاع بین‌واحدی" required>
              <TextareaInput
                rows={3}
                value={crossUnitReason}
                onChange={(e) => {
                  setCrossUnitReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="دلایل عدم امکان انجام کار در واحد انبار و لزوم ارجاع به خارج از واحد..."
              />
            </FormField>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-caption text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">مسیر گردش کار:</div>
              <div>ارجاع مستقیم به: <span className="font-bold text-primary-700">مهندس حامد اسدی</span> (مدیر ارشد عملیات — دارای صلاحیت انتساب سازمانی)</div>
              <div>وضعیت درخواست: <span className="font-bold text-amber-700">در انتظار مصوبه سازمانی (مجری فعلی حفظ می‌شود)</span></div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCrossUnitMode(false);
                  setError(null);
                }}
              >
                بازگشت به ارجاع درون‌واحدی
              </Button>
              <Button
                variant="primary"
                onClick={handleCrossUnitSubmit}
                disabled={!crossUnitReason.trim()}
              >
                ثبت درخواست ارجاع بین‌واحدی
              </Button>
            </div>
          </div>
        ) : (
          /* STANDARD UNIT-SCOPED REASSIGNMENT MODE */
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold">یادآوری مسئولیت: </span>
              مسئول پاسخگو (صاحب کار: {currentOwnerName || 'ثبت‌کننده'}) ثابت باقی می‌ماند و تنها{' '}
              <span className="font-bold">مجری اقدام‌کننده کنونی</span> تغییر خواهد کرد.
            </div>

            {/* Supervisor Self-Assignment Policy Option */}
            <FieldGroup className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs">
              <span className="text-slate-700 font-medium">
                مجوز خودارجاعی سرپرست (Self-Assignment جهت رفع اضطرار)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSupervisorSelfAssignment}
                  onChange={(e) => {
                    setAllowSupervisorSelfAssignment(e.target.checked);
                    setSelectedPersonId('');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-700"></div>
              </label>
            </FieldGroup>

            {/* Empty state when no eligible replacement is found */}
            {eligibleCandidates.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-950 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>در دامنه مجاز شما جانشین واجد شرایطی یافت نشد.</span>
                </div>
                <p className="text-caption text-amber-800 leading-relaxed">
                  کلیه اعضای واحد «{effectiveUnit}» بررسی شدند و هیچ جانشین واجد صلاحیت و فعالی خارج از مجری فعلی یافت نشد. می‌توانید با استفاده از گزینه زیر، درخواست ارجاع کار به خارج از واحد را ثبت نمایید.
                </p>
                <div className="pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold"
                    onClick={() => {
                      setIsCrossUnitMode(true);
                      setError(null);
                    }}
                  >
                    درخواست ارجاع بینواحدی
                  </Button>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <FormField label="انتخاب همکار مجری جدید (محدوده مجاز واحد)" required>
              <SelectInput
                value={selectedPersonId}
                disabled={eligibleCandidates.length === 0}
                onChange={(e) => {
                  setSelectedPersonId(e.target.value);
                  if (error) setError(null);
                }}
                options={[
                  {
                    value: '',
                    label: eligibleCandidates.length > 0 ? '-- انتخاب همکار واجد شرایط واحد --' : '-- فرد مجازی یافت نشد --',
                  },
                  ...eligibleCandidates.map((c) => ({
                    value: c.person.id,
                    label: `${c.person.name} — ${c.person.jobTitle} (${c.evidence.ui_label})`,
                  })),
                ]}
              />
            </FormField>

            {/* Evidence details for the selected candidate */}
            {selectedCandidate && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 border-b border-emerald-200 pb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>مستندات احراز صلاحیت سازمانی (استناد سیستمی)</span>
                  {selectedCandidate.evidence.is_supervisor_self_assignment && (
                    <span className="mr-auto px-2 py-0.5 rounded text-caption font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      مجوز خودارجاعی سرپرست
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption leading-relaxed">
                  <div>
                    <span className="text-slate-600">شناسه عضویت: </span>
                    <span className="font-mono font-semibold text-slate-900">{selectedCandidate.evidence.membership_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">واحد احراز‌شده: </span>
                    <span className="font-semibold text-slate-900">{selectedCandidate.evidence.matched_unit_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">صلاحیت اجرایی: </span>
                    <span className="font-semibold text-slate-900">{selectedCandidate.evidence.matched_capability}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">بازه اعتبار زمانی: </span>
                    <span className="font-semibold text-slate-900">
                      {selectedCandidate.evidence.effective_from} الی {selectedCandidate.evidence.effective_to}
                    </span>
                  </div>
                </div>
                <div className="text-caption text-emerald-900 pt-1 border-t border-emerald-200">
                  <span className="font-semibold">مبنای احراز: </span>
                  <span>{selectedCandidate.evidence.eligibility_reason}</span>
                </div>
              </div>
            )}

            <FormField label="علت ارجاع کار (ثبت در ردپای حسابرسی)" required>
              <TextInput
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="مثال: پیگیری هماهنگی به دلیل مرخصی یا مأموریت اداری"
              />
            </FormField>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary-700 hover:text-primary-800"
                onClick={() => {
                  setIsCrossUnitMode(true);
                  setError(null);
                }}
              >
                درخواست ارجاع بینواحدی
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  انصراف
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStandardSubmit}
                  disabled={!selectedPersonId || !reason.trim() || eligibleCandidates.length === 0}
                >
                  ارجاع و ثبت در تاریخچه
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 6. Approve Completion Modal (Approver Action)
// -------------------------------------------------------------
interface ApproveCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note?: string) => void;
  taskTitle?: string;
  resultSummary?: string;
}

export const ApproveCompletionModal: React.FC<ApproveCompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
  resultSummary,
}) => {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(note.trim() || undefined);
    setNote('');
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تأیید نهایی نتیجه انجام کار"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 leading-relaxed">
          <div className="font-bold mb-1">نتیجه کار ثبت‌شده توسط مجری:</div>
          <div className="text-slate-800 bg-white/80 p-3 rounded border border-emerald-100">
            {resultSummary || 'گزارش خروجی ثبت گردیده است.'}
          </div>
        </div>

        <FormField label="توضیحات یا دستورالعمل تکمیلی تأیید (اختیاری)">
          <TextareaInput
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: نتیجه کار بررسی و منطبق بر ضوابط کیفی است. بایگانی گردد."
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            تأیید نهایی و مختومه کردن کار
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};

// -------------------------------------------------------------
// 7. Reject Work Item Modal (Formal Rejection with Mandatory Reason)
// -------------------------------------------------------------
interface RejectWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  taskTitle?: string;
  sourceCode?: string;
}

export const RejectWorkItemModal: React.FC<RejectWorkItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
  sourceCode,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('ثبت علت مستند رد درخواست الزامی است.');
      return;
    }
    setError(null);
    onSubmit(reason.trim());
    setReason('');
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="رد رسمی درخواست / تأییدیه (Reject)"
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-2 text-rose-800">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>هشدار اثرات تصمیم رد قطعی:</span>
          </div>
          <p>
            با رد این درخواست ({sourceCode || taskTitle || 'پرونده جاری'})، گردش کار مختومه شده و سند مبدأ در وضعیت ردشده قرار می‌گیرد.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <FormField
          label="علت مستند رد درخواست"
          required
          hint="دلایل عدم انطباق با سیاست‌های تجاری، اعتباری یا فنی را به صراحت ثبت کنید."
        >
          <TextareaInput
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="مثال: عدم توجیه حاشیه سود، ریسک اعتباری بالای مشتری یا عدم تأیید شرایط پرداخت مدت‌دار"
            rows={3}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={!reason.trim()}>
            رد قطعی پرونده
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
};
