import { FieldGroup } from '../design-system/FieldGroup';
import React, { useState } from 'react';
import {
  PriorityLevel,
  RecordType,
  MockPersona,
  OperationalRecord,
  WorkItemType,
  LinkedBusinessRecord,
  RecordAttachment,
} from '../../types';
import { MOCK_PERSONAS } from '../../data/mockData';
import { MOCK_RESPONSIBILITY_AREAS, MOCK_DELEGATIONS, ResponsibilityAreaCatalogItem } from '../../data/mockOrgData';
import { mockRepository } from '../../runtime/workflow';
import {
  getEligibleAssignees,
  getEligibleApprovers,
  canActorCreateWorkItem,
} from '../../utils/workItemAuthorization';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Check, Send, ShieldAlert, FileText, UserCheck, UploadCloud, Trash2, Users, Eye, Award, Link2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../design-system/FormControls';
import { Modal } from '../design-system/ModalAndDrawer';
import { Badge, PriorityBadge } from '../design-system/Badges';
import { toPersianDigits, formatRials } from '../../utils/formatters';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: MockPersona;
  onTaskAssigned: (newTask: OperationalRecord) => void;
  initialAssigneeName?: string;
  onViewCreatedTask?: (recordId: string) => void;
  onViewTeamWork?: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onTaskAssigned,
  initialAssigneeName,
  onViewCreatedTask,
  onViewTeamWork,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRecord, setCreatedRecord] = useState<OperationalRecord | null>(null);

  // ---------------- STEP 1: SUBJECT & LINKED RECORD ----------------
  const [taskTitle, setTaskTitle] = useState('');
  const [workItemType, setWorkItemType] = useState<WorkItemType>('general');
  const [description, setDescription] = useState('');
  const [linkedRecordKey, setLinkedRecordKey] = useState<string>('none');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [requiresWorkResult, setRequiresWorkResult] = useState(true);
  const [initialAttachments, setInitialAttachments] = useState<RecordAttachment[]>([]);
  const [initialComment, setInitialComment] = useState('');

  // ---------------- STEP 2: RESPONSIBILITIES & SCOPE FILTERING ----------------
  // Filter out inactive personas (e.g. p-no-access)
  const activePersonas = MOCK_PERSONAS.filter((p) => p.id !== 'p-no-access');

  // Check permission: WORK_CREATE or delegate with WORK_CREATE
  const canCreate = canActorCreateWorkItem(activePersona);

  // Responsibility Area for Accountable Owner
  const [selectedResponsibilityId, setSelectedResponsibilityId] = useState<string>(() => {
    const found = MOCK_RESPONSIBILITY_AREAS.find((r) => r.primaryResponsiblePersonId === activePersona.id);
    return found?.id || MOCK_RESPONSIBILITY_AREAS[1].id;
  });

  const selectedRespArea =
    MOCK_RESPONSIBILITY_AREAS.find((r) => r.id === selectedResponsibilityId) || MOCK_RESPONSIBILITY_AREAS[0];
  const resolvedOwnerPerson =
    activePersonas.find((p) => p.id === selectedRespArea.primaryResponsiblePersonId) || activePersona;

  // Actor's effective scope
  const actorScope: 'self' | 'unit' | 'organization' = (() => {
    if (
      activePersona.id === 'p-admin-ops' ||
      activePersona.id === 'p-ops-dir' ||
      (activePersona.personaKey === 'multi_delegate' && activePersona.activeResponsibilityId === 'del-1') ||
      activePersona.id === 'p-comm-approver'
    ) {
      return 'organization';
    }
    if (activePersona.isManager) {
      return 'unit';
    }
    return 'self';
  })();

  // Eligible Assignees strictly filtered by capability, scope, unit membership, and delegation
  const eligibleAssignees = React.useMemo(() => {
    return getEligibleAssignees(activePersona, selectedRespArea?.unitName || activePersona.department);
  }, [activePersona, selectedRespArea]);

  // Current Assignee (مجری اقدام‌کننده کنونی - اکنون دست کیست) - MUST DEFAULT TO BLANK
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(() => {
    if (initialAssigneeName) {
      const found = eligibleAssignees.find((p) => p.name.includes(initialAssigneeName));
      if (found) return found.id;
    }
    return '';
  });

  // Approver (تأییدکننده تکمیل) - Self-approval prevention & genuine approval capability
  const [hasApprover, setHasApprover] = useState(false);
  const eligibleApprovers = React.useMemo(() => {
    return getEligibleApprovers(
      {
        creatorId: activePersona.id,
        assigneeId: selectedAssigneeId || undefined,
        unit: selectedRespArea?.unitName || activePersona.department,
        workItemType,
      },
      activePersona
    );
  }, [activePersona, selectedAssigneeId, selectedRespArea, workItemType]);

  // Approver selection - MUST DEFAULT TO BLANK
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');

  // Ensure selectedAssigneeId remains valid within eligibleAssignees
  React.useEffect(() => {
    if (selectedAssigneeId && !eligibleAssignees.some((p) => p.id === selectedAssigneeId)) {
      setSelectedAssigneeId('');
    }
  }, [eligibleAssignees, selectedAssigneeId]);

  // Ensure selectedApproverId remains valid within eligibleApprovers
  React.useEffect(() => {
    if (selectedApproverId && !eligibleApprovers.some((p) => p.id === selectedApproverId)) {
      setSelectedApproverId('');
    }
  }, [eligibleApprovers, selectedApproverId]);

  // Contributors (همکاران مشارکت‌کننده)
  const [selectedContributorIds, setSelectedContributorIds] = useState<string[]>([]);

  // Observers (رونوشت / مطلعین)
  const [selectedObserverIds, setSelectedObserverIds] = useState<string[]>([]);

  // ---------------- STEP 3: TIME & PRIORITY ----------------
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [startDate, setStartDate] = useState('۱۴۰۴/۰۶/۱۲');
  const [dueDate, setDueDate] = useState('۱۴۰۴/۰۶/۲۵');
  const [dueTime, setDueTime] = useState('۱۶:۰۰');
  const [managerInstruction, setManagerInstruction] = useState('');
  const [reminderPreference, setReminderPreference] = useState<'none' | '2h_before' | '24h_before' | 'daily'>('2h_before');
  const [visibilityScope, setVisibilityScope] = useState<'self_participants' | 'unit' | 'organization'>('unit');

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // Available business records from repository for linking
  const allRepoRecords = mockRepository.getAllRecords();

  const resetForm = () => {
    setStep(1);
    setIsSuccess(false);
    setCreatedRecord(null);
    setTaskTitle('');
    setWorkItemType('general');
    setDescription('');
    setLinkedRecordKey('none');
    setExpectedOutcome('');
    setRequiresWorkResult(true);
    setInitialAttachments([]);
    setInitialComment('');
    setSelectedResponsibilityId(MOCK_RESPONSIBILITY_AREAS[1].id);
    setSelectedAssigneeId('');
    setHasApprover(false);
    setSelectedApproverId('');
    setSelectedContributorIds([]);
    setSelectedObserverIds([]);
    setPriority('high');
    setManagerInstruction('');
    setValidationError(null);
  };

  const selectedOwner = resolvedOwnerPerson;
  const selectedAssignee = activePersonas.find((p) => p.id === selectedAssigneeId);
  const selectedApprover = hasApprover ? activePersonas.find((p) => p.id === selectedApproverId) : undefined;

  // Active delegation evidence for current assignee
  const activeDelegation = selectedAssignee
    ? MOCK_DELEGATIONS.find((d) => d.delegatee.id === selectedAssignee.id && d.status === 'active')
    : undefined;

  // Linked record helper
  const selectedRepoRecord = linkedRecordKey !== 'none' ? allRepoRecords.find((r) => r.id === linkedRecordKey) : null;

  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!taskTitle.trim()) {
        setValidationError('لطفاً عنوان کار یا وظیفه را وارد نمایید.');
        return;
      }
      if (requiresWorkResult && !expectedOutcome.trim()) {
        setValidationError('لطفاً معیار و خروجی مورد انتظار برای تکمیل (Definition of Done) را درج فرمایید.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (eligibleAssignees.length === 0) {
        setValidationError(`هیچ فرد واجد شرایطی بر اساس محدوده دسترسی شما (${actorScope === 'self' ? 'فقط خود' : actorScope === 'unit' ? 'واحد سازمانی' : 'سازمان'}) یافت نشد. امکان واگذاری وجود ندارد.`);
        return;
      }
      if (!selectedAssigneeId) {
        setValidationError('تعیین مجری اقدام‌کننده کنونی الزامی است.');
        return;
      }
      if (hasApprover && (!selectedApproverId || selectedApproverId === activePersona.id || selectedApproverId === selectedAssigneeId)) {
        setValidationError('عدم امکان خودتأییدی: طبق ضوابط حاکمیتی سازمان جوادیان، ایجادکننده یا مجری کار نمی‌تواند خود را به عنوان تأییدکننده نهایی تعیین کند. تأیید باید توسط مقام مستقل دیگری انجام پذیرد.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!dueDate.trim()) {
        setValidationError('لطفاً تاریخ مهلت انجام را مشخص کنید.');
        return;
      }
      setStep(4);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: RecordAttachment = {
        id: `att-new-${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc',
        uploadedBy: activePersona.name,
        uploadedAtJalali: 'هم‌اکنون',
      };
      setInitialAttachments([...initialAttachments, newAtt]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setInitialAttachments(initialAttachments.filter((a) => a.id !== id));
  };

  const handleAssign = () => {
    if (!selectedAssignee || !selectedOwner) return;

    const newRecordId = `rec-task-${Date.now()}`;
    const codePrefix =
      workItemType === 'review'
        ? 'REV'
        : workItemType === 'followup'
        ? 'FOL'
        : workItemType === 'coordination'
        ? 'CRD'
        : workItemType === 'field_op'
        ? 'FLD'
        : 'TSK';
    const newCode = `${codePrefix}-1404-${Math.floor(100 + Math.random() * 900)}`;

    const typeLabel =
      workItemType === 'review'
        ? 'بازبینی و کنترل فنی'
        : workItemType === 'followup'
        ? 'پیگیری عملیاتی'
        : workItemType === 'coordination'
        ? 'هماهنگی بین‌واحدی'
        : workItemType === 'field_op'
        ? 'عملیات میدانی'
        : 'اقدام اجرایی عمومی';

    // Map linked record
    let linkedBusinessRecord: LinkedBusinessRecord | undefined = undefined;
    if (selectedRepoRecord) {
      linkedBusinessRecord = {
        id: selectedRepoRecord.id,
        code: selectedRepoRecord.code,
        title: selectedRepoRecord.title,
        category: (selectedRepoRecord.type as any) || 'other',
        categoryLabel: selectedRepoRecord.typeLabel,
        currentStatus: selectedRepoRecord.statusLabel,
        summary: selectedRepoRecord.itemSummary,
      };
    }

    const isActingDelegate = selectedAssignee.id === 'p-multi-delegate';

    const newRecord: OperationalRecord = {
      id: newRecordId,
      code: newCode,
      title: taskTitle.trim(),
      itemSummary: description.trim() || taskTitle.trim(),
      type: (workItemType as any) || 'general_task',
      typeLabel: typeLabel,
      workItemType: workItemType,
      unit: selectedAssignee.department,
      status: 'open',
      statusLabel: 'باز / در انتظار شروع مجری',
      statusSinceJalali: 'هم‌اکنون',
      priority: priority,
      startDateJalali: startDate,
      dueDateJalali: dueDate,
      dueTimeJalali: dueTime ? `ساعت ${dueTime}` : undefined,
      managerInstruction: managerInstruction.trim() || undefined,
      reminderPreference: reminderPreference,
      visibilityScope: visibilityScope,
      expectedOutcome: expectedOutcome.trim() || undefined,
      requiresWorkResult: requiresWorkResult,
      linkedBusinessRecord: linkedBusinessRecord,

      // Roles
      creator: {
        id: activePersona.id,
        name: activePersona.name,
        role: activePersona.jobTitle,
        department: activePersona.department,
        avatar: activePersona.avatar,
      },
      createdAt: new Date().toISOString(),
      createdAtJalali: 'هم‌اکنون',

      owner: {
        id: selectedOwner.id,
        name: selectedOwner.name,
        role: selectedOwner.jobTitle,
        department: selectedOwner.department,
        avatar: selectedOwner.avatar,
      },

      currentAssignee: {
        id: selectedAssignee.id,
        name: selectedAssignee.name,
        role: selectedAssignee.jobTitle,
        department: selectedAssignee.department,
        avatar: selectedAssignee.avatar,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
        isActingDelegate: isActingDelegate,
      },

      currentOwner: {
        id: selectedAssignee.id,
        name: selectedAssignee.name,
        role: selectedAssignee.jobTitle,
        department: selectedAssignee.department,
        avatar: selectedAssignee.avatar,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
        isActingDelegate: isActingDelegate,
      },

      approver: selectedApprover
        ? {
            id: selectedApprover.id,
            name: selectedApprover.name,
            role: selectedApprover.jobTitle,
            department: selectedApprover.department,
            avatar: selectedApprover.avatar,
          }
        : undefined,

      contributors: selectedContributorIds
        .map((cid) => activePersonas.find((p) => p.id === cid))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          name: p!.name,
          role: p!.jobTitle,
          department: p!.department,
        })),

      observers: selectedObserverIds
        .map((oid) => activePersonas.find((p) => p.id === oid))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          name: p!.name,
          role: p!.jobTitle,
          department: p!.department,
        })),

      nextAction: {
        title: managerInstruction.trim() || 'شروع به کار، بررسی الزامات و ثبت خروجی کار',
        responsibleRole: selectedAssignee.jobTitle,
        responsiblePersonName: selectedAssignee.name,
        dueJalali: `${dueDate} ${dueTime ? 'ساعت ' + dueTime : ''}`.trim(),
        suggestedAction: 'start',
      },

      blocker: null,

      timeline: [
        {
          id: `tl-init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: {
            id: activePersona.id,
            name: activePersona.name,
            role: activePersona.jobTitle,
            department: activePersona.department,
            avatar: activePersona.avatar,
          },
          title: 'تعریف کار و واگذاری به همکار',
          note: `کار با اولویت ${
            priority === 'urgent' ? 'فوری' : priority === 'high' ? 'بالا' : priority === 'normal' ? 'عادی' : 'پایین'
          } و مسئولیت نظارتی ${selectedOwner.name} به مجری ${selectedAssignee.name} ارجاع گردید.`,
          type: 'creation',
        },
      ],

      assignmentHistory: [
        {
          id: `ah-init-${Date.now()}`,
          timestampJalali: 'هم‌اکنون',
          assignedBy: {
            id: activePersona.id,
            name: activePersona.name,
            role: activePersona.jobTitle,
            department: activePersona.department,
          },
          assignedTo: {
            id: selectedAssignee.id,
            name: selectedAssignee.name,
            role: selectedAssignee.jobTitle,
            department: selectedAssignee.department,
          },
          reason: 'تخصیص اولیه وظیفه در فرآیند واگذاری',
          isDelegation: isActingDelegate,
        },
      ],

      statusHistory: [
        {
          id: `sh-init-${Date.now()}`,
          timestampJalali: 'هم‌اکنون',
          fromStatus: 'draft',
          toStatus: 'open',
          actor: {
            id: activePersona.id,
            name: activePersona.name,
            role: activePersona.jobTitle,
            department: activePersona.department,
          },
          reason: 'صدور و ابلاغ کار به مجری',
        },
      ],

      comments: initialComment
        ? [
            {
              id: `c-init-${Date.now()}`,
              author: {
                id: activePersona.id,
                name: activePersona.name,
                role: activePersona.jobTitle,
                department: activePersona.department,
                avatar: activePersona.avatar,
              },
              createdAtJalali: 'هم‌اکنون',
              text: initialComment,
              isInternal: false,
            },
          ]
        : [],

      attachments: initialAttachments,
      tags: ['وظیفه_محوله', 'کارتابل_پرسنل'],
      lastActivityJalali: 'هم‌اکنون',
      lastActivityDescription: `واگذاری کار توسط ${activePersona.name} به ${selectedAssignee.name}`,
    };

    mockRepository.createRecord(newRecord);
    setCreatedRecord(newRecord);
    setIsSuccess(true);
    onTaskAssigned(newRecord);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        !canCreate
          ? 'عدم دسترسی ایجاد کار'
          : isSuccess
          ? 'کار با موفقیت ثبت و واگذار شد'
          : 'واگذاری کار جدید (۴ مرحله)'
      }
      size="lg"
    >
      <div className="space-y-5">
        {!canCreate ? (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-none">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">عدم دسترسی: ایجاد کار جدید مجاز نیست</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                کاربر جاری ({activePersona.name} — {activePersona.jobTitle}) دارای اختیار سیستمی ایجاد کار در سطح سازمان نیست. تعریف وظیفه نیازمند داشتن دسترسی «ایجاد کار» (WORK_CREATE) یا تفویض جانشینی مصوب است.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="outline" onClick={handleClose}>
                بستن پنجره
              </Button>
            </div>
          </div>
        ) : isSuccess && createdRecord ? (
          <div className="py-6 px-4 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-none animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                کار با کد شناسایی «{createdRecord.code}» در سامانه ثبت گردید
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                این وظیفه در کارتابل «اقدام من» برای{' '}
                <span className="font-bold text-slate-900">{selectedAssignee.name}</span> درج شد و نسخه پیگیری آن در تب
                «در انتظار دیگران» برای شما در دسترس است.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 max-w-md mx-auto text-right space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-700">عنوان:</span>
                <span className="font-bold text-slate-900">{createdRecord.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-700">صاحب کار (پاسخگو):</span>
                <span className="font-semibold text-slate-900">{selectedOwner.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-700">مجری کنونی (اکنون دست کیست):</span>
                <span className="font-semibold text-primary-700">{selectedAssignee.name}</span>
              </div>
              {selectedApprover && (
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-700">تأییدکننده تکمیل:</span>
                  <span className="font-semibold text-amber-800">{selectedApprover.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-700">مهلت انجام:</span>
                <span className="font-semibold text-slate-900">
                  {createdRecord.dueDateJalali} {createdRecord.dueTimeJalali || ''}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  if (onViewCreatedTask) onViewCreatedTask(createdRecord.id);
                  handleClose();
                }}
              >
                مشاهده کار در کارتابل
              </Button>
              <Button variant="outline" onClick={handleClose}>
                بستن پنجره
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* WIZARD STEPPER */}
            <div className="relative border-b border-slate-200 pb-4">
              {/* Mobile Condensed Stepper */}
              <div className="sm:hidden flex items-center justify-between p-2.5 bg-primary-50 rounded-xl border border-primary-200 text-xs font-bold text-primary-900">
                <span>مرحله {toPersianDigits(step)} از ۴</span>
                <span className="text-primary-700 font-medium">
                  {['موضوع و ارتباط', 'مسئولیت‌ها', 'زمان و اولویت', 'بررسی و تأیید'][step - 1]}
                </span>
              </div>

              {/* Desktop Stepper */}
              <div className="hidden sm:flex items-center justify-between text-xs">
                {[
                  { num: 1, title: 'موضوع و ارتباط' },
                  { num: 2, title: 'مسئولیت‌ها' },
                  { num: 3, title: 'زمان و اولویت' },
                  { num: 4, title: 'بررسی و تأیید' },
                ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                        step === s.num
                          ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                          : step > s.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {step > s.num ? <Check className="w-3.5 h-3.5" /> : toPersianDigits(s.num)}
                    </div>
                    <span
                      className={`text-caption font-medium ${
                        step === s.num ? 'text-primary-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ERROR ALERT */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP 1: SUBJECT & LINKED RECORD */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                <FormField label="عنوان کار یا وظیفه" required>
                  <TextInput
                    value={taskTitle}
                    onChange={(e) => {
                      setTaskTitle(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="مثال: پیگیری تأییدیه چک بانکی / کنترل فیزیکی برچسب بچ محموله روغن"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="نوع کار / اقدام" required>
                    <SelectInput
                      value={workItemType}
                      onChange={(e) => setWorkItemType(e.target.value as WorkItemType)}
                      options={[
                        { value: 'general', label: 'اقدام عمومی (General Task)' },
                        { value: 'followup', label: 'پیگیری عملیاتی (Follow-up)' },
                        { value: 'review', label: 'بازبینی و کنترل فنی (Review)' },
                        { value: 'coordination', label: 'هماهنگی بین‌واحدی (Coordination)' },
                        { value: 'field_op', label: 'عملیات میدانی (Field Operation)' },
                      ]}
                    />
                  </FormField>

                  <FormField label="ارتباط با سند عملیاتی (اختیاری)">
                    <SelectInput
                      value={linkedRecordKey}
                      onChange={(e) => setLinkedRecordKey(e.target.value)}
                      options={[
                        { value: 'none', label: 'بدون سند متصل (وظیفه مستقل)' },
                        ...allRepoRecords.map((r) => ({
                          value: r.id,
                          label: `[${r.typeLabel}] ${r.code} — ${r.title.slice(0, 45)}...`,
                        })),
                      ]}
                    />
                  </FormField>
                </div>

                {/* Selected Linked Record Details Preview */}
                {selectedRepoRecord && (
                  <div className="p-3 rounded-lg border border-primary-200 bg-primary-50/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-caption text-primary-800 font-bold flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>سند عملیاتی متصل: {selectedRepoRecord.code}</span>
                      </div>
                      <div className="text-slate-800 font-medium">{selectedRepoRecord.title}</div>
                      <div className="text-slate-700 text-caption">وضعیت فعلی: {selectedRepoRecord.statusLabel}</div>
                    </div>
                    <Badge variant="primary">{selectedRepoRecord.typeLabel}</Badge>
                  </div>
                )}

                <FormField label="شرح مأموریت و جزییات اجرایی">
                  <TextareaInput
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اقدامات لازم، ارقام یا ملاحظات خاص مورد نیاز را شرح دهید..."
                    rows={2}
                  />
                </FormField>

                {/* Expected Outcome (Definition of Done) */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <FieldGroup className="flex items-center justify-between">
                    <label className="font-bold text-amber-900 flex items-center gap-2 text-xs">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span>نتیجه مورد انتظار برای تکمیل کار (Definition of Done)</span>
                    </label>
                    <div className="flex items-center gap-1 text-caption text-slate-700">
                      <input
                        type="checkbox"
                        id="reqResultCheck"
                        checked={requiresWorkResult}
                        onChange={(e) => setRequiresWorkResult(e.target.checked)}
                        className="w-3.5 h-3.5 text-primary-700 rounded"
                      />
                      <label htmlFor="reqResultCheck" className="cursor-pointer">
                        الزام ثبت نتیجه پیش از تکمیل
                      </label>
                    </div>
                  </FieldGroup>
                  <TextInput
                    value={expectedOutcome}
                    onChange={(e) => {
                      setExpectedOutcome(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="مثال: تطبیق فیزیکی برچسب سلامت و ثبت شماره بچ در فرم / اخذ تأییدیه کتبی پرداخت"
                  />
                  <span className="text-caption text-amber-800">
                    مجری کار تنها در صورتی می‌تواند کار را تکمیل نماید که تحقق این خروجی را گزارش کند.
                  </span>
                </div>

                {/* Attachments & Initial Comment */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">پیوست اولیه و دستورالعمل (اختیاری)</label>
                    <span className="text-caption text-slate-500">حداکثر حجم فایل: ۱۰ مگابایت</span>
                  </div>
                  <FieldGroup className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer border border-slate-300">
                      <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                      <span>انتخاب فایل پیوست</span>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </FieldGroup>

                  {initialAttachments.length > 0 && (
                    <div className="space-y-1">
                      {initialAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-primary-700" />
                            <span className="font-medium text-slate-800">{att.name}</span>
                            <span className="text-slate-600 text-caption">({att.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                           aria-label="حذف مورد">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: RESPONSIBILITIES */}
            {step === 2 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                  تفکیک شفاف مسئولیت‌ها: سازوکار تضمین می‌کند ارکان مختلف تصمیم‌گیری و اجرا (ایجادکننده، صاحب کار، مجری، همکاران، ناظرین و تأییدکننده) متمایز باشند.
                </div>

                {/* Creator (Read-only) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-caption text-slate-700 font-medium">ایجادکننده اولیه (شما):</div>
                    <div className="font-bold text-slate-900">{activePersona.name}</div>
                    <div className="text-slate-700 text-caption">{activePersona.jobTitle} — {activePersona.department}</div>
                  </div>
                  <Badge variant="neutral">ثبت‌کننده (سیستمی)</Badge>
                </div>

                {/* Responsibility Area (حوزه مسئولیت سازمانی) -> Resolves to Accountable Owner */}
                <FormField
                  label="حوزه مسئولیت سازمانی (تعیین صاحب کار پاسخگو)"
                  required
                  hint="حوزه مسئولیتی که پاسخگوی کلان خروجی و نتایج این کار در سازمان خواهد بود."
                >
                  <SelectInput
                    value={selectedResponsibilityId}
                    onChange={(e) => setSelectedResponsibilityId(e.target.value)}
                    options={MOCK_RESPONSIBILITY_AREAS.map((ra) => {
                      const respPerson = activePersonas.find((p) => p.id === ra.primaryResponsiblePersonId);
                      return {
                        value: ra.id,
                        label: `${ra.title} (${ra.code}) — مدیر پاسخگو: ${respPerson?.name || ra.unitName}`,
                      };
                    })}
                  />
                </FormField>

                {/* Resolved Accountable Owner Display */}
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-caption text-emerald-800 font-medium">صاحب کار منتسب بر اساس حوزه مسئولیت (Accountable Owner):</div>
                    <div className="font-bold text-slate-900">{resolvedOwnerPerson.name}</div>
                    <div className="text-slate-700 text-caption">{resolvedOwnerPerson.jobTitle} — {resolvedOwnerPerson.department}</div>
                  </div>
                  <Badge variant="primary">پاسخگوی کلان</Badge>
                </div>

                {/* Current Assignee: Action taker (اکنون دست کیست؟) */}
                <FormField
                  label="مجری اقدام‌کننده کنونی (اکنون دست کیست؟)"
                  required
                  hint={
                    actorScope === 'self'
                      ? 'طبق سطح دسترسی، واگذاری صرفاً به خود امکان‌پذیر است.'
                      : actorScope === 'unit'
                      ? 'مجاز به واگذاری به همکاران واحد عملیاتی خود هستید.'
                      : 'مجاز به واگذاری در سطح سازمان هستید.'
                  }
                >
                  <SelectInput
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    options={[
                      {
                        value: '',
                        label:
                          eligibleAssignees.length > 0
                            ? '-- لطفاً مجری اقدام‌کننده کنونی را انتخاب نمایید (الزامی) --'
                            : '-- هیچ فرد واجد شرایطی یافت نشد --',
                      },
                      ...eligibleAssignees.map((p) => {
                        const hasActiveDel = MOCK_DELEGATIONS.some(
                          (d) => d.delegatee.id === p.id && d.status === 'active'
                        );
                        return {
                          value: p.id,
                          label: `${p.name} — ${p.jobTitle} (${p.department})${
                            hasActiveDel ? ' [دارای تفویض جانشینی فعال]' : ''
                          }`,
                        };
                      }),
                    ]}
                  />
                </FormField>

                {/* Active Delegation Evidence if selectedAssignee has active delegation */}
                {activeDelegation && (
                  <div className="p-3 rounded-lg bg-primary-50 border border-primary-200 text-xs text-primary-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-primary-900">
                      <UserCheck className="w-4 h-4 text-primary-700 shrink-0" />
                      <span>حکم تفویض جانشینی سازمانی معتبر و ثبت‌شده</span>
                    </div>
                    <div className="text-caption text-primary-800 leading-relaxed">
                      این همکار در حال حاضر به عنوان جانشین رسمی <strong>{activeDelegation.delegator.name} ({activeDelegation.delegator.role})</strong> فعالیت می‌کند.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-caption text-primary-700 pt-1 border-t border-primary-200">
                      <div>سقف اختیارات: {activeDelegation.approvalLimitRials ? `${formatRials(activeDelegation.approvalLimitRials)} (معادل ${(activeDelegation.approvalLimitRials / 10).toLocaleString('fa-IR')} تومان)` : 'نامحدود در حدود وظایف'}</div>
                      <div>بازه اعتبار: {activeDelegation.startDateJalali} تا {activeDelegation.endDateJalali}</div>
                    </div>
                  </div>
                )}

                {/* Approver Toggle & Selection */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">تأییدکننده تکمیل کار (Sign-off Approver)</div>
                      <div className="text-caption text-slate-700">
                        آیا خروجی کار نیازمند بررسی و تأیید رسمی مقام مستقل است؟
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="hasApproverCheck"
                      checked={hasApprover}
                      onChange={(e) => setHasApprover(e.target.checked)}
                      className="w-4 h-4 text-primary-700 rounded"
                    />
                  </div>

                  {hasApprover && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <FormField
                        label="انتخاب مقام تأییدکننده (عدم امکان خودتأییدی)"
                        hint="طبق ضوابط سازمانی، ایجادکننده یا مجری نمی‌تواند خروجی کار خود را تأیید کند."
                      >
                        <SelectInput
                          value={selectedApproverId}
                          onChange={(e) => setSelectedApproverId(e.target.value)}
                          options={[
                            {
                              value: '',
                              label:
                                eligibleApprovers.length > 0
                                  ? '-- لطفاً مقام تأییدکننده واجد صلاحیت را انتخاب کنید (الزامی) --'
                                  : '-- هیچ تأییدکننده واجد شرایطی یافت نشد --',
                            },
                            ...eligibleApprovers.map((p) => ({
                              value: p.id,
                              label: `${p.name} — ${p.jobTitle} (${p.department})`,
                            })),
                          ]}
                        />
                      </FormField>
                    </div>
                  )}
                </div>

                {/* Contributors (همکاران مشارکت‌کننده) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>همکاران مشارکت‌کننده (Contributors)</span>
                    </div>
                    <span className="text-caption text-slate-700">اختیاری</span>
                  </div>
                  <div className="text-caption text-slate-600">همکارانی که در انجام بخش‌هایی از کار مشارکت دارند اما مجری مسئول پرونده نیستند.</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activePersonas
                      .filter((p) => p.id !== selectedAssigneeId && p.id !== activePersona.id)
                      .map((p) => {
                        const isChecked = selectedContributorIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContributorIds([...selectedContributorIds, p.id]);
                                } else {
                                  setSelectedContributorIds(selectedContributorIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded text-primary-700 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-slate-800">{p.name} ({p.jobTitle})</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Observers (رونوشت و ناظرین / مطلعین) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>رونوشت و مطلعین (Observers)</span>
                    </div>
                    <span className="text-caption text-slate-700">اختیاری</span>
                  </div>
                  <div className="text-caption text-slate-600">افرادی که بدون داشتن وظیفه اجرایی، جریان پیشرفت پرونده را مشاهده می‌کنند.</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activePersonas
                      .filter((p) => p.id !== selectedAssigneeId && p.id !== activePersona.id && !selectedContributorIds.includes(p.id))
                      .map((p) => {
                        const isChecked = selectedObserverIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedObserverIds([...selectedObserverIds, p.id]);
                                } else {
                                  setSelectedObserverIds(selectedObserverIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded text-primary-700 w-3.5 h-3.5"
                            />
                            <span className="text-xs text-slate-800">{p.name} ({p.jobTitle})</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TIME & PRIORITY */}
            {step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="اولویت انجام" required>
                    <SelectInput
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                      options={[
                        { value: 'urgent', label: 'فوری (اقدام بی‌درنگ)' },
                        { value: 'high', label: 'بالا (حداکثر ۲۴ ساعت)' },
                        { value: 'normal', label: 'عادی (روال استاندارد)' },
                        { value: 'low', label: 'پایین (فرصت اداری)' },
                      ]}
                    />
                  </FormField>

                  <FormField label="تاریخ مهلت انجام (سررسید)" required>
                    <TextInput
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="۱۴۰۴/۰۶/۲۵"
                    />
                  </FormField>

                  <FormField label="ساعت سررسید">
                    <TextInput
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      placeholder="۱۶:۰۰"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="تنظیمات یادآوری سیستم">
                    <SelectInput
                      value={reminderPreference}
                      onChange={(e) => setReminderPreference(e.target.value as any)}
                      options={[
                        { value: '2h_before', label: '۲ ساعت قبل از موعد سررسید' },
                        { value: '24h_before', label: '۲۴ ساعت قبل از موعد سررسید' },
                        { value: 'daily', label: 'یادآوری روزانه تا زمان تکمیل' },
                        { value: 'none', label: 'بدون هشدار دوره‌ای' },
                      ]}
                    />
                  </FormField>

                  <FormField label="دامنه رویت کار">
                    <SelectInput
                      value={visibilityScope}
                      onChange={(e) => setVisibilityScope(e.target.value as any)}
                      options={[
                        { value: 'unit', label: 'واحد سازمانی مربوطه (توصیه سیستم)' },
                        { value: 'self_participants', label: 'فقط طرفین اقدام و مشارکت‌کنندگان' },
                        { value: 'organization', label: 'عمومی در سطح سازمان' },
                      ]}
                    />
                  </FormField>
                </div>

                <FormField
                  label="دستورالعمل / پیام مدیر به همکار (اختیاری)"
                  hint="این پیام مستقیماً در بالای شناسنامه کار برای مجری نمایش داده می‌شود."
                >
                  <TextareaInput
                    value={managerInstruction}
                    onChange={(e) => setManagerInstruction(e.target.value)}
                    placeholder="مثال: لطفاً برگه باسکول تأمین‌کننده را با سامانه توزین تطبیق دهید و در صورت اختلاف بیش از ۵۰ کیلوگرم بلافاصله گزارش نمایید."
                    rows={3}
                  />
                </FormField>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs leading-relaxed">
                  لطفاً خلاصه اطلاعات کار را بازبینی نمایید. پس از فشردن دکمه واگذاری، کار بلافاصله در کارتابل «اقدام من» مجری
                  و تب «در انتظار دیگران» برای شما ثبت می‌شود.
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-sm">{taskTitle}</div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={priority} />
                      <Badge variant="primary">{workItemType}</Badge>
                    </div>
                  </div>

                  {selectedRepoRecord && (
                    <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>سند متصل: {selectedRepoRecord.code} — {selectedRepoRecord.title}</span>
                    </div>
                  )}

                  {expectedOutcome && (
                    <div className="bg-amber-50/70 p-3 rounded border border-amber-100 text-amber-950">
                      <span className="font-bold">معیار تکمیل (DoD): </span>
                      <span>{expectedOutcome}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-700">صاحب کار (پاسخگو): </span>
                      <span className="font-semibold text-slate-900">{selectedOwner.name} ({selectedOwner.jobTitle})</span>
                    </div>
                    <div>
                      <span className="text-slate-700">مجری اقدام‌کننده کنونی: </span>
                      <span className="font-bold text-primary-700">{selectedAssignee.name}</span>
                    </div>
                    {selectedApprover && (
                      <div>
                        <span className="text-slate-700">تأییدکننده نهایی: </span>
                        <span className="font-semibold text-amber-800">{selectedApprover.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-700">مهلت انجام: </span>
                      <span className="font-semibold text-slate-900">{dueDate} {dueTime ? `ساعت ${dueTime}` : ''}</span>
                    </div>
                  </div>

                  {managerInstruction && (
                    <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-bold">دستورالعمل: </span>
                      <span>{managerInstruction}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FOOTER CONTROLS */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                >
                  مرحله قبل
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  انصراف
                </Button>
              )}

              {step < 4 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  rightIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  مرحله بعد
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAssign}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  واگذاری و درج در کارتابل
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
