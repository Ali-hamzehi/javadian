import {
  MockPersona,
  OperationalRecord,
  Person,
  WorkItemType,
} from '../types';
import { MOCK_PERSONAS } from '../data/mockData';
import { MOCK_DELEGATIONS, MOCK_RESPONSIBILITY_AREAS } from '../data/mockOrgData';

export type AuthorityScope = 'self' | 'unit' | 'organization';

/**
 * Authoritative organizational units and hierarchy
 */
export interface AuthoritativeOrgUnit {
  id: string;
  code: string;
  name: string;
  parentUnitId?: string;
  descendantUnitIds: string[];
}

export const AUTHORITATIVE_ORG_UNITS: AuthoritativeOrgUnit[] = [
  {
    id: 'unit-warehouse',
    code: 'UNT-WH-01',
    name: 'انبار و لجستیک کالا',
    parentUnitId: 'unit-ops',
    descendantUnitIds: [],
  },
  {
    id: 'unit-ops',
    code: 'UNT-OPS-01',
    name: 'معاونت عملیات و زنجیره تأمین',
    descendantUnitIds: ['unit-warehouse'],
  },
  {
    id: 'unit-sales',
    code: 'UNT-SAL-01',
    name: 'معاونت بازرگانی و فروش',
    descendantUnitIds: ['unit-field-sales'],
  },
  {
    id: 'unit-field-sales',
    code: 'UNT-SAL-02',
    name: 'واحد فروش مویرگی و بازاریابی میدانی',
    parentUnitId: 'unit-sales',
    descendantUnitIds: [],
  },
  {
    id: 'unit-finance',
    code: 'UNT-FIN-01',
    name: 'مدیریت امور مالی و خزانه‌داری',
    descendantUnitIds: [],
  },
  {
    id: 'unit-it',
    code: 'UNT-IT-01',
    name: 'مدیریت عملیات و امنیت فناوری',
    descendantUnitIds: [],
  },
  {
    id: 'unit-catalog',
    code: 'UNT-CAT-01',
    name: 'مدیریت زنجیره تأمین و اطلاعات پایه',
    descendantUnitIds: [],
  },
];

/**
 * Authoritative Unit Memberships Record
 */
export interface AuthoritativeMembership {
  membershipId: string;
  personId: string;
  unitId: string;
  unitName: string;
  status: 'active' | 'inactive';
  effectiveFrom: string;
  effectiveTo: string;
  isSupervisor: boolean;
  capabilities: string[];
}

