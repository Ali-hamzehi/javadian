import { OperationalRecord, RecordStatus, RecordType, PriorityLevel, MockPersona } from '../types';
import { MOCK_RECORDS, MOCK_PERSONAS } from './mockData';
import { MOCK_DELEGATIONS } from './mockOrgData';
import { MOCK_SALES_ORDERS } from './mockSalesData';
import { IOperationalRecordRepository } from './repositoryInterfaces';
import {
  canActorViewRecord,
  computeAllowedActions,
  getEligibleAssignees,
  canActorCreateWorkItem,
  validateReassignmentCandidate,
  CandidateEligibilityEvidence,
} from '../utils/workItemAuthorization';
import { isJalaliOverdue } from '../utils/formatters';

export interface ScopedTaskCounts {
  mine: number;
  approvals: number;
  returned: number;
  blocked: number;
  waiting: number;
  notifications: number;
  orders: number;
  supplyReqs: number;
  payRequests: number;
  visitPlans: number;
}

class MockRepository implements IOperationalRecordRepository {
  private records: OperationalRecord[] = [...MOCK_RECORDS];

  public getAllRecords(): OperationalRecord[] {
    return [...this.records];
  }

  public addRecord(record: OperationalRecord): void {
    const existingIdx = this.records.findIndex((r) => r.id === record.id);
    if (existingIdx >= 0) {
      this.records[existingIdx] = record;
    } else {
      this.records.unshift(record);
    }
  }

  public getAuthorizedRecords(actor: MockPersona): OperationalRecord[] {
    if (!actor) return [];
    return this.records.filter((r) => canActorViewRecord(actor, r));
  }

  /**
   * Canonical actionable approval predicate:
   * An Approval WorkItem must appear in the current user's «تأییدهای من» when:
   * - work_item_type === APPROVAL_REVIEW
   * - assigned_approver_user_id === current_user.id OR active authorized delegation resolves to current_user.id
   * - approval_status is PENDING_APPROVAL or IN_REVIEW
   * - work_item_status is READY or IN_REVIEW
   * - source revision is the current actionable revision
   * - Approval Instance is not SUPERSEDED, APPROVED, REJECTED or CANCELLED
   */
  public isActionableApprovalRecord(actor: MockPersona | null | undefined, record: OperationalRecord): boolean {
    if (!actor) return false;

    // 1. work_item_type === APPROVAL_REVIEW
    const itemType = (record.workItemType || record.type || '').toUpperCase();
    const isApprovalReviewType =
      itemType === 'APPROVAL_REVIEW' ||
      record.workItemType === 'approval_review' ||
      (record.type === 'approval' && Boolean(record.approvalInstance));
    if (!isApprovalReviewType) return false;

    // 2. assigned_approver_user_id === current_user.id OR active authorized delegation resolves to current_user.id
    const assignedApproverId =
      record.approvalInstance?.resolved_approver?.id ||
      record.approver?.id ||
      record.currentAssignee?.id ||
      record.currentOwner?.id;

    if (!assignedApproverId) return false;

    const isDirectApprover = assignedApproverId === actor.id;
    const isDelegateOfApprover = MOCK_DELEGATIONS.some(
      (d) => d.delegator.id === assignedApproverId && d.delegatee.id === actor.id && d.status === 'active'
    );

    if (!isDirectApprover && !isDelegateOfApprover) {
      return false;
    }

    // Segregation of Duties (SoD): Creator cannot approve their own record
    if (record.creator?.id === actor.id) {
      return false;
    }

    // 3. approval_status is PENDING_APPROVAL or IN_REVIEW
    const approvalStatus = (
      record.approvalInstance?.approval_status ||
      (record as any).approvalStatus ||
      ''
    ).toUpperCase();

    const isApprovalStatusValid =
      approvalStatus === 'PENDING_APPROVAL' ||
      approvalStatus === 'IN_REVIEW' ||
      approvalStatus === 'PENDING';
    if (!isApprovalStatusValid) return false;

    // 4. work_item_status is READY or IN_REVIEW
    const workItemStatus = (record.status || '').toLowerCase();
    const isWorkItemStatusValid = workItemStatus === 'ready' || workItemStatus === 'in_review';
    if (!isWorkItemStatusValid) return false;

    // 5. the Approval Instance is not SUPERSEDED, APPROVED, REJECTED or CANCELLED
    const forbiddenStatuses = ['SUPERSEDED', 'APPROVED', 'REJECTED', 'CANCELLED'];
    if (forbiddenStatuses.includes(approvalStatus)) return false;

    if (record.approvalInstance) {
      const instStatus = (record.approvalInstance.approval_status || '').toUpperCase();
      if (forbiddenStatuses.includes(instStatus)) return false;

      // 6. source revision is the current actionable revision
      if (record.approvalInstance.source_revision !== undefined) {
        const sourceOrder = MOCK_SALES_ORDERS.find(
          (o) =>
            o.id === record.approvalInstance?.source_entity_id ||
            o.code === record.approvalInstance?.source_entity_code
        );
        if (sourceOrder && sourceOrder.revisions && sourceOrder.revisions.length > 0) {
          const latestRevision = Math.max(...sourceOrder.revisions.map((r) => r.revisionNumber));
          if (record.approvalInstance.source_revision !== latestRevision) {
            return false;
          }
        }
      }
    }

    // WorkItem lifecycle must not be terminal or returned
    if (
      record.status === 'completed' ||
      record.status === 'rejected' ||
      record.status === 'cancelled' ||
      record.status === 'returned'
    ) {
      return false;
    }

    return true;
  }

