import { FieldGroup } from '../components/design-system/FieldGroup';
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, List, Map as MapIcon, Play, Square, ShieldCheck, CheckCircle2, Clock, FileText, CreditCard, Calendar, Phone, ArrowRight, WifiOff, RefreshCw, Plus, Building, User, ExternalLink, Upload, MessageSquare, Check, AlertTriangle, Eye, ShieldAlert, Lock } from 'lucide-react';
import {
  MockPersona,
  FieldVisitRecord,
  VisitOutcomeType,
  CustomerChangeRequest,
  OfflineQueueItem,
  OfflineItemStatus,
  ManualIntakeRecord,
  ManualIntakeChannel,
  OperationalRecord,
} from '../types';
import { MOCK_FIELD_VISITS, MOCK_OFFLINE_QUEUE, MOCK_MANUAL_INTAKES } from '../data/mockOperationsPrompt4';
import { MOCK_PERSONAS } from '../data/mockData';
import { mockRepository } from '../runtime/workflow';
import { Button } from '../components/design-system/Button';
import { StatusBadge, Badge, PriorityBadge } from '../components/design-system/Badges';
import { Modal } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { ConflictState, OfflineBanner } from '../components/design-system/SystemStates';
import { toPersianDigits, formatRials } from '../utils/formatters';
import { getChannelDisplayName } from '../utils/channelMapper';
import { getPersonaDisplayName, stripRoleSampleSuffix } from '../runtime/documentBasedPersonas';