export const AUTHORITATIVE_UNIT_MEMBERSHIPS: AuthoritativeMembership[] = [
  {
    membershipId: 'mem-wh-01',
    personId: 'p-warehouse',
    unitId: 'unit-warehouse',
    unitName: 'انبار و لجستیک کالا',
    status: 'active',
    effectiveFrom: '۱۴۰۲/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: true,
    capabilities: ['inventory.read', 'inventory.write', 'warehouse_receipt.create', 'supply.read'],
  },
  {
    membershipId: 'mem-wh-02',
    personId: 'p-ordinary',
    unitId: 'unit-warehouse',
    unitName: 'انبار و لجستیک کالا',
    status: 'active',
    effectiveFrom: '۱۴۰۳/۰۱/۰۱',
    effectiveTo: '۱۴۰۵/۱۲/۲۹',
    isSupervisor: false,
    capabilities: ['inventory.read'],
  },
  {
    membershipId: 'mem-it-01',
    personId: 'p-admin-ops',
    unitId: 'unit-it',
    unitName: 'مدیریت عملیات و امنیت فناوری',
    status: 'active',
    effectiveFrom: '۱۴۰۱/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: true,
    capabilities: ['USER_MANAGE', 'RESPONSIBILITY_MANAGE', 'DELEGATION_MANAGE', 'org.manage', 'WORK_ASSIGN'],
  },
  {
    membershipId: 'mem-ops-01',
    personId: 'p-ops-dir',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    status: 'active',
    effectiveFrom: '۱۴۰۱/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: true,
    capabilities: ['supply.read', 'supply.manage', 'org.manage', 'WORK_ASSIGN', 'inventory.read'],
  },
  {
    membershipId: 'mem-ops-02',
    personId: 'p-multi-delegate',
    unitId: 'unit-ops',
    unitName: 'معاونت عملیات و زنجیره تأمین',
    status: 'active',
    effectiveFrom: '۱۴۰۳/۰۶/۰۱',
    effectiveTo: '۱۴۰۴/۰۶/۳۱',
    isSupervisor: false,
    capabilities: ['supply.read', 'supply.manage', 'inventory.read'],
  },
  {
    membershipId: 'mem-cat-01',
    personId: 'p-master-data',
    unitId: 'unit-catalog',
    unitName: 'مدیریت زنجیره تأمین و اطلاعات پایه',
    status: 'active',
    effectiveFrom: '۱۴۰۲/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: false,
    capabilities: ['product.view', 'product.edit', 'supply.read'],
  },
  {
    membershipId: 'mem-sal-01',
    personId: 'p-sales',
    unitId: 'unit-sales',
    unitName: 'معاونت بازرگانی و فروش',
    status: 'active',
    effectiveFrom: '۱۴۰۲/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: false,
    capabilities: ['sales.read', 'sales.create', 'pricing.read'],
  },
  {
    membershipId: 'mem-sal-02',
    personId: 'p-comm-approver',
    unitId: 'unit-sales',
    unitName: 'معاونت بازرگانی و فروش',
    status: 'active',
    effectiveFrom: '۱۴۰۱/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: true,
    capabilities: ['sales.read', 'sales.approve', 'pricing.approve'],
  },
  {
    membershipId: 'mem-fsal-01',
    personId: 'p-field-sales',
    unitId: 'unit-field-sales',
    unitName: 'واحد فروش مویرگی و بازاریابی میدانی',
    status: 'active',
    effectiveFrom: '۱۴۰۳/۰۱/۰۱',
    effectiveTo: '۱۴۰۵/۱۲/۲۹',
    isSupervisor: false,
    capabilities: ['sales.read', 'sales.create', 'field.read'],
  },
  {
    membershipId: 'mem-fin-01',
    personId: 'p-fin-spec',
    unitId: 'unit-finance',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    status: 'active',
    effectiveFrom: '۱۴۰۲/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: false,
    capabilities: ['finance.read', 'finance.payment_request.create'],
  },
  {
    membershipId: 'mem-fin-02',
    personId: 'p-fin-dir',
    unitId: 'unit-finance',
    unitName: 'مدیریت امور مالی و خزانه‌داری',
    status: 'active',
    effectiveFrom: '۱۴۰۱/۰۱/۰۱',
    effectiveTo: '۱۴۰۶/۱۲/۲۹',
    isSupervisor: true,
    capabilities: ['finance.read', 'finance.approve', 'finance.execute'],
  },
  {
    membershipId: 'mem-trainee-01',
    personId: 'p-no-access',
    unitId: 'unit-trainee',
    unitName: 'دوره کارآموزی تابستانه',
    status: 'inactive',
    effectiveFrom: '۱۴۰۴/۰۴/۰۱',
    effectiveTo: '۱۴۰۴/۰۵/۳۱',
    isSupervisor: false,
    capabilities: [],
  },
];

/**
 * Candidate Eligibility Evidence model
 */
export interface CandidateEligibilityEvidence {
  person_id: string;
  membership_id: string;
  matched_unit_id: string;
  matched_unit_name: string;
  matched_capability: string;
  delegation_id?: string;
  effective_from: string;
  effective_to: string;
  eligibility_reason: string;
  ui_label: string;
  is_supervisor_self_assignment?: boolean;
}

export interface EligibleAssigneeCandidate {
  person: MockPersona;
  evidence: CandidateEligibilityEvidence;
}

/**
 * Resolves a task's organizational unit ID from unit string
 */
export function resolveTaskUnitId(unitName?: string): string {
  if (!unitName) return 'unit-general';
  const u = unitName.trim().toLowerCase();
  if (u.includes('انبار') || u.includes('لجستیک')) return 'unit-warehouse';
  if (u.includes('مویرگی') || u.includes('میدانی')) return 'unit-field-sales';
  if (u.includes('فروش') || u.includes('بازرگانی')) return 'unit-sales';
  if (u.includes('مالی') || u.includes('خزانه') || u.includes('حسابداری')) return 'unit-finance';
  if (u.includes('کاتالوگ') || (u.includes('اطلاعات') && u.includes('پایه')) || (u.includes('تأمین') && u.includes('پایه'))) return 'unit-catalog';
  if (u.includes('فناوری') || u.includes('امنیت') || u.includes('it') || u.includes('سیستم')) return 'unit-it';
  if (u.includes('عملیات') || u.includes('توزیع') || u.includes('زنجیره')) return 'unit-ops';
  return 'unit-general';
}

/**
 * Normalizes Persian department / unit names into standardized organizational domain keys
 */