  public getActionableApprovalItems(actor: MockPersona | null | undefined): OperationalRecord[] {
    if (!actor) return [];
    const authorized = this.getAuthorizedRecords(actor);
    return authorized.filter((rec) => this.isActionableApprovalRecord(actor, rec));
  }

  public computeScopedTaskCounts(actor: MockPersona | null | undefined): ScopedTaskCounts {
    if (!actor) {
      return {
        mine: 0,
        approvals: 0,
        returned: 0,
        blocked: 0,
        waiting: 0,
        notifications: 0,
        orders: 0,
        supplyReqs: 0,
        payRequests: 0,
        visitPlans: 0,
      };
    }

    const authorized = this.getAuthorizedRecords(actor);

    // 1. mine (اقدام من / کارهای من)
    const mine = authorized.filter((rec) => {
      const isAssignee =
        rec.currentAssignee?.id === actor.id ||
        rec.currentOwner?.id === actor.id ||
        (actor.personaKey === 'multi_delegate' &&
          (rec.currentAssignee?.isActingDelegate || rec.currentOwner?.isActingDelegate));
      if (!isAssignee) return false;
      if (rec.status === 'completed' || rec.status === 'rejected' || rec.status === 'cancelled' || rec.status === 'returned') {
        return false;
      }
      const isApprovalObligation =
        rec.type === 'approval' ||
        rec.workItemType === 'approval_review' ||
        rec.status === 'pending_approval' ||
        Boolean(rec.approvalInstance);
      if (isApprovalObligation) return false;

      return true;
    }).length;

    // 2. approvals (تأییدهای من) - Derived canonically from actionableApprovalItems
    const approvals = this.getActionableApprovalItems(actor).length;

    // 3. returned (برگشتی‌ها) - Only items returned to the actor for correction
    const returned = authorized.filter((rec) => {
      if (rec.status !== 'returned') return false;
      const isRecipient =
        rec.currentAssignee?.id === actor.id ||
        rec.currentOwner?.id === actor.id ||
        rec.creator.id === actor.id ||
        rec.owner?.id === actor.id;
      return isRecipient;
    }).length;

    // 4. blocked / overdue (عقب‌افتاده / مسدود)
    const blocked = authorized.filter((rec) => {
      const isBlocked = rec.status === 'blocked' || (rec.blocker && rec.blocker.exists);
      const isOverdue =
        isJalaliOverdue(rec.dueDateJalali) &&
        rec.status !== 'completed' &&
        rec.status !== 'cancelled';
      return isBlocked || isOverdue;
    }).length;

    // 5. waiting (در انتظار دیگران)
    const waiting = authorized.filter((rec) => {
      if (rec.status === 'returned') return false;
      const isAssignee =
        rec.currentAssignee?.id === actor.id || rec.currentOwner?.id === actor.id;
      const isCreatorOrOwner = rec.creator.id === actor.id || rec.owner?.id === actor.id;
      const isApprovalObligation =
        rec.type === 'approval' ||
        rec.workItemType === 'approval_review' ||
        rec.status === 'pending_approval' ||
        Boolean(rec.approvalInstance);

      if (isApprovalObligation) {
        const isApproverTarget = rec.approver?.id === actor.id;
        if (isApproverTarget) return false;
        return isCreatorOrOwner && rec.status !== 'completed' && rec.status !== 'cancelled' && rec.status !== 'rejected';
      }
      return !isAssignee && isCreatorOrOwner && rec.status !== 'completed' && rec.status !== 'cancelled';
    }).length;

    // 6. notifications
    const notifications = authorized.filter((rec) => {
      const isAssignee =
        rec.currentAssignee?.id === actor.id || rec.currentOwner?.id === actor.id;
      const isOwner = rec.owner?.id === actor.id;
      const isCreator = rec.creator?.id === actor.id;
      const isApprover = rec.approver?.id === actor.id;
      return isAssignee || isOwner || isCreator || isApprover;
    }).length;

    // Specific domain route badges
    const orders = authorized.filter((r) => r.type === 'sales_order').length;
    const supplyReqs = authorized.filter((r) => r.type === 'supply_request').length;
    const payRequests = authorized.filter((r) => r.type === 'payment_request').length;
    const visitPlans = authorized.filter((r) => r.type === 'field_visit').length;

    return {
      mine,
      approvals,
      returned,
      blocked,
      waiting,
      notifications,
      orders,
      supplyReqs,
      payRequests,
      visitPlans,
    };
  }

