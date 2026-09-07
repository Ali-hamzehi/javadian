import { CurrencyAmount } from '../design-system/CurrencyAmount';
import React, { useState } from 'react';
import {
  OperationalRecord,
  MockPersona,
  RecordAttachment,
  Person,
} from '../../types';
import { MOCK_DELEGATIONS } from '../../data/mockOrgData';
import { Drawer } from '../design-system/ModalAndDrawer';
import { Button } from '../design-system/Button';
import { Badge, PriorityBadge } from '../design-system/Badges';
import { Timeline } from '../design-system/Timeline';
import { CommentsSection, AttachmentsSection } from '../design-system/CommentsAndAttachments';
import { computeAllowedActions } from '../../utils/workItemAuthorization';
import {
  CompleteWorkItemModal,
  ReportBlockerModal,
  ReturnWorkItemModal,
  SetWaitingModal,
  ReassignWorkItemModal,
  ApproveCompletionModal,
  RejectWorkItemModal,
} from './WorkItemActionModals';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileText,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Check,
  ExternalLink,
  MessageSquare,
  History,
  Activity,
  Award,
  Play,
  Share2,
  XCircle,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';
import { getDisplayPersonaName, getDisplayPersonaRole } from '../../runtime/documentBasedPersonas';

interface WorkItemDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: OperationalRecord | null;
  activePersona: MockPersona;
  onStartWork: (recordId: string) => void;
  onAddProgressNote: (recordId: string, note: string) => void;
  onSetWaiting: (recordId: string, reason: string) => void;
  onReportBlocker: (recordId: string, reason: string, severity: 'warning' | 'critical', plan?: string) => void;
  onResolveBlocker: (recordId: string, note: string) => void;
  onReassign: (recordId: string, newAssignee: Person, reason?: string, isDelegation?: boolean) => void;
  onRequestCrossUnit?: (recordId: string, reason: string, proposedUnit?: string, proposedPerson?: string) => void;
  onReturnWork: (recordId: string, reason: string) => void;
  onRejectWork: (recordId: string, reason: string) => void;
  onCompleteWork: (
    recordId: string,
    result: { resultSummary: string; outcomeType: 'success' | 'partial' | 'alternative_solution'; attachments: RecordAttachment[] }
  ) => void;
  onApproveCompletion: (recordId: string, note?: string) => void;
  onReturnCompletion: (recordId: string, reason: string) => void;
  onNavigateToLinkedRecord?: (category: string, code: string) => void;
}