export function normalizeUnitKey(unitName?: string): string {
  if (!unitName) return 'general';
  const u = unitName.toLowerCase();
  if (u.includes('انبار') || u.includes('لجستیک')) {
    return 'warehouse';
  }
  if (u.includes('فناوری') || u.includes('امنیت') || u.includes('it') || u.includes('سیستم')) {
    return 'it';
  }
  if (u.includes('کاتالوگ') || (u.includes('اطلاعات') && u.includes('پایه')) || (u.includes('تأمین') && u.includes('پایه'))) {
    return 'catalog';
  }
  if (u.includes('میدانی') || u.includes('مویرگی')) {
    return 'field_sales';
  }
  if (u.includes('فروش') || u.includes('بازرگانی') || u.includes('مارکتینگ')) {
    return 'sales';
  }
  if (u.includes('مالی') || u.includes('خزانه') || u.includes('حسابداری') || u.includes('بودجه')) {
    return 'finance';
  }
  if (u.includes('عملیات') || u.includes('توزیع') || u.includes('زنجیره')) {
    return 'operations';
  }
  return 'general';
}

/**
 * Checks whether two department / unit labels belong to the same organizational domain
 */
export function isSameUnit(unitA?: string, unitB?: string): boolean {
  if (!unitA || !unitB) return false;
  if (unitA.trim() === unitB.trim()) return true;
  const keyA = normalizeUnitKey(unitA);
  const keyB = normalizeUnitKey(unitB);
  if (keyA === 'general' || keyB === 'general') return false;
  return keyA === keyB;
}

/**
 * Returns the effective organizational authority scope of an actor
 */
export function getActorAuthorityScope(actor: MockPersona): AuthorityScope {
  if (
    actor.id === 'p-admin-ops' ||
    actor.id === 'p-ops-dir' ||
    actor.capabilities.includes('org.manage') ||
    actor.capabilities.includes('WORK_ASSIGN') ||
    (actor.personaKey === 'multi_delegate' && actor.activeResponsibilityId === 'del-1')
  ) {
    return 'organization';
  }

  // Unit-level supervisors / managers
  if (
    actor.isManager ||
    actor.id === 'p-warehouse' ||
    actor.id === 'p-fin-dir' ||
    actor.id === 'p-comm-approver'
  ) {
    return 'unit';
  }

  // Ordinary workers have strictly SELF scope
  return 'self';
}

/**
 * Determines whether an actor has authority to create new work items (general task creation)
 */
export function canActorCreateWorkItem(actor: MockPersona): boolean {
  if (actor.id === 'p-no-access') return false;
  
  // Normal employee (Reza Mirzaei, p-ordinary) explicitly cannot create general tasks
  if (actor.id === 'p-ordinary') return false;

  // Explicit capability or active delegation with WORK_CREATE
  if (actor.capabilities.includes('WORK_CREATE')) return true;
  if (actor.personaKey === 'multi_delegate' && actor.activeResponsibilityId === 'del-1') return true;

  // Unit supervisors / managers and directors have creation authority for their unit
  if (actor.isManager || actor.id === 'p-admin-ops' || actor.id === 'p-ops-dir' || actor.id === 'p-comm-approver') {
    return true;
  }

  return false;
}

/**
 * Resolves eligible reassignment candidates with complete verification evidence
 * Enforces:
 * - Active Person
 * - Active membership in exact task unit or explicitly configured descendant unit
 * - Capability to perform task type
 * - Within actor's assignment authority
 * - Not the current Assignee
 * - No prohibited conflict
 * - Supervisor self-assignment requires explicit policy permission
 */
