import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflowRevision, decidePayment } from '../runtime/workflow';
import {
  OperationalRecord,
  MockPersona,
  PriorityLevel,
  Person,
  RecordAttachment,
} from '../types';
import { mockRepository, mockSalesWarehouseStore } from '../runtime/workflow';
import { WorkItemDetailDrawer } from '../components/work-item/WorkItemDetailDrawer';
import { SubmitRequestModal } from '../components/work-item/SubmitRequestModal';
import { Button } from '../components/design-system/Button';
import { useToast } from '../components/design-system/ToastContext';
import {
  determineUserExperienceType,
  getAuthorizedRequestTypes,
  filterEmployeeRecords,
  getEmployeeOneLineSummary,
  getEmployeeSummaryCounts,
  RequestTypeOption,
} from '../utils/roleExperience';
import {
  getPersonaDisplayName,
  getPersonaTypeLabel,
  getPersonaSubtitle,
} from '../runtime/documentBasedPersonas';
import {
  Search,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Truck,
  CreditCard,
  ShoppingCart,
  Boxes,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { toPersianDigits, isJalaliOverdue } from '../utils/formatters';

interface InboxViewProps {
  activePersona: MockPersona;
  selectedRecordId?: string;
  initialTab?: string;
  onOpenAssignTaskModal?: (assigneeName?: string) => void;
  onNavigateToLinkedRecord?: (category: string, code: string) => void;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  activePersona,
  selectedRecordId,
  initialTab,
  onOpenAssignTaskModal,
  onNavigateToLinkedRecord,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();
  const revision = useWorkflowRevision();

  // Strictly authorized records
  const authorizedRecords = useMemo(
    () => mockRepository.getAuthorizedRecords(activePersona),
    [activePersona, revision]
  );

  // Role experience type: 'employee' | 'manager' | 'hybrid'
  const experienceType = useMemo(
    () => determineUserExperienceType(activePersona),
    [activePersona]
  );

  // Active Presentation Mode for hybrid personas: 'employee' | 'manager'
  const [activeMode, setActiveMode] = useState<'employee' | 'manager'>(() => {
    if (initialTab === 'my_approvals' || initialTab === 'approvals') return 'manager';
    if (experienceType === 'manager') return 'manager';
    return 'employee';
  });

  useEffect(() => {
    if (initialTab === 'my_approvals' || initialTab === 'approvals') {
      setActiveMode('manager');
    } else if (experienceType === 'manager') {
      setActiveMode('manager');
    } else if (experienceType === 'employee') {
      setActiveMode('employee');
    }
  }, [experienceType, initialTab]);

  // Main visual layout toggle: 'dashboard' (Overview) | 'table' (All Work Table)
  const [mainView, setMainView] = useState<'dashboard' | 'table'>('dashboard');

  // Active filter for table / list
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals & Drawer
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(() => {
    if (selectedRecordId) {
      const match = authorizedRecords.find((r) => r.id === selectedRecordId || r.code === selectedRecordId);
      return match ? match.id : selectedRecordId;
    }
    return null;
  });

  useEffect(() => {
    if (!selectedRecordId) {
      setActiveRecordId(null);
    }
    setSearchQuery('');
    setPriorityFilter('all');
  }, [activePersona.id]);

  useEffect(() => {
    if (selectedRecordId) {
      const match = authorizedRecords.find((r) => r.id === selectedRecordId || r.code === selectedRecordId);
      if (match) {
        setActiveRecordId(match.id);
        const isAppr =
          mockRepository.isActionableApprovalRecord(activePersona, match) ||
          match.workItemType === 'approval_review' ||
          match.type === 'approval' ||
          Boolean(match.approvalInstance);
        if (isAppr) {
          setActiveMode('manager');
        }
      } else {
        setActiveRecordId(selectedRecordId);
      }
    }
  }, [selectedRecordId, authorizedRecords, activePersona]);

  const activeRecord = activeRecordId
    ? authorizedRecords.find((r) => r.id === activeRecordId || r.code === activeRecordId) || null
    : null;

  // Authorized request types for "ثبت درخواست" button
  const authorizedRequestTypes = useMemo(
    () => getAuthorizedRequestTypes(activePersona),
    [activePersona]
  );

  // One-line summary for employee
  const employeeSummary = useMemo(
    () => getEmployeeOneLineSummary(authorizedRecords, activePersona),
    [authorizedRecords, activePersona]
  );

  // 4 operational metric counts for employee
  const employeeCounts = useMemo(
    () => getEmployeeSummaryCounts(authorizedRecords, activePersona),
    [authorizedRecords, activePersona]
  );

  // Manager indicators
  const actionableApprovals = useMemo(
    () => authorizedRecords.filter((rec) => mockRepository.isActionableApprovalRecord(activePersona, rec)),
    [authorizedRecords, activePersona]
  );

  const teamBlockedRecords = useMemo(
    () => authorizedRecords.filter((rec) => rec.status === 'blocked'),
    [authorizedRecords]
  );

  const teamOverdueRecords = useMemo(
    () =>
      authorizedRecords.filter(
        (rec) =>
          rec.status !== 'completed' &&
          rec.status !== 'rejected' &&
          rec.status !== 'cancelled' &&
          (rec.priority === 'urgent' || (rec.dueDateJalali && isJalaliOverdue(rec.dueDateJalali)))
      ),
    [authorizedRecords]
  );

  const teamPendingRecords = useMemo(
    () =>
      authorizedRecords.filter(
        (rec) => rec.status !== 'completed' && rec.status !== 'rejected' && rec.status !== 'cancelled'
      ),
    [authorizedRecords]
  );

  // Categorized records
  const toDoRecords = useMemo(
    () => filterEmployeeRecords(authorizedRecords, activePersona, 'to_do'),
    [authorizedRecords, activePersona]
  );

  const trackingRecords = useMemo(
    () => filterEmployeeRecords(authorizedRecords, activePersona, 'tracking'),
    [authorizedRecords, activePersona]
  );

  const historyRecords = useMemo(
    () => filterEmployeeRecords(authorizedRecords, activePersona, 'history'),
    [authorizedRecords, activePersona]
  );

  // Surface 1: Actionable Work items (for attentionList)
  const attentionList = useMemo(() => {
    if (activeMode === 'manager') {
      return actionableApprovals;
    }
    return toDoRecords;
  }, [activeMode, actionableApprovals, toDoRecords]);

  // Surface 2: Active flows (for overviewFlowList)
  const flowList = useMemo(() => {
    if (activeMode === 'manager') {
      return teamPendingRecords.slice(0, 8);
    }
    return trackingRecords.slice(0, 8);
  }, [activeMode, teamPendingRecords, trackingRecords]);

  // Filtered table records
  const tableRecords = useMemo(() => {
    let list = authorizedRecords;
    if (activeFilter === 'to_do') {
      list = toDoRecords;
    } else if (activeFilter === 'tracking') {
      list = trackingRecords;
    } else if (activeFilter === 'blocked') {
      list = authorizedRecords.filter((r) => r.status === 'blocked');
    } else if (activeFilter === 'history') {
      list = historyRecords;
    } else if (activeFilter === 'approvals') {
      list = actionableApprovals;
    }

    if (priorityFilter !== 'all') {
      list = list.filter((r) => r.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.creator.name.toLowerCase().includes(q) ||
          r.currentAssignee?.name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    authorizedRecords,
    activeFilter,
    toDoRecords,
    trackingRecords,
    historyRecords,
    actionableApprovals,
    priorityFilter,
    searchQuery,
  ]);

  // Workflow Handlers
  const actorObj: Person = {
    id: activePersona.id,
    name: activePersona.name,
    role: activePersona.role,
    department: activePersona.department,
  };

  const handleStartWork = (recordId: string) => {
    mockRepository.startWorkItem(recordId, actorObj);
    addToast('وضعیت کار به «در حال انجام» تغییر یافت.', { tone: 'info' });
  };

  const handleAddProgressNote = (recordId: string, note: string) => {
    mockRepository.addComment(recordId, activePersona.name, note, false);
    addToast('یادداشت پیشرفت با موفقیت ثبت شد.', { tone: 'info' });
  };

  const handleSetWaiting = (recordId: string, reason: string) => {
    mockRepository.setWaitingStatus(recordId, actorObj, reason);
    addToast('کار در وضعیت انتظار قرار گرفت.', { tone: 'warning' });
  };

  const handleReportBlocker = (
    recordId: string,
    reason: string,
    severity: 'warning' | 'critical',
    _plan?: string
  ) => {
    mockRepository.raiseBlocker(recordId, activePersona.name, reason, severity);
    addToast('مانع کاری گزارش شد و به اطلاع ذینفعان رسید.', { tone: 'danger' });
  };

  const handleResolveBlocker = (recordId: string, note: string) => {
    mockRepository.resolveBlocker(recordId, activePersona.name, note);
    addToast('مانع کاری برطرف شد و جریان کار از سر گرفته شد.', { tone: 'success' });
  };

  const handleReassign = (
    recordId: string,
    newAssignee: Person,
    reason?: string,
    isDelegation?: boolean
  ) => {
    mockRepository.reassignWorkItem(recordId, actorObj, newAssignee, reason, isDelegation);
    addToast(`مسئولیت کار به ${newAssignee.name} ارجاع شد.`, { tone: 'info' });
  };

  const handleReturnWork = (recordId: string, reason: string) => {
    mockRepository.returnWorkItem(recordId, actorObj, reason);
    addToast('کار جهت اصلاح به واگذارکننده عودت داده شد.', { tone: 'warning' });
  };

  const handleRejectWork = (recordId: string, reason: string) => {
    mockRepository.rejectWorkItem(recordId, actorObj, reason);
    addToast('کار رد شد و فرآیند خاتمه یافت.', { tone: 'danger' });
  };

  const handleCompleteWork = (
    recordId: string,
    result: {
      resultSummary: string;
      outcomeType: 'success' | 'partial' | 'alternative_solution';
      attachments: RecordAttachment[];
    }
  ) => {
    const linked = mockRepository.getRecordById(recordId)?.linkedBusinessRecord;
    if (linked && ['payment_request', 'supply_request'].includes(linked.category)) {
      onNavigateToLinkedRecord?.(linked.category, linked.code);
      addToast('ثبت نتیجه این کار باید همراه با شواهد در پرونده اصلی انجام شود.', { tone: 'info' });
      return;
    }
    mockRepository.completeWorkItem(recordId, actorObj, result);
    addToast('نتیجه کار ثبت گردید و فرآیند خاتمه انجام شد.', { tone: 'success' });
  };

  const handleApproveCompletion = (recordId: string, note?: string) => {
    const targetRec = authorizedRecords.find((r) => r.id === recordId) || mockRepository.getRecordById(recordId);
    if (targetRec?.linkedBusinessRecord?.category === 'payment_request') {
      const success = decidePayment(recordId, activePersona.id, 'approved', note);
      addToast(
        success ? 'درخواست پرداخت تأیید و جهت اجرا به خزانه‌داری ارسال شد.' : 'این تصمیم در وضعیت فعلی مجاز نیست.',
        { tone: success ? 'success' : 'danger' }
      );
      return;
    }
    if (targetRec?.linkedBusinessRecord?.category === 'sales_order') {
      const soId = targetRec.linkedBusinessRecord.id;
      if (mockSalesWarehouseStore.getSalesOrderById(soId)?.linkedWorkItemId !== recordId) {
        addToast('این نگارش منسوخ است؛ لطفاً نگارش جاری را باز کنید.', { tone: 'danger' });
        return;
      }
      const orderCode = targetRec.linkedBusinessRecord.code;
      const result = mockSalesWarehouseStore.approveSalesOrder(soId, activePersona, note);
      if (result.success) {
        addToast(`سفارش فروش ${orderCode} با موفقیت تصویب شد و حواله خروج صادر گردید.`, { tone: 'success' });
      } else {
        addToast(result.message || 'خطا در تصویب سفارش فروش', { tone: 'danger' });
      }
    } else {
      mockRepository.approveWorkItemCompletion(recordId, actorObj, note);
      addToast('تکمیل کار توسط شما تأیید و پرونده مختومه شد.', { tone: 'success' });
    }
  };

  const handleReturnCompletion = (recordId: string, reason: string) => {
    const targetRec = authorizedRecords.find((r) => r.id === recordId) || mockRepository.getRecordById(recordId);
    if (targetRec?.linkedBusinessRecord?.category === 'payment_request') {
      const success = decidePayment(recordId, activePersona.id, 'returned', reason);
      addToast(
        success ? 'درخواست پرداخت جهت اصلاح به متقاضی بازگشت داده شد.' : 'این تصمیم مجاز نیست.',
        { tone: success ? 'warning' : 'danger' }
      );
      return;
    }
    if (targetRec?.linkedBusinessRecord?.category === 'sales_order') {
      const soId = targetRec.linkedBusinessRecord.id;
      if (mockSalesWarehouseStore.getSalesOrderById(soId)?.linkedWorkItemId !== recordId) {
        addToast('این نگارش منسوخ است؛ لطفاً نسخه جاری را باز کنید.', { tone: 'danger' });
        return;
      }
      const orderCode = targetRec.linkedBusinessRecord.code;
      const result = mockSalesWarehouseStore.returnSalesOrder(soId, activePersona, reason);
      if (result.success) {
        addToast(`سفارش فروش ${orderCode} جهت اصلاح به کارشناس فروش برگشت داده شد.`, { tone: 'warning' });
      } else {
        addToast(result.message || 'خطا در بازگشت سفارش', { tone: 'danger' });
      }
    } else {
      mockRepository.returnWorkItemCompletion(recordId, actorObj, reason);
      addToast('نتیجه کار تأیید نشد و پرونده جهت اصلاح به مجری بازگشت داده شد.', { tone: 'warning' });
    }
  };

  const handleSelectRequestOption = (option: RequestTypeOption) => {
    if (option.actionType === 'assign_task') {
      if (onOpenAssignTaskModal) onOpenAssignTaskModal();
    } else if (onNavigateToRoute) {
      onNavigateToRoute(option.routeKey);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return <span className="pill info"><span className="dot"></span>باز</span>;
      case 'in_progress':
        return <span className="pill primary"><span className="dot"></span>در حال انجام</span>;
      case 'waiting':
      case 'pending_approval':
        return <span className="pill warning"><span className="dot"></span>در انتظار</span>;
      case 'blocked':
        return <span className="pill danger"><span className="dot"></span>مسدود</span>;
      case 'completed':
      case 'approved':
        return <span className="pill success"><span className="dot"></span>تکمیل‌شده</span>;
      case 'rejected':
      case 'returned':
        return <span className="pill danger"><span className="dot"></span>عودت‌یافته</span>;
      default:
        return <span className="pill neutral"><span className="dot"></span>{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header matching prototype #page-overview exactly */}
      <div className="page-head overview-clean-head">
        <div className="page-title">
          <h1>{activeMode === 'manager' ? 'میز تصمیم‌گیری و نظارت بر تیم' : 'نمای کلی عملیات'}</h1>
          <p>فقط مواردی که برای تصمیم‌گیری امروز لازم‌اند؛ جزئیات هر حوزه در صفحه خودش قرار دارد.</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#202333]">
              {getPersonaDisplayName(activePersona)}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                getPersonaTypeLabel(activePersona) === 'نقش سازمانی'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-[#f0eeff] text-[#6558d9] border-[#e4dfff]'
              }`}
            >
              {getPersonaTypeLabel(activePersona)}
            </span>
            {getPersonaSubtitle(activePersona) && (
              <span className="text-[11px] text-[#747c90]">
                ({getPersonaSubtitle(activePersona)})
              </span>
            )}
            {employeeSummary && (
              <span className="text-[11px] text-[#747c90] mr-2">
                • {employeeSummary}
              </span>
            )}
          </div>
        </div>

        <div className="page-actions">
          {experienceType === 'hybrid' && (
            <div className="flex items-center bg-[#f0eeff] p-1 rounded-xl border border-[#e4dfff] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveMode('employee')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeMode === 'employee'
                    ? 'bg-white text-[#6558d9] shadow-xs font-black'
                    : 'text-[#697082] hover:text-[#1a202c]'
                }`}
              >
                کارهای من
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('manager')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeMode === 'manager'
                    ? 'bg-white text-[#6558d9] shadow-xs font-black'
                    : 'text-[#697082] hover:text-[#1a202c]'
                }`}
              >
                مدیریت و نظارت
              </button>
            </div>
          )}

          {authorizedRequestTypes.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (authorizedRequestTypes.length === 1 && authorizedRequestTypes[0].actionType !== 'assign_task') {
                  handleSelectRequestOption(authorizedRequestTypes[0]);
                } else {
                  setIsSubmitModalOpen(true);
                }
              }}
              className="btn primary cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              ثبت درخواست
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="برای این حساب کاربری، مجوز ثبت درخواست جدید تعریف نشده است."
              className="btn cursor-not-allowed opacity-50 border-[#e6e8ef] text-slate-400"
            >
              <Plus className="w-4 h-4 opacity-40" />
              ثبت درخواست (فاقد مجوز)
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact KPI Row: exactly 4 .stat cards matching prototype */}
      <div className="grid stats overview-clean-stats" id="overviewStats">
        {activeMode === 'employee' ? (
          <>
            <div
              onClick={() => {
                setActiveFilter('to_do');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'to_do' && mainView === 'dashboard' ? 'border-[#6558d9] ring-2 ring-[#6558d9]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">برای اقدام من (برای انجام)</span>
                <div className="stat-icon">⚡</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(employeeCounts.toDo)}{' '}
                <span className="text-xs font-normal text-[#747c90]">کار</span>
              </div>
              <div className="stat-meta">وظایف جاری نیازمند اقدام شما</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('tracking');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'tracking' && mainView === 'dashboard' ? 'border-[#6558d9] ring-2 ring-[#6558d9]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">منتظر دیگران (برای پیگیری)</span>
                <div className="stat-icon">⌛</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(employeeCounts.tracking)}{' '}
                <span className="text-xs font-normal text-[#747c90]">مورد</span>
              </div>
              <div className="stat-meta">اقلام ارجاع‌شده در گردش تیم</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('blocked');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'blocked' && mainView === 'dashboard' ? 'border-[#c74b55] ring-2 ring-[#c74b55]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">دارای مانع (مسدود)</span>
                <div className="stat-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>⛔</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(employeeCounts.blocked)}{' '}
                <span className="text-xs font-normal text-[#747c90]">مورد</span>
              </div>
              <div className="stat-meta">نیازمند رفع انسداد یا پیگیری</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('history');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'history' && mainView === 'dashboard' ? 'border-[#138a61] ring-2 ring-[#138a61]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">تاریخچه (انجام‌شده اخیر)</span>
                <div className="stat-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>✓</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(employeeCounts.recentCompleted)}{' '}
                <span className="text-xs font-normal text-[#747c90]">تکمیل</span>
              </div>
              <div className="stat-meta">اقدامات نهایی‌شده در روزهای اخیر</div>
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => {
                setActiveFilter('approvals');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'approvals' && mainView === 'dashboard' ? 'border-[#6558d9] ring-2 ring-[#6558d9]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">تصمیم‌گیری‌های منتظر اقدام</span>
                <div className="stat-icon">⚡</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(actionableApprovals.length)}{' '}
                <span className="text-xs font-normal text-[#747c90]">تصمیم</span>
              </div>
              <div className="stat-meta">اسناد تجاری و مالی در صف بررسی</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('tracking');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'tracking' && mainView === 'dashboard' ? 'border-[#6558d9] ring-2 ring-[#6558d9]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">پیگیری تیم و گردش اسناد</span>
                <div className="stat-icon">⌛</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(teamPendingRecords.length)}{' '}
                <span className="text-xs font-normal text-[#747c90]">پرونده</span>
              </div>
              <div className="stat-meta">کارهای در دست اقدام اعضای تیم</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('blocked');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'blocked' && mainView === 'dashboard' ? 'border-[#c74b55] ring-2 ring-[#c74b55]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">کارهای مسدود تیم (انسداد)</span>
                <div className="stat-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>⛔</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(teamBlockedRecords.length)}{' '}
                <span className="text-xs font-normal text-[#747c90]">مانع</span>
              </div>
              <div className="stat-meta">توقف‌های بحرانی با علت ثبت‌شده</div>
            </div>

            <div
              onClick={() => {
                setActiveFilter('overdue');
                setMainView('dashboard');
              }}
              className={`stat cursor-pointer ${activeFilter === 'overdue' && mainView === 'dashboard' ? 'border-[#b97318] ring-2 ring-[#b97318]/15' : ''}`}
            >
              <div className="stat-top">
                <span className="stat-label">کارهای معوق و فوری</span>
                <div className="stat-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>⚠</div>
              </div>
              <div className="stat-value">
                {toPersianDigits(teamOverdueRecords.length)}{' '}
                <span className="text-xs font-normal text-[#747c90]">مورد</span>
              </div>
              <div className="stat-meta">سررسید گذشته نیازمند تصمیم</div>
            </div>
          </>
        )}
      </div>

      {/* 3. Filter Tabs: simple, scannable, matching prototype */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="tabs">
          <button
            type="button"
            onClick={() => {
              setMainView('dashboard');
              setActiveFilter('all');
            }}
            className={`tab ${mainView === 'dashboard' && activeFilter === 'all' ? 'active' : ''}`}
          >
            نمای کلی داشبورد
          </button>
          <button
            type="button"
            onClick={() => {
              setMainView('table');
              setActiveFilter('all');
            }}
            className={`tab ${mainView === 'table' && activeFilter === 'all' ? 'active' : ''}`}
          >
            جدول همه کارها
          </button>
          <button
            type="button"
            onClick={() => {
              setMainView('table');
              setActiveFilter('to_do');
            }}
            className={`tab ${mainView === 'table' && activeFilter === 'to_do' ? 'active' : ''}`}
          >
            برای اقدام (برای انجام)
          </button>
          <button
            type="button"
            onClick={() => {
              setMainView('table');
              setActiveFilter('tracking');
            }}
            className={`tab ${mainView === 'table' && activeFilter === 'tracking' ? 'active' : ''}`}
          >
            در حال پیگیری (برای پیگیری)
          </button>
          <button
            type="button"
            onClick={() => {
              setMainView('table');
              setActiveFilter('history');
            }}
            className={`tab ${mainView === 'table' && activeFilter === 'history' ? 'active' : ''}`}
          >
            تکمیل‌شده (سابقه)
          </button>
        </div>
      </div>

      {/* 4. Primary Content: Two-Column Operational Surface or Clean Data Table */}
      {mainView === 'dashboard' ? (
        <div className="overview-simple-grid">
          {/* Surface 1: Actionable Work Today */}
          <div className="card overview-focus-card">
            <div className="card-head">
              <div>
                <div className="card-title">نیازمند اقدام امروز</div>
                <div className="card-sub">کارهای معوق، مهم و تأییدهای منتظر تصمیم</div>
              </div>
              <button
                type="button"
                className="link-btn btn ghost small"
                onClick={() => setMainView('table')}
              >
                مشاهده همه کارها
              </button>
            </div>
            <div className="card-body" id="attentionList">
              {attentionList.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">✓</div>
                  <h3>همه موارد بررسی شده‌اند</h3>
                  <p>در حال حاضر هیچ کار فوری یا تصمیم بلاتکلیفی برای اقدام امروز وجود ندارد.</p>
                </div>
              ) : (
                <div className="stack">
                  {attentionList.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="queue-row hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => setActiveRecordId(item.id)}
                    >
                      <div className="activity-dot shrink-0">
                        {item.type === 'approval' ? '⌛' : '⚡'}
                      </div>
                      <div className="queue-main">
                        <div className="queue-title font-bold text-[#202333] text-xs">
                          {item.title}
                        </div>
                        <div className="queue-meta flex items-center gap-2 text-[10px] text-[#747c90] mt-0.5 flex-wrap">
                          <span className="font-mono font-bold text-[#6558d9]">{item.code}</span>
                          <span>•</span>
                          <span>مسئول فعلی: <strong className="text-[#202333] font-semibold">{item.currentAssignee?.name || item.currentOwner?.name || item.creator.name}</strong></span>
                          <span>•</span>
                          <span>قدم بعدی: <strong className="text-[#202333] font-semibold">{item.nextAction?.title || item.waitingForActionTitle || 'بررسی و اقدام متناسب'}</strong></span>
                          {item.dueDateJalali && (
                            <>
                              <span>•</span>
                              <span>موعد: {item.dueDateJalali}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusPill(item.status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRecordId(item.id);
                          }}
                          className="btn small ghost text-xs text-[#6558d9] hover:bg-[#f0eeff]"
                        >
                          بررسی و اقدام
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Surface 2: Active Pipeline & Tracking */}
          <div className="card overview-focus-card">
            <div className="card-head">
              <div>
                <div className="card-title">جریان‌های در حال حرکت</div>
                <div className="card-sub">سفارش‌ها و تحویل‌هایی که هنوز بسته نشده‌اند</div>
              </div>
              <button
                type="button"
                className="link-btn btn ghost small"
                onClick={() => onNavigateToRoute?.('inventory_dispatch')}
              >
                خروج و تحویل
              </button>
            </div>
            <div className="card-body" id="overviewFlowList">
              {flowList.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">●</div>
                  <h3>جریان بازی وجود ندارد</h3>
                  <p>تمامی پرونده‌های در دست پیگیری تکمیل شده یا مختومه گردیده‌اند.</p>
                </div>
              ) : (
                <div className="stack">
                  {flowList.map((item) => (
                    <div
                      key={item.id}
                      className="overview-flow-row hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => setActiveRecordId(item.id)}
                    >
                      <div className="overview-flow-kind shrink-0">
                        {item.linkedBusinessRecord?.category === 'sales_order' ? (
                          <FileText className="w-4 h-4" />
                        ) : item.linkedBusinessRecord?.category === 'warehouse_exit' ? (
                          <Truck className="w-4 h-4" />
                        ) : item.linkedBusinessRecord?.category === 'payment_request' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Boxes className="w-4 h-4" />
                        )}
                      </div>
                      <div className="queue-main">
                        <div className="queue-title font-bold text-[#202333] text-xs">
                          {item.title}
                        </div>
                        <div className="queue-meta flex items-center gap-2 text-[10px] text-[#747c90] mt-0.5">
                          <span className="font-mono font-bold text-[#6558d9]">{item.code}</span>
                          <span>•</span>
                          <span>مسئول: {item.currentAssignee?.name || 'تعیین‌نشده'}</span>
                          {item.statusSinceJalali && (
                            <>
                              <span>•</span>
                              <span>از {item.statusSinceJalali}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusPill(item.status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRecordId(item.id);
                          }}
                          className="mini-btn"
                          title="مشاهده پرونده"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Full Table View matching prototype data-table */
        <div className="space-y-3">
          <div className="toolbar">
            <input
              className="input search"
              placeholder="جست‌وجوی عنوان، کد یا مسئول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">همه اولویت‌ها</option>
              <option value="urgent">فوری</option>
              <option value="high">بالا</option>
              <option value="normal">عادی</option>
              <option value="low">کم</option>
            </select>
            <div className="spacer"></div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setActiveFilter('all');
              }}
            >
              پاک کردن فیلترها
            </button>
          </div>

          <div className="table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>عنوان و شناسه</th>
                    <th>نوع</th>
                    <th>وضعیت</th>
                    <th>اولویت</th>
                    <th>مسئول فعلی</th>
                    <th>مهلت اقدام</th>
                    <th>مرتبط با</th>
                    <th className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-[#747c90]">
                        هیچ رکوردی مطابق با فیلترهای انتخابی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    tableRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="cursor-pointer hover:bg-[#f8f8fd] transition-colors"
                        onClick={() => setActiveRecordId(rec.id)}
                      >
                        <td>
                          <div className="cell-main">{rec.title}</div>
                          <div className="cell-sub font-mono font-bold text-[#6558d9]">{rec.code}</div>
                        </td>
                        <td>
                          <span className="text-xs text-[#555b6d]">
                            {rec.workItemType === 'approval_review' ? 'تأییدیه' : 'کار عملیاتی'}
                          </span>
                        </td>
                        <td>{getStatusPill(rec.status)}</td>
                        <td>
                          <span className={`pill ${rec.priority === 'urgent' ? 'danger' : rec.priority === 'high' ? 'warning' : 'neutral'}`}>
                            {rec.priority === 'urgent' ? 'فوری' : rec.priority === 'high' ? 'بالا' : 'عادی'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs font-bold text-[#202333]">{rec.currentAssignee?.name || '---'}</div>
                          <div className="text-[10px] text-[#747c90]">{rec.currentAssignee?.department || ''}</div>
                        </td>
                        <td>
                          <span className="text-xs text-[#555b6d] font-mono">{rec.dueDateJalali || '---'}</span>
                        </td>
                        <td>
                          {rec.linkedBusinessRecord ? (
                            <div>
                              <span className="text-xs font-bold text-[#202333]">{rec.linkedBusinessRecord.title}</span>
                              <div className="text-[10px] text-[#6558d9] font-mono">{rec.linkedBusinessRecord.code}</div>
                            </div>
                          ) : (
                            <span className="text-[#9aa1b3]">---</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRecordId(rec.id);
                            }}
                            className="btn small ghost text-xs text-[#6558d9] hover:bg-[#f0eeff]"
                          >
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Work Item Detail Drawer */}
      <WorkItemDetailDrawer
        isOpen={Boolean(activeRecord)}
        onClose={() => setActiveRecordId(null)}
        record={activeRecord}
        activePersona={activePersona}
        onStartWork={handleStartWork}
        onAddProgressNote={handleAddProgressNote}
        onSetWaiting={handleSetWaiting}
        onReportBlocker={handleReportBlocker}
        onResolveBlocker={handleResolveBlocker}
        onReassign={handleReassign}
        onReturnWork={handleReturnWork}
        onRejectWork={handleRejectWork}
        onCompleteWork={handleCompleteWork}
        onApproveCompletion={handleApproveCompletion}
        onReturnCompletion={handleReturnCompletion}
        onNavigateToLinkedRecord={onNavigateToLinkedRecord}
      />

      {/* 6. Submit Request Modal */}
      <SubmitRequestModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        activePersona={activePersona}
        onSelectOption={handleSelectRequestOption}
      />
    </div>
  );
};
