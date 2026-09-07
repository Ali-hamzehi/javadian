import { PaymentSchedule, DueBadge, getPaymentSchedule, daysUntilDue } from '../components/design-system/PaymentSchedule';
import { parseFinancialInput, validRials } from '../utils/financial';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardBody } from '../components/design-system/EnterpriseCard';
import { MetricStrip, ViewSwitcher, AmountInWords } from '../components/design-system/WorkspaceTools';
import { EmptyState } from '../components/design-system/SystemStates';
import { usePayments } from '../runtime/workflow';
import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Building2, User, ShieldCheck, ShieldAlert, Eye, Copy, Lock, CheckCircle2, AlertTriangle, Clock, ChevronRight, Filter, Paperclip, Check, Plus, Sliders, Shield, RotateCcw } from 'lucide-react';
import {
  PaymentRequestRecord,
  PaymentRequestStatus,
  PaymentCategory,
  PaymentContextType,
  FinancialIntegrationStatus,
  MockPersona,
  Person,
  OperationalRecord,
} from '../types';
import { mockRepository } from '../runtime/workflow';
import { MOCK_PAYMENT_REQUESTS } from '../data/mockSupplyLogisticsData';
import {
  PAYMENT_CATEGORIES,
  ORG_PAYMENT_SCOPE_RULES,
  PAYMENT_STATUS_LIFECYCLE_META,
  PersonaPaymentScope,
  CategoryMeta,
  ScopeRuleItem,
} from '../data/mockPaymentConfig';
import {
  getDocumentPersonaPaymentScope,
  validatePaymentCreationScope,
  getDisplayPersonaName,
  adaptPersona,
  getPersonaDisplayName,
  stripRoleSampleSuffix,
} from '../runtime/documentBasedPersonas';
import { Button } from '../components/design-system/Button';
import { Drawer, ModalDialog } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import {
  toPersianDigits,
  formatRials,
  numberToPersianWords,
  formatRialsWithWords,
} from '../utils/formatters';

interface PaymentRequestsViewProps {
  activePersona: MockPersona;
  selectedRecordId?: string;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const PaymentRequestsView: React.FC<PaymentRequestsViewProps> = ({
  activePersona,
  selectedRecordId,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [largeOnly, setLargeOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  // Primary State
  const [payments, setPayments] = usePayments();
  const [selectedRecord, setSelectedRecord] = useState<PaymentRequestRecord | null>(null);
  useEffect(() => { if (selectedRecordId) setSelectedRecord(payments.find(r => r.id === selectedRecordId || r.code === selectedRecordId) || null); }, [selectedRecordId, payments]);

  useEffect(() => { setSelectedRecord(previous => previous ? payments.find(p => p.id === previous.id) || null : null); }, [payments]);
  useEffect(() => { setRevealedIds(new Set()); setSelectedRecord(null); }, [activePersona.id]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically resolve persona's payment scope based on initial evidence
  const userScope: PersonaPaymentScope = getDocumentPersonaPaymentScope(activePersona);
  const adaptedCurrentPersona = adaptPersona(activePersona);

  // Organization Scope Rules Modal State
  const [isScopeRulesModalOpen, setIsScopeRulesModalOpen] = useState(false);

  // Security Reveal / Audit Warning Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Manual External Execution Modal State (PAID requirements: executor, time, reference, evidence)
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [executionRefCode, setExecutionRefCode] = useState('');
  const [executionDateJalali, setExecutionDateJalali] = useState('۱۴۰۴/۰۶/۱۲');
  const [executionTime, setExecutionTime] = useState('۱۲:۳۰');
  const [executionMethod, setExecutionMethod] = useState<'ساتنا' | 'پایا' | 'کارت به کارت' | 'چک تضمینی' | 'نقدی تنخواه'>('ساتنا');
  const [evidenceReceiptName, setEvidenceReceiptName] = useState('رسید انتقال وجه ساتنا / پایا بانک ملی');

  // Return / Rejection Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // New Payment Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDateJalali, setNewDateJalali] = useState('۱۴۰۴/۰۶/۱۲');
  const [newPurpose, setNewPurpose] = useState('');
  const [newAmountRials, setNewAmountRials] = useState('25000000');
  const [newContextType, setNewContextType] = useState<PaymentContextType>(
    userScope.allowedContexts[0] || 'company'
  );
  const [newCategory, setNewCategory] = useState<PaymentCategory>(
    userScope.allowedCategories[0] || 'supplier'
  );
  const [newBeneficiaryType, setNewBeneficiaryType] = useState<'company' | 'person' | 'institution'>('company');
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newNationalCode, setNewNationalCode] = useState('۱۰۸۶۱۴۴۴۹۰۱');
  const [newBankName, setNewBankName] = useState('بانک ملی ایران');
  const [newIban, setNewIban] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newOperationalContextType, setNewOperationalContextType] = useState<'none' | 'supplier' | 'supply_request' | 'logistics_operation' | 'sales_order'>('none');
  const [newOperationalRef, setNewOperationalRef] = useState('');
  const [newAttachmentTitle, setNewAttachmentTitle] = useState('');

  // Update category when modal opens or context changes
  const handleOpenCreateModal = () => {
    if (!userScope.canCreate) {
      addToast({
        id: `scope-err-${Date.now()}`,
        title: 'عدم دسترسی ثبت پرداخت',
        description: userScope.restrictionReason || 'این نقش سازمانی مجوز ثبت درخواست پرداخت ندارد.',
        tone: 'danger',
      });
      return;
    }
    const defaultCat = userScope.allowedCategories[0] || 'supplier';
    const defaultCtx = userScope.allowedContexts[0] || 'company';
    setNewCategory(defaultCat);
    setNewContextType(defaultCtx);
    setNewBeneficiaryType(defaultCtx === 'personal' ? 'person' : 'company');
    setNewPurpose('');
    setNewBeneficiaryName('');
    setNewIban('');
    setNewCardNumber('');
    setNewAccountNumber('');
    setNewOperationalRef('');
    setNewAttachmentTitle('');
    setIsCreateModalOpen(true);
  };

  // Filter Logic
  const filteredPayments = payments.filter((p) => {
    if (mineOnly && (p.approver.id !== activePersona.id || !['submitted', 'under_review', 'pending'].includes(p.status))) return false;
    const due = daysUntilDue(getPaymentSchedule(p.id)?.due || '');
    if (dueOnly && (due === null || due > 3 || ['paid', 'closed', 'cancelled', 'rejected'].includes(p.status))) return false;
    if (largeOnly && p.amountRials <= 1_000_000_000) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (contextFilter !== 'all' && p.contextType !== contextFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = p.code.toLowerCase().includes(q);
      const matchPurpose = p.purpose.toLowerCase().includes(q);
      const matchBeneficiary = p.beneficiary.name.toLowerCase().includes(q);
      const matchRequester = p.requester.name.toLowerCase().includes(q);
      const matchApprover = p.approver.name.toLowerCase().includes(q);
      if (!matchCode && !matchPurpose && !matchBeneficiary && !matchRequester && !matchApprover) {
        return false;
      }
    }
    return true;
  });

  // Calculate "Who has the ball" and "Next action"
  const getBallAndNextAction = (p: PaymentRequestRecord) => {
    const meta = PAYMENT_STATUS_LIFECYCLE_META[p.status] || PAYMENT_STATUS_LIFECYCLE_META.draft;
    let holder = meta.defaultBallHolder;
    let action = meta.defaultNextAction;

    if (p.status === 'submitted' || p.status === 'under_review') {
      holder = `${getDisplayPersonaName(p.reviewer)} (${p.reviewer.role})`;
      action = 'تطبیق فاکتور و کد اقتصادی در سامانه مؤدیان و تأیید کنترل حسابداری';
    } else if (p.status === 'approved') {
      holder = `${getDisplayPersonaName(p.approver)} (${p.approver.role}) / خزانه‌داری`;
      action = 'صدور دستور تخصیص حساب و انتقال به صف پرداخت خزانه‌داری';
    } else if (p.status === 'ready' || p.status === 'ready_for_payment') {
      holder = `${getDisplayPersonaName(p.executor)} (${p.executor.role})`;
      action = 'اجرای حواله ساتنا/پایا در اینترنت‌بانک و بارگذاری فیش بانکی';
    } else if (p.status === 'returned') {
      holder = `${getDisplayPersonaName(p.requester)} (متقاضی اولیه)`;
      action = 'اصلاح اسناد و بارگذاری مجدد تصویر خوانای بارنامه / پیش‌فاکتور';
    } else if (p.status === 'paid') {
      holder = 'سیستم مالی و حسابداری (در انتظار وب‌سرویس)';
      action = 'ثبت قطعی در سیستم مالی پس از راه‌اندازی وب‌سرویس پارسینا';
    } else if (p.status === 'blocked') {
      holder = 'مدیر ارشد مالی و نظارت بر رعایت مقررات';
      action = 'رفع تضاد منافع ناشی از خود-تأییدی و تعیین تأییدکننده مستقل';
    }

    return { holder, action };
  };

  // Status Badge
  const renderStatusBadge = (status: PaymentRequestStatus) => {
    const meta = PAYMENT_STATUS_LIFECYCLE_META[status] || PAYMENT_STATUS_LIFECYCLE_META.draft;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-caption font-bold border ${meta.badgeClass}`}
      >
        {status === 'paid' && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
        {status === 'blocked' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
        {status === 'returned' && <RotateCcw className="w-3 h-3 text-orange-600" />}
        {meta.label}
      </span>
    );
  };

  // Category Badge
  const renderCategoryBadge = (cat: PaymentCategory) => {
    const found = PAYMENT_CATEGORIES.find((c) => c.id === cat);
    if (!found) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {cat}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-medium border ${found.colorClass}`}
        title={found.description}
      >
        {found.shortLabel}
      </span>
    );
  };