export function getAuthoritativeEligibleAssignees(
  actor: MockPersona,
  taskUnitOrRecord: string | OperationalRecord,
  options: {
    allowSupervisorSelfAssignment?: boolean;
    excludePersonId?: string;
  } = {}
): EligibleAssigneeCandidate[] {
  const taskUnit = typeof taskUnitOrRecord === 'string' ? taskUnitOrRecord : taskUnitOrRecord.unit;
  const workItemType = typeof taskUnitOrRecord === 'string' ? undefined : taskUnitOrRecord.workItemType;
  const recordAssigneeId = typeof taskUnitOrRecord === 'string' ? undefined : (taskUnitOrRecord.currentAssignee?.id || taskUnitOrRecord.currentOwner?.id);
  const excludeId = options.excludePersonId || recordAssigneeId;

  const actorScope = getActorAuthorityScope(actor);
  if (actorScope === 'self') {
    return [];
  }

  const taskUnitId = resolveTaskUnitId(taskUnit);
  const taskUnitDef = AUTHORITATIVE_ORG_UNITS.find((u) => u.id === taskUnitId);
  const permittedUnitIds = new Set<string>();
  if (taskUnitDef) {
    permittedUnitIds.add(taskUnitDef.id);
    taskUnitDef.descendantUnitIds.forEach((d) => permittedUnitIds.add(d));
  } else {
    permittedUnitIds.add(taskUnitId);
  }

  const candidates: EligibleAssigneeCandidate[] = [];

  for (const p of MOCK_PERSONAS) {
    // 1. Must be active person
    if (p.id === 'p-no-access') continue;

    // 2. Must not be the current Assignee
    if (excludeId && p.id === excludeId) continue;

    // 3. Find authoritative membership
    const membership = AUTHORITATIVE_UNIT_MEMBERSHIPS.find(
      (m) => m.personId === p.id && m.status === 'active'
    );
    if (!membership) continue;

    // 4. Check active delegation if any
    const activeDelegation = MOCK_DELEGATIONS.find(
      (d) => d.delegatee.id === p.id && d.status === 'active'
    );

    // 5. Unit membership & scope check:
    // When actor has UNIT scope, candidate MUST be active member of task unit or descendant unit
    const inAuthorizedUnit = permittedUnitIds.has(membership.unitId);
    const hasDelegationForUnit = activeDelegation
      ? permittedUnitIds.has(resolveTaskUnitId(activeDelegation.authorizedScope))
      : false;

    if (actorScope === 'unit') {
      if (!inAuthorizedUnit && !hasDelegationForUnit) {
        // Cross-unit candidates strictly absent from normal candidate list
        continue;
      }
    }

    // 6. Capability to perform the task type
    let matchedCap = '';
    if (taskUnitId === 'unit-warehouse' || workItemType === 'review') {
      const hasWhCap = p.capabilities.some(
        (c) =>
          c === 'inventory.read' ||
          c === 'inventory.write' ||
          c === 'warehouse_receipt.create' ||
          c === 'supply.read'
      );
      if (!hasWhCap) continue;
      matchedCap =
        p.capabilities.find((c) => c === 'inventory.write' || c === 'warehouse_receipt.create') ||
        'inventory.read';
    } else if (taskUnitId === 'unit-sales' || taskUnitId === 'unit-field-sales') {
      const hasSalesCap = p.capabilities.some(
        (c) => c.startsWith('sales.') || c.startsWith('pricing.') || c.startsWith('field.')
      );
      if (!hasSalesCap) continue;
      matchedCap = p.capabilities.find((c) => c.startsWith('sales.')) || 'sales.read';
    } else if (taskUnitId === 'unit-finance') {
      const hasFinCap = p.capabilities.some((c) => c.startsWith('finance.'));
      if (!hasFinCap) continue;
      matchedCap = p.capabilities.find((c) => c.startsWith('finance.')) || 'finance.read';
    } else {
      matchedCap = p.capabilities[0] || 'general.execute';
    }

    // 7. Supervisor Self-Assignment check:
    const isSelf = p.id === actor.id;
    if (isSelf) {
      if (!options.allowSupervisorSelfAssignment) {
        continue;
      }
      candidates.push({
        person: p,
        evidence: {
          person_id: p.id,
          membership_id: membership.membershipId,
          matched_unit_id: membership.unitId,
          matched_unit_name: membership.unitName,
          matched_capability: matchedCap,
          delegation_id: undefined,
          effective_from: membership.effectiveFrom,
          effective_to: membership.effectiveTo,
          eligibility_reason: `عضو فعال و سرپرست ${membership.unitName} — دارای صلاحیت عملیات بر اساس مجوز صریح خودارجاعی سرپرست`,
          ui_label: `عضو فعال واحد انبار — واجد صلاحیت عملیات انبار [خودارجاعی سرپرست]`,
          is_supervisor_self_assignment: true,
        },
      });
      continue;
    }

    // 8. Regular eligible candidate
    candidates.push({
      person: p,
      evidence: {
        person_id: p.id,
        membership_id: membership.membershipId,
        matched_unit_id: membership.unitId,
        matched_unit_name: membership.unitName,
        matched_capability: matchedCap,
        delegation_id: activeDelegation?.id,
        effective_from: activeDelegation ? activeDelegation.startDateJalali : membership.effectiveFrom,
        effective_to: activeDelegation ? activeDelegation.endDateJalali : membership.effectiveTo,
        eligibility_reason: activeDelegation
          ? `دارای حکم تفویض اختیارات فعال به شماره ${activeDelegation.id}`
          : `عضو فعال سازمانی در ${membership.unitName} با صلاحیت اجرایی احراز‌شده`,
        ui_label: `عضو فعال ${membership.unitName} — واجد صلاحیت عملیاتی`,
        is_supervisor_self_assignment: false,
      },
    });
  }

  return candidates;
}