  public getAuthorizedRecordById(id: string, actor: MockPersona): OperationalRecord | undefined {
    const rec = this.records.find((r) => r.id === id || r.code === id);
    if (!rec) return undefined;
    if (!canActorViewRecord(actor, rec)) return undefined;
    return rec;
  }

  public getRecordById(id: string): OperationalRecord | undefined {
    return this.records.find((r) => r.id === id || r.code === id);
  }

  public filterRecords(params: {
    query?: string;
    type?: RecordType | 'all';
    status?: RecordStatus | 'all';
    priority?: PriorityLevel | 'all';
    hasBlocker?: boolean;
    ownerId?: string;
  }, actor?: MockPersona): OperationalRecord[] {
    let result = actor ? this.records.filter((r) => canActorViewRecord(actor, r)) : [...this.records];

    if (params.query) {
      const q = params.query.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.itemSummary.toLowerCase().includes(q) ||
          r.creator.name.toLowerCase().includes(q) ||
          r.currentOwner.name.toLowerCase().includes(q) ||
          r.unit.toLowerCase().includes(q)
      );
    }

    if (params.type && params.type !== 'all') {
      result = result.filter((r) => r.type === params.type);
    }

    if (params.status && params.status !== 'all') {
      result = result.filter((r) => r.status === params.status);
    }

    if (params.priority && params.priority !== 'all') {
      result = result.filter((r) => r.priority === params.priority);
    }

    if (params.hasBlocker !== undefined) {
      result = result.filter((r) => (r.blocker?.exists ?? false) === params.hasBlocker);
    }

    if (params.ownerId) {
      result = result.filter((r) => r.currentOwner.id === params.ownerId);
    }