  // Financial Integration Badge (Strictly separate from business status)
  const renderFinancialIntegrationBadge = (finStatus?: FinancialIntegrationStatus) => {
    switch (finStatus) {
      case 'dispatch_success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ثبت شده در سیستم مالی
          </span>
        );
      case 'pending_dispatch':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            در انتظار ارسال به مالی
          </span>
        );
      case 'connection_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            خطای اتصال مالی
          </span>
        );
      case 'not_registered':
      default:
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-600 border border-slate-200"
            title="این بخش نمایشی است و هنوز به بانک یا پارسینا متصل نیست."
          >
            <Building2 className="w-3 h-3 text-slate-500" />
            ثبت نشده در سیستم مالی
          </span>
        );
    }
  };

  // Check if active persona is requester of the selected record (Self-approval guard)
  const isRequesterOfSelected = selectedRecord
    ? selectedRecord.requester.id === activePersona.id ||
      selectedRecord.requester.name === activePersona.name
    : false;

  // Check if active persona is authorized to view unmasked personal banking data
  const isAuthorizedToViewPersonal = (p: PaymentRequestRecord) => {
    // 1. Finance team / Admin can view
    if (userScope.canViewUnmaskedPersonalData) return true;
    // 2. The owner/requester themselves can view
    if (p.requester.id === activePersona.id || p.requester.name === activePersona.name) return true;
    return false;
  };

  // Handle Security Reveal Request
  const handleRequestReveal = () => {
    if (!selectedRecord) return;
    // If it's a personal context and user is unauthorized, block it
    if (selectedRecord.contextType === 'personal' && !isAuthorizedToViewPersonal(selectedRecord)) {
      addToast({
        id: `unauth-reveal-${Date.now()}`,
        title: 'عدم دسترسی به اطلاعات شخصی',
        description: 'حفاظت از حریم داده‌های بانکی: اطلاعات حساب و کارت شخصی افراد صرفاً برای کارشناسان مالی و حسابرسی قابل افشا است.',
        tone: 'danger',
      });
      return;
    }
    setIsAuditModalOpen(true);
  };

  // Confirm Security Reveal
  const handleConfirmReveal = () => {
    if (!selectedRecord) return;

    const newRevealed = new Set(revealedIds);
    newRevealed.add(selectedRecord.id);
    setRevealedIds(newRevealed);
    setIsAuditModalOpen(false);

    const auditEntry = {
      id: `aud-${Date.now()}`,
      timestampJalali: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۲:۴۵',
      actorName: getPersonaDisplayName(activePersona),
      action: 'افشای اطلاعات مالی و بانکی',
      details: `کاربر ${getPersonaDisplayName(activePersona)} با موافقت امنیتی، شماره شبا و حساب کامل را مشاهده کرد.`,
    };

    const updated = payments.map((p) =>
      p.id === selectedRecord.id
        ? { ...p, auditLogs: [...p.auditLogs, auditEntry] }
        : p
    );
    setPayments(updated);
    setSelectedRecord({
      ...selectedRecord,
      auditLogs: [...selectedRecord.auditLogs, auditEntry],
    });

    addToast({
      id: `toast-audit-${Date.now()}`,
      title: 'افشای اطلاعات در لاگ حسابرسی ثبت شد',
      description: 'شماره شبا و حساب برای این نشست آشکار گردید و رویداد در دفتر وقایع امنیتی ضبط شد.',
      tone: 'info',
    });
  };

  // Copy with Toast
  const handleCopyValue = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      id: `copy-${Date.now()}`,
      title: `${label} کپی شد`,
      description: `${text} در حافظه کلیپ‌بورد ذخیره گردید.`,
      tone: 'success',
    });
  };

  // Workflow Action: Approve
  const handleApprove = () => {
    if (!selectedRecord) return;

    // Strict Self-Approval Gate
    if (isRequesterOfSelected) {
      addToast({
        id: `sod-block-${Date.now()}`,
        title: 'خطای تفکیک وظایف (تأیید درخواست خودتان مجاز نیست)',
        description: 'امکان تأیید پرونده پرداختی توسط متقاضی اولیه وجود ندارد. این پرونده باید توسط مدیر مالی دیگر تأیید شود.',
        tone: 'danger',
      });
      return;
    }

    if (!userScope.canApprove || selectedRecord.approver.id !== activePersona.id) {
      addToast({
        id: `perm-err-${Date.now()}`,
        title: 'عدم دسترسی به تأیید پرداخت',
        description: 'این نقش سازمانی فاقد صلاحیت تأیید پرداخت‌های مالی است.',
        tone: 'danger',
      });
      return;
    }

    const auditEntry = {
      id: `aud-appr-${Date.now()}`,
      timestampJalali: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۳:۰۰',
      actorName: getPersonaDisplayName(activePersona),
      action: 'تأیید درخواست پرداخت',
      details: `درخواست به مبلغ ${formatRials(selectedRecord.amountRials)} توسط ${getPersonaDisplayName(activePersona)} تأیید و آماده تخصیص خزانه‌داری شد.`,
    };

    const updatedRecord: PaymentRequestRecord = {
      ...selectedRecord,
      status: 'approved',
      statusNote: `تأیید شد توسط ${getPersonaDisplayName(activePersona)}؛ ارسال به صف پرداخت خزانه‌داری`,
      auditLogs: [...selectedRecord.auditLogs, auditEntry],
    };

    setPayments(payments.map((p) => (p.id === selectedRecord.id ? updatedRecord : p)));
    setSelectedRecord(updatedRecord);

    addToast({
      id: `appr-succ-${Date.now()}`,
      title: 'درخواست پرداخت تأیید شد',
      description: `سند ${selectedRecord.code} با موفقیت تأیید گردید و در صف اجرای خزانه‌داری قرار گرفت.`,
      tone: 'success',
    });
  };

  // Workflow Action: Return for Correction
  const handleConfirmReturn = () => {
    if (!selectedRecord || !returnReason.trim() || !userScope.canApprove || selectedRecord.approver.id !== activePersona.id || selectedRecord.requester.id === activePersona.id) return;

    const auditEntry = {
      id: `aud-ret-${Date.now()}`,
      timestampJalali: '۱۴۰۴/۰۶/۱۲ - ساعت ۱۳:۱۵',
      actorName: activePersona.name,
      action: 'عودت درخواست جهت رفع نقص',
      details: `علت عودت: ${returnReason}`,
    };

    const updatedRecord: PaymentRequestRecord = {
      ...selectedRecord,
      status: 'returned',
      statusNote: `عودت داده شد: ${returnReason}`,
      auditLogs: [...selectedRecord.auditLogs, auditEntry],
    };

    setPayments(payments.map((p) => (p.id === selectedRecord.id ? updatedRecord : p)));
    setSelectedRecord(updatedRecord);
    setIsReturnModalOpen(false);
    setReturnReason('');

    addToast({
      id: `ret-succ-${Date.now()}`,
      title: 'درخواست عودت داده شد',
      description: `پرونده به متقاضی اولیه (${selectedRecord.requester.name}) جهت رفع نقص مدارک بازگردانده شد.`,
      tone: 'warning',
    });
  };

  // Workflow Action: Final Manual Execution (PAID status requires executor, time, reference)
  const handleManualExecution = () => {
    if (!selectedRecord) return;

    // Strict Self-Execution Gate: Requester cannot execute their own payment
    if (isRequesterOfSelected) {
      addToast({
        id: `exec-self-block-${Date.now()}`,
        title: 'منع خود-تسویه (Self-Execution Blocked)',
        description: 'امکان اجرای تسویه بانکی توسط متقاضی اولیه وجود ندارد. اجرای پرداخت باید توسط خزانه‌دار مستقل انجام شود.',
        tone: 'danger',
      });
      return;
    }

    if (!userScope.canExecute) {
      addToast({
        id: `exec-perm-err-${Date.now()}`,
        title: 'عدم دسترسی خزانه‌داری',
        description: 'این نقش سازمانی صلاحیت ثبت تسویه مالی و خزانه‌داری را ندارد.',
        tone: 'danger',
      });
      return;
    }

    if (!executionRefCode.trim()) {
      addToast({
        id: `err-ref-${Date.now()}`,
        title: 'شماره پیگیری الزامی است',
        description: 'ثبت وضعیت تسویه (PAID) طبق آیین‌نامه منوط به درج شماره پیگیری یا ارجاع معتبر بانکی است.',
        tone: 'danger',
      });
      return;
    }

    const executionData = {
      executor: {
        id: activePersona.id,
        name: getPersonaDisplayName(activePersona),
        role: stripRoleSampleSuffix(activePersona.jobTitle),
        department: activePersona.department,
      },
      executedAtJalali: executionDateJalali || '۱۴۰۴/۰۶/۱۲',
      executedAtTime: executionTime || '۱۲:۳۰',
      referenceCode: executionRefCode.trim(),
      evidenceReceiptUrl: '#',
      evidenceReceiptName: evidenceReceiptName.trim() || 'رسید الکترونیک حواله بانکی',
      paymentMethod: executionMethod,
    };

    const auditEntry = {
      id: `aud-exec-${Date.now()}`,
      timestampJalali: `${executionDateJalali} - ساعت ${executionTime}`,
      actorName: activePersona.name,
      action: 'ثبت تسویه و پرداخت قطعی (PAID)',
      details: `پرداخت با روش ${executionMethod} و شماره پیگیری ${executionRefCode} تسویه گردید. سند طبق ضوابط مالیاتی قفل شد.`,
    };

    const updatedRecord: PaymentRequestRecord = {
      ...selectedRecord,
      status: 'paid',
      statusNote: `تسویه شد. شماره پیگیری بانکی: ${executionRefCode} (${executionMethod})`,
      manualExecution: executionData,
      auditLogs: [...selectedRecord.auditLogs, auditEntry],
    };

    setPayments(payments.map((p) => (p.id === selectedRecord.id ? updatedRecord : p)));
    setSelectedRecord(updatedRecord);
    setIsExecutionModalOpen(false);

    // Sync linked WorkItem in mockRepository
    const linkedWorkItem = mockRepository
      .getAllRecords()
      .find(
        (r) =>
          r.linkedBusinessRecord?.id === selectedRecord.id ||
          r.code === `TSK-${selectedRecord.code}`
      );
    if (linkedWorkItem) {
      linkedWorkItem.status = 'completed';
      linkedWorkItem.statusLabel = 'تکمیل‌شده — حواله بانکی اجرا شد';
      linkedWorkItem.currentAssignee = {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس ثبت دفاتر و تطبیق اسناد مالی',
        department: 'امور مالی و خزانه‌داری',
      };
      linkedWorkItem.currentOwner = {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس ثبت دفاتر و تطبیق اسناد مالی',
        department: 'امور مالی و خزانه‌داری',
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      };
      linkedWorkItem.nextAction = {
        title: 'بایگانی اسناد تسویه و تطبیق صورت‌حساب بانکی',
        responsibleRole: 'کارشناس ثبت دفاتر و تطبیق اسناد مالی',
        responsiblePersonName: 'کارشناس مالی — نقش نمونه',
        dueJalali: '۱۴۰۴/۰۶/۱۴',
        suggestedAction: 'review',
      };
      mockRepository.updateRecord(linkedWorkItem);
    }

    addToast({
      id: `paid-${Date.now()}`,
      title: 'تسویه پرداخت ثبت و سند قفل شد',
      description: `سند ${selectedRecord.code} با شماره پیگیری ${executionRefCode} تسویه شد. بر اساس ضوابط ضدپولشویی، این سند غیرقابل حذف است.`,
      tone: 'success',
    });
  };

  // Create New Payment Request with Scope Validation
  const handleCreatePaymentRequest = () => {
    if (!newPurpose.trim() || !newBeneficiaryName.trim()) {
      addToast({
        id: `err-req-${Date.now()}`,
        title: 'اطلاعات ناقص',
        description: 'لطفاً بابت پرداخت و نام ذینفع را وارد نمایید.',
        tone: 'danger',
      });
      return;
    }

    // Validate category against active persona's allowed categories
    if (!userScope.allowedCategories.includes(newCategory)) {
      addToast({
        id: `err-cat-scope-${Date.now()}`,
        title: 'عدم انطباق با حدود اختیارات',
        description: `نقش سازمانی شما مجاز به ثبت سرفصل «${newCategory}» نیست. فقط سرفصل‌های مجاز را انتخاب نمایید.`,
        tone: 'danger',
      });
      return;
    }

    const numAmount = parseFinancialInput(newAmountRials);
    if (!validRials(numAmount)) { addToast('مبلغ باید عدد صحیح مثبت و معتبر به ریال باشد.', 'danger'); return; }
    const wordsObj = formatRialsWithWords(numAmount);
    const newCode = `PAY-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const fullIbanVal = newIban.trim();
    const maskedIbanVal = fullIbanVal ? `${fullIbanVal.slice(0, 4)} •••• •••• •••• ${fullIbanVal.slice(-4)}` : 'ثبت نشده';

    const fullCardVal = newCardNumber.trim() ? newCardNumber.trim() : undefined;
    const maskedCardVal = fullCardVal
      ? `${fullCardVal.slice(0, 4)} •••• •••• ${fullCardVal.slice(-4)}`
      : undefined;

    const fullAccountVal = newAccountNumber.trim() ? newAccountNumber.trim() : undefined;
    const maskedAccountVal = fullAccountVal
      ? `${fullAccountVal.slice(0, 4)}••••${fullAccountVal.slice(-4)}`
      : undefined;

    const attachmentsList = [];
    if (newAttachmentTitle.trim()) {
      attachmentsList.push({
        id: `att-${Date.now()}`,
        title: newAttachmentTitle.trim(),
        url: '#',
        uploadedAtJalali: newDateJalali,
      });
    }

    const linkedRecs: Record<string, string> = {};
    if (newOperationalRef.trim()) {
      if (newOperationalContextType === 'supply_request') linkedRecs.supplyRequestId = newOperationalRef.trim();
      else if (newOperationalContextType === 'logistics_operation') linkedRecs.logisticsId = newOperationalRef.trim();
      else if (newOperationalContextType === 'sales_order') linkedRecs.salesOrderId = newOperationalRef.trim();
      else linkedRecs.generalNote = newOperationalRef.trim();
    }

    const regionVal = activePersona.id === 'p-field-sales' ? 'قم' : undefined;
    const scopeCheck = validatePaymentCreationScope(activePersona.id, newCategory, regionVal);
    if (!scopeCheck.allowed) {
      addToast({
        id: `scope-err-${Date.now()}`,
        title: 'عدم تطابق با محدوده دسترسی مستند',
        description: scopeCheck.reason || 'ثبت پرداخت در این سرفصل مجاز نیست.',
        tone: 'danger',
      });
      return;
    }

    const newRecord: PaymentRequestRecord = {
      id: `pay-${Date.now()}`,
      code: newCode,
      dateJalali: newDateJalali,
      contextType: newContextType,
      category: newCategory,
      amountRials: numAmount,
      amountInWordsPersian: wordsObj.wordsRials,
      purpose: newPurpose.trim(),
      beneficiary: {
        name: newBeneficiaryName.trim(),
        nationalOrEconomicCode: newNationalCode.trim() || '۱۰۸۶۱۴۴۴۹۰۱',
        bankName: newBankName.trim() || 'بانک ملی ایران',
        maskedIban: maskedIbanVal,
        fullIban: fullIbanVal,
        maskedCard: maskedCardVal,
        fullCard: fullCardVal,
        maskedAccount: maskedAccountVal,
        fullAccount: fullAccountVal,
        beneficiaryType: newBeneficiaryType,
      },
      requester: {
        id: activePersona.id,
        name: adaptedCurrentPersona.name,
        role: adaptedCurrentPersona.jobTitle,
        department: adaptedCurrentPersona.department,
      },
      reviewer: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس حسابداری و رسیدگی اسناد',
        department: 'امور مالی و خزانه‌داری',
      },
      approver: {
        id: 'p-fin-dir',
        name: 'تأییدکننده مالی — نقش نمونه',
        role: 'تأییدکننده مالی و امضادار مجاز',
        department: 'مدیریت مالی',
      },
      executor: {
        id: 'p-fin-exec',
        name: 'مجری خزانه‌داری — نقش نمونه',
        role: 'کارشناس امور بانکی و خزانه‌داری',
        department: 'امور مالی و خزانه‌داری',
      },
      accountingRecorder: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس ثبت دفاتر و تطبیق اسناد مالی',
        department: 'امور مالی',
      },
      status: 'submitted',
      statusNote: 'درخواست توسط متقاضی ثبت و به واحد حسابداری ارسال شد.',
      financialIntegrationStatus: 'not_registered',
      isSelfApprovalBlocked: false,
      attachments: attachmentsList,
      linkedRecords: linkedRecs,
      auditLogs: [
        {
          id: `aud-create-${Date.now()}`,
          timestampJalali: `${newDateJalali} - ساعت ۱۲:۰۰`,
          actorName: adaptedCurrentPersona.name,
          action: 'ثبت دستور پرداخت جدید',
          details: `درخواست به مبلغ ${formatRials(numAmount)} (${wordsObj.wordsRials}) در سرفصل ${newCategory} ایجاد و به حسابداری ارجاع شد.`,
        },
      ],
      createdAtJalali: newDateJalali,
    };

    // Create WorkItem in mockRepository
    const workItemId = `rec-pay-${Date.now()}`;
    const approvalWorkItem: OperationalRecord = {
      id: workItemId,
      code: `TSK-${newCode}`,
      title: `رسیدگی و تطبیق حسابداری درخواست پرداخت ${newCode}`,
      type: 'approval',
      typeLabel: 'تأییدیه مالی',
      itemSummary: `درخواست پرداخت مبلغ ${formatRials(numAmount)} بابت ${newPurpose.trim()} به ذینفع ${newBeneficiaryName.trim()}`,
      creator: {
        id: activePersona.id,
        name: adaptedCurrentPersona.name,
        role: adaptedCurrentPersona.jobTitle,
        department: adaptedCurrentPersona.department,
      },
      owner: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس حسابداری و رسیدگی اسناد',
        department: 'امور مالی و خزانه‌داری',
      },
      currentAssignee: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس حسابداری و رسیدگی اسناد',
        department: 'امور مالی و خزانه‌داری',
      },
      currentOwner: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی — نقش نمونه',
        role: 'کارشناس حسابداری و رسیدگی اسناد',
        department: 'امور مالی و خزانه‌داری',
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      status: 'in_progress',
      statusLabel: 'در انتظار رسیدگی حسابداری',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      createdAtJalali: newDateJalali,
      statusSinceJalali: 'هم‌اکنون',
      unit: 'امور مالی و خزانه‌داری',
      tags: ['پرداخت', 'مالی', newCategory, newCode],
      blocker: null,
      nextAction: {
        title: 'تطبیق فاکتور و کد اقتصادی در سامانه مؤدیان و تأیید کنترل حسابداری',
        responsibleRole: 'کارشناس حسابداری و رسیدگی اسناد',
        responsiblePersonName: 'کارشناس مالی — نقش نمونه',
        dueJalali: '۱۴۰۴/۰۶/۱۳',
        suggestedAction: 'review',
      },
      linkedBusinessRecord: {
        id: newRecord.id,
        code: newRecord.code,
        title: `درخواست پرداخت ${newRecord.code} — ${newBeneficiaryName.trim()}`,
        category: 'payment_request',
        categoryLabel: 'درخواست پرداخت',
        currentStatus: 'ارسال به حسابداری',
        summary: newPurpose.trim(),
      },
      relatedRecords: [
        {
          id: newRecord.id,
          code: newRecord.code,
          title: `درخواست پرداخت ${newRecord.code}`,
          typeLabel: 'درخواست پرداخت',
          statusLabel: 'ارسال به حسابداری',
        },
      ],
      timeline: [
        {
          id: `tl-p-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: {
            id: activePersona.id,
            name: getPersonaDisplayName(activePersona),
            role: stripRoleSampleSuffix(activePersona.jobTitle),
            department: activePersona.department,
          },
          title: 'ثبت و ارسال درخواست پرداخت به حسابداری',
          note: 'ایجاد کارتابل تطبیق اسناد مالی',
          type: 'creation',
        },
      ],
      comments: [],
      attachments: [],
    };
    mockRepository.createRecord(approvalWorkItem);

    setPayments([newRecord, ...payments]);
    setIsCreateModalOpen(false);
    setSelectedRecord(newRecord);

    addToast({
      id: `toast-new-${Date.now()}`,
      title: 'درخواست پرداخت صادر شد',
      description: `درخواست ${newCode} به مبلغ ${formatRials(numAmount)} ثبت شد و به کارتابل امور مالی ارسال گردید.`,
      tone: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* View Header with Persona Scope Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-none">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-700" />
              درخواست‌های پرداخت و تسویه مالی
            </h1>
            <span className="text-caption bg-primary-50 text-primary-800 font-bold px-2 py-0.5 rounded border border-primary-200">
              واحد مالی و خزانه‌داری
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            تفکیک سرفصل‌های حقوقی و حقیقی، کنترل سلسله‌مراتب تأیید مالی، منع خود-تأییدی، صیانت از داده‌های بانکی و تسویه دستی خزانه‌داری
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Organization Scope Matrix Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScopeRulesModalOpen(true)}
            className="flex items-center gap-2 text-slate-700 hover:text-primary-700"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            ماتریس حدود اختیارات سازمانی
          </Button>

          {/* Create Button with Scope Gate */}
          {userScope.canCreate ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ثبت دستور پرداخت جدید
            </Button>
          ) : (
            <div
              className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1"
              title={userScope.restrictionReason}
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              {userScope.scopeBadgeText}
            </div>
          )}
        </div>
      </div>

      {/* Active Persona Scope Indicator Banner */}
      <div className="p-3 bg-primary-50/70 border border-primary-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-primary-950">
          <Shield className="w-4 h-4 text-primary-700 shrink-0" />
          <span>حوزه اختیارات کاربر جاری ({getPersonaDisplayName(activePersona)}):</span>
          <strong className="bg-white px-2 py-0.5 rounded border border-primary-300 font-bold text-primary-800">
            {userScope.scopeBadgeText}
          </strong>
          {userScope.ruleTag === 'نیازمند_تنظیم_سازمان' && (
            <span className="text-caption bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
              نیازمند تنظیم سازمان
            </span>
          )}
        </div>

        {userScope.isRestricted && userScope.restrictionReason && (
          <div className="text-caption text-primary-800 font-medium">
            {userScope.restrictionReason}
          </div>
        )}
      </div>

      {/* Financial Integration Notice Banner (Explicit separation from business status) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-slate-700 shadow-none">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-700 font-medium">
            این بخش نمایشی است و هنوز به بانک یا پارسینا متصل نیست (ثبت نشده در سیستم مالی).
          </span>
        </div>
        <span className="text-caption text-slate-500 shrink-0">
          ثبت نتیجه پرداخت به صورت دستی انجام می‌شود
        </span>
      </div>

      {/* Filters: Context Type, Search, Category & Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        {/* Context Type Selector (Company / Personal) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium ml-1">بستر حساب:</span>
            {[
              { id: 'all', label: 'همه بسترهای مالی' },
              { id: 'company', label: 'حقوقی / شرکتی (Company)', icon: Building2 },
              { id: 'personal', label: 'حقیقی / شخصی و تنخواه (Personal)', icon: User },
            ].map((ctx) => {
              const Icon = ctx.icon;
              return (
                <button
                  key={ctx.id}
                  onClick={() => setContextFilter(ctx.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    contextFilter === ctx.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {ctx.label}
                </button>
              );
            })}
          </div>

          <span className="text-caption text-slate-500">
            تعداد اسناد: <strong className="text-slate-800 font-mono">{toPersianDigits(filteredPayments.length)}</strong>
          </span>
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در کد دستور پرداخت، بابت، نام ذینفع، متقاضی یا مدیر مالی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">همه سرفصل‌ها</option>
              {PAYMENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="draft">پیش‌نویس اولیه</option>
              <option value="submitted">ارسال به حسابداری</option>
              <option value="under_review">رسیدگی حسابداری</option>
              <option value="approved">تأیید شده / آماده تخصیص</option>
              <option value="ready">آماده پرداخت خزانه‌داری</option>
              <option value="paid">تسویه شده (نهایی)</option>
              <option value="returned">عودت جهت رفع نقص</option>
              <option value="blocked">مسدود (خود-تأییدی)</option>
            </select>
          </div>
        </div>
      </div>

      <MetricStrip total={payments.length} pending={payments.filter(x => !['paid', 'closed', 'cancelled', 'rejected', 'completed'].includes(x.status)).length} amount={payments.reduce((sum, x) => sum + x.amountRials, 0)} />
      <div className="flex items-center justify-between gap-3 flex-wrap"><button type="button" aria-pressed={largeOnly} onClick={() => setLargeOnly(!largeOnly)} className={`px-4 py-2 rounded-full text-xs border ${largeOnly ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200'}`}>بالای ۱۰۰ میلیون تومان</button><button type="button" aria-pressed={dueOnly} onClick={() => setDueOnly(!dueOnly)} className="text-xs border rounded-full px-4 py-2">سررسید نزدیک و معوق</button><button type="button" aria-pressed={mineOnly} onClick={() => setMineOnly(!mineOnly)} className="text-xs border rounded-full px-4 py-2">منتظر تأیید من</button><ViewSwitcher value={viewMode} onChange={setViewMode} /></div>
      {viewMode === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPayments.length === 0 && <div className="col-span-full"><EmptyState title="فضا برای پرونده‌های تازه" description="فیلترها را تغییر دهید یا یک درخواست جدید ثبت کنید." actionText="پاک کردن فیلترها" onAction={() => { setLargeOnly(false); setDueOnly(false); setMineOnly(false); setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); setContextFilter('all'); }} /></div>}
        {filteredPayments.map(p => <EnterpriseCard key={p.id} isInteractive onClick={() => setSelectedRecord(p)} status="primary"><EnterpriseCardHeader title={p.purpose} code={p.code} /><EnterpriseCardBody><CurrencyAmount amountRials={p.amountRials} size="lg" /><p className="text-xs text-slate-600 mt-3">ذینفع: {p.beneficiary.name}</p><p className="text-xs text-slate-500 mt-1">مسئول اقدام: {getBallAndNextAction(p).holder}</p><div className="mt-3 text-xs text-slate-500">{renderStatusBadge(p.status)}<DueBadge id={p.id} settled={['paid', 'closed', 'cancelled', 'rejected'].includes(p.status)} /></div></EnterpriseCardBody></EnterpriseCard>)}
      </div>}
      {/* Main Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
        {/* Desktop Table */}
        <div className={viewMode === 'table' ? "hidden lg:block overflow-x-auto" : "hidden"}>
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">کد و بستر</th>
                <th className="p-3">سرفصل و بابت پرداخت</th>
                <th className="p-3">ذینفع و شماره حساب (ماسک‌شده)</th>
                <th className="p-3">مبلغ پرداختی</th>
                <th className="p-3">مسئول فعلی (در دست کیست؟)</th>
                <th className="p-3">اقدام بعدی مورد انتظار</th>
                <th className="p-3">وضعیت پرداخت</th>
                <th className="p-3">سیستم مالی</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    دستور پرداختی با شرایط جستجوی انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const { holder, action } = getBallAndNextAction(p);
                  const isSelf = p.requester.id === activePersona.id || p.requester.name === activePersona.name;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedRecord(p)}
                      className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                    >
                      {/* Code & Context */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-primary-700">{p.code}</div>
                        <div className="mt-1">
                          {p.contextType === 'company' ? (
                            <span className="inline-flex items-center gap-1 text-caption font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <Building2 className="w-3 h-3 text-slate-600" />
                              شرکتی
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-caption font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <User className="w-3 h-3 text-amber-600" />
                              شخصی / تنخواه
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Purpose */}
                      <td className="p-3">
                        <div className="mb-1">{renderCategoryBadge(p.category)}</div>
                        <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">{p.purpose}</div>
                      </td>

                      {/* Beneficiary & Masked Account */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{p.beneficiary.name}</div>
                        <div className="font-mono text-caption text-slate-500 mt-0.5 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>
                            {revealedIds.has(p.id) ? p.beneficiary.fullIban : p.beneficiary.maskedIban}
                          </span>
                        </div>
                      </td>

                      {/* Amount in Rials & Tomans */}
                      <td className="p-3">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          <CurrencyAmount amountRials={p.amountRials} />
                        </div>
                        <div className="text-caption text-slate-500 font-mono mt-0.5">
                          {formatRialsWithWords(p.amountRials).inTomans}
                        </div>
                      </td>

                      {/* Who has the ball */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 text-caption flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-700 inline-block" />
                          {holder}
                        </div>
                        {isSelf && (
                          <span className="inline-block mt-0.5 text-caption bg-slate-100 text-slate-600 px-1.5 rounded">
                            (ثبت‌شده توسط شما)
                          </span>
                        )}
                      </td>

                      {/* Next Action */}
                      <td className="p-3 max-w-xs">
                        <div className="text-caption text-slate-600 leading-snug line-clamp-2">
                          {action}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {renderStatusBadge(p.status)}
                        {p.isSelfApprovalBlocked && (
                          <div className="text-caption text-rose-700 font-bold mt-1">
                            ممنوعیت خودتأییدی
                          </div>
                        )}
                      </td>

                      {/* Integration Status */}
                      <td className="p-3">
                        {renderFinancialIntegrationBadge(p.financialIntegrationStatus)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedRecord(p);
                          }}
                        >
                          بررسی پرونده
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </AdaptiveTable>
        </div>

        {/* Mobile / Tablet Cards */}
        <div className={viewMode === 'table' ? "lg:hidden divide-y divide-slate-100" : "hidden"}>
          {filteredPayments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">درخواستی یافت نشد.</div>
          ) : (
            filteredPayments.map((p) => {
              const { holder, action } = getBallAndNextAction(p);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedRecord(p)}
                  className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-700">{p.code}</span>
                      {p.contextType === 'company' ? (
                        <span className="text-caption bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">شرکتی</span>
                      ) : (
                        <span className="text-caption bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">شخصی / تنخواه</span>
                      )}
                      {renderCategoryBadge(p.category)}
                    </div>
                    {renderStatusBadge(p.status)}
                  </div>

                  <div className="font-bold text-slate-900 text-xs">{p.purpose}</div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-caption">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ذینفع:</span>
                      <span className="font-semibold text-slate-800">{p.beneficiary.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">مبلغ پرداختی:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        <CurrencyAmount amountRials={p.amountRials} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">مسئول فعلی:</span>
                      <span className="font-semibold text-primary-900">{holder}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-caption text-slate-500 pt-1">
                    <span>متقاضی: {p.requester.name}</span>
                    <span className="text-primary-700 font-bold flex items-center gap-1">
                      بررسی و مشاهده پرونده
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Detail Drawer */}
      {selectedRecord && (
        <Drawer
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`دستور پرداخت: ${selectedRecord.code}`}
          subtitle={`مبلغ: ${formatRials(selectedRecord.amountRials)} (${formatRialsWithWords(selectedRecord.amountRials).wordsRials})`}
          width="xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Review / Submit Action: If Draft */}
                {selectedRecord.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const updatedRecord: PaymentRequestRecord = {
                        ...selectedRecord,
                        status: 'submitted',
                        statusNote: 'ارسال شد به امور مالی جهت رسیدگی',
                      };
                      setPayments(payments.map((p) => (p.id === selectedRecord.id ? updatedRecord : p)));
                      setSelectedRecord(updatedRecord);
                      addToast({
                        id: `subm-${Date.now()}`,
                        title: 'درخواست به حسابداری ارسال شد',
                        tone: 'success',
                      });
                    }}
                  >
                    ارسال برای بررسی
                  </Button>
                )}

                {/* 2. Approve Action: strictly gated by No-Self-Approval */}
                {(selectedRecord.status === 'submitted' || selectedRecord.status === 'under_review') && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isRequesterOfSelected || selectedRecord.isSelfApprovalBlocked || !userScope.canApprove || selectedRecord.approver.id !== activePersona.id}
                      title={
                        isRequesterOfSelected
                          ? 'امکان تأیید پرونده توسط متقاضی وجود ندارد (اصل تفکیک وظایف و منع خود-تأییدی)'
                          : !userScope.canApprove
                          ? 'نقش شما فاقد اختیار تأیید مالی است'
                          : undefined
                      }
                      onClick={handleApprove}
                    >
                      تأیید پرداخت
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRequesterOfSelected || !userScope.canApprove || selectedRecord.approver.id !== activePersona.id}
                      onClick={() => setIsReturnModalOpen(true)}
                      className="text-orange-700 border-orange-200 hover:bg-orange-50"
                    >
                      عودت برای اصلاح
                    </Button>
                  </>
                )}

                {/* 3. Treasury Allocation Action: Approved -> Ready for Payment */}
                {selectedRecord.status === 'approved' && userScope.canExecute && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const updatedRecord: PaymentRequestRecord = {
                        ...selectedRecord,
                        status: 'ready',
                        statusNote: 'حساب مبدأ در خزانه‌داری تخصیص یافت؛ آماده اجرای حواله',
                      };
                      setPayments(payments.map((p) => (p.id === selectedRecord.id ? updatedRecord : p)));
                      setSelectedRecord(updatedRecord);
                      addToast({
                        id: `ready-${Date.now()}`,
                        title: 'آماده پرداخت خزانه‌داری شد',
                        tone: 'info',
                      });
                    }}
                  >
                    تخصیص به صف پرداخت
                  </Button>
                )}

                {/* 4. Manual Execution Action: External Bank Payment (PAID requirements: executor, time, reference) */}
                {(selectedRecord.status === 'approved' || selectedRecord.status === 'ready' || selectedRecord.status === 'ready_for_payment') && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isRequesterOfSelected || !userScope.canExecute}
                    title={
                      isRequesterOfSelected
                        ? 'امکان اجرای تسویه بانکی توسط متقاضی اولیه وجود ندارد'
                        : !userScope.canExecute
                        ? 'نقش شما فاقد اختیار خزانه‌داری است'
                        : undefined
                    }
                    onClick={() => {
                      setExecutionRefCode('');
                      setIsExecutionModalOpen(true);
                    }}
                  >
                    ثبت پرداخت
                  </Button>
                )}

                {/* 5. Paid Status: Permanently Locked, Cannot Be Deleted */}
                {selectedRecord.status === 'paid' && (
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    پرداخت نهایی و تسویه گردیده است (غیرقابل حذف عادی)
                  </span>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                بستن
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Header: Context & Category */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRecord.contextType === 'company' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
                      <Building2 className="w-3.5 h-3.5 text-slate-300" />
                      پرداخت حقوقی و شرکتی (Company Account)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-600 text-white">
                      <User className="w-3.5 h-3.5" />
                      پرداخت حقیقی / شخصی و تنخواه (Personal)
                    </span>
                  )}
                  {renderCategoryBadge(selectedRecord.category)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary-700 font-bold">{selectedRecord.code}</span>
                  {renderStatusBadge(selectedRecord.status)}
                </div>
              </div>

              {/* Amount Display in Numbers and Persian Words */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-caption">مبلغ ناخالص قابل پرداخت:</span>
                  <div className="font-mono font-black text-slate-900 text-lg">
                    <CurrencyAmount amountRials={selectedRecord.amountRials} />
                  </div>
                </div>
                <div className="text-slate-600 text-caption bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                  <span>مبلغ به حروف:</span>
                  <strong className="text-slate-900 font-bold">
                    {formatRialsWithWords(selectedRecord.amountRials).wordsRials}
                  </strong>
                </div>
                <div className="text-caption text-slate-500 text-left font-mono">
                  معادل {formatRialsWithWords(selectedRecord.amountRials).wordsTomans}
                </div>
              </div>

              <PaymentSchedule key={selectedRecord.id} id={selectedRecord.id} amount={selectedRecord.amountRials} beneficiary={selectedRecord.beneficiary.name} canEdit={userScope.canApprove || userScope.canExecute || selectedRecord.requester.id === activePersona.id} settled={['paid', 'closed'].includes(selectedRecord.status)} />
              {/* Babet / Purpose */}
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-caption mb-1">بابت و شرح ضرورت پرداخت:</span>
                <p className="text-slate-900 font-medium leading-relaxed">{selectedRecord.purpose}</p>
              </div>

              {/* Strict Self-Approval Warning Banner */}
              {isRequesterOfSelected && (
                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-3 text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-xs block">
                      ثبت‌کننده نمی‌تواند درخواست خودش را تأیید کند:
                    </span>
                    <p className="text-caption leading-relaxed">
                      شما متقاضی این دستور پرداخت هستید ({getPersonaDisplayName(activePersona)}). طبق ضوابط سازمانی، امکان تأیید یا تسویه پرداخت توسط ثبت‌کننده وجود ندارد و سند باید توسط مقام مستقل بررسی شود.
                    </p>
                  </div>
                </div>
              )}

              {/* Self-Approval Blocked Error Banner (for pre-blocked records) */}
              {selectedRecord.isSelfApprovalBlocked && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-lg flex items-start gap-3 text-rose-900">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-xs block">
                      تأیید درخواست خودتان مجاز نیست.
                    </span>
                    <p className="text-caption leading-relaxed">این درخواست باید توسط تأییدکننده دیگری بررسی شود.</p>
                    {selectedRecord.unauthorizedRegionOrCategoryWarning && (
                      <p className="text-caption text-rose-700 font-bold mt-1">
                        {selectedRecord.unauthorizedRegionOrCategoryWarning}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* "Who Holds the Ball" & "Next Action" Component */}
            <div className="p-4 bg-primary-50/60 rounded-xl border border-primary-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-primary-100 pb-2">
                <span className="font-extrabold text-primary-950 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-700" />
                  مسئولیت جاری و اقدام بعدی
                </span>
                <span className="text-caption bg-primary-200/70 text-primary-900 font-bold px-2 py-0.5 rounded">
                  پایش زنجیره اقدام
                </span>
              </div>

              {(() => {
                const { holder, action } = getBallAndNextAction(selectedRecord);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
                    <div className="p-3 bg-white rounded-lg border border-primary-100">
                      <span className="text-slate-500 block text-caption">مسئول فعلی (در دست کیست؟):</span>
                      <strong className="text-primary-950 text-xs block mt-1">{holder}</strong>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-primary-100">
                      <span className="text-slate-500 block text-caption">اقدام بعدی مورد انتظار:</span>
                      <p className="text-slate-700 leading-relaxed mt-1 font-medium">{action}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Beneficiary & Masked Financial Identifiers with Audit Reveal */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  مشخصات بانکی ذینفع و صیانت از داده‌های مالی
                </span>
                <span className="text-caption text-slate-500">حفاظت از حریم داده‌های بانکی</span>
              </div>

              <div className="space-y-2.5 text-caption">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">نام شخص یا شرکت ذینفع:</span>
                  <strong className="text-slate-900">{selectedRecord.beneficiary.name}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">بانک عامل:</span>
                  <span className="font-medium text-slate-800">{selectedRecord.beneficiary.bankName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">شناسه ملی / کد اقتصادی:</span>
                  <span className="font-mono text-slate-800">
                    {selectedRecord.beneficiary.nationalOrEconomicCode}
                  </span>
                </div>

                {/* IBAN Display (Masked vs Revealed) */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-bold">شماره شبا بانکی (IBAN):</span>
                    {revealedIds.has(selectedRecord.id) ? (
                      <span className="text-emerald-700 text-caption font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        افشا شده با هشدار حسابرسی
                      </span>
                    ) : (
                      <span className="text-slate-500 text-caption flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        اطلاعات ماسک‌شده
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                      {revealedIds.has(selectedRecord.id)
                        ? selectedRecord.beneficiary.fullIban
                        : selectedRecord.beneficiary.maskedIban}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {revealedIds.has(selectedRecord.id) ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleCopyValue(selectedRecord.beneficiary.fullIban, 'شماره شبا')}
                          className="flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          کپی شبا
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={handleRequestReveal}
                          className="flex items-center gap-1 text-primary-700 hover:text-primary-900 border-primary-200"
                        >
                          <Eye className="w-3 h-3" />
                          مشاهده کامل / کپی
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Number if Available */}
                {selectedRecord.beneficiary.maskedCard && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-caption">
                    <span className="text-slate-500">شماره کارت بانکی (شتاب):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {revealedIds.has(selectedRecord.id)
                          ? selectedRecord.beneficiary.fullCard
                          : selectedRecord.beneficiary.maskedCard}
                      </span>
                      {revealedIds.has(selectedRecord.id) && selectedRecord.beneficiary.fullCard && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleCopyValue(selectedRecord.beneficiary.fullCard!, 'شماره کارت')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Separate Roles Display (5 Distinct Pillars) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs">
                تفکیک ارکان تصویب، نظارت و خزانه‌داری (اصل تفکیک وظایف)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-caption">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-caption">۱. متقاضی (ثبت‌کننده):</span>
                  <span className="font-bold text-slate-900 block">{selectedRecord.requester.name}</span>
                  <span className="text-caption text-slate-500 block">{selectedRecord.requester.role}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-caption">۲. رسیدگی حسابداری:</span>
                  <span className="font-bold text-slate-900 block">{selectedRecord.reviewer.name}</span>
                  <span className="text-caption text-slate-500 block">{selectedRecord.reviewer.role}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-caption">۳. تأییدکننده نهایی مالی:</span>
                  <span className={`font-bold block ${selectedRecord.isSelfApprovalBlocked ? 'text-rose-700 line-through' : 'text-slate-900'}`}>
                    {selectedRecord.approver.name}
                  </span>
                  <span className="text-caption text-slate-500 block">{selectedRecord.approver.role}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block text-caption">۴. مجری پرداخت (خزانه‌دار):</span>
                  <span className="font-bold text-slate-900 block">{selectedRecord.executor.name}</span>
                  <span className="text-caption text-slate-500 block">{selectedRecord.executor.role}</span>
                </div>
              </div>

              {/* 5. Accounting Recorder & System Boundary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-caption">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500">۵. ثبت‌کننده سند مالی:</span>
                  <strong className="text-slate-800">
                    {selectedRecord.accountingRecorder?.name || 'سیستم مالی (پارسینا)'}
                  </strong>
                </div>
                {renderFinancialIntegrationBadge(selectedRecord.financialIntegrationStatus)}
              </div>
            </div>

            {/* Related Operational Context */}
            {selectedRecord.linkedRecords && Object.keys(selectedRecord.linkedRecords).length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  عطف به پرونده‌های عملیاتی متناظر
                </span>
                <div className="flex flex-wrap gap-2 text-caption">
                  {selectedRecord.linkedRecords.supplyRequestId && (
                    <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200 font-mono">
                      درخواست تأمین: {selectedRecord.linkedRecords.supplyRequestId}
                    </span>
                  )}
                  {selectedRecord.linkedRecords.logisticsId && (
                    <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200 font-mono">
                      بارنامه / لجستیک: {selectedRecord.linkedRecords.logisticsId}
                    </span>
                  )}
                  {selectedRecord.linkedRecords.receiptId && (
                    <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200 font-mono">
                      رسید انبار: {selectedRecord.linkedRecords.receiptId}
                    </span>
                  )}
                  {selectedRecord.linkedRecords.salesOrderId && (
                    <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded border border-slate-200 font-mono">
                      سفارش فروش: {selectedRecord.linkedRecords.salesOrderId}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Attachments List */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                پیوست‌ها و مدارک مثبته ({toPersianDigits(selectedRecord.attachments.length)})
              </span>
              {selectedRecord.attachments.length === 0 ? (
                <p className="text-slate-500 text-caption italic">مدرکی ضمیمه نشده است.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedRecord.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-caption"
                    >
                      <span className="font-medium text-slate-800">{att.title}</span>
                      <span className="text-caption text-primary-700 font-bold">مشاهده فایل</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual External Execution Record (Immutable Evidence) */}
            {selectedRecord.manualExecution && (
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-2 text-emerald-950">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    اطلاعات تسویه قطعی خزانه‌داری (PAID)
                  </span>
                  <span className="text-caption bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                    روش: {selectedRecord.manualExecution.paymentMethod}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-caption pt-1">
                  <div>
                    <span className="text-emerald-800 text-caption block">شماره ارجاع / پیگیری بانکی:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {selectedRecord.manualExecution.referenceCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-800 text-caption block">تاریخ و ساعت تسویه:</span>
                    <span className="font-mono text-slate-800">
                      {selectedRecord.manualExecution.executedAtJalali} - ساعت {selectedRecord.manualExecution.executedAtTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-800 text-caption block">کارشناس مجری پرداخت:</span>
                    <span className="font-bold text-slate-900">
                      {selectedRecord.manualExecution.executor.name}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-caption text-emerald-900 flex items-center gap-1 border-t border-emerald-200 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    سند تسویه شده به موجب قوانین ضدپولشویی و نظام کنترل‌های مالیاتی غیرقابل حذف عادی است.
                  </span>
                </div>
              </div>
            )}

            {/* Security Audit Trail Logs */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
              <span className="font-bold text-slate-800 block text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-700" />
                دفتر ثبت وقایع حسابرسی و امنیتی (Security Audit Trail)
              </span>

              <div className="space-y-2">
                {selectedRecord.auditLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-caption">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-bold">{log.action}</span>
                      <span className="font-mono text-caption text-slate-500">{log.timestampJalali}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <span className="text-caption text-slate-500 mt-0.5 block">عامل: {log.actorName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Organization Scope Rules Modal (Shows configured & unresolved rules) */}
      {isScopeRulesModalOpen && (
        <ModalDialog
          isOpen={isScopeRulesModalOpen}
          onClose={() => setIsScopeRulesModalOpen(false)}
          title="ماتریس حدود اختیارات سازمانی و سرفصل‌های پرداخت"
          maxWidth="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsScopeRulesModalOpen(false)}>
              بستن
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              بر اساس ضوابط کنترل‌های داخلی شرکت جوادیان، دسترسی به ثبت سرفصل‌های پرداخت بر اساس مسئولیت‌های سازمانی تفکیک شده است:
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <AdaptiveTable className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">عنوان حوزه مسئولیت</th>
                    <th className="p-3">واحدهای مشمول</th>
                    <th className="p-3">سرفصل‌های مجاز پرداخت</th>
                    <th className="p-3">بسترهای مجاز</th>
                    <th className="p-3">وضعیت تصویب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ORG_PAYMENT_SCOPE_RULES.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{rule.scopeName}</td>
                      <td className="p-3 text-slate-600">{rule.applicableUnits}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {rule.allowedCategories.length === 0 ? (
                            <span className="text-slate-500 italic">فاقد مجوز سرفصل</span>
                          ) : (
                            rule.allowedCategories.map((c) => renderCategoryBadge(c))
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {rule.allowedContexts.map((ctx) => (
                            <span
                              key={ctx}
                              className="text-caption bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                            >
                              {ctx === 'company' ? 'شرکتی' : 'شخصی'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {rule.statusTag === 'مصوب_قطعی' ? (
                          <span className="inline-flex items-center gap-1 text-caption font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" />
                            مصوب قطعی
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-caption font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            نیازمند تنظیم سازمان
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdaptiveTable>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-caption text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">یادداشت فنی:</span>
              <p>
                این قواعد بر اساس نقش‌های عملیاتی و حدود اختیارات تفویض‌شده تنظیم شده‌اند و وابستگی نامی به فرد خاصی ندارند. هر قاعده‌ای که در مصوبات اولیه مسکوت بوده، با برچسب «نیازمند تنظیم سازمان» مشخص گردیده است.
              </p>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* Security Reveal Audit Warning Modal */}
      {isAuditModalOpen && (
        <ModalDialog
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="هشدار امنیتی حسابرسی: افشای اطلاعات بانکی"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAuditModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmReveal}>
                تأیید و نمایش اطلاعات بانکی
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">اخطار ثبت در دفتر وقایع امنیتی (Audit Warning)</span>
                <p className="text-caption leading-relaxed">
                  مشاهده یا رونوشت شماره شبا، شماره حساب یا کارت بانکی ذینفع در دفتر ثبت رویدادهای امنیتی با شناسه کاربری «{getPersonaDisplayName(activePersona)}»، آدرس شبکه و برچسب زمانی دقیق ثبت و ضبط می‌گردد.
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-caption">
              آیا از الزام به مشاهده اطلاعات مالی بدون ماسک اطمینان دارید؟
            </p>
          </div>
        </ModalDialog>
      )}

      {/* Manual Execution Modal (PAID requirements: executor, time, reference, evidence) */}
      {isExecutionModalOpen && (
        <ModalDialog
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          title="ثبت پرداخت"
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsExecutionModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleManualExecution}>
                ثبت پرداخت
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-900 leading-relaxed">
              این سامانه به وب‌سرویس بانک متصل نیست. وضعیت «پرداخت شد» صرفاً نتیجه پرداخت بیرونی است که پس از واریز دستی توسط خزانه‌داری ثبت می‌گردد. ورود مشخصات و پیوست رسید تسویه الزامی است.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">روش انتقال وجه</label>
                <select
                  value={executionMethod}
                  onChange={(e) => setExecutionMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="ساتنا">حواله بین‌بانکی ساتنا (مبالغ کلان)</option>
                  <option value="پایا">حواله پایا (چرخه تسویه الکترونیک)</option>
                  <option value="کارت به کارت">کارت به کارت شتابی (تنخواه)</option>
                  <option value="چک تضمینی">چک تضمینی / بین‌بانکی</option>
                  <option value="نقدی تنخواه">پرداخت نقدی از محل تنخواه</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">
                  شماره پیگیری / کد ارجاع بانکی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: SAT-9920148-TEJ"
                  value={executionRefCode}
                  onChange={(e) => setExecutionRefCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">تاریخ تسویه (جلالی)</label>
                <input
                  type="text"
                  value={executionDateJalali}
                  onChange={(e) => setExecutionDateJalali(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">ساعت تسویه</label>
                <input
                  type="text"
                  value={executionTime}
                  onChange={(e) => setExecutionTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">
                نام پیوست / سند رسید تسویه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: رسید الکترونیکی حواله ساتنا بانک ملت"
                value={evidenceReceiptName}
                onChange={(e) => setEvidenceReceiptName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </FieldGroup>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-caption text-slate-600 flex items-center justify-between">
              <span>کارشناس مجری پرداخت:</span>
              <strong className="text-slate-900 font-bold">
                {getPersonaDisplayName(activePersona)}
              </strong>
            </div>
          </div>
        </ModalDialog>
      )}

      {/* Return for Correction Modal */}
      {isReturnModalOpen && (
        <ModalDialog
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title="عودت برای اصلاح"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmReturn}>
                عودت برای اصلاح
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              لطفاً علت عودت و نواقص مدارک را جهت اطلاع متقاضی ذکر فرمایید:
            </p>
            <textarea
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="مثال: تصویر بارنامه ناخوانا است یا مهر باربری فاقد وضوح می‌باشد..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </ModalDialog>
      )}

      {/* Create Payment Request Modal (Strictly Scoped by Persona) */}
      {isCreateModalOpen && (
        <ModalDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="ثبت دستور پرداخت جدید (Payment Request)"
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreatePaymentRequest}>
                ثبت و ارسال به امور مالی
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Scoped Role Notice */}
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between text-primary-950">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-700 shrink-0" />
                <span>حوزه اختیارات ثبت‌کننده ({getPersonaDisplayName(activePersona)}):</span>
                <strong className="bg-white px-2 py-0.5 rounded border border-primary-300">
                  {userScope.scopeBadgeText}
                </strong>
              </div>
              <span className="text-caption text-slate-500 font-mono">
                تاریخ: {newDateJalali}
              </span>
            </div>

            {/* Context & Category Selection (Scoped strictly!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">بستر حساب</label>
                <select
                  value={newContextType}
                  onChange={(e) => {
                    const ctx = e.target.value as PaymentContextType;
                    setNewContextType(ctx);
                    setNewBeneficiaryType(ctx === 'personal' ? 'person' : 'company');
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {userScope.allowedContexts.includes('company') && (
                    <option value="company">حساب حقوقی و شرکتی (Company)</option>
                  )}
                  {userScope.allowedContexts.includes('personal') && (
                    <option value="personal">حساب حقیقی / شخصی و تنخواه (Personal)</option>
                  )}
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">
                  سرفصل پرداخت (محدود به اختیارات شما) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {PAYMENT_CATEGORIES.filter((c) => userScope.allowedCategories.includes(c.id)).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Purpose */}
            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">
                بابت و شرح ضرورت پرداخت <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: تسویه کرایه حمل تریلی کفی محموله اصفهان به تهران یا پیش‌فاکتور خرید روغن خام..."
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </FieldGroup>

            {/* Amount in Numbers & Persian Words */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">
                    مبلغ پرداختی به ریال (عدد) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newAmountRials}
                    onChange={(e) => setNewAmountRials(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </FieldGroup>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">معادل به تومان</label>
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                    <CurrencyAmount amountRials={parseFinancialInput(newAmountRials)} />
                  </div>
                </div>
              </div>

              {/* Live Persian Words Display */}
              <div className="p-2 bg-white rounded border border-slate-200 text-caption text-slate-800 flex items-center justify-between">
                <span className="text-slate-500">مبلغ به حروف فارسی:</span>
                <strong className="text-primary-900 font-bold">
                  <AmountInWords amount={parseFinancialInput(newAmountRials)} />
                </strong>
              </div>
            </div>

            {/* Beneficiary Details */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block">مشخصات ذینفع و حساب بانکی</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">نوع ذینفع</label>
                  <select
                    value={newBeneficiaryType}
                    onChange={(e) => setNewBeneficiaryType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="company">حقوقی (شرکت)</option>
                    <option value="person">حقیقی (شخص)</option>
                    <option value="institution">نهاد یا سازمان دولتی</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">
                    نام شخص یا شرکت ذینفع <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شرکت تعاونی حمل و نقل ماهان"
                    value={newBeneficiaryName}
                    onChange={(e) => setNewBeneficiaryName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">شناسه ملی / کد اقتصادی</label>
                  <input
                    type="text"
                    value={newNationalCode}
                    onChange={(e) => setNewNationalCode(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </FieldGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">بانک عامل</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">شماره شبا (۲۴ رقمی)</label>
                  <input
                    type="text"
                    placeholder="IR12018000000000..."
                    value={newIban}
                    onChange={(e) => setNewIban(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </FieldGroup>
              </div>

              {/* Personal Card / Account Number (for worker/driver expenses) */}
              {newContextType === 'personal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">شماره کارت (۱۶ رقمی)</label>
                    <input
                      type="text"
                      placeholder="۶۰۳۷۹۹..."
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <label className="font-bold text-slate-700 block mb-1">شماره حساب شخصی</label>
                    <input
                      type="text"
                      placeholder="۰۱۵۰..."
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </FieldGroup>
                </div>
              )}
            </div>

            {/* Operational Reference Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldGroup>
                <label className="font-bold text-slate-700 block mb-1">عطف به پرونده عملیاتی</label>
                <select
                  value={newOperationalContextType}
                  onChange={(e) => setNewOperationalContextType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="none">بدون عطف مستقیم (عمومی)</option>
                  <option value="supply_request">درخواست تأمین کالا (Supply Request)</option>
                  <option value="logistics_operation">عملیات ترابری و بارنامه (Logistics)</option>
                  <option value="sales_order">سفارش فروش مشتری (Sales Order)</option>
                </select>
              </FieldGroup>

              {newOperationalContextType !== 'none' && (
                <FieldGroup>
                  <label className="font-bold text-slate-700 block mb-1">شماره عطف / بارنامه</label>
                  <input
                    type="text"
                    placeholder="مثال: WB-ISF-99214 یا SUP-1403-089"
                    value={newOperationalRef}
                    onChange={(e) => setNewOperationalRef(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </FieldGroup>
              )}
            </div>

            {/* Attachment Proof */}
            <FieldGroup>
              <label className="font-bold text-slate-700 block mb-1">عنوان مدرک مثبته / پیش‌فاکتور</label>
              <input
                type="text"
                placeholder="مثال: تصویر بارنامه ممهور باربری ماهان، یا فاکتور رسمی تأمین‌کننده"
                value={newAttachmentTitle}
                onChange={(e) => setNewAttachmentTitle(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </FieldGroup>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