/**
 * Returns active eligible personas who can be assigned work by the actor
 * Maintained for backward compatibility, backed by authoritative engine
 */
export function getEligibleAssignees(
  actor: MockPersona,
  taskUnit?: string,
  excludePersonId?: string,
  options?: { allowSupervisorSelfAssignment?: boolean }
): MockPersona[] {
  const candidates = getAuthoritativeEligibleAssignees(actor, taskUnit || '', {
    allowSupervisorSelfAssignment: options?.allowSupervisorSelfAssignment ?? false,
    excludePersonId,
  });
  return candidates.map((c) => c.person);
}

/**
 * Server-side authoritative validation for reassignment requests
 */
export interface ReassignmentValidationResult {
  valid: boolean;
  errorCode?:
    | 'ERR_NOT_AUTHORIZED'
    | 'ERR_INACTIVE_PERSON'
    | 'ERR_CURRENT_ASSIGNEE'
    | 'ERR_OUT_OF_UNIT'
    | 'ERR_MISSING_CAPABILITY'
    | 'ERR_EXPIRED_DELEGATION'
    | 'ERR_SELF_ASSIGNMENT_NOT_PERMITTED'
    | 'ERR_FORGED_REQUEST';
  errorMessage?: string;
  evidence?: CandidateEligibilityEvidence;
}

export function validateReassignmentCandidate(
  actor: MockPersona,
  record: OperationalRecord,
  targetPersonId: string,
  options: {
    allowSupervisorSelfAssignment?: boolean;
    isDelegation?: boolean;
  } = {}
): ReassignmentValidationResult {
  // 1. Authoritative action check
  const allowed = computeAllowedActions(actor, record);
  if (!allowed.can_reassign) {
    return {
      valid: false,
      errorCode: 'ERR_NOT_AUTHORIZED',
      errorMessage: `کاربر ${actor.name} اختیار بازتخصیص این کار را ندارد.`,
    };
  }

  // 2. Active person check
  if (!targetPersonId || targetPersonId === 'p-no-access') {
    return {
      valid: false,
      errorCode: 'ERR_INACTIVE_PERSON',
      errorMessage: 'فرد انتخابی غیرفعال است یا حساب کاربری معتبر ندارد.',
    };
  }

  // 3. Current assignee check
  const currentAssignee = record.currentAssignee || record.currentOwner;
  if (currentAssignee && targetPersonId === currentAssignee.id) {
    return {
      valid: false,
      errorCode: 'ERR_CURRENT_ASSIGNEE',
      errorMessage: 'امکان ارجاع کار به مجری فعلی وجود ندارد.',
    };
  }

  // 4. Resolve against authoritative eligibility engine
  const eligibleCandidates = getAuthoritativeEligibleAssignees(actor, record, {
    allowSupervisorSelfAssignment: options.allowSupervisorSelfAssignment ?? true,
    excludePersonId: currentAssignee?.id,
  });

  const matched = eligibleCandidates.find((c) => c.person.id === targetPersonId);
  if (!matched) {
    const targetPersona = MOCK_PERSONAS.find((p) => p.id === targetPersonId);
    if (!targetPersona) {
      return {
        valid: false,
        errorCode: 'ERR_FORGED_REQUEST',
        errorMessage: 'شناسه فرد نامعتبر و جعلی است.',
      };
    }

    const membership = AUTHORITATIVE_UNIT_MEMBERSHIPS.find((m) => m.personId === targetPersonId);
    const taskUnitId = resolveTaskUnitId(record.unit);

    if (membership && membership.unitId !== taskUnitId) {
      return {
        valid: false,
        errorCode: 'ERR_OUT_OF_UNIT',
        errorMessage: `فرد انتخابی (${targetPersona.name}) عضو واحد مجاز این کار نیست و ارجاع بین‌واحدی نیازمند ثبت «درخواست ارجاع بین‌واحدی» است.`,
      };
    }

    if (targetPersonId === actor.id && !options.allowSupervisorSelfAssignment) {
      return {
        valid: false,
        errorCode: 'ERR_SELF_ASSIGNMENT_NOT_PERMITTED',
        errorMessage: 'سیاست خودارجاعی سرپرست فعال نیست.',
      };
    }

    return {
      valid: false,
      errorCode: 'ERR_MISSING_CAPABILITY',
      errorMessage: `فرد انتخابی صلاحیت تخصصی لازم جهت انجام این کار را ندارد.`,
    };
  }

  // 5. Delegation check if applicable
  if (options.isDelegation) {
    const activeDel = MOCK_DELEGATIONS.find(
      (d) => d.delegatee.id === targetPersonId && d.status === 'active'
    );
    if (!activeDel) {
      return {
        valid: false,
        errorCode: 'ERR_EXPIRED_DELEGATION',
        errorMessage: 'حکم تفویض منقضی شده یا فاقد اعتبار زمانی است.',
      };
    }
  }

  return {
    valid: true,
    evidence: matched.evidence,
  };
}