export const WorkItemDetailDrawer: React.FC<WorkItemDetailDrawerProps> = ({
  isOpen,
  onClose,
  record,
  activePersona,
  onStartWork,
  onAddProgressNote,
  onSetWaiting,
  onReportBlocker,
  onResolveBlocker,
  onReassign,
  onRequestCrossUnit,
  onReturnWork,
  onRejectWork,
  onCompleteWork,
  onApproveCompletion,
  onReturnCompletion,
  onNavigateToLinkedRecord,
}) => {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'participants' | 'linked' | 'timeline' | 'result' | 'history' | 'comments' | 'attachments'
  >('summary');

  // Modal open states
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isReturnCompletionModalOpen, setIsReturnCompletionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Quick note state
  const [quickProgressNote, setQuickProgressNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Quick unblock note state
  const [unblockNote, setUnblockNote] = useState('');
  const [isUnblocking, setIsUnblocking] = useState(false);

  if (!record) return null;

  // Check if work item represents an approval obligation
  const isApprovalWorkItem =
    record.type === 'approval' ||
    record.workItemType === 'approval_review' ||
    Boolean(record.approvalInstance);

  // Authoritative allowed actions computation
  const allowed = computeAllowedActions(activePersona, record);

  // Determine current user's role relative to this record
  const currentAssignee = record.currentAssignee || record.currentOwner || record.owner || record.creator;
  const isCreator = record.creator.id === activePersona.id;
  const isCompleter = record.workResult?.completedBy?.id === activePersona.id;
  const isSelfApprovalForbidden = isCreator || isCompleter;

  const isDelegateOfApprover = record.approver
    ? MOCK_DELEGATIONS.some(
        (d) =>
          d.delegator.id === record.approver?.id &&
          d.delegatee.id === activePersona.id &&
          d.status === 'active'
      )
    : false;

  const isDesignatedApprover = record.approver
    ? record.approver.id === activePersona.id || isDelegateOfApprover
    : activePersona.capabilities.includes('approvals.view');

  const getWorkTypeBadge = (type?: string, rec?: OperationalRecord) => {
    if (type === 'approval_review' || type === 'approval' || rec?.workItemType === 'approval_review' || rec?.approvalInstance) {
      return <Badge variant="accent">بررسی و تصمیم‌گیری تأیید</Badge>;
    }
    switch (type) {
      case 'review':
        return <Badge variant="warning">بازبینی و کنترل</Badge>;
      case 'followup':
        return <Badge variant="info">پیگیری</Badge>;
      case 'coordination':
        return <Badge variant="neutral">هماهنگی</Badge>;
      case 'field_op':
        return <Badge variant="accent">عملیات میدانی</Badge>;
      default:
        return <Badge variant="primary">اقدام عمومی</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="info">آماده شروع</Badge>;
      case 'ready':
        return <Badge variant="info">آماده بررسی</Badge>;
      case 'in_progress':
        return <Badge variant="primary">در دست اقدام</Badge>;
      case 'in_review':
        return <Badge variant="primary">در حال بررسی</Badge>;
      case 'waiting':
        return <Badge variant="neutral">معلق / در انتظار</Badge>;
      case 'blocked':
        return <Badge variant="danger">مسدود (دارای مانع)</Badge>;
      case 'returned':
        return <Badge variant="warning">برگشتی جهت اصلاح</Badge>;
      case 'pending_approval':
        return <Badge variant="accent">در انتظار تصمیم مدیر</Badge>;
      case 'completed':
        return <Badge variant="success">تکمیل‌شده</Badge>;
      case 'rejected':
        return <Badge variant="danger">رد شده</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">لغو شده</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`شناسنامه کار: ${record.code}`}
        width="xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Workflow Actions pinned in sticky footer */}
              {isApprovalWorkItem ? (
                <>
                  {allowed.can_approve && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsApproveModalOpen(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      تأیید
                    </Button>
                  )}
                  {allowed.can_return && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setIsReturnModalOpen(true)}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      بازگشت جهت اصلاح
                    </Button>
                  )}
                  {allowed.can_reject && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsRejectModalOpen(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      رد
                    </Button>
                  )}
                  {allowed.can_start && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onStartWork(record.id)}
                      leftIcon={<Play className="w-4 h-4 fill-current" />}
                    >
                      شروع بررسی
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {allowed.can_start && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onStartWork(record.id)}
                      leftIcon={<Play className="w-4 h-4 fill-current" />}
                    >
                      شروع به کار
                    </Button>
                  )}
                  {allowed.can_submit_result && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsCompleteModalOpen(true)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      {record.approver ? 'ثبت نتیجه و ارسال به تأییدکننده' : 'تکمیل قطعی کار با ثبت نتیجه'}
                    </Button>
                  )}
                  {allowed.can_approve && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsApproveModalOpen(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      تأیید نهایی نتیجه کار
                    </Button>
                  )}
                  {allowed.can_return && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setIsReturnCompletionModalOpen(true)}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      عدم تأیید و بازگشت به مجری
                    </Button>
                  )}
                  {allowed.can_resolve_blocker && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsUnblocking(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      رفع مانع و ادامه کار
                    </Button>
                  )}
                  {allowed.can_report_blocker && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBlockerModalOpen(true)}
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    >
                      اعلام مانع
                    </Button>
                  )}
                  {allowed.can_reassign && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsReassignModalOpen(true)}
                      leftIcon={<Share2 className="w-3.5 h-3.5" />}
                    >
                      ارجاع به همکار
                    </Button>
                  )}
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Header Card: Code, Type, Status, Deadline */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-200">
                  {record.code}
                </span>
                {getWorkTypeBadge(record.workItemType || (record.type as any), record)}
                {getStatusBadge(record.status)}
                <PriorityBadge priority={record.priority} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>ثبت: {record.createdAtJalali}</span>
              </div>
            </div>

            <h2 className="text-base font-extrabold text-slate-900 leading-snug">
              {record.title}
            </h2>

            {record.itemSummary && (
              <p className="text-xs text-slate-600 leading-relaxed">{record.itemSummary}</p>
            )}

            {/* Quick Who Holds It Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">مسئول فعلی:</span>
                <span className="font-bold text-primary-800 bg-primary-100/70 px-2 py-0.5 rounded">
                  {getDisplayPersonaName(currentAssignee)}{currentAssignee.role ? ` (${getDisplayPersonaRole(currentAssignee)})` : ''}
                </span>
                <span className="text-caption text-slate-600 font-medium">از {currentAssignee.heldSinceJalali || 'هم‌اکنون'}</span>
              </div>

              {record.dueDateJalali && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>مهلت: <strong className="text-slate-900">{record.dueDateJalali}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: چه کاری باید انجام دهم؟ (What should I do?) */}
          <div className="p-4 bg-white rounded-xl border border-primary-100 shadow-none space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-700" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  چه کاری باید انجام دهم؟
                </h3>
              </div>
              {record.requestedAmountRials != null && record.requestedAmountRials > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-caption text-slate-500">مبلغ:</span>
                  <CurrencyAmount amountRials={record.requestedAmountRials} layout="inline" size="sm" tone="primary" />
                </div>
              )}
            </div>

            {/* Directive instruction */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                {record.nextAction?.title || 'بررسی پرونده و اقدام لازم'}
              </div>
              <div className="text-caption text-slate-500">
                مسئول اقدام: {record.nextAction?.responsibleRole || currentAssignee.role || 'کارشناس مسئول'} • مهلت: {record.nextAction?.dueJalali || record.dueDateJalali || 'تعیین نشده'}
              </div>
            </div>

            {/* Self-approval prevention warning (shown ONLY when applicable) */}
            {isSelfApprovalForbidden && !allowed.can_approve && isApprovalWorkItem && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-bold">تأیید درخواست خودتان مجاز نیست: </span>
                  <span>
                    شما ثبت‌کننده این سند هستید ({getDisplayPersonaName(record.creator)}). تأیید باید توسط مقام مستقل ({getDisplayPersonaName(record.approver) || 'مدیر مربوطه'}) انجام شود.
                  </span>
                </div>
              </div>
            )}

            {/* Blocker alert if active */}
            {record.blocker && record.blocker.exists && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>مانع کاری: {record.blocker.reason}</span>
                </div>
                {record.blocker.resolutionPlan && (
                  <div className="text-caption text-rose-800 pr-6">
                    طرح رفع مانع: {record.blocker.resolutionPlan}
                  </div>
                )}
              </div>
            )}

            {/* Returned alert if active */}
            {record.returnedReason && record.status === 'returned' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>پرونده برگشت داده شده جهت رفع نواقص</span>
                </div>
                <p className="text-caption text-amber-900 pr-6">{record.returnedReason}</p>
              </div>
            )}

            {/* Direct In-place Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isApprovalWorkItem ? (
                <>
                  {allowed.can_start && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onStartWork(record.id)}
                      leftIcon={<Play className="w-4 h-4 fill-current" />}
                    >
                      شروع بررسی
                    </Button>
                  )}
                  {allowed.can_approve && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsApproveModalOpen(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      تأیید
                    </Button>
                  )}
                  {allowed.can_return && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setIsReturnModalOpen(true)}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      بازگشت جهت اصلاح
                    </Button>
                  )}
                  {allowed.can_reject && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsRejectModalOpen(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      رد
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {allowed.can_start && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onStartWork(record.id)}
                      leftIcon={<Play className="w-4 h-4 fill-current" />}
                    >
                      شروع به کار
                    </Button>
                  )}
                  {allowed.can_submit_result && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsCompleteModalOpen(true)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      {record.approver ? 'ثبت نتیجه و ارسال به تأییدکننده' : 'تکمیل قطعی کار'}
                    </Button>
                  )}
                  {allowed.can_resolve_blocker && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsUnblocking(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      رفع مانع و ادامه کار
                    </Button>
                  )}
                  {allowed.can_report_blocker && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBlockerModalOpen(true)}
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    >
                      اعلام مانع
                    </Button>
                  )}
                </>
              )}

              {allowed.can_report_progress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  ثبت یادداشت پیشرفت
                </Button>
              )}
            </div>

            {/* In-place progress note */}
            {isAddingNote && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={quickProgressNote}
                  onChange={(e) => setQuickProgressNote(e.target.value)}
                  placeholder="شرح پیشرفت کار را وارد نمایید..."
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (quickProgressNote.trim()) {
                      onAddProgressNote(record.id, quickProgressNote.trim());
                      setQuickProgressNote('');
                      setIsAddingNote(false);
                    }
                  }}
                >
                  ثبت
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsAddingNote(false)}>
                  انصراف
                </Button>
              </div>
            )}

            {/* In-place unblock input */}
            {isUnblocking && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={unblockNote}
                  onChange={(e) => setUnblockNote(e.target.value)}
                  placeholder="نحوه رفع مانع را توضیح دهید..."
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    onResolveBlocker(record.id, unblockNote.trim() || 'مانع با پیگیری رفع گردید.');
                    setUnblockNote('');
                    setIsUnblocking(false);
                  }}
                >
                  رفع مانع و ادامه کار
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsUnblocking(false)}>
                  انصراف
                </Button>
              </div>
            )}
          </div>

          {/* Section 2: داده‌ها و جزئیات (Tabs for organized deep-dive) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'summary'
                    ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مشخصات
              </button>
              {record.linkedBusinessRecord && (
                <button
                  type="button"
                  onClick={() => setActiveTab('linked')}
                  className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'linked'
                      ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  سند مرتبط ({record.linkedBusinessRecord.code})
                </button>
              )}
              {record.workResult && (
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'result'
                      ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  نتیجه کار
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                رویدادنگار ({toPersianDigits(record.timeline.length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                یادداشت‌ها ({toPersianDigits(record.comments.length)})
              </button>
              {record.attachments && record.attachments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('attachments')}
                  className={`px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'attachments'
                      ? 'border-b-2 border-primary-600 text-primary-700 font-bold bg-primary-50/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  پیوست‌ها ({toPersianDigits(record.attachments.length)})
                </button>
              )}
            </div>

            {/* TAB: SUMMARY & PARTICIPANTS */}
            {activeTab === 'summary' && (
              <div className="space-y-3 text-xs">
                {/* Definition of outcome */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Award className="w-4 h-4 text-primary-700" />
                    <span>شرط تکمیل کار:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {record.expectedOutcome || 'انجام بررسی‌های لازم، تکمیل مدارک و ثبت گزارش خروجی در سامانه'}
                  </p>
                </div>

                {/* Manager instruction if any */}
                {record.managerInstruction && (
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                    <div className="font-bold text-amber-900">پیام و دستورالعمل مدیر:</div>
                    <p className="text-amber-950 leading-relaxed">{record.managerInstruction}</p>
                  </div>
                )}

                {/* Key Roles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="text-caption text-slate-500">ثبت‌کننده اولیه:</div>
                    <div className="font-bold text-slate-900">{getDisplayPersonaName(record.creator)}</div>
                    <div className="text-caption text-slate-600">{getDisplayPersonaRole(record.creator)} ({record.creator.department})</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="text-caption text-slate-500">صاحب کار (پاسخگو):</div>
                    <div className="font-bold text-slate-900">{getDisplayPersonaName(record.owner) || getDisplayPersonaName(record.creator)}</div>
                    <div className="text-caption text-slate-600">{getDisplayPersonaRole(record.owner || record.creator)}</div>
                  </div>

                  <div className="p-3 bg-primary-50/50 rounded-lg border border-primary-100 space-y-1">
                    <div className="text-caption text-primary-800 font-semibold">مجری کنونی (اکنون دست کیست؟):</div>
                    <div className="font-bold text-slate-900">{getDisplayPersonaName(currentAssignee)}</div>
                    <div className="text-caption text-slate-600">{getDisplayPersonaRole(currentAssignee)}</div>
                  </div>

                  {record.approver && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="text-caption text-slate-500">تأییدکننده مسئول:</div>
                      <div className="font-bold text-slate-900">{getDisplayPersonaName(record.approver)}</div>
                      <div className="text-caption text-slate-600">{getDisplayPersonaRole(record.approver)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: LINKED RECORD */}
            {activeTab === 'linked' && record.linkedBusinessRecord && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded border border-primary-200">
                    {record.linkedBusinessRecord.code}
                  </span>
                  <Badge variant="primary">{record.linkedBusinessRecord.categoryLabel}</Badge>
                </div>

                <div className="font-bold text-slate-900 text-sm">{record.linkedBusinessRecord.title}</div>

                <div className="flex items-center gap-2 text-slate-600">
                  <span>وضعیت فعلی سند:</span>
                  <span className="font-semibold text-slate-800">{record.linkedBusinessRecord.currentStatus}</span>
                </div>

                {record.linkedBusinessRecord.summary && (
                  <p className="text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">
                    {record.linkedBusinessRecord.summary}
                  </p>
                )}

                {onNavigateToLinkedRecord && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onNavigateToLinkedRecord(
                        record.linkedBusinessRecord!.category,
                        record.linkedBusinessRecord!.code
                      );
                      onClose();
                    }}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    مشاهده پرونده کامل در بخش مربوطه
                  </Button>
                )}
              </div>
            )}

            {/* TAB: WORK RESULT */}
            {activeTab === 'result' && record.workResult && (
              <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">نتیجه قطعی کار</span>
                  </div>
                  <Badge variant={record.workResult.outcomeType === 'success' ? 'success' : 'warning'}>
                    {record.workResult.outcomeType === 'success'
                      ? 'موفقیت کامل'
                      : record.workResult.outcomeType === 'partial'
                      ? 'تحقق جزئی'
                      : 'راه‌حل جایگزین'}
                  </Badge>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {record.workResult.resultSummary}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-slate-600 pt-2 border-t border-slate-200">
                  <div>ثبت‌شده توسط: {record.workResult.completedBy.name}</div>
                  <div>تاریخ ثبت: {record.workResult.completedAtJalali}</div>
                </div>

                {record.workResult.approvalDecision && (
                  <div className="mt-2 p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-emerald-700" />
                      <span>تأیید رسمی توسط {record.workResult.approvalDecision.approver.name}</span>
                    </div>
                    <div className="text-caption text-emerald-900">
                      تاریخ: {record.workResult.approvalDecision.approvedAtJalali}
                    </div>
                    {record.workResult.approvalDecision.decisionNote && (
                      <div className="text-xs pt-1">
                        توضیحات: {record.workResult.approvalDecision.decisionNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <Timeline events={record.timeline} />
              </div>
            )}

            {/* TAB: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <CommentsSection
                  comments={record.comments}
                  onAddComment={(text) => onAddProgressNote(record.id, text)}
                />
              </div>
            )}

            {/* TAB: ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <AttachmentsSection attachments={record.attachments} />
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Action Modals */}
      <CompleteWorkItemModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onSubmit={(result) => {
          onCompleteWork(record.id, result);
          setIsCompleteModalOpen(false);
        }}
        expectedOutcome={record.expectedOutcome}
        hasApprover={!!record.approver && record.approver.id !== activePersona.id}
        approverName={record.approver?.name}
      />

      <ReportBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        onSubmit={(data) => {
          onReportBlocker(record.id, data.reason, data.severity, data.resolutionPlan);
          setIsBlockerModalOpen(false);
        }}
      />

      <ReturnWorkItemModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={(reason) => {
          onReturnWork(record.id, reason);
          setIsReturnModalOpen(false);
        }}
        targetPersonName={record.approvalInstance ? 'علیرضا تهرانی' : (record.owner?.name || record.creator.name)}
        isApprovalReview={!!record.approvalInstance || record.workItemType === 'approval_review'}
      />

      <SetWaitingModal
        isOpen={isWaitingModalOpen}
        onClose={() => setIsWaitingModalOpen(false)}
        onSubmit={(reason) => {
          onSetWaiting(record.id, reason);
          setIsWaitingModalOpen(false);
        }}
      />

      <ReassignWorkItemModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onSubmit={(newAssignee, reason, isDelegation) => {
          onReassign(record.id, newAssignee, reason, isDelegation);
          setIsReassignModalOpen(false);
        }}
        onRequestCrossUnit={(reason, proposedUnit, proposedPerson) => {
          if (onRequestCrossUnit) {
            onRequestCrossUnit(record.id, reason, proposedUnit, proposedPerson);
          }
          setIsReassignModalOpen(false);
        }}
        currentOwnerName={record.owner?.name || record.creator.name}
        actor={activePersona}
        taskUnit={record.unit || record.creator?.department}
        record={record}
        currentAssigneeId={currentAssignee.id}
      />

      <ApproveCompletionModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onSubmit={(note) => {
          onApproveCompletion(record.id, note);
          setIsApproveModalOpen(false);
        }}
        taskTitle={record.title}
        resultSummary={record.workResult?.resultSummary}
      />

      <ReturnWorkItemModal
        isOpen={isReturnCompletionModalOpen}
        onClose={() => setIsReturnCompletionModalOpen(false)}
        onSubmit={(reason) => {
          onReturnCompletion(record.id, reason);
          setIsReturnCompletionModalOpen(false);
        }}
        targetPersonName={record.workResult?.completedBy.name || currentAssignee.name}
      />

      <RejectWorkItemModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={(reason) => {
          onRejectWork(record.id, reason);
          setIsRejectModalOpen(false);
        }}
        taskTitle={record.title}
        sourceCode={record.linkedBusinessRecord?.code || record.code}
      />
    </>
  );
};