interface FieldSalesViewProps {
  activePersona: MockPersona;
  initialTab?: 'visit_plans' | 'sales_calls' | 'field_followups' | 'field_manager';
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

type FieldTabKey = 'visit_plans' | 'sales_calls' | 'field_followups' | 'field_manager';

export const FieldSalesView: React.FC<FieldSalesViewProps> = ({
  activePersona,
  initialTab = 'visit_plans',
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<FieldTabKey>(initialTab);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Visits State
  const [visits, setVisits] = useState<FieldVisitRecord[]>(MOCK_FIELD_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisitRecord | null>(null);

  // Shift Management State
  const [isShiftActive, setIsShiftActive] = useState<boolean>(true);
  const [shiftStartTime, setShiftStartTime] = useState<string>('۰۸:۳۰');
  const [shiftEndTime, setShiftEndTime] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // Offline / Connectivity Simulation State
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(MOCK_OFFLINE_QUEUE);
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Calls & Messenger Intake State
  const [intakes, setIntakes] = useState<ManualIntakeRecord[]>(MOCK_MANUAL_INTAKES);
  const [selectedIntake, setSelectedIntake] = useState<ManualIntakeRecord | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Modals
  const [activeModal, setActiveModal] = useState<
    | 'result'
    | 'draft_order'
    | 'receipt'
    | 'followup'
    | 'change_request'
    | 'conflict_resolve'
    | 'new_intake'
    | 'convert_intake'
    | null
  >(null);

  // Form States: Mandatory Result
  const [resultOutcome, setResultOutcome] = useState<VisitOutcomeType>('success_draft');
  const [resultNotes, setResultNotes] = useState('');
  const [resultError, setResultError] = useState<string | null>(null);
  const [hasChangeRequest, setHasChangeRequest] = useState(false);
  const [changeReqAddress, setChangeReqAddress] = useState('');
  const [changeReqPhone, setChangeReqPhone] = useState('');

  // Form States: Draft Order
  const [draftProduct, setDraftProduct] = useState('روغن سرخ‌کردنی شفاف ۱.۵ لیتری پت');
  const [draftQty, setDraftQty] = useState('۴۰۰');
  const [draftAmount, setDraftAmount] = useState('۶,۴۰۰,۰۰۰,۰۰۰');
  const [draftTerm, setDraftTerm] = useState('نقدی ۳۰٪ پیش‌پرداخت، مابقی چک صیادی ۳۰ روزه');

  // Form States: Receipt Submission
  const [receiptTracking, setReceiptTracking] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptBank, setReceiptBank] = useState('بانک ملت');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Form States: Follow-up Creation
  const [followupTitle, setFollowupTitle] = useState('');
  const [followupAssigneeId, setFollowupAssigneeId] = useState<string>(activePersona.id);
  const [followupDueDate, setFollowupDueDate] = useState('۱۴۰۴/۰۶/۱۵');
  const [followupNotes, setFollowupNotes] = useState('');
  const [followupError, setFollowupError] = useState<string | null>(null);

  // Form States: New Call/Messenger Intake
  const [newIntakeChannel, setNewIntakeChannel] = useState<ManualIntakeChannel>('phone');
  const [newIntakeDirection, setNewIntakeDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [newIntakeSenderName, setNewIntakeSenderName] = useState('');
  const [newIntakeSenderContact, setNewIntakeSenderContact] = useState('');
  const [newIntakeSenderCompany, setNewIntakeSenderCompany] = useState('');
  const [newIntakeSummary, setNewIntakeSummary] = useState('');
  const [newIntakePriority, setNewIntakePriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  // Intake Conversion Modal
  const [convertTargetType, setConvertTargetType] = useState<'followup' | 'draft_order' | 'task'>('followup');
  const [convertAssigneeId, setConvertAssigneeId] = useState<string>(activePersona.id);
  const [convertTitle, setConvertTitle] = useState('');
  const [convertDueDate, setConvertDueDate] = useState('۱۴۰۴/۰۶/۱۴');

  // Conflict Resolution
  const [activeConflictItem, setActiveConflictItem] = useState<OfflineQueueItem | null>(null);

  // Sync initial tab when changed from props
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Determine authorized visits based on Persona:
  // Non-managers see strictly their assigned customers
  const isVisitorPersona = activePersona.personaKey === 'field_sales_visitor';
  const isManagerOrAdmin =
    activePersona.isManager ||
    activePersona.capabilities.includes('MANAGEMENT_VIEW') ||
    activePersona.capabilities.includes('sales.approve');

  const [visitorFilter, setVisitorFilter] = useState<string>(isVisitorPersona ? activePersona.name : 'all');

  const assignedVisits = useMemo(() => {
    if (isVisitorPersona) {
      // Strictly assigned visits for the logged-in visitor persona
      return visits.filter(
        (v) =>
          v.assignedSalespersonId === activePersona.id ||
          v.assignedSalespersonName === activePersona.name
      );
    }
    if (visitorFilter !== 'all') {
      return visits.filter((v) => v.assignedSalespersonName === visitorFilter || (visitorFilter === 'کارشناس فروش' && v.assignedSalespersonName === 'کارشناس فروش — نقش نمونه'));
    }
    return visits;
  }, [visits, activePersona, isVisitorPersona, visitorFilter]);

  // Counts for Badges
  const pendingQueueCount = offlineQueue.filter((q) => q.status === 'queued' || q.status === 'conflict').length;
  const conflictCount = offlineQueue.filter((q) => q.status === 'conflict').length;
  const missingResultVisits = visits.filter((v) => v.status === 'in_progress' && !v.mandatoryResult);
  const overdueFollowupsCount = 2; // Pre-calculated mock indicator

  // Shift Management Handlers
  const handleToggleShift = () => {
    if (isShiftActive) {
      const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setIsShiftActive(false);
      setShiftEndTime(timeNow);
      addToast('شیفت کاری میدانی خاتمه یافت', {
        description: `ساعت پایان: ${timeNow} • موقعیت مکانی غیرفعال شد (هیچ داده‌ای در پس‌زمینه ارسال نمی‌شود).`,
        tone: 'info',
      });
    } else {
      const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setIsShiftActive(true);
      setShiftStartTime(timeNow);
      setShiftEndTime(null);
      addToast('شیفت کاری میدانی آغاز گردید', {
        description: `ساعت شروع: ${timeNow} • موقعیت مکانی صرفاً برای ثبت رویدادمحور فعال شد.`,
        tone: 'success',
      });
    }
  };

  // Check-In Handler with Shift Enforcement & Mock Location
  const handleCheckIn = (visit: FieldVisitRecord) => {
    if (!isShiftActive) {
      addToast('خطا: شیفت کاری غیرفعال است', {
        description: 'موقعیت مکانی و ثبت رویداد خارج از شیفت فعال در دسترس نیست. ابتدا دکمه شروع شیفت را بفشارید.',
        tone: 'error',
      });
      return;
    }

    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const mockEvidence = {
      latitude: 35.6892,
      longitude: 51.389,
      accuracyMeters: 20,
      addressDescriptor: `${visit.province}، ${visit.city}، ${visit.address}`,
      capturedAtTime: timeNow,
    };

    setVisits((prev) =>
      prev.map((v) =>
        v.id === visit.id
          ? {
              ...v,
              status: 'in_progress',
              checkInTime: timeNow,
              mockLocationEvidence: mockEvidence,
              eventLocationNote: `ثبت ورود با موقعیت رویدادمحور (${visit.city} - دقت ۲۰ متر)`,
            }
          : v
      )
    );

    addToast(`ورود به محل «${visit.customerName}» ثبت شد`, {
      description: `ساعت: ${timeNow} • موقعیت ثبت شد. جلسه آغاز گردید.`,
      tone: 'success',
    });
  };

  // Mandatory Visit Result Handler
  const handleSaveResult = () => {
    if (!selectedVisit) return;
    if (!resultOutcome) {
      setResultError('لطفاً نتیجه قطعی جلسه ویزیت را مشخص کنید.');
      return;
    }
    if (!resultNotes.trim() || resultNotes.trim().length < 5) {
      setResultError('ثبت یادداشت و توضیحات نتیجه ویزیت الزامی است (حداقل ۵ کاراکتر).');
      return;
    }

    setResultError(null);
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const outcomeLabels: Partial<Record<VisitOutcomeType, string>> = {
      success_order: 'موفق • عقد قرارداد یا سفارش قطعی',
      success_draft: 'موفق • صدور پیش‌نویس سفارش',
      success_payment: 'موفق • تسویه مالی / دریافت فیش',
      renegotiation_needed: 'نیازمند مذاکره مجدد و اصلاح نرخ',
      customer_absent: 'عدم حضور تصمیم‌گیرنده در محل',
      competitor_preferred: 'ترجیح برند رقیب (ملاحظات قیمت/تسویه)',
      financial_dispute: 'وجود اختلاف حساب یا چک معوق',
      cancelled_by_customer: 'لغو جلسه توسط خریدار',
      followup_needed: 'نیازمند پیگیری بعدی',
      absent: 'عدم حضور مشتری',
      change_request: 'درخواست تغییر مشخصات مشتری',
      customer_cancelled: 'لغو توسط خریدار',
      location_mismatch: 'مغایرت آدرس یا موقعیت',
    };

    const outcomeLabel = outcomeLabels[resultOutcome] || 'ثبت‌شده';
    const mandatoryResultData = {
      outcome: resultOutcome,
      outcomeLabel,
      notes: resultNotes,
      registeredAtJalali: `۱۴۰۴/۰۶/۱۱ - ${timeNow}`,
      customerChangeRequest: hasChangeRequest
        ? {
            customerId: selectedVisit.customerId,
            newAddress: changeReqAddress || undefined,
            newPhone: changeReqPhone || undefined,
            notes: 'درخواست تغییر مشخصات اظهارشده در ویزیت',
          }
        : undefined,
    };

    const updatedVisits = visits.map((v) =>
      v.id === selectedVisit.id
        ? {
            ...v,
            status: 'completed' as const,
            checkOutTime: timeNow,
            mandatoryResult: mandatoryResultData,
          }
        : v
    );
    setVisits(updatedVisits);

    // If change request was filed, route to Master Data / Customer Review WorkItem
    if (hasChangeRequest && (changeReqAddress || changeReqPhone)) {
      const changeTaskId = `rec-cust-rev-${Date.now()}`;
      const changeRecord: OperationalRecord = {
        id: changeTaskId,
        code: `CRV-1404-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `بررسی و اصلاح مشخصات پایه مشتری: ${selectedVisit.customerName}`,
        type: 'general_task',
        typeLabel: 'بررسی داده پایه مشتریان',
        itemSummary: `درخواست اصلاح اطلاعات تماس/نشانی مشتری ${selectedVisit.customerName} از صورتجلسه ویزیت حضوری ${selectedVisit.code}:\nنشانی جدید: ${changeReqAddress || 'بدون تغییر'}\nتلفن جدید: ${changeReqPhone || 'بدون تغییر'}`,
        unit: 'اطلاعات پایه و امور مشتریان',
        tags: ['داده پایه', 'مشتری', 'اصلاح پروفایل', selectedVisit.customerName],
        creator: {
          id: activePersona.id,
          name: getPersonaDisplayName(activePersona),
          role: stripRoleSampleSuffix(activePersona.jobTitle),
          department: activePersona.department,
        },
        currentOwner: {
          id: 'p-comm-approver',
          name: 'تأییدکننده بازرگانی',
          role: 'تأییدکننده بازرگانی',
          department: 'معاونت بازرگانی',
          heldSinceJalali: 'هم‌اکنون',
          durationHours: 0,
        },
        currentAssignee: {
          id: 'p-comm-approver',
          name: 'تأییدکننده بازرگانی',
          role: 'تأییدکننده بازرگانی',
          department: 'معاونت بازرگانی',
        },
        status: 'in_progress',
        statusLabel: 'در انتظار بررسی داده پایه',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        createdAtJalali: '۱۴۰۴/۰۶/۱۱',
        statusSinceJalali: 'هم‌اکنون',
        nextAction: {
          title: 'بررسی مدارک هویتی و تصویب تغییر نشانی/تلفن در پایگاه مشتریان',
          responsibleRole: 'تأییدکننده بازرگانی',
          responsiblePersonName: 'تأییدکننده بازرگانی',
          dueJalali: '۱۴۰۴/۰۶/۱۲',
          suggestedAction: 'review',
        },
        linkedBusinessRecord: {
          id: selectedVisit.id,
          code: selectedVisit.code,
          title: `ویزیت مشتری ${selectedVisit.customerName}`,
          category: 'customer_visit',
          categoryLabel: 'ویزیت حضوری مشتری',
          currentStatus: 'تکمیل‌شده',
          summary: 'درخواست تغییر مشخصات پایه مشتری',
        },
        relatedRecords: [
          {
            id: selectedVisit.id,
            code: selectedVisit.code,
            title: `ویزیت ${selectedVisit.code}`,
            typeLabel: 'صورتجلسه ویزیت',
            statusLabel: 'تکمیل‌شده',
          },
        ],
        timeline: [
          {
            id: `tl-cr-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timestampJalali: 'هم‌اکنون',
            actor: {
              id: activePersona.id,
              name: activePersona.name,
              role: activePersona.jobTitle,
              department: activePersona.department,
            },
            title: 'ارسال درخواست اصلاح مشخصات به مدیریت داده‌های پایه',
            note: 'عدم تغییر مستقیم پروفایل فعال مشتری تا زمان بررسی و تأیید کارشناسی',
            type: 'creation',
          },
        ],
        comments: [],
        attachments: [],
        blocker: null,
      };
      mockRepository.createRecord(changeRecord);
    }

    // If in offline mode, queue item with idempotency key
    const idempotencyKey = `vst-res-${selectedVisit.id}`;
    if (isOfflineMode) {
      const newItem: OfflineQueueItem = {
        id: `off-${Date.now()}`,
        idempotencyKey,
        entityType: 'visit_result',
        title: `نتیجه ویزیت ${selectedVisit.customerName} (${selectedVisit.code})`,
        clientTimestamp: 'لحظاتی پیش (محلی)',
        status: 'local_draft',
        retryCount: 0,
        localPayload: mandatoryResultData,
      };
      setOfflineQueue((prev) => [newItem, ...prev]);
      addToast('نتیجه ویزیت به عنوان پیش‌نویس محلی ذخیره شد', {
        description: 'وضعیت: «ذخیره روی دستگاه». پس از وصل شدن شبکه ارسال می‌شود.',
        tone: 'warning',
      });
    } else {
      addToast(`نتیجه ویزیت «${selectedVisit.customerName}» با موفقیت ثبت و نهایی شد`, {
        description: `وضعیت: ${outcomeLabel}`,
        tone: 'success',
      });
    }

    setActiveModal(null);
    setSelectedVisit(null);
    setResultNotes('');
  };

  // Draft Order Creation Handler
  const handleSaveDraftOrder = () => {
    if (!selectedVisit) return;
    const cleanAmount = parseInt(draftAmount.replace(/[^\d]/g, ''), 10) || 4500000000;
    const orderCode = `ORD-DRAFT-${Math.floor(100 + Math.random() * 900)}`;

    const draftData = {
      orderCode,
      itemsSummary: `${draftProduct} (${draftQty} کارتن)`,
      totalAmountRials: cleanAmount,
      paymentTerm: draftTerm,
    };

    setVisits((prev) =>
      prev.map((v) =>
        v.id === selectedVisit.id
          ? {
              ...v,
              draftOrder: draftData,
            }
          : v
      )
    );

    // Also queue or sync
    const idempotencyKey = `ord-${selectedVisit.id}-${orderCode}`;
    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          id: `off-ord-${Date.now()}`,
          idempotencyKey,
          entityType: 'draft_order',
          title: `پیش‌نویس سفارش ${orderCode} (${selectedVisit.customerName})`,
          clientTimestamp: 'لحظاتی پیش (محلی)',
          status: 'queued',
          retryCount: 0,
          localPayload: draftData,
        },
        ...prev,
      ]);
    }

    addToast(`پیش‌نویس سفارش «${orderCode}» با موفقیت متصل شد`, {
      description: `مبلغ: ${formatRials(cleanAmount)} • جهت بررسی واحد بازرگانی ذخیره شد.`,
      tone: 'success',
    });

    setActiveModal(null);
  };

  // Follow-up Creation as Real Work Item in Selected Employee's Inbox
  const handleSaveFollowup = () => {
    if (!followupTitle.trim()) {
      setFollowupError('عنوان پیگیری الزامی است.');
      return;
    }
    setFollowupError(null);

    const selectedEmployee = MOCK_PERSONAS.find((p) => p.id === followupAssigneeId) || activePersona;
    const taskCode = `TSK-1404-${Math.floor(1000 + Math.random() * 9000)}`;
    const taskId = `rec-flw-${Date.now()}`;

    // Create real operational record in mock repository
    const newRecord: OperationalRecord = {
      id: taskId,
      code: taskCode,
      title: followupTitle,
      type: 'general_task',
      typeLabel: 'پیگیری میدانی / بازرگانی',
      itemSummary: `پیگیری متعهد شده در جلسه با مشتری: ${selectedVisit ? selectedVisit.customerName : 'عملیات میدانی'}`,
      unit: 'فروش و بازاریابی میدانی',
      tags: ['میدانی', 'پیگیری مشتری', selectedVisit ? selectedVisit.customerName : 'ویزیتور'],
      salesChannel: 'in_person',
      relatedRecords: selectedVisit
        ? [
            {
              id: selectedVisit.id,
              code: selectedVisit.code,
              title: selectedVisit.customerName,
              typeLabel: 'ویزیت حضوری',
              statusLabel: selectedVisit.status === 'completed' ? 'تکمیل‌شده' : 'در دست اقدام',
            },
          ]
        : [],
      creator: {
        id: activePersona.id,
        name: activePersona.name,
        role: activePersona.jobTitle,
        department: activePersona.department,
        avatar: activePersona.avatar,
      },
      currentOwner: {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        role: selectedEmployee.jobTitle,
        department: selectedEmployee.department,
        avatar: selectedEmployee.avatar,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      currentAssignee: {
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        role: selectedEmployee.jobTitle,
        department: selectedEmployee.department,
        avatar: selectedEmployee.avatar,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      status: 'in_progress',
      statusLabel: 'در دست اقدام پیگیری',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      createdAtJalali: '۱۴۰۴/۰۶/۱۱',
      statusSinceJalali: 'هم‌اکنون',
      dueDateJalali: followupDueDate,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          timestampJalali: 'هم‌اکنون',
          actor: {
            id: activePersona.id,
            name: activePersona.name,
            role: activePersona.jobTitle,
            department: activePersona.department,
          },
          title: 'ثبت پیگیری و واگذاری اقدام',
          note: followupNotes || 'ارجاع خودکار از صورتجلسه ویزیت میدانی',
          type: 'transition',
        },
      ],
      comments: [],
      attachments: [],
      blocker: null,
      nextAction: {
        title: followupTitle,
        responsibleRole: selectedEmployee.jobTitle,
        responsiblePersonName: selectedEmployee.name,
        dueJalali: followupDueDate,
        suggestedAction: 'review',
      },
    };

    mockRepository.createRecord(newRecord);

    // Link to visit if active
    if (selectedVisit) {
      setVisits((prev) =>
        prev.map((v) =>
          v.id === selectedVisit.id
            ? {
                ...v,
                followUp: {
                  id: taskId,
                  title: followupTitle,
                  ownerName: selectedEmployee.name,
                  dueDateJalali: followupDueDate,
                  notes: followupNotes,
                },
              }
            : v
        )
      );
    }

    addToast(`وظیفه پیگیری در کارهای من «${selectedEmployee.name}» ثبت شد`, {
      description: `کد پیگیری: ${taskCode} • موعد: ${followupDueDate}`,
      tone: 'success',
    });

    setActiveModal(null);
    setFollowupTitle('');
    setFollowupNotes('');
  };

  // Receipt Submission Handler (Finance Review Enforcement)
  const handleSaveReceipt = () => {
    if (!selectedVisit) return;
    if (!receiptTracking.trim()) {
      setReceiptError('کد رهگیری یا شماره ارجاع بانکی الزامی است.');
      return;
    }
    const cleanAmount = parseInt(receiptAmount.replace(/[^\d]/g, ''), 10);
    if (!cleanAmount || cleanAmount <= 0) {
      setReceiptError('مبلغ واریزی فیش نامعتبر است.');
      return;
    }
    setReceiptError(null);

    const receiptSubmissionData = {
      trackingNumber: receiptTracking.trim(),
      amountRials: cleanAmount,
      bankName: receiptBank,
      receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      status: 'awaiting_finance_review' as const,
      registeredAtJalali: '۱۴۰۴/۰۶/۱۱',
    };

    setVisits((prev) =>
      prev.map((v) =>
        v.id === selectedVisit.id
          ? {
              ...v,
              receiptSubmission: receiptSubmissionData,
            }
          : v
      )
    );

    // Create a Payment Verification record for Finance
    const financeRecord: OperationalRecord = {
      id: `rec-pay-${Date.now()}`,
      code: `PAY-REC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `بررسی فیش واریزی دریافتی: ${selectedVisit.customerName}`,
      type: 'payment_request',
      typeLabel: 'تطبیق فیش واریزی واریزکننده',
      itemSummary: `فیش ${formatRials(cleanAmount)} واریز شده به ${receiptBank} با کد رهگیری ${receiptTracking}`,
      unit: 'امور مالی و خزانه‌داری',
      tags: ['فیش بانکی', 'تطبیق خزانه‌داری', selectedVisit.customerName],
      salesChannel: 'in_person',
      creator: {
        id: activePersona.id,
        name: activePersona.name,
        role: activePersona.jobTitle,
        department: activePersona.department,
        avatar: activePersona.avatar,
      },
      currentOwner: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی',
        role: 'کارشناس مالی',
        department: 'امور مالی و خزانه‌داری',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      currentAssignee: {
        id: 'p-fin-spec',
        name: 'کارشناس مالی',
        role: 'کارشناس مالی',
        department: 'امور مالی و خزانه‌داری',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      },
      status: 'pending_approval',
      statusLabel: 'در انتظار تطبیق و تأیید مالی',
      priority: 'high',
      createdAt: new Date().toISOString(),
      createdAtJalali: '۱۴۰۴/۰۶/۱۱',
      statusSinceJalali: 'هم‌اکنون',
      dueDateJalali: '۱۴۰۴/۰۶/۱۲',
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
          title: 'ثبت فیش واریز توسط ویزیتور و ارسال به امور مالی',
          note: `کد رهگیری: ${receiptTracking} • مبلغ: ${formatRials(cleanAmount)}`,
          type: 'creation',
        },
      ],
      comments: [],
      attachments: [],
      blocker: null,
      nextAction: {
        title: 'استعلام حسابداری و تایید وصول وجه',
        responsibleRole: 'کارشناس مالی',
        responsiblePersonName: 'کارشناس مالی',
        dueJalali: '۱۴۰۴/۰۶/۱۲',
        suggestedAction: 'review',
      },
    };

    mockRepository.createRecord(financeRecord);

    addToast('فیش واریزی با موفقیت به امور مالی ارسال گردید', {
      description: 'ویزیتور صلاحیت تأیید مالی ندارد؛ فیش جهت کنترل به امور مالی ارجاع شد.',
      tone: 'info',
    });

    setActiveModal(null);
    setReceiptTracking('');
    setReceiptAmount('');
    setReceiptNotes('');
  };

  // Idempotent Sync / Retry Handler for Offline Items
  const handleRetryItem = (item: OfflineQueueItem) => {
    setIsSyncing(true);
    setTimeout(() => {
      // Idempotent logic: update item in-place and guarantee no duplicates
      setOfflineQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'synced',
                retryCount: (q.retryCount || 0) + 1,
                clientTimestamp: 'هم‌اکنون همگام شد (یکتا)',
              }
            : q
        )
      );
      setIsSyncing(false);
      addToast(`سند «${item.title}» با موفقیت و بدون تکرار همگام گردید`, {
        description: 'رفتار سیستم پایدار (Idempotent) بوده و هیچ سند تکراری ایجاد نشد.',
        tone: 'success',
      });
    }, 600);
  };

  // Sync All Offline Items
  const handleSyncOfflineQueue = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setOfflineQueue((prev) =>
        prev.map((item) =>
          item.status === 'conflict'
            ? item // leave conflicts to be resolved intentionally
            : { ...item, status: 'synced', clientTimestamp: 'هم‌اکنون همگام شد' }
        )
      );
      setIsSyncing(false);
      addToast('عملیات همگام‌سازی با سرور به پایان رسید', {
        description: conflictCount > 0 ? `${conflictCount} مورد تعارض باقی مانده است.` : 'کلیه اسناد با موفقیت همگام شدند.',
        tone: conflictCount > 0 ? 'warning' : 'success',
      });
    }, 900);
  };

  // Resolve Conflict Handler
  const handleResolveConflict = (resolution: 'current' | 'server') => {
    if (!activeConflictItem) return;
    setOfflineQueue((prev) =>
      prev.map((q) =>
        q.id === activeConflictItem.id
          ? {
              ...q,
              status: 'synced',
              conflictReason: undefined,
              clientTimestamp: resolution === 'current' ? 'رفع تعارض (حفظ نسخه محلی)' : 'رفع تعارض (پذیرش سرور)',
            }
          : q
      )
    );
    addToast('تعارض همگام‌سازی با موفقیت برطرف گردید', {
      description: resolution === 'current' ? 'نسخه دستگاه ثبت شد.' : 'نسخه مرکزی سرور اعمال گردید.',
      tone: 'success',
    });
    setActiveModal(null);
    setActiveConflictItem(null);
  };

  // New Intake Creation
  const handleCreateNewIntake = () => {
    if (!newIntakeSenderName.trim() || !newIntakeSummary.trim()) {
      addToast('خطا در ثبت', { description: 'نام مخاطب و خلاصه شرح مکالمه الزامی است.', tone: 'error' });
      return;
    }

    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const channelLabels: Record<ManualIntakeChannel, string> = {
      phone: 'تماس تلفنی',
      whatsapp: 'واتساپ',
      bale: 'پیام‌رسان بله',
      eitaa: 'پیام‌رسان ایتا',
      telegram: 'تلگرام',
      sms: 'پیامک مستقیم',
      in_person: 'گفتگوی حضوری',
      paper_note: 'دست‌نویس و یادداشت کاغذی',
    };

    const newRecord: ManualIntakeRecord = {
      id: `intk-${Date.now()}`,
      code: `INT-1404-${Math.floor(100 + Math.random() * 900)}`,
      channel: newIntakeChannel,
      senderName: newIntakeSenderName.trim(),
      senderContact: newIntakeSenderContact || '۰۹۱۲۰۰۰۰۰۰۰',
      senderCompany: newIntakeSenderCompany || 'مشتری آزاد',
      senderRole: 'مسئول خرید / متقاضی',
      receivedAtJalali: '۱۴۰۴/۰۶/۱۱',
      receivedAtTime: timeNow,
      originalReference: `${channelLabels[newIntakeChannel]} (${newIntakeDirection === 'inbound' ? 'ورودی' : 'خروجی'})`,
      summary: newIntakeSummary.trim(),
      attachments: [],
      responsibleUnit: 'sales',
      classification: 'new_order',
      ownerName: activePersona.name,
      dueDateJalali: '۱۴۰۴/۰۶/۱۲',
      priority: newIntakePriority,
      state: 'unclassified',
      traceLogs: [
        {
          timestamp: timeNow,
          actorName: activePersona.name,
          action: `ثبت دستی ${newIntakeDirection === 'inbound' ? 'مکالمه ورودی' : 'تماس خروجی'} در سامانه`,
        },
      ],
    };

    setIntakes((prev) => [newRecord, ...prev]);
    addToast('فعالیت مکالمه/پیام با موفقیت ثبت شد', {
      description: `کد پیگیری: ${newRecord.code} • آماده تبدیل به پیگیری یا سفارش`,
      tone: 'success',
    });

    setActiveModal(null);
    setNewIntakeSenderName('');
    setNewIntakeSenderContact('');
    setNewIntakeSenderCompany('');
    setNewIntakeSummary('');
  };

  // Convert Intake to Real Actionable Object (Preserving Source)
  const handleExecuteConvertIntake = () => {
    if (!selectedIntake) return;
    const targetEmployee = MOCK_PERSONAS.find((p) => p.id === convertAssigneeId) || activePersona;
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (convertTargetType === 'followup' || convertTargetType === 'task') {
      const taskCode = `TSK-1404-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const channelLabel = getChannelDisplayName(selectedIntake.channel);

      const taskRecord: OperationalRecord = {
        id: `rec-intk-${Date.now()}`,
        code: taskCode,
        title: convertTitle || `پیگیری پیام ${selectedIntake.senderName} (${selectedIntake.senderCompany})`,
        type: 'general_task',
        typeLabel: 'پیگیری منشأ کانال ارتباطی',
        itemSummary: `موضوع پیام: ${selectedIntake.summary} • منبع: ${selectedIntake.originalReference}`,
        unit: 'فروش و امور مشتریان',
        tags: [channelLabel, selectedIntake.senderCompany, 'پیگیری پیام'],
        salesChannel: selectedIntake.channel === 'phone' ? 'phone' : selectedIntake.channel === 'whatsapp' ? 'whatsapp' : 'other',
        relatedRecords: [],
        creator: {
          id: activePersona.id,
          name: activePersona.name,
          role: activePersona.jobTitle,
          department: activePersona.department,
          avatar: activePersona.avatar,
        },
        currentOwner: {
          id: targetEmployee.id,
          name: targetEmployee.name,
          role: targetEmployee.jobTitle,
          department: targetEmployee.department,
          avatar: targetEmployee.avatar,
          heldSinceJalali: 'هم‌اکنون',
          durationHours: 0,
        },
        currentAssignee: {
          id: targetEmployee.id,
          name: targetEmployee.name,
          role: targetEmployee.jobTitle,
          department: targetEmployee.department,
          avatar: targetEmployee.avatar,
          heldSinceJalali: 'هم‌اکنون',
          durationHours: 0,
        },
        status: 'in_progress',
        statusLabel: 'در دست اقدام پیگیری',
        priority: selectedIntake.priority,
        createdAt: new Date().toISOString(),
        createdAtJalali: '۱۴۰۴/۰۶/۱۱',
        statusSinceJalali: 'هم‌اکنون',
        dueDateJalali: convertDueDate,
        timeline: [
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timestampJalali: 'هم‌اکنون',
            actor: {
              id: activePersona.id,
              name: activePersona.name,
              role: activePersona.jobTitle,
              department: activePersona.department,
            },
            title: `تبدیل پیام دریافتی (${channelLabel}) به اقدام عملیاتی`,
            note: `اصل پیام: ${selectedIntake.summary}`,
            type: 'creation',
          },
        ],
        comments: [],
        attachments: [],
        blocker: null,
        nextAction: {
          title: convertTitle || 'پاسخ و تعیین تکلیف درخواست مشتری',
          responsibleRole: targetEmployee.jobTitle,
          responsiblePersonName: targetEmployee.name,
          dueJalali: convertDueDate,
          suggestedAction: 'review',
        },
      };

      mockRepository.createRecord(taskRecord);

      // Mark intake as converted
      setIntakes((prev) =>
        prev.map((itk) =>
          itk.id === selectedIntake.id
            ? {
                ...itk,
                state: 'converted',
                convertedRecord: {
                  type: 'general_task',
                  code: taskCode,
                  title: taskRecord.title,
                  routeKey: 'inbox',
                  convertedAtJalali: `۱۴۰۴/۰۶/۱۱ - ${timeNow}`,
                },
              }
            : itk
        )
      );

      addToast(`پیام با موفقیت به پیگیری تبدیل و به کارهای من «${targetEmployee.name}» منتقل شد`, {
        description: `کد وظیفه: ${taskCode} • حفظ ردپای کانال: ${channelLabel}`,
        tone: 'success',
      });
    } else {
      // Convert to Draft Order
      const orderCode = `ORD-INTK-${Math.floor(100 + Math.random() * 900)}`;
      setIntakes((prev) =>
        prev.map((itk) =>
          itk.id === selectedIntake.id
            ? {
                ...itk,
                state: 'converted',
                convertedRecord: {
                  type: 'sales_order',
                  code: orderCode,
                  title: `پیش‌نویس سفارش حاصل از پیام ${selectedIntake.senderCompany}`,
                  routeKey: 'sales_orders',
                  convertedAtJalali: `۱۴۰۴/۰۶/۱۱ - ${timeNow}`,
                },
              }
            : itk
        )
      );

      addToast(`پیام به پیش‌نویس سفارش «${orderCode}» تبدیل شد`, {
        description: 'سند جهت تکمیل اقلام و تأیید قیمت به بخش فروش متصل گردید.',
        tone: 'success',
      });
    }

    setActiveModal(null);
    setSelectedIntake(null);
  };

  return (
    <div className="space-y-4 pb-16 max-w-5xl mx-auto" dir="rtl">
      {/* 1. Mobile-First Operational Header & Persona Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-none space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900">عملیات فروش میدانی و CRM</h1>
                <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 font-bold px-2 py-0.5 rounded-md">
                  {getPersonaDisplayName(activePersona)}
                </span>
                {isVisitorPersona && (
                  <span className="text-caption bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    مشتریان تخصیص‌یافته به شما
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ثبت رویدادمحور ویزیت، صدور پیش‌نویس، واگذاری پیگیری در کارهای من و حفظ حریم خصوصی پرسنل
              </p>
            </div>
          </div>

          {/* Shift Control & Quick Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <Button
              size="sm"
              variant={isShiftActive ? 'outline' : 'primary'}
              onClick={handleToggleShift}
              leftIcon={
                isShiftActive ? (
                  <Square className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                )
              }
              className={isShiftActive ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {isShiftActive ? 'خاتمه شیفت کاری' : 'شروع شیفت کاری'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPrivacyModal(true)}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
              title="اصول حفظ حریم خصوصی"
            >
              حفظ حریم خصوصی
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQueueModal(true)}
              leftIcon={<WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              className="relative"
            >
              صف آفلاین
              {pendingQueueCount > 0 && (
                <span className="mr-1.5 bg-amber-500 text-white text-caption font-bold px-1.5 py-0.2 rounded-full">
                  {toPersianDigits(pendingQueueCount)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Shift & Location Status Banner */}
        <div
          className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            isShiftActive
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-100 border-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isShiftActive ? 'bg-emerald-500 ' : 'bg-slate-400'
              }`}
            />
            <span className="font-bold">
              {isShiftActive ? (
                <>شیفت کاری فعال است (شروع: {shiftStartTime})</>
              ) : (
                <>شیفت کاری غیرفعال است (موقعیت مکانی خاموش)</>
              )}
            </span>
            <span className="text-caption text-slate-500 hidden sm:inline">•</span>
            <span className="text-caption text-slate-600">
              {isShiftActive
                ? 'موقعیت مکانی صرفاً در زمان ثبت ورود/خروج یا فیش ذخیره می‌شود (بدون ردگیری مداوم پس‌زمینه).'
                : 'جهت رعایت حریم خصوصی، هیچ مختصات یا ثبتی خارج از شیفت فعال ذخیره نمی‌شود.'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-caption">
            {isOfflineMode ? (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                حالت آفلاین (شبیه‌سازی)
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                شبکه متصل (آنلاین)
              </span>
            )}
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className="text-primary-700 hover:underline font-semibold"
            >
              {isOfflineMode ? 'تغییر به آنلاین' : 'تست آفلاین'}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-1 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('visit_plans')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'visit_plans'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            «برنامه امروز» ({toPersianDigits(assignedVisits.length)})
          </button>

          <button
            onClick={() => setActiveTab('sales_calls')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'sales_calls'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            تماس‌ها و پیام‌ها ({toPersianDigits(intakes.length)})
          </button>

          <button
            onClick={() => setActiveTab('field_followups')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'field_followups'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            کارهای من پیگیری‌های میدانی
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('field_manager')}
              className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'field_manager'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              دیده‌بان سرپرست فروش
              {missingResultVisits.length > 0 && (
                <span className="bg-rose-500 text-white text-caption px-1.5 py-0.2 rounded-full font-mono">
                  {missingResultVisits.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB CONTENT 1: «برنامه امروز» (Today's Plan) */}
      {activeTab === 'visit_plans' && (
        <div className="space-y-4">
          {/* Controls Bar: List vs Map & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">تعداد ویزیت‌های برنامه‌ریزی‌شده:</span>
              <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {toPersianDigits(assignedVisits.length)} مشتری
              </span>

              {!isVisitorPersona && (
                <div className="flex items-center gap-1 mr-3 text-xs">
                  <span className="text-slate-500">فیلتر ویزیتور:</span>
                  <select
                    value={visitorFilter}
                    onChange={(e) => setVisitorFilter(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800"
                  >
                    <option value="all">همه ویزیتورها</option>
                    <option value="آقای نادری">آقای نادری (استان قم)</option>
                    <option value="کارشناس فروش">کارشناس فروش</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-2 ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-none' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  نمای کارتی
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors flex items-center gap-2 ${
                    viewMode === 'map' ? 'bg-white text-slate-900 shadow-none' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  نقشه توالی مسیر
                </button>
              </div>
            </div>
          </div>

          {/* List View of Planned Visits */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {assignedVisits.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Building className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="font-bold text-slate-800">هیچ ویزیتی برای این کارشناس ثبت نشده است</h3>
                  <p className="text-xs text-slate-500">برای مشاهده ویزیت‌های آزمایشی، فیلتر ویزیتور را تغییر دهید.</p>
                </div>
              ) : (
                assignedVisits.map((visit) => {
                  const isCompleted = visit.status === 'completed';
                  const isInProgress = visit.status === 'in_progress';

                  return (
                    <div
                      key={visit.id}
                      className={`bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-none ${
                        isInProgress
                          ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                          : isCompleted
                          ? 'border-slate-200 bg-slate-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Row 1: Sequence, Customer, Time Window, Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 font-mono ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInProgress
                                ? 'bg-emerald-600 text-white '
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {toPersianDigits(visit.visitSequence)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-black text-slate-900">
                                {visit.customerName}
                              </h3>
                              {visit.customerTradeName && (
                                <span className="text-xs text-slate-500 font-semibold">
                                  ({visit.customerTradeName})
                                </span>
                              )}
                              <span className="text-caption font-mono text-slate-500">{visit.code}</span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-bold text-primary-700">
                                <Clock className="w-3.5 h-3.5" />
                                پنجره زمانی: {visit.timeWindow || visit.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                {visit.contactPerson} ({visit.contactPhone})
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-500">
                                ویزیتور مسئول: <strong>{visit.assignedSalespersonName}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ویزیت انجام شد
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-full ">
                              <Play className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                              جلسه در جریان (Check-in)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1 rounded-full">
                              در انتظار مراجعه
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Purpose and Address */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-start gap-2 text-slate-800">
                          <strong className="shrink-0 text-slate-900">هدف ویزیت:</strong>
                          <span>{visit.purpose || 'مذاکره فروش و بررسی سبد محصولات روغن خوراکی'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>نشانی:</strong> {visit.province}، {visit.city}، {visit.address}
                          </span>
                        </div>
                      </div>

                      {/* Completed Result Summary if present */}
                      {visit.mandatoryResult && (
                        <div className="mt-3 p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-950 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              نتیجه ثبت‌شده: {visit.mandatoryResult.outcomeLabel}
                            </span>
                            <span className="text-caption text-slate-500 font-mono">
                              {visit.mandatoryResult.registeredAtJalali}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed">{visit.mandatoryResult.notes}</p>

                          {/* Created Order badge */}
                          {visit.draftOrder && (
                            <div className="pt-2 flex items-center justify-between border-t border-emerald-200 text-slate-800">
                              <span className="font-semibold flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-primary-700" />
                                پیش‌نویس سفارش: {visit.draftOrder.orderCode} ({visit.draftOrder.itemsSummary})
                              </span>
                              <span className="font-bold text-primary-700 font-mono">
                                {formatRials(visit.draftOrder.totalAmountRials)}
                              </span>
                            </div>
                          )}

                          {/* Submitted Receipt badge */}
                          {visit.receiptSubmission && (
                            <div className="pt-1.5 flex items-center justify-between text-slate-800">
                              <span className="font-semibold flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                فیش واریزی: کد رهگیری {visit.receiptSubmission.trackingNumber} ({visit.receiptSubmission.bankName})
                              </span>
                              <span className="text-caption font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                در انتظار بررسی مالی (کارشناس خزانه‌داری)
                              </span>
                            </div>
                          )}

                          {/* Follow-up badge */}
                          {visit.followUp && (
                            <div className="pt-1.5 flex items-center justify-between text-slate-800">
                              <span className="font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                پیگیری محول‌شده: {visit.followUp.title} (مسئول: {visit.followUp.ownerName})
                              </span>
                              <span className="text-caption font-mono text-slate-500">
                                سررسید: {visit.followUp.dueDateJalali}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isCompleted && !isInProgress && (
                            <Button
                              size="xs"
                              variant="primary"
                              disabled={!isShiftActive}
                              onClick={() => handleCheckIn(visit)}
                              leftIcon={
                                isShiftActive ? (
                                  <Play className="w-3 h-3 text-white" />
                                ) : (
                                  <Lock className="w-3 h-3 text-slate-500" />
                                )
                              }
                              title={!isShiftActive ? 'شیفت متوقف است. ثبت موقعیت خارج از شیفت غیرفعال است.' : ''}
                            >
                              ثبت ورود (Check-in)
                            </Button>
                          )}

                          {isInProgress && (
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => {
                                setSelectedVisit(visit);
                                setActiveModal('result');
                              }}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              ثبت نتیجه ویزیت (الزامی)
                            </Button>
                          )}

                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisit(visit);
                              setActiveModal('draft_order');
                            }}
                            leftIcon={<Plus className="w-3 h-3 text-primary-700" />}
                          >
                            صدور پیش‌نویس سفارش
                          </Button>

                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisit(visit);
                              setActiveModal('receipt');
                            }}
                            leftIcon={<CreditCard className="w-3 h-3 text-emerald-600" />}
                          >
                            ثبت فیش واریزی (ارسال به مالی)
                          </Button>

                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisit(visit);
                              setActiveModal('followup');
                            }}
                            leftIcon={<Calendar className="w-3 h-3 text-amber-600" />}
                          >
                            ثبت پیگیری (کارهای پرسنل)
                          </Button>
                        </div>

                        {visit.eventLocationNote && (
                          <span className="text-caption text-slate-500 font-mono">
                            {visit.eventLocationNote}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Visual SVG Map (Zero External GPS / Continuous Tracking) */
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">نقشه هندسی توالی توقف‌ها (مختصات داخلی)</h3>
                  <p className="text-xs text-slate-500">
                    نمایش توالی هندسی توقف‌های امروز بدون ارسال مداوم داده به سرویس‌های نقشه خارجی
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                  {assignedVisits.length} توقف برنامه‌ریزی‌شده
                </span>
              </div>

              <div className="relative w-full bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto select-none">
                <svg role="img" aria-label="توالی هندسی توقف‌ها؛ نام کامل توقف‌ها در فهرست زیر" className="w-full min-w-[650px] h-[400px]" viewBox="0 0 650 400" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                  {/* Route Polyline */}
                  <polyline
                    points="120,110 260,160 380,220 490,170"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />

                  {/* Visit Markers */}
                  {assignedVisits.map((v) => {
                    const isDone = v.status === 'completed';
                    const isNow = v.status === 'in_progress';
                    return (
                      <g key={v.id} className="cursor-pointer">
                        <circle
                          cx={v.mapCoord.x}
                          cy={v.mapCoord.y}
                          r={isNow ? 18 : 14}
                          fill={isDone ? '#10b981' : isNow ? '#f59e0b' : '#3b82f6'}
                          opacity={isNow ? 0.3 : 0.2}
                          className={isNow ? '' : ''}
                        />
                        <circle
                          cx={v.mapCoord.x}
                          cy={v.mapCoord.y}
                          r="12"
                          fill={isDone ? '#10b981' : isNow ? '#f59e0b' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={v.mapCoord.x}
                          y={v.mapCoord.y + 4}
                          fill="#ffffff"
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {toPersianDigits(v.visitSequence)}
                        </text>
                        <text
                          x={v.mapCoord.x}
                          y={v.mapCoord.y + 26}
                          fill="#1e293b"
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {v.customerName.slice(0, 18)}...
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <p className="text-caption text-slate-600">برای دیدن تمام نقشه، به چپ و راست پیمایش کنید.</p>
              <ol className="space-y-2 text-sm">{assignedVisits.map(visit => <li key={visit.id}>{toPersianDigits(visit.visitSequence)}. {visit.customerName}</li>)}</ol>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB CONTENT 2: «تماس‌ها و پیام‌ها» (Calls & Messenger Intake) */}
      {activeTab === 'sales_calls' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  ثبت و ساختاردهی تماس‌ها و پیام‌های ورودی (CRM Intake)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت پیام‌های واتساپ، ایتا، بله، تلگرام، پیامک و تلفن و تبدیل یک‌کلیکه به پیگیری یا پیش‌نویس سفارش
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setActiveModal('new_intake')}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                ثبت پیام / تماس جدید
              </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-bold ml-1">کانال ارتباطی:</span>
              {[
                { key: 'all', label: 'همه کانال‌ها' },
                { key: 'phone', label: 'تلفن مستقیم' },
                { key: 'whatsapp', label: 'واتساپ' },
                { key: 'bale', label: 'بله' },
                { key: 'eitaa', label: 'ایتا' },
                { key: 'telegram', label: 'تلگرام' },
                { key: 'sms', label: 'پیامک' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setChannelFilter(pill.key)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    channelFilter === pill.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intakes List */}
          <div className="space-y-3">
            {intakes
              .filter((itk) => (channelFilter === 'all' ? true : itk.channel === channelFilter))
              .map((itk) => {
                const isConverted = itk.state === 'converted';

                return (
                  <div
                    key={itk.id}
                    className={`bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-none ${
                      isConverted ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center shrink-0">
                          {itk.channel === 'phone' ? (
                            <Phone className="w-4 h-4 text-primary-700" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-primary-700" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{itk.senderName}</h4>
                            <span className="text-xs text-slate-600 font-semibold">({itk.senderCompany})</span>
                            <span className="text-caption font-mono text-slate-500">{itk.code}</span>
                            <PriorityBadge priority={itk.priority} />
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-700">
                              کانال: <strong>{itk.originalReference}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono">تماس: {itk.senderContact}</span>
                            <span>•</span>
                            <span className="font-mono">{itk.receivedAtJalali} - {itk.receivedAtTime}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                            تبدیل‌شده به اقدام
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                            اقدام‌نشده
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed border border-slate-100">
                      <strong className="block text-slate-900 mb-1">شرح پیام / درخواست:</strong>
                      {itk.summary}
                    </div>

                    {/* Converted Record Link */}
                    {itk.convertedRecord && (
                      <div className="mt-2 p-2 bg-emerald-50 text-emerald-950 rounded border border-emerald-200 text-xs flex items-center justify-between">
                        <span className="font-semibold">
                          سند ایجادشده: {itk.convertedRecord.title} ({itk.convertedRecord.code})
                        </span>
                        <span className="font-mono text-caption text-slate-500">
                          {itk.convertedRecord.convertedAtJalali}
                        </span>
                      </div>
                    )}

                    {/* Conversion Action Buttons */}
                    {!isConverted && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedIntake(itk);
                            setConvertTargetType('followup');
                            setConvertTitle(`پیگیری پیام ${itk.senderName} (${itk.senderCompany})`);
                            setActiveModal('convert_intake');
                          }}
                          leftIcon={<Calendar className="w-3 h-3 text-amber-600" />}
                        >
                          تبدیل به پیگیری (کارهای پرسنل)
                        </Button>

                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedIntake(itk);
                            setConvertTargetType('draft_order');
                            setConvertTitle(`پیش‌نویس سفارش ${itk.senderCompany}`);
                            setActiveModal('convert_intake');
                          }}
                          leftIcon={<FileText className="w-3 h-3 text-primary-700" />}
                        >
                          تبدیل به پیش‌نویس سفارش
                        </Button>

                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => {
                            setSelectedIntake(itk);
                            setConvertTargetType('task');
                            setConvertTitle(`وظیفه عملیاتی: بررسی درخواست ${itk.senderCompany}`);
                            setActiveModal('convert_intake');
                          }}
                          leftIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          تبدیل به اقدام کاری (Work Item)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT 3: «کارهای من پیگیری‌های میدانی» */}
      {activeTab === 'field_followups' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">کارهای من پیگیری‌های حاصل از ویزیت‌های حضوری</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعهدات ثبت‌شده در جلسات حضوری که به وظیفه در کارهای پرسنل تبدیل شده‌اند
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateToRoute && onNavigateToRoute('inbox')}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              مشاهده در کارهای من
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {assignedVisits
              .filter((v) => v.followUp)
              .map((v) => (
                <div key={v.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{v.followUp?.title}</span>
                      <span className="text-caption bg-primary-50 text-primary-700 font-bold px-2 py-0.5 rounded">
                        مشتری: {v.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{v.followUp?.notes}</p>
                    <div className="text-caption text-slate-500 flex items-center gap-3">
                      <span>مسئول اقدام: <strong>{v.followUp?.ownerName}</strong></span>
                      <span>•</span>
                      <span className="font-mono">سررسید: {v.followUp?.dueDateJalali}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md shrink-0">
                    ثبت در کارهای من
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 4: «دیده‌بان سرپرست فروش» (Manager View) */}
      {activeTab === 'field_manager' && isManagerOrAdmin && (
        <div className="space-y-4">
          {/* Privacy & Surveillance Prohibition Banner */}
          <div className="p-4 bg-primary-50/80 rounded-xl border border-primary-200 text-xs text-primary-950 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block text-sm font-black text-primary-900">
                اصل نظارت مبتنی بر نتیجه و استثنائات (Outcome-Based Supervision)
              </strong>
              <p>
                بر اساس منشور انضباطی سازمان جوادیان، رصد لحظه‌ای یا نقشه جاسوسی پرسنل اکیداً غیرفعال است. پایش
                مدیریتی صرفاً بر مبنای تحقق برنامه، استثنائات فاقد نتیجه، پیگیری‌های معوق و خطاهای همگام‌سازی متمرکز است.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-bold block">تحقق برنامه امروز</span>
              <span className="text-xl font-black text-slate-900">۷۵٪</span>
              <span className="text-caption text-emerald-600 block">۳ از ۴ ویزیت انجام شد</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-bold block">استثنا: ویزیت‌های فاقد نتیجه</span>
              <span className="text-xl font-black text-rose-600">{toPersianDigits(missingResultVisits.length)}</span>
              <span className="text-caption text-rose-500 block">نیازمند ثبت نتیجه الزامی</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-bold block">استثنا: پیگیری‌های معوق</span>
              <span className="text-xl font-black text-amber-600">{toPersianDigits(overdueFollowupsCount)}</span>
              <span className="text-caption text-amber-600 block">گذشته از موعد مقرر</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-bold block">استثنا: خطاهای همگام‌سازی</span>
              <span className="text-xl font-black text-slate-800">{toPersianDigits(conflictCount)}</span>
              <span className="text-caption text-slate-500 block">تعارض‌های نیازمند حل دستی</span>
            </div>
          </div>

          {/* Exception Table: Visits Missing Mandatory Results */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              ویزیت‌های در جریان فاقد نتیجه قطعی (Missing Results)
            </h4>

            {missingResultVisits.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">کلیه جلسات دارای نتیجه ثبت‌شده هستند.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {missingResultVisits.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {v.customerName} ({v.code})
                      </span>
                      <span className="text-slate-500 text-caption">
                        ورود ثبت‌شده در {v.checkInTime} • ویزیتور: {v.assignedSalespersonName}
                      </span>
                    </div>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSelectedVisit(v);
                        setActiveModal('result');
                      }}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      ثبت نتیجه الزامی
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Mandatory Result Modal */}
      {activeModal === 'result' && selectedVisit && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={`ثبت نتیجه قطعی و الزامی ویزیت (${selectedVisit.customerName})`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 text-amber-950 rounded-lg border border-amber-200 leading-relaxed">
              <strong>قاعده انضباطی سازمان:</strong> اتمام ویزیت بدون انتخاب نتیجه قطعی و ثبت یادداشت غیرمجاز است.
            </div>

            {resultError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 font-bold">
                {resultError}
              </div>
            )}

            <FieldGroup>
              <label className="block font-bold text-slate-800 mb-1.5">
                نتیجه نهایی جلسه: <span className="text-rose-500">*</span>
              </label>
              <select
                value={resultOutcome}
                onChange={(e) => setResultOutcome(e.target.value as VisitOutcomeType)}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900"
              >
                <option value="success_draft">موفق • صدور پیش‌نویس سفارش</option>
                <option value="success_order">موفق • عقد تفاهم‌نامه یا سفارش قطعی</option>
                <option value="success_payment">موفق • تسویه مالی / دریافت فیش واریز</option>
                <option value="renegotiation_needed">نیازمند مذاکره مجدد و اصلاح نرخ روغن</option>
                <option value="customer_absent">عدم حضور تصمیم‌گیرنده در محل</option>
                <option value="competitor_preferred">ترجیح برند رقیب (اختلاف قیمت یا شرایط پرداخت)</option>
                <option value="financial_dispute">وجود اختلاف حساب مالی یا چک معوق</option>
                <option value="cancelled_by_customer">لغو جلسه توسط خریدار</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-800 mb-1">
                یادداشت توضیحی جلسه: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={resultNotes}
                onChange={(e) => {
                  setResultNotes(e.target.value);
                  if (resultError) setResultError(null);
                }}
                placeholder="خلاصه توافقات انجام‌شده، نرخ مطرح‌شده، زمان تحویل و وضعیت موجودی قفسه خریدار..."
                className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </FieldGroup>

            {/* Optional Customer Change Request Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={hasChangeRequest}
                  onChange={(e) => setHasChangeRequest(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                مشتری تقاضای تغییر آدرس یا شماره تماس دارد
              </label>

              {hasChangeRequest && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="نشانی جدید انبار یا فروشگاه"
                    value={changeReqAddress}
                    onChange={(e) => setChangeReqAddress(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="شماره تماس مستقیم جدید"
                    value={changeReqPhone}
                    onChange={(e) => setChangeReqPhone(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveResult}>
                ثبت قطعی نتیجه و تکمیل ویزیت
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Draft Order Modal */}
      {activeModal === 'draft_order' && selectedVisit && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={`صدور پیش‌نویس سفارش برای ${selectedVisit.customerName}`}
          size="md"
        >
          <div className="space-y-3.5 text-xs">
            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">کالای انتخابی از کاتالوگ روغن:</label>
              <select
                value={draftProduct}
                onChange={(e) => setDraftProduct(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
              >
                <option>روغن سرخ‌کردنی شفاف ۱.۵ لیتری پت</option>
                <option>روغن پخت‌وپز آفتابگردان ۹۰۰ میلی‌لیتری</option>
                <option>روغن حلب ۱۶ کیلوگرمی صنف و صنعت</option>
                <option>روغن ذرت خالص ۱.۸ لیتری</option>
                <option>روغن زیتون فرابکر نیم لیتری</option>
              </select>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">تعداد (کارتن):</label>
                <input
                  type="text"
                  value={draftQty}
                  onChange={(e) => setDraftQty(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">مبلغ برآوردی (ریال):</label>
                <input
                  type="text"
                  value={draftAmount}
                  onChange={(e) => setDraftAmount(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">شرایط پرداخت توافق‌شده:</label>
              <input
                type="text"
                value={draftTerm}
                onChange={(e) => setDraftTerm(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </FieldGroup>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveDraftOrder}>
                ثبت پیش‌نویس سفارش
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Receipt Submission Modal (Finance Review Mandate) */}
      {activeModal === 'receipt' && selectedVisit && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={`ثبت فیش واریز مشتری: ${selectedVisit.customerName}`}
          size="md"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-primary-50 text-primary-950 rounded-lg border border-primary-200 leading-relaxed">
              <strong>گردش کار مالی:</strong> این فیش مستقیماً جهت کنترل و تطبیق بانکی به امور مالی و پرداخت
              (کارشناس مالی) ارسال می‌شود. ویزیتور صلاحیت تأیید مالی ندارد.
            </div>

            {receiptError && (
              <div className="p-2 bg-rose-50 text-rose-800 rounded font-bold border border-rose-200">
                {receiptError}
              </div>
            )}

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">
                کد پیگیری یا شماره ارجاع بانکی: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={receiptTracking}
                onChange={(e) => setReceiptTracking(e.target.value)}
                placeholder="مثال: TRK-981245 یا شماره ۱۲ رقمی شتاب"
                className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">
                  مبلغ واریزی (ریال): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder="مثال: ۵۰۰,۰۰۰,۰۰۰"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">بانک مقصد واریز:</label>
                <select
                  value={receiptBank}
                  onChange={(e) => setReceiptBank(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                >
                  <option>بانک ملت (حساب جاری بازرگانی)</option>
                  <option>بانک تجارت (حساب تمرکز وجوه)</option>
                  <option>بانک ملی (حساب پشتیبان فروش)</option>
                  <option>بانک سامان</option>
                </select>
              </FieldGroup>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تصویر فیش یا رسید عابربانک:</label>
              <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg text-center hover:bg-slate-50 cursor-pointer">
                <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                <span className="text-slate-600 block font-semibold">پیوست تصویر فیش بانکی (اختیاری)</span>
                <span className="text-caption text-slate-500">JPG, PNG حداکثر ۴ مگابایت</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveReceipt}>
                ارسال فیش به واحد مالی
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Follow-up Creation Modal (Real Work Item in Employee's Inbox) */}
      {activeModal === 'followup' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="ثبت پیگیری و واگذاری وظیفه در کارهای پرسنل"
          size="md"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-emerald-50 text-emerald-950 rounded-lg border border-emerald-200">
              این پیگیری مستقیماً به عنوان یک سند کاری در <strong>«کارهای من»</strong> کارمند انتخابی ظاهر خواهد شد.
            </div>

            {followupError && (
              <div className="p-2 bg-rose-50 text-rose-800 rounded font-bold border border-rose-200">
                {followupError}
              </div>
            )}

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">
                موضوع پیگیری: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={followupTitle}
                onChange={(e) => setFollowupTitle(e.target.value)}
                placeholder="مثال: ارسال نرخ نهایی روغن حلب ۱۶ کیلویی یا هماهنگی بارگیری"
                className="w-full p-3 rounded-lg border border-slate-300 text-xs"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">مسئول پیگیری (Assignee):</label>
                <select
                  value={followupAssigneeId}
                  onChange={(e) => setFollowupAssigneeId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                >
                  {MOCK_PERSONAS.filter((p) => p.capabilities.length > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.jobTitle})
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">تاریخ سررسید جلالی:</label>
                <input
                  type="text"
                  value={followupDueDate}
                  onChange={(e) => setFollowupDueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">یادداشت تکمیلی:</label>
              <textarea
                rows={2}
                value={followupNotes}
                onChange={(e) => setFollowupNotes(e.target.value)}
                placeholder="توضیحات ضروری برای مسئول اقدام..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </FieldGroup>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveFollowup}>
                ثبت در کارهای پرسنل
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. New Call / Messenger Intake Modal */}
      {activeModal === 'new_intake' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="ثبت فعالیت تماس یا پیام جدید"
          size="md"
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">کانال ارتباطی:</label>
                <select
                  value={newIntakeChannel}
                  onChange={(e) => setNewIntakeChannel(e.target.value as ManualIntakeChannel)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                >
                  <option value="phone">تماس تلفنی</option>
                  <option value="whatsapp">واتساپ</option>
                  <option value="bale">پیام‌رسان بله</option>
                  <option value="eitaa">پیام‌رسان ایتا</option>
                  <option value="telegram">تلگرام</option>
                  <option value="sms">پیامک مستقیم</option>
                  <option value="in_person">حضوری</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">جهت ارتباط:</label>
                <select
                  value={newIntakeDirection}
                  onChange={(e) => setNewIntakeDirection(e.target.value as 'inbound' | 'outbound')}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                >
                  <option value="inbound">ورودی (مشتری تماس گرفت)</option>
                  <option value="outbound">خروجی (ما تماس گرفتیم)</option>
                </select>
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">نام مخاطب:</label>
                <input
                  type="text"
                  value={newIntakeSenderName}
                  onChange={(e) => setNewIntakeSenderName(e.target.value)}
                  placeholder="مثال: آقای رحیمی"
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">نام شرکت / فروشگاه:</label>
                <input
                  type="text"
                  value={newIntakeSenderCompany}
                  onChange={(e) => setNewIntakeSenderCompany(e.target.value)}
                  placeholder="مثال: بازرگانی سهند"
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </FieldGroup>
            </div>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">شماره تماس یا آیدی:</label>
              <input
                type="text"
                value={newIntakeSenderContact}
                onChange={(e) => setNewIntakeSenderContact(e.target.value)}
                placeholder="مثال: ۰۹۱۲۸۸۸۳۳۴۴"
                className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
              />
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">شرح مکالمه / متن پیام:</label>
              <textarea
                rows={3}
                value={newIntakeSummary}
                onChange={(e) => setNewIntakeSummary(e.target.value)}
                placeholder="خلاصه مذاکره، تقاضای نرخ، استعلام موجودی یا ثبت درخواست خریدار..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </FieldGroup>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleCreateNewIntake}>
                ثبت پیام در سامانه
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Convert Intake Modal */}
      {activeModal === 'convert_intake' && selectedIntake && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={`تبدیل پیام به اقدام (${selectedIntake.senderName})`}
          size="md"
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-primary-50 text-primary-950 rounded-lg border border-primary-200">
              این عملیات پیام منبع ({selectedIntake.originalReference}) را به یک سند رسمی قابل پیگیری تبدیل می‌کند.
            </div>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">نوع سند هدف:</label>
              <select
                value={convertTargetType}
                onChange={(e) => setConvertTargetType(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
              >
                <option value="followup">پیگیری در کارهای پرسنل (Follow-up)</option>
                <option value="draft_order">پیش‌نویس سفارش فروش (Draft Order)</option>
                <option value="task">وظیفه و اقدام عملیاتی (General Task)</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">عنوان سند:</label>
              <input
                type="text"
                value={convertTitle}
                onChange={(e) => setConvertTitle(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">مسئول اقدام (Assignee):</label>
                <select
                  value={convertAssigneeId}
                  onChange={(e) => setConvertAssigneeId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
                >
                  {MOCK_PERSONAS.filter((p) => p.capabilities.length > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.jobTitle})
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">سررسید:</label>
                <input
                  type="text"
                  value={convertDueDate}
                  onChange={(e) => setConvertDueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </FieldGroup>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setActiveModal(null)}>
                انصراف
              </Button>
              <Button size="sm" variant="primary" onClick={handleExecuteConvertIntake}>
                تبدیل و ذخیره سند
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Offline Queue Drawer & Idempotent Sync */}
      <Modal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        title="صف محلی آفلاین و همگام‌سازی پایدار"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">اقلام ذخیره‌شده روی حافظه دستگاه</span>
              <span className="text-slate-500 text-caption">
                {offlineQueue.length} سند در صف • رفتار سیستم کاملاً پایدار (Idempotent) بوده و اسناد تکرار نمی‌شوند.
              </span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSyncOfflineQueue}
              disabled={isSyncing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? 'در حال ارسال...' : 'همگام‌سازی با سرور'}
            </Button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {offlineQueue.map((item) => {
              const statusBadgeMap: Record<OfflineItemStatus, { label: string; bg: string; text: string }> = {
                local_draft: { label: 'ذخیره روی دستگاه', bg: 'bg-slate-100', text: 'text-slate-700' },
                queued: { label: 'در انتظار همگام‌سازی', bg: 'bg-amber-100', text: 'text-amber-800' },
                syncing: { label: 'در حال ارسال', bg: 'bg-primary-100', text: 'text-primary-800' },
                synced: { label: 'همگام شد', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                conflict: { label: 'نیازمند رفع تعارض', bg: 'bg-rose-100', text: 'text-rose-800' },
              };

              const badge = statusBadgeMap[item.status] || statusBadgeMap.queued;

              return (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className={`text-caption font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      {item.retryCount !== undefined && item.retryCount > 0 && (
                        <span className="text-caption bg-slate-100 text-slate-500 font-mono px-1 rounded">
                          تلاش: {toPersianDigits(item.retryCount)}
                        </span>
                      )}
                    </div>
                    <span className="text-caption text-slate-500 font-mono block">{item.clientTimestamp}</span>
                    {item.conflictReason && (
                      <p className="text-rose-700 bg-rose-50 p-2 rounded text-caption leading-relaxed border border-rose-200">
                        {item.conflictReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status !== 'synced' && item.status !== 'conflict' && (
                      <Button size="xs" variant="outline" onClick={() => handleRetryItem(item)}>
                        ارسال مجدد (Retry)
                      </Button>
                    )}

                    {item.status === 'conflict' && (
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => {
                          setActiveConflictItem(item);
                          setActiveModal('conflict_resolve');
                        }}
                      >
                        رفع تعارض نسخه
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 text-right">
            <Button size="sm" variant="outline" onClick={() => setShowQueueModal(false)}>
              بستن پنجره
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Conflict Resolution Modal */}
      {activeModal === 'conflict_resolve' && activeConflictItem && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="حل تعارض همگام‌سازی سند (Sync Conflict 409)"
          size="lg"
        >
          <ConflictState
            currentValue={JSON.stringify(activeConflictItem.localPayload, null, 2)}
            serverValue={JSON.stringify(activeConflictItem.serverPayload || {}, null, 2)}
            modifiedBy="واحد فروش دفتری دفتر مرکزی"
            onResolve={handleResolveConflict}
          />
        </Modal>
      )}

      {/* 9. Privacy Explanation Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="اصول حفظ حریم خصوصی در سامانه میدانی جوادیان"
        size="md"
      >
        <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-emerald-900 mb-1">
                تعهد عدم ردگیری پیوسته یا مخفیانه
              </strong>
              این برنامه موبایل فاقد هرگونه سرویس پس‌زمینه برای ارسال مداوم جی‌پی‌اس است.
            </div>
          </div>

          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>
              <strong>حضور و غیاب اعلامی:</strong> شروع و پایان شیفت صرفاً بر مبنای فشردن صریح دکمه توسط خود همکار ثبت
              می‌شود.
            </li>
            <li>
              <strong>موقعیت رویدادمحور:</strong> موقعیت جغرافیایی صرفاً در زمان فشردن دکمه ثبت ورود/خروج یا ثبت فیش
              ذخیره می‌گردد.
            </li>
            <li>
              <strong>غیرفعال بودن خارج از شیفت:</strong> با پایان شیفت کاری، دسترسی به موقعیت مکانی متوقف می‌شود.
            </li>
            <li>
              <strong>ارزیابی مبتنی بر نتیجه:</strong> نظارت مدیریتی صرفاً بر تحقق برنامه و وظایف بلاتکلیف تمرکز دارد، نه
              شمارش خام گام‌ها یا توقف‌های مکانی.
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-200 text-right">
            <Button size="sm" variant="primary" onClick={() => setShowPrivacyModal(false)}>
              متوجه شدم
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