/**
 * Returns active qualified personas who have legitimate approval authority for a work item
 * Enforces:
 * - Active approval / sign-off capability
 * - Matching scope / responsibility
 * - No role conflict: cannot be Creator
 * - No role conflict: cannot be current or proposed Assignee
 * - Excludes inactive members and non-approvers
 */
export function getEligibleApprovers(
  recordOrDraft: {
    creatorId?: string;
    assigneeId?: string;
    unit?: string;
    workItemType?: string;
  },
  activeActor?: MockPersona
): MockPersona[] {
  const activePersonas = MOCK_PERSONAS.filter((p) => p.id !== 'p-no-access');

  return activePersonas.filter((candidate) => {
    // 1. Prohibit self-approval: Creator cannot be Approver
    if (recordOrDraft.creatorId && candidate.id === recordOrDraft.creatorId) {
      return false;
    }

    // 2. Prohibit self-approval: Assignee cannot be Approver
    if (recordOrDraft.assigneeId && candidate.id === recordOrDraft.assigneeId) {
      return false;
    }

    // 3. Must possess genuine approval authority
    const hasApprovalCapability =
      candidate.capabilities.includes('approvals.view') ||
      candidate.capabilities.includes('sales.approve') ||
      candidate.capabilities.includes('finance.approve') ||
      candidate.capabilities.includes('supply.manage') ||
      candidate.id === 'p-comm-approver' ||
      candidate.id === 'p-ops-dir' ||
      candidate.id === 'p-fin-dir' ||
      candidate.id === 'p-warehouse' ||
      candidate.id === 'p-admin-ops' ||
      (candidate.personaKey === 'multi_delegate' && candidate.activeResponsibilityId === 'del-1');

    if (!hasApprovalCapability) {
      return false;
    }

    // 4. Must not be an ordinary employee or non-manager without approval delegation
    if (candidate.id === 'p-ordinary' || candidate.id === 'p-field-sales') {
      return false;
    }

    // 5. Must have matching domain authority or executive authority
    const isExecutive =
      candidate.id === 'p-admin-ops' ||
      candidate.id === 'p-ops-dir' ||
      candidate.id === 'p-comm-approver' ||
      candidate.id === 'p-fin-dir';

    if (isExecutive) return true;

    if (recordOrDraft.unit) {
      return isSameUnit(candidate.department, recordOrDraft.unit);
    }

    return true;
  });
}

/**
 * Core WorkItem Visibility Predicate
 * A user may see a WorkItem only when at least one authorized relationship exists:
 * - current Assignee
 * - Creator (when creator visibility is permitted)
 * - Accountable Owner within authorized scope
 * - Contributor
 * - Observer
 * - current Approver / Reviewer
 * - valid delegated actor
 * - explicit unit or organization oversight capability
 */
