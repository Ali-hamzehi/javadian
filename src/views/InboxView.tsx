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
import { EmployeeWorkCard } from '../components/work-item/EmployeeWorkCard';
import { ManagerDecisionCard, getStatusDisplayBadge } from '../components/work-item/ManagerDecisionCard';
import { SubmitRequestModal } from '../components/work-item/SubmitRequestModal';
import { Button } from '../components/design-system/Button';
import { Badge, PriorityBadge } from '../components/design-system/Badges';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import { CurrencyAmount } from '../components/design-system/CurrencyAmount';
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
  CheckCircle2,
  AlertCircle,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Clock,
  RotateCcw,
  Inbox,
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

  // Active Presentation Mode for hybrid personas: 'employee' (کارهای من) | 'manager' (مدیریت و نظارت)
  const [activeMode, setActiveMode] = useState<'employee' | 'manager'>(() => {
    if (initialTab === 'my_approvals' || initialTab === 'approvals') return 'manager';
    if (experienceType === 'manager') return 'manager';
    return 'employee';
  });

  // Sync mode if experienceType changes (e.g., switching personas)
  useEffect(() => {
    if (initialTab === 'my_approvals' || initialTab === 'approvals') {
      setActiveMode('manager');
    } else if (experienceType === 'manager') {
      setActiveMode('manager');
    } else if (experienceType === 'employee') {
      setActiveMode('employee');
    }
  }, [experienceType, initialTab]);

  // Employee Tabs: 'to_do' | 'tracking' | 'history'
  const [employeeTab, setEmployeeTab] = useState<'to_do' | 'tracking' | 'history'>('to_do');

  // Manager Tabs: 'decisions' | 'team_tracking' | 'personal'
  const [managerTab, setManagerTab] = useState<'decisions' | 'team_tracking' | 'personal'>(() => {
    if (initialTab === 'my_approvals' || initialTab === 'approvals') return 'decisions';
    return 'decisions';
  });

  // Manager display style: 'cards' | 'table'
  const [managerViewStyle, setManagerViewStyle] = useState<'cards' | 'table'>('cards');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [managerMetricFilter, setManagerMetricFilter] = useState<'all' | 'blocked' | 'overdue'>('all');

  // Primary filters for Manager
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(() => {
    if (selectedRecordId) {
      const match = authorizedRecords.find((r) => r.id === selectedRecordId || r.code === selectedRecordId);
      return match ? match.id : selectedRecordId;
    }
    return null;
  });

  // Reset active record, drawer, search and filters on persona change (zero data leakage)
  useEffect(() => {
    if (!selectedRecordId) {
      setActiveRecordId(null);
    }
    setSearchQuery('');
    setSelectedPriority('all');
    setSelectedType('all');
    setManagerMetricFilter('all');
    setSelectedDepartment('all');
    setSelectedAssignee('all');
    setSelectedStatus('all');
    setSelectedAge('all');
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
          setManagerTab('decisions');
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

  // Counts for Manager indicators
  const actionableApprovals = useMemo(
    () => authorizedRecords.filter((rec) => mockRepository.isActionableApprovalRecord(activePersona, rec)),
    [authorizedRecords, activePersona]
  );

  const teamBlockedRecords = useMemo(
    () => authorizedRecords.filter((rec) => rec.status === 'blocked' || Boolean(rec.blocker?.exists)),
    [authorizedRecords]
  );

  const teamOverdueRecords = useMemo(
    () =>
      authorizedRecords.filter(
        (rec) =>
          isJalaliOverdue(rec.dueDateJalali) &&
          rec.status !== 'completed' &&
          rec.status !== 'rejected' &&
          rec.status !== 'cancelled'
      ),
    [authorizedRecords]
  );

  // Base list depending on active mode & tab
  const baseRecords = useMemo(() => {
    if (activeMode === 'employee') {
      return filterEmployeeRecords(authorizedRecords, activePersona, employeeTab);
    } else {
      // Manager mode
      if (managerTab === 'decisions') {
        return actionableApprovals;
      }
      if (managerTab === 'team_tracking') {
        let list = authorizedRecords.filter((rec) => {
          const isBlocked = rec.status === 'blocked' || Boolean(rec.blocker?.exists);
          const isOverdue =
            isJalaliOverdue(rec.dueDateJalali) &&
            rec.status !== 'completed' &&
            rec.status !== 'rejected' &&
            rec.status !== 'cancelled';
          const isWaiting = rec.status === 'waiting' || rec.status === 'returned';
          return isBlocked || isOverdue || isWaiting;
        });

        if (managerMetricFilter === 'blocked') {
          list = list.filter((r) => r.status === 'blocked' || Boolean(r.blocker?.exists));
        } else if (managerMetricFilter === 'overdue') {
          list = list.filter(
            (r) =>
              isJalaliOverdue(r.dueDateJalali) &&
              r.status !== 'completed' &&
              r.status !== 'rejected' &&
              r.status !== 'cancelled'
          );
        }
        return list;
      }
      // manager personal tasks
      return authorizedRecords.filter((rec) => {
        const isAssignee =
          rec.currentAssignee?.id === activePersona.id || rec.currentOwner?.id === activePersona.id;
        const isAppr = mockRepository.isActionableApprovalRecord(activePersona, rec);
        const isTerminal = rec.status === 'completed' || rec.status === 'rejected' || rec.status === 'cancelled';
        return isAssignee && !isAppr && !isTerminal;
      });
    }
  }, [activeMode, employeeTab, managerTab, managerMetricFilter, authorizedRecords, activePersona, actionableApprovals]);

  // Available departments & assignees for manager filtering
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    authorizedRecords.forEach((r) => {
      if (r.department) depts.add(r.department);
      if (r.creator?.department) depts.add(r.creator.department);
      if (r.currentAssignee?.department) depts.add(r.currentAssignee.department);
    });
    return Array.from(depts).filter(Boolean);
  }, [authorizedRecords]);

  const availableAssignees = useMemo(() => {
    const map = new Map<string, string>();
    authorizedRecords.forEach((r) => {
      const p = r.currentAssignee || r.currentOwner;
      if (p?.id && p?.name) map.set(p.id, p.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [authorizedRecords]);

  // Filtered records by search & advanced filters
  const displayedRecords = useMemo(() => {
    return baseRecords.filter((rec) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = rec.code.toLowerCase().includes(q);
        const matchTitle = rec.title.toLowerCase().includes(q);
        const matchSummary = (rec.itemSummary || '').toLowerCase().includes(q);
        const matchAssignee = rec.currentAssignee?.name.toLowerCase().includes(q) || false;
        const matchOwner = rec.owner?.name.toLowerCase().includes(q) || false;
        const matchCreator = rec.creator.name.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchSummary && !matchAssignee && !matchOwner && !matchCreator) {
          return false;
        }
      }

      // 2. Department Filter
      if (selectedDepartment !== 'all') {
        const matchesDept =
          rec.department === selectedDepartment ||
          rec.creator?.department === selectedDepartment ||
          rec.currentAssignee?.department === selectedDepartment;
        if (!matchesDept) return false;
      }

      // 3. Assignee Filter
      if (selectedAssignee !== 'all') {
        const matchesAssignee =
          rec.currentAssignee?.id === selectedAssignee ||
          rec.currentOwner?.id === selectedAssignee;
        if (!matchesAssignee) return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'blocked') {
          if (rec.status !== 'blocked' && !rec.blocker?.exists) return false;
        } else if (selectedStatus === 'overdue') {
          const isOvd =
            isJalaliOverdue(rec.dueDateJalali) &&
            rec.status !== 'completed' &&
            rec.status !== 'rejected' &&
            rec.status !== 'cancelled';
          if (!isOvd) return false;
        } else if (selectedStatus === 'urgent') {
          if (rec.priority !== 'urgent' && rec.priority !== 'critical') return false;
        } else if (selectedStatus === 'waiting') {
          if (rec.status !== 'waiting') return false;
        } else if (selectedStatus === 'approved') {
          if (rec.status !== 'approved') return false;
        } else if (selectedStatus === 'returned') {
          if (rec.status !== 'returned') return false;
        } else if (selectedStatus === 'rejected') {
          if (rec.status !== 'rejected') return false;
        } else if (rec.status !== selectedStatus) {
          return false;
        }
      }

      // 5. Age / Holding Time Filter
      if (selectedAge !== 'all') {
        const duration = (rec.currentAssignee as any)?.durationHours || (rec.currentOwner as any)?.durationHours || 0;
        if (selectedAge === '24h' && duration < 24) return false;
        if (selectedAge === '48h' && duration < 48) return false;
        if (selectedAge === '72h' && duration < 72) return false;
      }

      // 6. Priority Filter
      if (selectedPriority !== 'all' && rec.priority !== selectedPriority) {
        return false;
      }

      // 7. Type Filter
      if (selectedType !== 'all') {
        if (selectedType === 'approval_review') {
          const isAppr = rec.workItemType === 'approval_review' || rec.type === 'approval' || Boolean(rec.approvalInstance);
          if (!isAppr) return false;
        } else if (rec.workItemType !== selectedType && rec.type !== selectedType) {
          return false;
        }
      }

      return true;
    });
  }, [
    baseRecords,
    searchQuery,
    selectedDepartment,
    selectedAssignee,
    selectedStatus,
    selectedAge,
    selectedPriority,
    selectedType,
  ]);

  // Operational Action Handlers
  const actorObj: Person = {
    id: activePersona.id,
    name: activePersona.name,
    role: activePersona.jobTitle,
    department: activePersona.department,
    avatar: activePersona.avatar,
  };

  const handleStartWork = (recordId: string) => {
    mockRepository.startWorkItem(recordId, actorObj);
    addToast('کار با موفقیت آغاز شد و در وضعیت در دست اقدام قرار گرفت.', { tone: 'success' });
  };

  const handleAddProgressNote = (recordId: string, note: string) => {
    mockRepository.addProgressNote(recordId, actorObj, note);
    addToast('یادداشت پیشرفت در رویدادنگار کار ثبت شد.', { tone: 'info' });
  };

  const handleSetWaiting = (recordId: string, reason: string) => {
    mockRepository.setWaitingStatus(recordId, actorObj, reason);
    addToast('وضعیت کار به معلق / در انتظار تغییر یافت.', { tone: 'warning' });
  };

  const handleReportBlocker = (
    recordId: string,
    reason: string,
    severity: 'warning' | 'critical',
    plan?: string
  ) => {
    mockRepository.raiseBlocker(recordId, activePersona.name, reason, severity);
    if (plan) {
      const rec = mockRepository.getRecordById(recordId);
      if (rec && rec.blocker) {
        rec.blocker.resolutionPlan = plan;
      }
    }
    addToast('مانع کاری با موفقیت ثبت و کار مسدود گردید.', { tone: 'danger' });
  };

  const handleResolveBlocker = (recordId: string, note: string) => {
    mockRepository.resolveBlocker(recordId, activePersona.name, note);
    addToast('مانع برطرف شد و کار به چرخه اقدام بازگشت.', { tone: 'success' });
  };

  const handleReassign = (
    recordId: string,
    newAssignee: Person,
    reason?: string,
    isDelegation?: boolean
  ) => {
    const success = mockRepository.reassignWorkItem(recordId, actorObj, newAssignee, reason, isDelegation);
    if (success) {
      addToast(`کار با موفقیت به ${newAssignee.name} ارجاع گردید.`, { tone: 'success' });
    } else {
      addToast('ارجاع کار به دلیل عدم انطباق با اختیارات سازمانی مجاز انجام نشد.', { tone: 'danger' });
    }
  };

  const handleReturnWork = (recordId: string, reason: string) => {
    const targetRec = authorizedRecords.find((r) => r.id === recordId) || mockRepository.getRecordById(recordId);
    if (targetRec?.linkedBusinessRecord?.category === 'payment_request') {
      const success = decidePayment(recordId, activePersona.id, 'returned', reason);
      addToast(
        success ? 'درخواست پرداخت جهت اصلاح به متقاضی برگشت داده شد.' : 'این تصمیم در وضعیت فعلی مجاز نیست.',
        { tone: success ? 'warning' : 'danger' }
      );
      return;
    }
    if (targetRec?.linkedBusinessRecord?.category === 'sales_order') {
      const soId = targetRec.linkedBusinessRecord.id;
      if (mockSalesWarehouseStore.getSalesOrderById(soId)?.linkedWorkItemId !== recordId) {
        addToast('این نگارش منسوخ است؛ لطفاً نگارش جاری را بررسی کنید.', { tone: 'danger' });
        return;
      }
      const orderCode = targetRec.linkedBusinessRecord.code;
      const result = mockSalesWarehouseStore.returnSalesOrder(soId, activePersona, reason);
      if (result.success) {
        addToast(`سفارش فروش ${orderCode} جهت اصلاح به کارشناس برگشت داده شد.`, { tone: 'warning' });
      } else {
        addToast(result.message || 'خطا در بازگشت سفارش', { tone: 'danger' });
      }
    } else {
      mockRepository.returnWorkItem(recordId, actorObj, reason);
      addToast('کار جهت رفع نواقص عودت داده شد.', { tone: 'warning' });
    }
  };

  const handleRejectWork = (recordId: string, reason: string) => {
    const targetRec = authorizedRecords.find((r) => r.id === recordId) || mockRepository.getRecordById(recordId);
    if (targetRec?.linkedBusinessRecord?.category === 'payment_request') {
      const success = decidePayment(recordId, activePersona.id, 'rejected', reason);
      addToast(
        success ? 'درخواست پرداخت رسماً رد شد.' : 'این اقدام در وضعیت فعلی مجاز نیست.',
        { tone: success ? 'danger' : 'danger' }
      );
      return;
    }
    if (targetRec?.linkedBusinessRecord?.category === 'sales_order') {
      const soId = targetRec.linkedBusinessRecord.id;
      if (mockSalesWarehouseStore.getSalesOrderById(soId)?.linkedWorkItemId !== recordId) {
        addToast('این نگارش منسوخ است؛ لطفاً نگارش جاری را بررسی کنید.', { tone: 'danger' });
        return;
      }
      const orderCode = targetRec.linkedBusinessRecord.code;
      const result = mockSalesWarehouseStore.rejectSalesOrder(soId, activePersona, reason);
      if (result.success) {
        addToast(`سفارش فروش ${orderCode} رسماً رد شد.`, { tone: 'danger' });
      } else {
        addToast(result.message || 'خطا در رد سفارش', { tone: 'danger' });
      }
    } else {
      mockRepository.rejectWorkItem(recordId, actorObj, reason);
      addToast('کار رد شد.', { tone: 'danger' });
    }
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
        addToast('این نگارش منسوخ است؛ کارتابل نسخه جاری را باز کنید.', { tone: 'danger' });
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

  return (
    <div className="space-y-4">
      {/* Top Header Card: Title, Persona info, Hybrid presentation toggle, and Submit Request button */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title text-xl sm:text-2xl font-black text-slate-900">
                {activeMode === 'manager' ? 'میز تصمیم‌گیری و نظارت بر تیم' : 'کارهای من'}
              </h1>
              <div className="inline-flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900">
                  {getPersonaDisplayName(activePersona)}
                </span>
                <span
                  className={`text-caption px-2 py-0.5 rounded-full font-bold border ${
                    getPersonaTypeLabel(activePersona) === 'نقش سازمانی'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {getPersonaTypeLabel(activePersona)}
                </span>
                {getPersonaSubtitle(activePersona) && (
                  <span className="text-caption text-slate-500 font-medium">
                    ({getPersonaSubtitle(activePersona)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Hybrid Role Presentation Switcher (presentation-only, creates NO fake permissions) */}
            {experienceType === 'hybrid' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveMode('employee')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeMode === 'employee'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  کارهای من
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('manager')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeMode === 'manager'
                      ? 'bg-white text-primary-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مدیریت و نظارت
                </button>
              </div>
            )}

            {/* Button «ثبت درخواست» */}
            {authorizedRequestTypes.length > 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (authorizedRequestTypes.length === 1 && authorizedRequestTypes[0].actionType !== 'assign_task') {
                    handleSelectRequestOption(authorizedRequestTypes[0]);
                  } else {
                    setIsSubmitModalOpen(true);
                  }
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                ثبت درخواست
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                leftIcon={<Plus className="w-4 h-4 opacity-40" />}
                title="برای این حساب کاربری، مجوز ثبت درخواست جدید تعریف نشده است."
                className="opacity-50 cursor-not-allowed text-slate-400 border-slate-200"
              >
                ثبت درخواست (فاقد مجوز)
              </Button>
            )}
          </div>
        </div>

        {/* Employee 4-Card Operational Summary Grid */}
        {activeMode === 'employee' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setEmployeeTab('to_do');
                setSelectedPriority('all');
                setSelectedType('all');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                employeeTab === 'to_do'
                  ? 'border-primary-400 bg-primary-50/60 shadow-xs ring-1 ring-primary-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">برای انجام</div>
              <div className="text-lg font-black text-primary-900 mt-0.5">
                {toPersianDigits(employeeCounts.toDo)} کار
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeTab('tracking');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                employeeTab === 'tracking'
                  ? 'border-sky-400 bg-sky-50/60 shadow-xs ring-1 ring-sky-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">برای پیگیری</div>
              <div className="text-lg font-black text-sky-900 mt-0.5">
                {toPersianDigits(employeeCounts.tracking)} مورد
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeTab('to_do');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                employeeCounts.blocked > 0
                  ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">مسدود</div>
              <div className={`text-lg font-black mt-0.5 ${employeeCounts.blocked > 0 ? 'text-rose-800' : 'text-slate-700'}`}>
                {toPersianDigits(employeeCounts.blocked)} کار
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmployeeTab('history');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                employeeTab === 'history'
                  ? 'border-emerald-400 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">انجام‌شده اخیر</div>
              <div className="text-lg font-black text-emerald-900 mt-0.5">
                {toPersianDigits(employeeCounts.recentCompleted)} کار
              </div>
            </button>
          </div>
        )}

        {/* Manager Actionable KPI Metric Cards (4 core indicators) */}
        {activeMode === 'manager' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setManagerTab('decisions');
                setManagerMetricFilter('all');
                setSelectedStatus('all');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                managerTab === 'decisions' && managerMetricFilter === 'all'
                  ? 'border-primary-400 bg-primary-50/60 shadow-xs ring-1 ring-primary-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">تصمیم‌های در انتظار</div>
              <div className="text-lg font-black text-primary-900 mt-0.5">
                {toPersianDigits(actionableApprovals.length)} پرونده
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setManagerTab('team_tracking');
                setManagerMetricFilter('blocked');
                setSelectedStatus('blocked');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                managerTab === 'team_tracking' && managerMetricFilter === 'blocked'
                  ? 'border-rose-400 bg-rose-50/60 shadow-xs ring-1 ring-rose-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">کارهای مسدود</div>
              <div className="text-lg font-black text-rose-800 mt-0.5">
                {toPersianDigits(teamBlockedRecords.length)} پرونده
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setManagerTab('team_tracking');
                setManagerMetricFilter('overdue');
                setSelectedStatus('overdue');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                managerTab === 'team_tracking' && managerMetricFilter === 'overdue'
                  ? 'border-amber-400 bg-amber-50/60 shadow-xs ring-1 ring-amber-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">کارهای معوق</div>
              <div className="text-lg font-black text-amber-900 mt-0.5">
                {toPersianDigits(teamOverdueRecords.length)} پرونده
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setManagerTab('team_tracking');
                setManagerMetricFilter('all');
                setSelectedStatus('all');
              }}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                managerTab === 'team_tracking' && managerMetricFilter === 'all'
                  ? 'border-sky-400 bg-sky-50/60 shadow-xs ring-1 ring-sky-300/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-caption text-slate-500 font-medium">پیگیری تیم</div>
              <div className="text-lg font-black text-sky-900 mt-0.5">
                {toPersianDigits(
                  teamBlockedRecords.length +
                    teamOverdueRecords.length +
                    authorizedRecords.filter((r) => r.status === 'waiting' || r.status === 'returned').length
                )}{' '}
                پرونده
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Row & Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
          {/* Active Mode Tabs */}
          {activeMode === 'employee' ? (
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setEmployeeTab('to_do')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  employeeTab === 'to_do'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>برای انجام</span>
                <span className={`px-1.5 py-0.2 rounded-full text-caption font-mono ${
                  employeeTab === 'to_do' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(filterEmployeeRecords(authorizedRecords, activePersona, 'to_do').length)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeTab('tracking')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  employeeTab === 'tracking'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>برای پیگیری</span>
                <span className={`px-1.5 py-0.2 rounded-full text-caption font-mono ${
                  employeeTab === 'tracking' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(filterEmployeeRecords(authorizedRecords, activePersona, 'tracking').length)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEmployeeTab('history')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  employeeTab === 'history'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>سابقه</span>
                <span className={`px-1.5 py-0.2 rounded-full text-caption font-mono ${
                  employeeTab === 'history' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(filterEmployeeRecords(authorizedRecords, activePersona, 'history').length)}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => {
                  setManagerTab('decisions');
                  setManagerMetricFilter('all');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  managerTab === 'decisions'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>تصمیم‌های در انتظار</span>
                <span className={`px-1.5 py-0.2 rounded-full text-caption font-mono ${
                  managerTab === 'decisions' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(actionableApprovals.length)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setManagerTab('team_tracking');
                  setManagerMetricFilter('all');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  managerTab === 'team_tracking'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>پیگیری تیم</span>
                <span className={`px-1.5 py-0.2 rounded-full text-caption font-mono ${
                  managerTab === 'team_tracking' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(
                    teamBlockedRecords.length +
                      teamOverdueRecords.length +
                      authorizedRecords.filter((r) => r.status === 'waiting' || r.status === 'returned').length
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManagerTab('personal')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                  managerTab === 'personal'
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>کارهای شخصی من</span>
              </button>
            </div>
          )}

          {/* View Switcher for Manager (Cards vs Table) with clear text labels & active state */}
          {activeMode === 'manager' && (
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setManagerViewStyle('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  managerViewStyle === 'cards'
                    ? 'bg-white text-primary-800 shadow-xs font-extrabold ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمای کارتی برای مرور سریع پرونده‌ها"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>نمای کارت</span>
              </button>
              <button
                type="button"
                onClick={() => setManagerViewStyle('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  managerViewStyle === 'table'
                    ? 'bg-white text-primary-800 shadow-xs font-extrabold ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="نمای جدولی فشرده مخصوص دسکتاپ"
              >
                <List className="w-3.5 h-3.5" />
                <span>نمای جدول</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Filters Toolbar: Search + Unit + Assignee + Status + Age */}
        <div className="space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان کار، کد، متقاضی یا متن..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary-500 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Primary Filter 1: Unit / Department */}
            {activeMode === 'manager' && availableDepartments.length > 0 && (
              <div className="w-auto min-w-[130px]">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden"
                >
                  <option value="all">همه واحدها</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Primary Filter 2: Responsible Person */}
            {activeMode === 'manager' && availableAssignees.length > 0 && (
              <div className="w-auto min-w-[130px]">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden"
                >
                  <option value="all">همه مسئولان</option>
                  {availableAssignees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Primary Filter 3: Status */}
            {activeMode === 'manager' && (
              <div className="w-auto min-w-[120px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="waiting">در انتظار</option>
                  <option value="blocked">مسدود</option>
                  <option value="overdue">معوق</option>
                  <option value="urgent">فوری</option>
                  <option value="approved">تأیید شده</option>
                  <option value="returned">عودت داده شده</option>
                  <option value="rejected">رد شده</option>
                </select>
              </div>
            )}

            {/* Primary Filter 4: Age / Holding Time */}
            {activeMode === 'manager' && (
              <div className="w-auto min-w-[120px]">
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden"
                >
                  <option value="all">همه سنین کار</option>
                  <option value="24h">بیش از ۲۴ ساعت</option>
                  <option value="48h">بیش از ۴۸ ساعت</option>
                  <option value="72h">بیش از ۳ روز</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                isFiltersOpen || selectedPriority !== 'all' || selectedType !== 'all'
                  ? 'border-primary-400 bg-primary-50 text-primary-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فیلترهای بیشتر</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>

            {(searchQuery ||
              selectedPriority !== 'all' ||
              selectedType !== 'all' ||
              selectedDepartment !== 'all' ||
              selectedAssignee !== 'all' ||
              selectedStatus !== 'all' ||
              selectedAge !== 'all' ||
              managerMetricFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPriority('all');
                  setSelectedType('all');
                  setSelectedDepartment('all');
                  setSelectedAssignee('all');
                  setSelectedStatus('all');
                  setSelectedAge('all');
                  setManagerMetricFilter('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 font-medium cursor-pointer"
              >
                پاک‌کردن فیلترها
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {isFiltersOpen && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-caption text-slate-500 font-medium">نوع کار:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden"
              >
                <option value="all">همه انواع کار</option>
                {activeMode === 'manager' && (
                  <option value="approval_review">تصمیم‌گیری و تأیید</option>
                )}
                <option value="general">اقدام عمومی</option>
                <option value="review">بازبینی و کنترل</option>
                <option value="followup">پیگیری</option>
                <option value="coordination">هماهنگی</option>
                <option value="field_op">عملیات میدانی</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-caption text-slate-500 font-medium">اولویت:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-hidden"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value="urgent">فوری</option>
                <option value="high">بالا</option>
                <option value="normal">عادی</option>
                <option value="low">پایین</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Records List / Table */}
      {displayedRecords.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="font-bold text-slate-800 text-sm">
            {searchQuery || selectedPriority !== 'all' || selectedType !== 'all'
              ? 'هیچ موردی مطابق با جستجو یا فیلترها یافت نشد'
              : activeMode === 'employee'
              ? employeeTab === 'to_do'
                ? 'در حال حاضر کاری برای انجام ندارید.'
                : employeeTab === 'tracking'
                ? 'درخواستی در دست پیگیری ندارید'
                : 'سابقه کاری برای نمایش وجود ندارد'
              : managerTab === 'decisions'
              ? 'هیچ تصمیمی در انتظار شما نیست'
              : 'هیچ کار متوقف یا معوقی در تیم وجود ندارد'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedPriority !== 'all' || selectedType !== 'all'
              ? 'لطفاً فیلترها را پاک کنید یا عبارت دیگری را جستجو فرمایید.'
              : activeMode === 'employee' && employeeTab === 'to_do'
              ? 'وظیفه جدیدی به شما محول نشده است.'
              : 'تمام پرونده‌های این بخش رسیدگی شده‌اند.'}
          </p>
        </div>
      ) : activeMode === 'manager' && managerViewStyle === 'table' ? (
        /* Manager Dense Table (Desktop only) + Mobile Card Fallback */
        <div>
          {/* Desktop Dense Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
            <AdaptiveTable>
              <thead>
                <tr className="bg-slate-50/80 text-right text-xs font-bold text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-4">کد</th>
                  <th className="py-3 px-4">عنوان کار</th>
                  <th className="py-3 px-4">متقاضی</th>
                  <th className="py-3 px-4">مسئول فعلی</th>
                  <th className="py-3 px-4">مبلغ</th>
                  <th className="py-3 px-4">مهلت</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-center">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">{rec.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">{rec.title}</td>
                    <td className="py-3 px-4 text-slate-700">{rec.creator.name}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {rec.currentAssignee?.name || rec.currentOwner?.name || 'نامشخص'}
                    </td>
                    <td className="py-3 px-4">
                      {rec.requestedAmountRials != null && rec.requestedAmountRials > 0 ? (
                        <CurrencyAmount amountRials={rec.requestedAmountRials} layout="dual" size="sm" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.dueDateJalali || '—'}</td>
                    <td className="py-3 px-4">
                      {getStatusDisplayBadge(rec.status, rec.statusLabel)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => setActiveRecordId(rec.id)}>
                        بررسی
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdaptiveTable>
          </div>

          {/* Mobile Card Fallback for Table View */}
          <div className="md:hidden space-y-3">
            {displayedRecords.map((rec) => (
              <ManagerDecisionCard
                key={rec.id}
                record={rec}
                activePersona={activePersona}
                mode={managerTab}
                onOpenDrawer={(id) => setActiveRecordId(id)}
                onApprove={(id) => handleApproveCompletion(id)}
                onReturn={(id) => handleReturnWork(id, 'عودت از کارتابل تصمیم‌گیری مدیر')}
                onReject={(id) => handleRejectWork(id, 'رد از کارتابل تصمیم‌گیری مدیر')}
              />
            ))}
          </div>
        </div>
      ) : activeMode === 'manager' ? (
        /* Manager Card View */
        <div className="space-y-3">
          {displayedRecords.map((rec) => (
            <ManagerDecisionCard
              key={rec.id}
              record={rec}
              activePersona={activePersona}
              mode={managerTab}
              onOpenDrawer={(id) => setActiveRecordId(id)}
              onApprove={(id) => handleApproveCompletion(id)}
              onReturn={(id) => handleReturnWork(id, 'عودت از کارتابل تصمیم‌گیری مدیر')}
              onReject={(id) => handleRejectWork(id, 'رد از کارتابل تصمیم‌گیری مدیر')}
            />
          ))}
        </div>
      ) : (
        /* Employee Card View */
        <div className="space-y-3">
          {displayedRecords.map((rec) => (
            <EmployeeWorkCard
              key={rec.id}
              record={rec}
              activePersona={activePersona}
              activeTab={employeeTab}
              onOpenDrawer={(id) => setActiveRecordId(id)}
              onStartWork={handleStartWork}
            />
          ))}
        </div>
      )}

      {/* Dedicated Work Item Detail Drawer */}
      <WorkItemDetailDrawer
        key={`${activeRecord?.id}-${activePersona.id}`}
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

      {/* Submit Request Modal */}
      <SubmitRequestModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        activePersona={activePersona}
        onSelectOption={handleSelectRequestOption}
      />
    </div>
  );
};