    return result;
  }

  public addComment(recordId: string, authorName: string, text: string, isInternal: boolean): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.comments.unshift({
      id: `c-${Date.now()}`,
      author: {
        id: 'usr-current',
        name: authorName,
        role: 'کاربر سیستم',
        department: 'عملیات',
      },
      text,
      createdAtJalali: 'هم‌اکنون',
      isInternal,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: {
        id: 'usr-current',
        name: authorName,
        role: 'کاربر سیستم',
        department: 'عملیات',
      },
      title: isInternal ? 'ثبت یادداشت محرمانه داخلی' : 'ثبت توضیح بر روی پرونده',
      note: text,
      type: 'comment',
    });

    return true;
  }

  public resolveBlocker(recordId: string, resolverName: string, note: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.blocker = null;
    if (rec.status === 'blocked') {
      rec.status = 'in_progress';
      rec.statusLabel = 'در حال اجرا (مانع برطرف شد)';
    }

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: {
        id: 'usr-current',
        name: resolverName,
        role: 'مسئول پیگیری',
        department: 'عملیات',
      },
      title: 'رفع مانع عملیاتی',
      note: note || 'مانع با هماهنگی انجام‌شده رفع شد و روند به جریان افتاد.',
      type: 'blocker_cleared',
    });

    return true;
  }

  public raiseBlocker(recordId: string, reporterName: string, reason: string, severity: 'warning' | 'critical'): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.blocker = {
      exists: true,
      reason,
      severity,
      reportedAtJalali: 'هم‌اکنون',
      reporter: {
        id: 'usr-current',
        name: reporterName,
        role: 'مسئول بررسی',
        department: 'عملیات',
      },
    };
    rec.status = 'blocked';
    rec.statusLabel = 'دارای مانع عملیاتی فوری';

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: {
        id: 'usr-current',
        name: reporterName,
        role: 'مسئول بررسی',
        department: 'عملیات',
      },
      title: 'اعلام مانع عملیاتی جدید',
      note: reason,
      type: 'blocker_raised',
    });

    return true;
  }

  public approveRecord(recordId: string, approverName: string, note?: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.status = 'in_progress';
    rec.statusLabel = 'تأیید شد و به مرحله بعد ارجاع یافت';
    rec.nextAction = {
      title: 'صدور مجوز خروج انبار و صدور فاکتور',
      responsibleRole: 'لجستیک و انبار',
      dueJalali: 'تا ۲۴ ساعت آینده',
      suggestedAction: 'dispatch',
    };

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: {
        id: 'usr-current',
        name: approverName,
        role: 'مقام تأییدکننده',
        department: 'مدیریت',
      },
      title: 'تأیید رسمی پرونده',
      note: note || 'پرونده بررسی و مورد موافقت قرار گرفت.',
      type: 'approval',
    });

    return true;
  }

  public rejectRecord(recordId: string, actorName: string, reason: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.status = 'rejected';
    rec.statusLabel = 'رد شده توسط مقام مسئول';
    if (rec.approvalInstance) {
      rec.approvalInstance.approval_status = 'REJECTED';
    }
    rec.nextAction = {
      title: 'بایگانی پرونده یا بازنگری اساسی و ثبت مجدد',
      responsibleRole: 'ایجادکننده اولیه (' + rec.creator.name + ')',
      dueJalali: 'اقدام فوری',
      suggestedAction: 'review',
    };

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: {
        id: 'usr-current',
        name: actorName,
        role: 'مقام تصمیم‌گیرنده',
        department: 'مدیریت',
      },
      title: 'رد رسمی پرونده',
      note: 'علت رد: ' + reason,
      type: 'rejection',
    });

    return true;
  }

  public returnRecord(recordId: string, actorName: string, reason: string): boolean {
    return this.returnWorkItem(
      recordId,
      {
        id: 'p-comm-approver',
        name: actorName,
        role: 'معاونت بازرگانی',
        department: 'معاونت بازرگانی و فروش',
      },
      reason
    );
  }

  public startWorkItem(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    const isApprovalWorkItem =
      rec.type === 'approval' ||
      rec.workItemType === 'approval_review' ||
      Boolean(rec.approvalInstance);

    const previousStatus = rec.status;
    const newStatus = isApprovalWorkItem ? 'in_review' : 'in_progress';
    const newStatusLabel = isApprovalWorkItem ? 'در حال بررسی' : 'در دست اقدام مجری';
    rec.status = newStatus;
    rec.statusLabel = newStatusLabel;
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = isApprovalWorkItem
      ? `شروع بررسی تأییدیه توسط ${actor.name}`
      : `شروع به کار توسط ${actor.name}`;

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: newStatus,
      actor,
      reason: isApprovalWorkItem ? 'شروع بررسی و تصمیم‌گیری تأیید' : 'شروع عملیات اجرایی کار',
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: isApprovalWorkItem ? 'شروع بررسی توسط مقام تأییدکننده' : 'شروع به کار توسط مجری',
      note: isApprovalWorkItem
        ? 'وظیفه کاری در وضعیت «در حال بررسی» (IN_REVIEW) قرار گرفت. وضعیت سفارش کماکان «در انتظار تأیید تجاری و اعتباری» باقی ماند.'
        : 'کار از وضعیت باز / در انتظار به جریان افتاد و در دست اقدام قرار گرفت.',
      type: 'started',
    });

    return true;
  }

  public addProgressNote(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }, note: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `ثبت پیشرفت کار توسط ${actor.name}`;

    rec.comments = rec.comments || [];
    rec.comments.unshift({
      id: `c-${Date.now()}`,
      author: actor,
      text: note,
      createdAtJalali: 'هم‌اکنون',
      isInternal: false,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'ثبت یادداشت پیشرفت کار',
      note,
      type: 'comment',
    });

    return true;
  }

  public setWaitingStatus(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }, reason: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    const previousStatus = rec.status;
    rec.status = 'waiting';
    rec.statusLabel = 'معلق / در انتظار اقدام دیگران';
    rec.waitingReason = reason;
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `تعلیق کار به علت: ${reason}`;

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'waiting',
      actor,
      reason,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'تعلیق کار (در انتظار)',
      note: `علت تعلیق یا انتظار: ${reason}`,
      type: 'waiting',
    });

    return true;
  }

  public reassignWorkItem(
    recordId: string,
    actor: { id: string; name: string; role: string; department: string; avatar?: string },
    newAssignee: { id: string; name: string; role: string; department: string; avatar?: string; isActingDelegate?: boolean },
    reason?: string,
    isDelegation?: boolean,
    allowSupervisorSelfAssignment: boolean = true
  ): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    // Strict Authoritative Server-Side Validation
    const actorPersona = MOCK_PERSONAS.find((p) => p.id === actor.id);
    if (!actorPersona) return false;

    const validation = validateReassignmentCandidate(actorPersona, rec, newAssignee.id, {
      allowSupervisorSelfAssignment,
      isDelegation,
    });

    if (!validation.valid) {
      console.warn(
        `[SECURITY REJECTION] Reassignment of ${rec.code} to ${newAssignee.name} (${newAssignee.id}) rejected: ${validation.errorMessage} (code: ${validation.errorCode})`
      );
      return false;
    }

    const previousAssignee = rec.currentAssignee || rec.currentOwner;

    const isRealDelegation = Boolean(validation.evidence?.delegation_id) || isDelegation;

    // Preserving accountable Owner (rec.owner remains untouched), changing currentAssignee
    rec.currentAssignee = {
      ...newAssignee,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
      isActingDelegate: isRealDelegation || newAssignee.isActingDelegate,
    };
    rec.currentOwner = {
      ...newAssignee,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
      isActingDelegate: isRealDelegation || newAssignee.isActingDelegate,
    };

    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `ارجاع به ${newAssignee.name} توسط ${actor.name}`;

    rec.assignmentHistory = rec.assignmentHistory || [];
    rec.assignmentHistory.unshift({
      id: `ah-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      assignedBy: actor,
      assignedTo: {
        ...newAssignee,
        isActingDelegate: isRealDelegation,
      },
      previousAssignee,
      reason: reason || (isRealDelegation ? 'ارجاع به جانشین بر اساس حکم تفویض اختیارات' : 'بازتخصیص مجری کار'),
      isDelegation: isRealDelegation,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: isRealDelegation ? 'ارجاع کار از طریق جانشینی رسمی' : 'ارجاع کار به همکار جدید',
      note: `کار از ${previousAssignee.name} به ${newAssignee.name} منتقل شد.${reason ? ' دلیل: ' + reason : ''}`,
      type: 'assignment',
    });

    return true;
  }

  public requestCrossUnitReassignment(
    recordId: string,
    actor: { id: string; name: string; role: string; department: string; avatar?: string },
    reason: string,
    proposedUnit?: string,
    proposedPersonName?: string
  ): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;
    if (!reason || !reason.trim()) return false;

    const orgAuthority = {
      id: 'p-ops-dir',
      name: 'مهندس حامد اسدی',
      role: 'مدیر ارشد عملیات (دارای اختیارات سازمانی)',
    };

    const requestId = `cur-${Date.now()}`;
    const auditId = `aud-${Date.now()}`;

    // Current Assignee is strictly preserved
    rec.crossUnitRequest = {
      id: requestId,
      recordId: rec.id,
      requestedBy: actor,
      reason: reason.trim(),
      proposedUnit: proposedUnit || 'معاونت عملیات و زنجیره تأمین',
      proposedPerson: proposedPersonName ? { id: 'suggested', name: proposedPersonName } : undefined,
      routedTo: orgAuthority,
      status: 'pending_approval',
      requestedAtJalali: 'هم‌اکنون',
      auditTrailId: auditId,
    };

    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `ثبت درخواست ارجاع بین‌واحدی توسط ${actor.name}`;

    // Append-only audit events
    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'ثبت درخواست ارجاع بین‌واحدی',
      note: `درخواست ارجاع کار به خارج از واحد توسط ${actor.name} ثبت شد و جهت بررسی و اتخاذ تصمیم به ${orgAuthority.name} ارجاع گردید. دلیل: ${reason.trim()}`,
      type: 'assignment',
    });

    rec.comments = rec.comments || [];
    rec.comments.unshift({
      id: `c-${Date.now()}`,
      author: actor,
      text: `درخواست رسمی ارجاع بین‌واحدی: ${reason.trim()} (ارجاع به: ${orgAuthority.name} — وضعیت: در انتظار بررسی و مصوبه سازمانی)`,
      createdAtJalali: 'هم‌اکنون',
      isInternal: true,
    });

    return true;
  }

  public returnWorkItem(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }, reason: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    if (!reason || !reason.trim()) {
      return false;
    }

    const actorPersona = MOCK_PERSONAS.find((p) => p.id === actor.id);
    if (actorPersona) {
      const allowed = computeAllowedActions(actorPersona, rec);
      if (!allowed.can_return) {
        console.warn(`[AUTH REJECTED] Actor ${actor.name} lacks authority to return ${rec.code}`);
        return false;
      }
    }

    const isApprovalWorkItem =
      rec.type === 'approval' ||
      rec.workItemType === 'approval_review' ||
      Boolean(rec.approvalInstance);

    const previousStatus = rec.status;
    rec.status = 'returned';
    rec.statusLabel = 'برگشتی جهت اصلاح';
    rec.returnedReason = reason.trim();
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `برگشت کار توسط ${actor.name}: ${reason}`;

    if (rec.approvalInstance) {
      rec.approvalInstance.approval_status = 'RETURNED_FOR_CORRECTION';
    }

    // Return to the order creator (Alireza Tehrani) if approval work item, or submitter/creator
    const targetRecipient = isApprovalWorkItem
      ? (rec.creator || {
          id: 'p-sales',
          name: 'علیرضا تهرانی',
          role: 'کارشناس فروش',
          department: 'معاونت بازرگانی و فروش',
        })
      : (rec.workResult?.completedBy || rec.creator || rec.owner);

    rec.owner = targetRecipient;
    rec.currentAssignee = {
      ...targetRecipient,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
    };
    rec.currentOwner = {
      ...targetRecipient,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
    };

    rec.nextAction = {
      title: isApprovalWorkItem
        ? 'اصلاح سفارش فروش و ارسال مجدد جهت بررسی و تأیید'
        : 'اصلاح نواقص و ارسال مجدد جهت اقدام/تأیید',
      responsibleRole: targetRecipient.role,
      responsiblePersonName: targetRecipient.name,
      dueJalali: 'حداکثر ۲۴ ساعت کاری',
      suggestedAction: 'review',
    };

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'returned',
      actor,
      reason,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'برگشت کار جهت اصلاح نواقص (Returned)',
      note: `دلیل برگشت الزامی: ${reason}`,
      type: 'returned',
    });

    return true;
  }

  public rejectWorkItem(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }, reason: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    const previousStatus = rec.status;
    rec.status = 'rejected';
    rec.statusLabel = 'رد شده توسط مقام مسئول';
    rec.rejectionReason = reason;
    if (rec.approvalInstance) {
      rec.approvalInstance.approval_status = 'REJECTED';
    }
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `رد کار توسط ${actor.name}: ${reason}`;

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'rejected',
      actor,
      reason,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'رد قطعی کار (Rejected)',
      note: `دلیل رد: ${reason}`,
      type: 'rejection',
    });

    return true;
  }

  public cancelWorkItem(recordId: string, actor: { id: string; name: string; role: string; department: string; avatar?: string }, reason: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    const previousStatus = rec.status;
    rec.status = 'cancelled';
    rec.statusLabel = 'لغو شده';
    rec.cancellationReason = reason;
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `لغو کار توسط ${actor.name}: ${reason}`;

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'cancelled',
      actor,
      reason,
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor,
      title: 'لغو کار (Cancelled)',
      note: `دلیل لغو: ${reason}`,
      type: 'cancelled',
    });

    return true;
  }

  public completeWorkItem(
    recordId: string,
    actor: { id: string; name: string; role: string; department: string; avatar?: string },
    result: {
      resultSummary: string;
      outcomeType: 'success' | 'partial' | 'alternative_solution';
      attachments?: any[];
    }
  ): { status: 'completed' | 'pending_approval' } | false {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    // Strict Rule: Work items cannot become COMPLETED without a valid non-empty structured Work Result
    if (!result || !result.resultSummary || !result.resultSummary.trim()) {
      console.warn(`[VALIDATION REJECTED] Work Result summary is empty or whitespace-only`);
      return false;
    }

    const actorPersona = MOCK_PERSONAS.find((p) => p.id === actor.id);
    if (actorPersona) {
      const allowed = computeAllowedActions(actorPersona, rec);
      if (!allowed.can_submit_result) {
        console.warn(`[AUTH REJECTED] Actor ${actor.name} lacks authority to submit result for ${rec.code}`);
        return false;
      }
    }

    const previousStatus = rec.status;
    const hasApprover = !!rec.approver && rec.approver.id !== actor.id;

    rec.workResult = {
      completedAtJalali: 'هم‌اکنون',
      completedBy: actor,
      resultSummary: result.resultSummary.trim(),
      outcomeType: result.outcomeType,
      attachments: result.attachments || [],
    };

    if (hasApprover) {
      // Moves to pending_approval and is assigned to Approver
      rec.status = 'pending_approval';
      rec.statusLabel = 'در انتظار تأیید تکمیل توسط مقام مسئول';
      rec.statusSinceJalali = 'هم‌اکنون';
      rec.currentAssignee = {
        ...rec.approver!,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      };
      rec.currentOwner = {
        ...rec.approver!,
        heldSinceJalali: 'هم‌اکنون',
        durationHours: 0,
      };
      rec.nextAction = {
        title: 'بررسی نتیجه انجام کار و اعلام تأیید یا برگشت',
        responsibleRole: rec.approver!.role,
        responsiblePersonName: rec.approver!.name,
        dueJalali: 'تا ۲۴ ساعت کاری',
        suggestedAction: 'approve',
      };
      rec.lastActivityJalali = 'هم‌اکنون';
      rec.lastActivityDescription = `ارسال نتیجه کار جهت تأیید به ${rec.approver!.name}`;

      rec.statusHistory = rec.statusHistory || [];
      rec.statusHistory.unshift({
        id: `sh-${Date.now()}`,
        timestampJalali: 'هم‌اکنون',
        fromStatus: previousStatus,
        toStatus: 'pending_approval',
        actor,
        reason: 'ثبت نتیجه کار و ارسال به کارتابل تأییدکننده',
      });

      rec.timeline.unshift({
        id: `t-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timestampJalali: 'هم‌اکنون',
        actor,
        title: 'ثبت نتیجه و ارسال جهت تأیید نهایی',
        note: `نتیجه ثبت‌شده: ${result.resultSummary.trim()} (ارجاع به ${rec.approver!.name})`,
        type: 'completed',
      });

      return { status: 'pending_approval' };
    } else {
      // Completed directly
      rec.status = 'completed';
      rec.statusLabel = 'تکمیل شده';
      rec.statusSinceJalali = 'هم‌اکنون';
      rec.lastActivityJalali = 'هم‌اکنون';
      rec.lastActivityDescription = `تکمیل کار با ثبت نتیجه قطعی توسط ${actor.name}`;

      rec.statusHistory = rec.statusHistory || [];
      rec.statusHistory.unshift({
        id: `sh-${Date.now()}`,
        timestampJalali: 'هم‌اکنون',
        fromStatus: previousStatus,
        toStatus: 'completed',
        actor,
        reason: 'تکمیل کار با ثبت Work Result قطعی',
      });

      rec.timeline.unshift({
        id: `t-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timestampJalali: 'هم‌اکنون',
        actor,
        title: 'تکمیل قطعی کار (Completed)',
        note: `نتیجه نهایی کار: ${result.resultSummary.trim()}`,
        type: 'completed',
      });

      return { status: 'completed' };
    }
  }

  public approveWorkItemCompletion(
    recordId: string,
    approver: { id: string; name: string; role: string; department: string; avatar?: string },
    note?: string
  ): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    const approverPersona = MOCK_PERSONAS.find((p) => p.id === approver.id);
    if (approverPersona) {
      const allowed = computeAllowedActions(approverPersona, rec);
      if (!allowed.can_approve) {
        console.warn(`[AUTH REJECTED] Actor ${approver.name} is not permitted to approve ${rec.code}`);
        return false;
      }
    }

    // Role conflict: Creator or Completer cannot approve their own work
    if (approver.id === rec.creator.id || approver.id === rec.workResult?.completedBy?.id) {
      console.warn(`[AUTH REJECTED] Self-approval forbidden for ${approver.name}`);
      return false;
    }

    const previousStatus = rec.status;
    rec.status = 'completed';
    rec.statusLabel = 'تکمیل شده (تأیید نهایی شد)';
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `تأیید تکمیل کار توسط ${approver.name}`;

    if (rec.workResult) {
      rec.workResult.approvalDecision = {
        approvedAtJalali: 'هم‌اکنون',
        approver,
        decision: 'approved',
        decisionNote: note || 'نتیجه کار بررسی و تأیید شد.',
      };
    }

    rec.approvalHistory = rec.approvalHistory || [];
    rec.approvalHistory.unshift({
      id: `apph-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      approver,
      decision: 'approved',
      reason: note || 'تأیید کامل خروجی کار',
    });

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'completed',
      actor: approver,
      reason: 'تأیید نهایی تکمیل کار توسط مقام مسئول',
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: approver,
      title: 'تأیید نهایی تکمیل کار',
      note: note || 'گزارش و نتیجه کار مورد تأیید قرار گرفت و پرونده خاتمه یافت.',
      type: 'approval',
    });

    return true;
  }

  public returnWorkItemCompletion(
    recordId: string,
    approver: { id: string; name: string; role: string; department: string; avatar?: string },
    reason: string
  ): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    if (!reason || !reason.trim()) {
      return false;
    }

    const approverPersona = MOCK_PERSONAS.find((p) => p.id === approver.id);
    if (approverPersona) {
      const allowed = computeAllowedActions(approverPersona, rec);
      if (!allowed.can_return) {
        console.warn(`[AUTH REJECTED] Actor ${approver.name} is not permitted to return completion for ${rec.code}`);
        return false;
      }
    }

    // Role conflict
    if (approver.id === rec.creator.id || approver.id === rec.workResult?.completedBy?.id) {
      return false;
    }

    const previousStatus = rec.status;
    rec.status = 'returned';
    rec.statusLabel = 'عدم تأیید نتیجه و برگشت جهت اصلاح';
    rec.returnedReason = reason.trim();
    rec.statusSinceJalali = 'هم‌اکنون';
    rec.lastActivityJalali = 'هم‌اکنون';
    rec.lastActivityDescription = `برگشت نتیجه کار توسط ${approver.name}: ${reason}`;

    // Return to the person who submitted the result or owner
    const targetRecipient = rec.workResult?.completedBy || rec.owner || rec.creator;
    rec.currentAssignee = {
      ...targetRecipient,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
    };
    rec.currentOwner = {
      ...targetRecipient,
      heldSinceJalali: 'هم‌اکنون',
      durationHours: 0,
    };

    if (rec.workResult) {
      rec.workResult.approvalDecision = {
        approvedAtJalali: 'هم‌اکنون',
        approver,
        decision: 'returned',
        decisionNote: reason.trim(),
      };
    }

    rec.approvalHistory = rec.approvalHistory || [];
    rec.approvalHistory.unshift({
      id: `apph-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      approver,
      decision: 'returned',
      reason: reason.trim(),
    });

    rec.statusHistory = rec.statusHistory || [];
    rec.statusHistory.unshift({
      id: `sh-${Date.now()}`,
      timestampJalali: 'هم‌اکنون',
      fromStatus: previousStatus,
      toStatus: 'returned',
      actor: approver,
      reason: reason.trim(),
    });

    rec.timeline.unshift({
      id: `t-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampJalali: 'هم‌اکنون',
      actor: approver,
      title: 'عدم پذیرش نتیجه کار و برگشت جهت تکمیل',
      note: `علت بازگشت: ${reason.trim()}`,
      type: 'returned',
    });

    return true;
  }

  public createRecord(record: OperationalRecord, actor?: MockPersona): boolean {
    if (actor && !canActorCreateWorkItem(actor)) {
      console.warn(`[AUTH REJECTED] Actor ${actor.name} lacks authority to create general work items`);
      return false;
    }
    this.records.unshift(record);
    return true;
  }

  public updateRecord(record: OperationalRecord): boolean {
    const idx = this.records.findIndex((r) => r.id === record.id);
    if (idx !== -1) {
      this.records[idx] = record;
      return true;
    }
    return false;
  }

  public find(predicate: (r: OperationalRecord) => boolean): OperationalRecord | undefined {
    return this.records.find(predicate);
  }
}

export const mockRepository = new MockRepository();