export function canActorViewRecord(actor: MockPersona, record: OperationalRecord): boolean {
  if (!actor || actor.id === 'p-no-access') return false;

  const currentAssignee = record.currentAssignee || record.currentOwner;

  // 1. Current Assignee
  if (currentAssignee && currentAssignee.id === actor.id) return true;
  if (record.currentOwner && record.currentOwner.id === actor.id) return true;

  // 2. Creator
  if (record.creator && record.creator.id === actor.id) return true;

  // 3. Accountable Owner
  if (record.owner && record.owner.id === actor.id) return true;

  // 4. Contributor
  if (record.contributors && record.contributors.some((c) => c.id === actor.id)) return true;

  // 5. Observer
  if (record.observers && record.observers.some((o) => o.id === actor.id)) return true;

  // 6. Current Approver / Reviewer
  if (record.approver && record.approver.id === actor.id) return true;
  if (record.approvalInstance?.resolved_approver && record.approvalInstance.resolved_approver.id === actor.id) return true;

  // 7. Active Delegation
  const hasActiveDelegation = MOCK_DELEGATIONS.some((d) => {
    if (d.delegatee.id !== actor.id || d.status !== 'active') return false;
    const delegatorId = d.delegator.id;
    return (
      delegatorId === currentAssignee?.id ||
      delegatorId === record.approver?.id ||
      delegatorId === record.owner?.id ||
      delegatorId === record.creator?.id
    );
  });
  if (hasActiveDelegation) return true;

  // 8. Explicit Organization Oversight
  if (
    actor.id === 'p-admin-ops' ||
    actor.id === 'p-ops-dir' ||
    actor.capabilities.includes('ops_view') ||
    actor.capabilities.includes('org.manage') ||
    (actor.personaKey === 'multi_delegate' && actor.activeResponsibilityId === 'del-1')
  ) {
    return true;
  }

  // 9. Explicit Unit Oversight (Unit Supervisor / Manager)
  if (actor.isManager) {
    const taskUnit = record.unit || record.creator?.department || record.owner?.department;
    if (isSameUnit(actor.department, taskUnit)) {
      return true;
    }
  }

  // Commercial Director oversight over sales/commercial records
  if (actor.id === 'p-comm-approver') {
    const taskUnit = record.unit || record.creator?.department || record.owner?.department;
    if (isSameUnit('معاونت بازرگانی و فروش', taskUnit)) {
      return true;
    }
  }

  // Finance Director oversight over finance records
  if (actor.id === 'p-fin-dir') {
    const taskUnit = record.unit || record.creator?.department || record.owner?.department;
    if (isSameUnit('مدیریت امور مالی و خزانه‌داری', taskUnit)) {
      return true;
    }
  }

  // Otherwise, no authorized relationship exists
  return false;
}

/**
 * Authoritative allowed actions set per WorkItem and Actor
 */
export interface AllowedWorkItemActions {
  can_start: boolean;
  can_report_progress: boolean;
  can_submit_result: boolean;
  can_report_blocker: boolean;
  can_resolve_blocker: boolean;
  can_set_waiting: boolean;
  can_request_reassignment: boolean;
  can_reassign: boolean;
  can_approve: boolean;
  can_return: boolean;
  can_reject: boolean;
  can_cancel: boolean;
}

/**
 * Computes authoritative allowed actions for a specific actor on a specific record
 */
export function computeAllowedActions(
  actor: MockPersona,
  record: OperationalRecord
): AllowedWorkItemActions {
  // If user cannot even view the record, all actions are strictly denied
  if (!canActorViewRecord(actor, record)) {
    return {
      can_start: false,
      can_report_progress: false,
      can_submit_result: false,
      can_report_blocker: false,
      can_resolve_blocker: false,
      can_set_waiting: false,
      can_request_reassignment: false,
      can_reassign: false,
      can_approve: false,
      can_return: false,
      can_reject: false,
      can_cancel: false,
    };
  }

  const currentAssignee = record.currentAssignee || record.currentOwner;
  const isAssignee = currentAssignee?.id === actor.id;
  const isCreator = record.creator.id === actor.id;
  const isOwner = record.owner ? record.owner.id === actor.id : isCreator;
  const isCompleter = record.workResult?.completedBy?.id === actor.id;

  const isApprovalWorkItem =
    record.type === 'approval' ||
    record.workItemType === 'approval_review' ||
    Boolean(record.approvalInstance);

  // Active delegation check for Assignee
  const isDelegateOfAssignee = currentAssignee
    ? MOCK_DELEGATIONS.some(
        (d) => d.delegator.id === currentAssignee.id && d.delegatee.id === actor.id && d.status === 'active'
      )
    : false;

  // Active delegation check for Approver
  const isDelegateOfApprover = record.approver
    ? MOCK_DELEGATIONS.some(
        (d) => d.delegator.id === record.approver?.id && d.delegatee.id === actor.id && d.status === 'active'
      )
    : false;

  const isEffectiveAssignee = isAssignee || isDelegateOfAssignee;
  const isEffectiveApprover =
    (record.approver ? record.approver.id === actor.id || isDelegateOfApprover : false) ||
    (isApprovalWorkItem && isEffectiveAssignee);

  // Self-approval prohibition:
  // For approval work items, the assigned approver is reviewing work submitted by the creator.
  // Creator or operational completer cannot approve.
  // For standard result-oriented tasks, the assignee who completed work cannot approve their own sign-off.
  const isSelfApprovalForbidden = isApprovalWorkItem
    ? (isCreator || isCompleter || record.creator.id === actor.id)
    : (isCreator || isCompleter || isAssignee);

  // Actor's assignment capability & scope
  const actorScope = getActorAuthorityScope(actor);
  const hasReassignCapability =
    actorScope === 'organization' ||
    (actorScope === 'unit' && (actor.isManager || isSameUnit(actor.department, record.unit))) ||
    (isOwner && actor.isManager);

  const isTerminal = record.status === 'completed' || record.status === 'cancelled' || record.status === 'rejected';

  // For approval work items, arbitrary reassignment is prohibited for normal approvers.
  // Reassignment is allowed only through valid effective delegation or explicit approval-administration authority.
  const hasApprovalAdminAuthority =
    actor.id === 'p-admin-ops' ||
    actor.personaKey === 'admin_ops' ||
    actor.capabilities.includes('org.manage') ||
    actor.capabilities.includes('WORK_ASSIGN');

  const can_reassign = !isTerminal && (isApprovalWorkItem ? hasApprovalAdminAuthority : hasReassignCapability);

  // 1. can_start: Open or Ready status and actor is the current Assignee / Approver
  const can_start =
    (record.status === 'open' || record.status === 'ready') &&
    (isApprovalWorkItem ? isEffectiveApprover && !isSelfApprovalForbidden : isEffectiveAssignee);

  // 2. can_report_progress: In progress and actor is Assignee (not applicable to approval-only work)
  const can_report_progress = !isApprovalWorkItem && record.status === 'in_progress' && isEffectiveAssignee;

  // 3. can_submit_result: In progress, waiting, or returned, and actor is Assignee
  const can_submit_result =
    !isApprovalWorkItem &&
    (record.status === 'in_progress' || record.status === 'waiting' || record.status === 'returned') &&
    isEffectiveAssignee;

  // 4. can_report_blocker: In progress or open, and actor is Assignee (operational blockers)
  const can_report_blocker =
    !isApprovalWorkItem &&
    (record.status === 'in_progress' || record.status === 'open') &&
    isEffectiveAssignee;

  // 5. can_resolve_blocker: Blocked status, and actor is Assignee, Owner, or Unit Supervisor/Admin
  const can_resolve_blocker =
    record.status === 'blocked' &&
    (isEffectiveAssignee || isOwner || actor.isManager || actor.id === 'p-admin-ops' || actor.id === 'p-ops-dir');

  // 6. can_set_waiting: In progress and actor is Assignee
  const can_set_waiting = !isApprovalWorkItem && record.status === 'in_progress' && isEffectiveAssignee;

  // 7. can_request_reassignment: Non-terminal, actor is Assignee, but does NOT have reassign authority
  const can_request_reassignment = !isTerminal && !isApprovalWorkItem && isEffectiveAssignee && !can_reassign;

  // 8. can_approve, can_return, can_reject:
  // For approval work items: active when pending review (open, ready, in_progress, in_review, pending_approval)
  const isApprovalPendingReview =
    record.status === 'open' ||
    record.status === 'ready' ||
    record.status === 'in_progress' ||
    record.status === 'in_review' ||
    record.status === 'pending_approval';

  const can_approve = isApprovalWorkItem
    ? (isApprovalPendingReview && isEffectiveApprover && !isSelfApprovalForbidden)
    : (record.status === 'pending_approval' && isEffectiveApprover && !isSelfApprovalForbidden);

  const can_return = isApprovalWorkItem
    ? (isApprovalPendingReview && isEffectiveApprover && !isSelfApprovalForbidden)
    : (record.status === 'pending_approval' && isEffectiveApprover && !isSelfApprovalForbidden);

  const can_reject = isApprovalWorkItem
    ? (isApprovalPendingReview && isEffectiveApprover && !isSelfApprovalForbidden)
    : (record.status === 'pending_approval' && isEffectiveApprover && !isSelfApprovalForbidden);

  // 9. can_cancel: Non-terminal, actor is Owner, Creator, or Admin
  const can_cancel =
    !isTerminal && (isOwner || isCreator || actor.id === 'p-admin-ops' || actor.id === 'p-ops-dir');

  return {
    can_start,
    can_report_progress,
    can_submit_result,
    can_report_blocker,
    can_resolve_blocker,
    can_set_waiting,
    can_request_reassignment,
    can_reassign,
    can_approve,
    can_return,
    can_reject,
    can_cancel,
  };
}
