export type RecordType =
  | 'sales_order'
  | 'supply_request'
  | 'payment_request'
  | 'inventory_receipt'
  | 'inventory_dispatch'
  | 'field_visit'
  | 'general_task'
  | 'followup'
  | 'review'
  | 'coordination'
  | 'field_op'
  | 'approval';

export type RecordStatus =
  | 'draft'
  | 'open'
  | 'ready'
  | 'in_progress'
  | 'in_review'
  | 'waiting'
  | 'completed'
  | 'returned'
  | 'rejected'
  | 'blocked'
  | 'cancelled'
  | 'pending_review'
  | 'pending_approval';

export type PriorityLevel = 'critical' | 'urgent' | 'high' | 'normal' | 'low';

// ================= WORK ITEM SPECIFIC TYPES =================

export type WorkItemType =
  | 'general' // اقدام عمومی
  | 'followup' // پیگیری
  | 'review' // بازبینی و کنترل
  | 'coordination' // هماهنگی
  | 'field_op' // عملیات میدانی
  | 'approval_review'; // بازبینی و تصمیم تأیید (APPROVAL_REVIEW)

export type WorkItemStatus = RecordStatus;

export type LinkedRecordCategory =
  | 'customer'
  | 'sales_order'
  | 'supply_request'
  | 'payment_request'
  | 'inventory_receipt'
  | 'inventory_dispatch'
  | 'field_visit'
  | 'customer_visit'
  | 'warehouse_exit'
  | 'warehouse_receipt'
  | 'other';

export interface LinkedBusinessRecord {
  id: string;
  code: string;
  title: string;
  category: LinkedRecordCategory;
  categoryLabel: string;
  currentStatus: string;
  routeKey?: string;
  summary?: string;
}

export interface WorkItemResult {
  completedAtJalali: string;
  completedBy: Person;
  resultSummary: string; // شرح نتیجه انجام کار
  outcomeType: 'success' | 'partial' | 'alternative_solution';
  attachments?: RecordAttachment[];
  approvalDecision?: {
    approvedAtJalali: string;
    approver: Person;
    decision: 'approved' | 'returned' | 'rejected';
    decisionNote?: string;
  };
}

export interface WorkItemAssignmentHistory {
  id: string;
  timestampJalali: string;
  assignedBy: Person;
  assignedTo: Person;
  previousAssignee?: Person;
  reason?: string;
  isDelegation?: boolean;
}

export interface WorkItemStatusHistory {
  id: string;
  timestampJalali: string;
  fromStatus: RecordStatus;
  toStatus: RecordStatus;
  actor: Person;
  reason?: string;
}

export interface WorkItemApprovalHistory {
  id: string;
  timestampJalali: string;
  approver: Person;
  decision: 'approved' | 'returned' | 'rejected';
  reason?: string;
}

export interface CrossUnitReassignmentRequest {
  id: string;
  recordId: string;
  requestedBy: Person;
  reason: string;
  proposedUnit?: string;
  proposedPerson?: { id: string; name: string };
  routedTo: { id: string; name: string; role: string };
  status: 'pending_approval' | 'approved' | 'rejected';
  requestedAtJalali: string;
  auditTrailId: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  email?: string;
  phone?: string;
  isActingDelegate?: boolean;
  delegatorName?: string;
}

export interface BlockerInfo {
  exists: boolean;
  reason?: string;
  reporter?: Person;
  reportedAtJalali?: string;
  severity?: 'warning' | 'critical';
  resolutionPlan?: string;
}

export interface NextActionInfo {
  title: string;
  responsibleRole: string;
  responsiblePersonName?: string;
  dueJalali: string;
  suggestedAction:
    | 'approve'
    | 'dispatch'
    | 'pay'
    | 'resolve_blocker'
    | 'review'
    | 'deliver'
    | 'start'
    | 'complete'
    | 'followup';
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timestampJalali: string;
  actor: Person;
  title: string;
  note?: string;
  type:
    | 'creation'
    | 'transition'
    | 'comment'
    | 'blocker_raised'
    | 'blocker_cleared'
    | 'approval'
    | 'rejection'
    | 'assignment'
    | 'started'
    | 'waiting'
    | 'completed'
    | 'returned'
    | 'cancelled';
}

export interface RecordComment {
  id: string;
  author: Person;
  text: string;
  createdAtJalali: string;
  isInternal: boolean;
}

export interface RecordAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'excel' | 'image' | 'doc';
  uploadedBy: string;
  uploadedAtJalali: string;
  url?: string;
}

export interface OperationalRecord {
  id: string;
  code: string;
  title: string;
  type: RecordType;
  typeLabel: string;
  
  // ۱. چه چیزی درخواست شده؟
  itemSummary: string;
  requestedAmountRials?: number;
  quantitySummary?: string;
  details?: Record<string, string | number>;

  // ۲. چه کسی ایجاد کرده؟
  creator: Person;
  createdAt: string;
  createdAtJalali: string;

  // ۳. اکنون دست چه کسی است؟ (مجری اقدام‌کننده کنونی)
  currentOwner: Person & {
    heldSinceJalali: string;
    durationHours: number;
    isActingDelegate?: boolean;
  };

  // ۴. مسئول پاسخگو / صاحب کار (Accountable Owner)
  owner?: Person;

  // ۵. سایر ارکان و مشارکت‌کنندگان
  currentAssignee?: Person & {
    heldSinceJalali?: string;
    durationHours?: number;
    isActingDelegate?: boolean;
  };
  contributors?: Person[];
  approver?: Person;
  observers?: Person[];

  // ۶. تفویض و جانشینی
  delegationContext?: {
    isDelegated: boolean;
    originalOwner?: Person;
    delegatee?: Person;
    validityPeriod?: string;
    reason?: string;
  };

  // ۷. نوع وظیفه، معیار و نتیجه تکمیل
  workItemType?: WorkItemType;
  expectedOutcome?: string; // نتیجه مورد انتظار / معیار تکمیل کار (Definition of Done)
  requiresWorkResult?: boolean; // الزام ثبت Work Result پیش از تکمیل
  workResult?: WorkItemResult; // نتیجه قطعی ثبت‌شده

  // ۸. سند تجاری متصل
  linkedBusinessRecord?: LinkedBusinessRecord;
  workRelation?: {
    relation_type: string;
    source_type: string;
    source_id: string;
    source_revision?: number;
  };

  // ۹. زمان‌بندی و اولویت
  status: RecordStatus;
  statusLabel: string;
  statusSinceJalali: string;
  priority: PriorityLevel;
  startDateJalali?: string;
  dueDateJalali?: string;
  dueTimeJalali?: string;
  managerInstruction?: string;
  reminderPreference?: 'none' | '2h_before' | '24h_before' | 'daily';
  visibilityScope?: 'self_participants' | 'unit' | 'organization';

  // ۱۰. دلایل وضعیت‌های خاص
  waitingReason?: string;
  returnedReason?: string;
  rejectionReason?: string;
  cancellationReason?: string;

  // ۱۱. رویدادها، موانع و اقدام بعدی
  timeline: TimelineEvent[];
  blocker: BlockerInfo | null;
  nextAction: NextActionInfo;

  // ۱۲. تاریخچه‌های تخصصی جهت ممیزی و شفافیت کامل
  assignmentHistory?: WorkItemAssignmentHistory[];
  statusHistory?: WorkItemStatusHistory[];
  approvalHistory?: WorkItemApprovalHistory[];

  // ۱۳. اقلام و اطلاعات تکمیلی
  comments: RecordComment[];
  attachments: RecordAttachment[];
  tags: string[];
  unit: string;
  relatedRecords?: {
    id: string;
    code: string;
    title: string;
    typeLabel: string;
    statusLabel: string;
    routeKey?: string;
    relation?: string;
  }[];
  salesChannel?: 'phone' | 'visit' | 'whatsapp' | 'telegram' | 'in_person' | 'other';
  commercialApprovalDetails?: CommercialApprovalTrigger;
  approvalInstance?: ApprovalInstance;
  revisionHistory?: OrderRevision[];
  lastActivityJalali?: string;
  lastActivityDescription?: string;
  crossUnitRequest?: CrossUnitReassignmentRequest;
}

export type ApprovalReasonCode =
  | 'PRICE_BELOW_THRESHOLD'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'MISSING_VALID_CREDIT_DATA';

export interface ApprovalReasonDetails {
  priceDeviation?: {
    productName: string;
    referencePriceRials: number;
    minAllowedPriceRials: number;
    offeredPriceRials: number;
    discountPercent: number;
    differenceRials: number;
  };
  creditSnapshot?: {
    source: string;
    timestampJalali: string;
    customerCreditLimitRials: number;
    customerOpenBalanceRials: number;
    availableCreditRials: number;
    orderTotalRials: number;
    exceededAmountRials: number;
  };
  notes?: string;
}

export interface ApprovalInstance {
  approval_id: string;
  source_entity_type: 'SALES_ORDER';
  source_entity_id: string;
  source_entity_code: string;
  source_revision: number;
  reason_codes: ApprovalReasonCode[];
  reason_details: ApprovalReasonDetails;
  approval_status:
    | 'NOT_REQUIRED'
    | 'PENDING'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'RETURNED'
    | 'RETURNED_FOR_CORRECTION'
    | 'REJECTED'
    | 'SUPERSEDED';
  resolved_approver: Person;
  accountable_responsibility: {
    id: string;
    code: string;
    title: string;
    unitName: string;
  };
  created_at: string;
  created_at_jalali: string;
  decision_at?: string;
  decision_at_jalali?: string;
  decision_actor?: Person;
  decision_note?: string;
  decision_evidence?: string;
}

export type CommercialApprovalTriggerType =
  | 'PRICE_BELOW_THRESHOLD'
  | 'below_min_price'
  | 'below_floor_price'
  | 'excessive_discount'
  | 'credit_limit_exceeded'
  | 'special_terms';

export interface CommercialApprovalTrigger {
  triggerType: CommercialApprovalTriggerType;
  title: string;
  description: string;
  // Before / After comparisons
  requestedDiscountPercent: number;
  maxAuthorizedDiscountPercent: number;
  requestedUnitPriceRials: number;
  minAllowedUnitPriceRials: number;
  orderTotalRials: number;
  customerCreditLimitRials: number;
  customerOpenBalanceRials: number;
  availableCreditRials: number;
  isSelfApprovalBlocked?: boolean;
}

export interface OrderRevision {
  revisionNumber: number;
  dateJalali: string;
  modifiedBy: Person;
  changeSummary: string;
  beforeAmountRials: number;
  afterAmountRials: number;
  approvalStatus?: string;
  itemsDiff: {
    field: string;
    before: string;
    after: string;
    isCritical?: boolean;
  }[];
}

// ================= MASTER DATA TYPES =================

export interface CustomerLocation {
  id: string;
  type: 'office' | 'warehouse' | 'delivery_site';
  title: string;
  address: string;
  postalCode?: string;
  recipientName: string;
  recipientPhone: string;
}

export interface CustomerPhone {
  id: string;
  label: string;
  number: string;
  isPrimary?: boolean;
  contactPerson?: string;
  notes?: string;
}

export interface CustomerSalespersonHistory {
  id: string;
  salesperson: Person;
  assignedAtJalali: string;
  unassignedAtJalali?: string;
  assignedBy: string;
  reason?: string;
}

export interface CustomerInteraction {
  id: string;
  type: 'order' | 'call' | 'visit' | 'followup' | 'receipt' | 'assignment';
  typeLabel: string;
  title: string;
  dateJalali: string;
  time?: string;
  actorName: string;
  actorRole?: string;
  summary: string;
  referenceCode?: string;
  amountRials?: number;
  statusBadge?: {
    text: string;
    tone: 'success' | 'warning' | 'info' | 'danger';
  };
  linkRoute?: string;
  linkId?: string;
  details?: Record<string, string | number>;
}

export interface CustomerRecord {
  id: string;
  code: string;
  officialName: string;
  tradeName: string;
  nationalId: string;
  economicCode: string;
  phone: string;
  mobile: string;
  province: string;
  city: string;
  assignedSalesperson: Person;
  externalRef?: string;
  creditLimitRials: number;
  openBalanceRials: number;
  status: 'active' | 'suspended' | 'needs_review';
  isDuplicateFlagged?: boolean;
  duplicateConflictNote?: string;
  locations: CustomerLocation[];
  tags: string[];
  phones?: CustomerPhone[];
  salespersonHistory?: CustomerSalespersonHistory[];
  interactions?: CustomerInteraction[];
}

export interface ProductPriceHistory {
  dateJalali: string;
  priceRials: number;
  changedBy: string;
  reason: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId: string | null;
  parentName?: string;
  status: 'active' | 'inactive';
  description?: string;
}

export interface ProductUnit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
}

export interface ProductPrice {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  conversionFactor: number;
  referencePriceRials: number; // reference / daily price
  minPermittedPriceRials: number; // minimum permitted price
  validFrom: string; // تاریخ آغاز اعتبار مثلا ۱۴۰۴/۰۶/۰۱
  validTo?: string; // تاریخ پایان اعتبار مثلا ۱۴۰۴/۱۲/۲۹
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category: string; // display name of category for backward compat
  brand: string;
  packageType: string; // نوع بسته‌بندی مانند بطری، قوطی، کارتن، حلب
  packageSize: string; // مقدار یا حجم مانند ۱.۵ لیتر، ۹۰۰ میلی‌لیتر
  baseUnit: string; // واحد پایه مانند بطری، قوطی، عدد، کیلوگرم، لیتر
  secondaryUnit: string; // واحد ثانویه مانند کارتن
  conversionRatio: number; // ضریب تبدیل: چند واحد پایه در هر کارتن
  conversionDescription: string; // توضیح تبدیل واحد مانند «هر کارتن = ۱۲ بطری»
  barcode?: string;
  referencePriceRials: number; // قیمت مرجع/مصوب روز
  currentPriceRials: number; // alias for referencePriceRials
  minAllowedPriceRials: number; // کف مجاز برای تخفیف کارشناس
  effectivePrice?: ProductPrice; // نرخ مصوب دارای تاریخ اعتبار
  priceHistory: ProductPriceHistory[];
  priceList?: ProductPrice[];
  status: 'active' | 'inactive';
  isActive: boolean;
  legacyCode?: string;
  description?: string;
  cartonConversion: {
    piecesPerCarton: number;
    kgPerCarton: number;
    description: string;
  };
  stockAvailableKg: number;
  taxPercent: number;
}

export interface SupplierRecord {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  mobile: string;
  email?: string;
  categories: string[];
  maskedIban: string;
  bankName: string;
  accountOwner: string;
  creditRating: 'A' | 'B' | 'C';
  status: 'active' | 'suspended';
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  managerName: string;
  totalCapacityTons: number;
  externalInventorySnapshot: {
    totalStockTons: number;
    reservedTons: number;
    availableTons: number;
    lastSyncJalali: string;
    sourceSystem: string;
  };
  status: 'active' | 'maintenance';
}

// ================= SALES ORDER MODULE TYPES =================

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  unit?: string;
  conversionFactor?: number;
  cartons: number;
  pieces: number;
  weightKg: number;
  baseUnit: string;
  
  // Non-negotiable snapshots required by business rules:
  dailyReferencePriceRials: number; // reference/daily price
  minPermittedPriceRials: number; // minimum permitted price
  offeredPriceRials: number; // customer proposed price
  finalPriceRials: number; // agreed / final price
  appliedDiscountPercent: number; // applied discount percentage

  // Backward compatibility fields
  officialSnapshotPriceRials: number; // alias for dailyReferencePriceRials
  agreedUnitPriceRials: number; // alias for finalPriceRials
  discountPercent: number; // alias for appliedDiscountPercent
  totalRials: number;
}

export interface SalesOrderDetails {
  id: string;
  code: string;
  title: string;
  customerId: string;
  customerName: string;
  channel: 'phone' | 'visit' | 'whatsapp' | 'telegram' | 'in_person' | 'other';
  channelLabel: string;
  createdById: string;
  createdByName: string;
  salesResponsibleId: string;
  salesResponsibleName: string;
  deliveryAddress: string;
  paymentTerms: string;
  deliveryTerms: string;
  items: SalesOrderItem[];
  totalAmountRials: number;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'needs_price_approval'
    | 'pending_approval'
    | 'pending_commercial_approval'
    | 'approved'
    | 'returned'
    | 'rejected'
    | 'cancelled';
  statusLabel: string;
  currentOwnerName: string;
  hasPriceException: boolean;
  priceExceptionReason?: string;
  autosavedAtJalali?: string;
  revisions: OrderRevision[];
  commercialApproval?: CommercialApprovalTrigger;
  linkedWorkItemId?: string;
  relatedApprovalId?: string;
  approvalStatus?:
    | 'NOT_REQUIRED'
    | 'PENDING'
    | 'PENDING_APPROVAL'
    | 'PRICE_APPROVAL_REQUIRED'
    | 'APPROVED'
    | 'FINAL_APPROVED'
    | 'RETURNED'
    | 'RETURNED_FOR_CORRECTION'
    | 'REJECTED'
    | 'SUPERSEDED';
  accountableOwnerId?: string;
  accountableOwnerName?: string;
  accountableResponsibilityId?: string;
  accountableResponsibilityCode?: string;
  accountableResponsibilityTitle?: string;
  currentApproverId?: string;
  currentApproverName?: string;
  decisionHistory?: Array<{
    approvalId: string;
    revision: number;
    status: string;
    decidedBy?: string;
    decidedAtJalali?: string;
    notes?: string;
    reasonCodes?: string[];
  }>;
}

// ================= ORG & ACCESS MODULE TYPES =================

export type AccessScope = 'self' | 'unit' | 'organization';
export type UserAccountState = 'invited' | 'active' | 'suspended' | 'locked' | 'archived';

export type BaseAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'APPROVE' | 'CANCEL' | 'ADMIN';
export type BaseScope = 'SELF' | 'UNIT' | 'ORGANIZATION';

export interface OrgUnit {
  id: string;
  code: string;
  name: string;
  parentUnitName?: string;
  managerName: string;
  staffCount: number;
}

export interface OrgPosition {
  id: string;
  code: string;
  title: string;
  unitName: string;
  levelLabel: string;
  defaultScope: AccessScope;
}

export interface ResponsibilityArea {
  id: string;
  code: string;
  title: string;
  description: string;
  unitId: string;
  unitName: string;
  inheritedCapabilities: Capability[];
  defaultScope: AccessScope;
  scopeConstraints?: {
    paymentCategory?: string;
    region?: string;
    processType?: string;
    maxAmountRials?: number;
  };
}

export interface ResponsibilityAssignment {
  id: string;
  userId: string;
  userName: string;
  responsibilityId: string;
  responsibilityTitle: string;
  isPrimary: boolean;
  startDateJalali: string;
  endDateJalali?: string;
  assignedBy: string;
  status: 'active' | 'expired' | 'revoked';
  scopeConstraints?: {
    paymentCategory?: string;
    region?: string;
    processType?: string;
    maxAmountRials?: number;
  };
  notes?: string;
}

export interface DirectPermissionException {
  id: string;
  userId: string;
  capability: Capability;
  actionType: 'GRANT' | 'RESTRICT';
  grantedBy: string;
  reason: string;
  grantedAtJalali: string;
  validUntilJalali?: string;
  scopeConstraint?: string;
}

export interface PermissionExplanation {
  capability: Capability;
  labelPersian: string;
  description: string;
  inheritedFrom: 'direct' | 'position' | 'delegation';
  sourceName?: string;
  scopeConstraint?: string;
}

export interface UserAccessProfile {
  id: string;
  name: string;
  nationalCode: string;
  maskedNationalCode?: string;
  personnelCode?: string;
  personnelId?: string;
  jobTitle: string;
  unit: string;
  unitId?: string;
  positionId?: string;
  effectiveScope: AccessScope;
  scopeSummaryPersian: string;
  financialLimitRials?: number;
  allowedProductLines?: string[];
  allowedWarehouses?: string[];
  permissions: PermissionExplanation[];
  directExceptions?: DirectPermissionException[];
  activeDelegation?: {
    delegatorName: string;
    scopeTitle: string;
    validUntilJalali: string;
  };
  username?: string;
  contact?: string;
  email?: string;
  mobile?: string;
  maskedMobile?: string;
  internalExtension?: string;
  directManagerName?: string;
  accountState?: UserAccountState;
  status?: 'active' | 'suspended';
  stateReason?: string;
  hireDateJalali?: string;
  lastLoginJalali?: string;
  primaryResponsibilityId?: string;
  secondaryResponsibilityIds?: string[];
  auditLog?: {
    id: string;
    timestampJalali: string;
    action: string;
    actor: string;
    description: string;
  }[];
}

export interface DelegationRecord {
  id: string;
  code: string;
  delegator: Person;
  delegatee: Person;
  title: string;
  authorizedScope: string;
  authorizedCapabilities?: Capability[];
  responsibilityId?: string;
  responsibilityTitle?: string;
  startDateJalali: string;
  endDateJalali: string;
  status: 'active' | 'scheduled' | 'expired' | 'revoked' | 'future';
  approvalLimitRials?: number;
  reason: string;
  revocationReason?: string;
  revokedAtJalali?: string;
  revokedBy?: string;
  actionsCount?: number;
  scopeConstraints?: {
    paymentCategory?: string;
    region?: string;
    processType?: string;
    maxAmountRials?: number;
  };
  auditEvents?: {
    id: string;
    timestampJalali: string;
    action: string;
    actor: string;
    details: string;
  }[];
}

export type Capability =
  | 'inbox.read'
  | 'approvals.view'
  | 'sales.read'
  | 'sales.create'
  | 'sales.approve'
  | 'pricing.read'
  | 'pricing.approve'
  | 'crm.write'
  | 'supply.read'
  | 'supply.create'
  | 'supply.manage'
  | 'inventory.read'
  | 'inventory.write'
  | 'warehouse_receipt.create'
  | 'finance.read'
  | 'finance.payment_request.create'
  | 'finance.payment_request.approve'
  | 'finance.payment_request.execute'
  | 'finance.create_request'
  | 'finance.approve'
  | 'finance.execute'
  | 'field.read'
  | 'field.write'
  | 'field.manage'
  | 'management.read'
  | 'ops_view'
  | 'org.read'
  | 'org.manage'
  | 'access.read'
  | 'access.manage'
  // Centralized administrative & managerial capabilities
  | 'USER_MANAGE'
  | 'RESPONSIBILITY_MANAGE'
  | 'DELEGATION_MANAGE'
  | 'WORK_CREATE'
  | 'WORK_ASSIGN'
  | 'MANAGEMENT_VIEW'
  // Product Catalog & Master Data capabilities
  | 'product.view'
  | 'product.create'
  | 'product.update'
  | 'product.archive'
  | 'product.category_manage'
  | 'product.price_manage';

export interface DelegationContext {
  id: string;
  title: string;
  originalOwnerName: string;
  department: string;
  authorizedScope: string;
}

export interface MockPersona {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  avatar: string;
  capabilities: Capability[];
  delegatedResponsibilities?: DelegationContext[];
  activeResponsibilityId?: string;
  username: string;
  employeeId: string;
  email?: string;
  isManager?: boolean;
  personaKey:
    | 'admin_ops'
    | 'sales_specialist'
    | 'commercial_approver'
    | 'warehouse_officer'
    | 'multi_delegate'
    | 'finance_specialist'
    | 'finance_director'
    | 'regional_sales_lead'
    | 'operations_director'
    | 'access_admin'
    | 'ordinary_employee'
    | 'no_access_user'
    | 'master_data_manager'
    | 'field_sales_visitor';
  badgeNote?: string;
}

export type NavMainId =
  | 'home'
  | 'sales'
  | 'supply'
  | 'finance'
  | 'field'
  | 'management'
  | 'base_data'
  | 'org_access'
  | 'design_system';

export interface NavItem {
  id: string;
  title: string;
  iconName: string;
  requiredCapabilities: Capability[];
  badgeCount?: number;
  subItems?: {
    id: string;
    title: string;
    routeKey: string;
    requiredCapabilities: Capability[];
    badgeCount?: number;
  }[];
}

export type ToastTone = 'success' | 'danger' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration?: number;
}

// ================= PROMPT 3: SUPPLY, LOGISTICS, RECEIPTS, EXIT & PAYMENT =================

export interface InventorySnapshotEvidence {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  evidenceTimestampJalali: string;
  evidenceSource: string;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  calculatedShortage: number;
  unit: string;
  snapshotStatus: string;
  statusLabel: string;
  notes?: string;
  offlineNotice: string;
  sourceTimestamp: string;
  snapshotAge: string;
  freshnessStatus: 'CURRENT' | 'STALE';
  sourceSystem: string;
  integrationStatus: 'NOT_CONNECTED';
}

export type SupplyPriority = 'urgent' | 'high' | 'normal' | 'low';

export type SupplyTriggerType =
  | 'shortage'
  | 'periodic_order_point'
  | 'confirmed_sales_order'
  | 'urgent_operational_need'
  | 'sales_order'
  | 'operational_need';
export type SupplyResult = 'pending' | 'supplied_complete' | 'supplied_partial' | 'cancelled' | 'blocked';

export type SupplyRequestStatus =
  | 'draft'
  | 'assigned'
  | 'in_progress'
  | 'partial'
  | 'supplied'
  | 'blocked'
  | 'cancelled';

export interface SupplyItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number; // Requested quantity (alias for backward-compat)
  unit: string;
  suppliedQuantity: number; // Received quantity (alias for backward-compat)
  unitPriceEstimateRials?: number;
  notes?: string;

  // Prompt 2 Mandates: Explicit Quantity Separation
  requestedQuantity?: number;
  approvedQuantity?: number;
  orderedQuantity?: number;
  receivedQuantity?: number;
  remainingQuantity?: number;

  // Calculation & Pricing fields
  conversionFactor?: number; // e.g. 16 for 16 bottles per carton, 1 for kg
  baseUnitEquivalent?: number; // e.g. 500 cartons * 16 = 8,000 bottles
  priceUnit?: string; // unit to which unitPriceEstimateRials applies
  estimatedLineTotal?: number; // required quantity in priceUnit * unitPriceEstimateRials
  itemResult?: 'pending' | 'supplied_complete' | 'supplied_partial' | 'cancelled';

  // Physical Quantity & Unit Conversion Gate fields
  sourceRequiredQuantity?: number;
  sourceRequiredUnit?: string;
  selectedProcurementQuantity?: number;
  selectedProcurementUnit?: string;
  resultingBaseQuantity?: number;
  roundingDifference?: number;
  roundingPolicy?: string;
  isSourceDerived?: boolean;
}

export interface SupplyNeedSource {
  type: 'shortage' | 'sales_order' | 'operational_need';
  // Shortage evidence details
  snapshotId?: string;
  snapshotCode?: string;
  evidenceTimestampJalali?: string;
  evidenceSource?: string;
  snapshotStatus?: string;
  unit?: string;
  warehouseId?: string;
  warehouseName?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  physicalStock?: number;
  reservedStock?: number;
  availableStock?: number;
  orderPoint?: number;
  calculatedShortage?: number;
  offlineNotice?: string;
  sourceTimestamp?: string;
  snapshotAge?: string;
  freshnessStatus?: 'CURRENT' | 'STALE';
  sourceSystem?: string;
  integrationStatus?: 'NOT_CONNECTED';
  // SalesOrder details
  salesOrderId?: string;
  salesOrderCode?: string;
  customerName?: string;
  revisionNumber?: number;
  orderStatus?: string;
  approvalStatus?: string;
  deliveryDateJalali?: string;
  deliveryTerms?: string;
  orderItemsSummary?: string;
  orderItemName?: string;
  orderedQuantity?: number;
  confirmedShortage?: number;
  // Operational need details
  requestingUnit?: string;
  costCenter?: string;
  operationalJustification?: string;
}

export interface SupplyRequestRecord {
  id: string;
  code: string;
  title: string;
  triggerType?: SupplyTriggerType;
  triggerDescription?: string;
  needSource?: SupplyNeedSource;
  creator?: Person;
  requester: Person;
  owner: Person;
  currentAssignee?: Person;
  targetResponsibilityTitle?: string;
  fallbackOwner?: Person;
  delegationInfo?: {
    delegationId: string;
    delegatorName: string;
    delegatorRole: string;
    delegateeName: string;
    validity: string;
    scope: string;
  };
  assignmentAudit?: {
    assignedAtJalali: string;
    assignedBy: string;
    assignmentReason: string;
  };
  selectedSupplier?: {
    id: string;
    name: string;
    code: string;
    phone: string;
  };
  externalPurchaseRef?: string;
  requiredDateJalali: string;
  priority: SupplyPriority;
  reason: string;
  status: SupplyRequestStatus;
  statusReason?: string;
  supplyResult?: SupplyResult;
  items: SupplyItem[];
  estimatedTotalAmountRials: number;
  createdAtJalali: string;
  warehouseId?: string;
  warehouseName?: string;
  customerName?: string;
  linkedWorkItemId?: string;
  closureInfo?: {
    closedAtJalali: string;
    closedBy: string;
    workResult: string;
  };
  cancellationInfo?: {
    cancelledAtJalali: string;
    cancelledBy: string;
    cancellationReason: string;
  };
  links: {
    logisticsId?: string;
    receiptId?: string;
    paymentRequestId?: string;
    salesOrderId?: string;
    warehouseId?: string;
  };
}

// Logistics
export type LogisticsType = 'inbound' | 'outbound' | 'transfer';

export type LogisticsCoordinationStatus =
  | 'vehicle_search'
  | 'driver_assigned'
  | 'loading'
  | 'on_the_way'
  | 'arrived'
  | 'delayed'
  | 'cancelled';

export interface LogisticsTimelineEvent {
  id: string;
  timestampJalali: string;
  title: string;
  description: string;
  actorName: string;
}

export interface LogisticsRecord {
  id: string;
  code: string;
  type: LogisticsType;
  title: string;
  origin: {
    name: string;
    city: string;
    address: string;
  };
  destination: {
    name: string;
    city: string;
    address: string;
  };
  driver: {
    name: string;
    phone: string;
    nationalCode: string;
    licensePlate: string;
  };
  vehicle: {
    type: string;
    capacityTons: number;
  };
  waybill: {
    number: string;
    issuedBy: string;
    dateJalali: string;
    imageUrl?: string;
  };
  freight: {
    amountRials: number;
    paymentMethod: 'پیش‌کرایه' | 'پس‌کرایه' | 'تسویه باربری اعتباری';
    payer: 'شرکت جوادیان' | 'مشتری' | 'تأمین‌کننده';
    linkedPaymentRequestId?: string;
  };
  coordinationStatus: LogisticsCoordinationStatus;
  currentOwner: Person;
  fallbackOwner: Person;
  nextAction: string;
  timeline: LogisticsTimelineEvent[];
  attachments: {
    id: string;
    title: string;
    type: string;
    url: string;
  }[];
  linkedRecords: {
    supplyRequestId?: string;
    salesOrderId?: string;
    receiptId?: string;
    dispatchId?: string;
  };
}

// Financial & Accounting Integration States (Separated from operational workflow)
export type FinancialIntegrationStatus =
  | 'not_registered' // ثبت نشده در سیستم مالی (پیش‌فرض)
  | 'pending_dispatch' // در انتظار ارسال
  | 'dispatch_success' // ارسال موفق
  | 'connection_error' // خطای اتصال
  | 'recheck_needed'; // نیازمند بررسی مجدد

// Warehouse Receipt (Real Document Form Based)
export type ReceiptItemResult =
  | 'complete'
  | 'partial'
  | 'mismatch'
  | 'damaged'
  | 'wrong_product'
  | 'rejected';

export type WarehouseReceiptItemResult = ReceiptItemResult;
export type WarehouseReceiptOverallResult = ReceiptItemResult;

export interface WarehouseReceiptItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  cartons: number;
  pieces: number; // partial / unit quantity
  unit: string;
  conversionRatio?: number; // unit conversion factor
  expectedQuantity: number;
  actualQuantity: number;
  purchasePriceRials: number;
  purchasePriceSnapshotRials?: number; // purchase-price snapshot
  totalPriceRials: number;
  itemResult: ReceiptItemResult;
  notes?: string;
}

export interface ReceiptParticipant {
  roleLabel: string; // انباردار، کنترل کیفی، مدیریت انبار، تأییدکننده نهایی
  person?: Person;
  signedAtJalali?: string;
  status: 'pending' | 'signed' | 'waived';
  notes?: string;
}

export type ReceiptApprovalStageType = 'acknowledgement' | 'operational_review' | 'formal_approval';

export interface ReceiptApprovalStage {
  id: string;
  stageIndex: number;
  stageType: ReceiptApprovalStageType;
  stageTypeLabel: string; // «رسید و تصدیق تحویل» | «بررسی فنی و عملیاتی» | «تصویب رسمی مدیریت»
  roleKey: 'driver_ack' | 'warehouse_keeper' | 'management_approver' | 'ceo' | 'qc_reviewer' | 'procurement_reviewer';
  roleTitle: string; // «رسید تحویل راننده», «انباردار و متصدی تخلیه», «معاونت بازرگانی / مدیر مربوطه», «مدیریت عامل»
  assignedPersonName?: string;
  isMandatory: boolean; // Driver, WH, Management, CEO are mandatory; QC, Procurement are optional
  status: 'pending' | 'signed' | 'returned' | 'waived';
  signedBy?: Person;
  signedAtJalali?: string;
  signedAtTime?: string;
  notes?: string;
  returnReason?: string;
}

export interface ConfigurableSignatureStep {
  stepIndex: number;
  roleKey: string;
  roleTitle: string;
  assignedPersonName: string;
  isRequired: boolean;
  status: 'pending' | 'signed' | 'waived';
  signedAtJalali?: string;
  notes?: string;
}

export interface WarehouseReceiptRecord {
  id: string;
  internalNumber: string; // e.g. REC-1403-104
  dateJalali: string;
  timeJalali: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  supplier: {
    id: string;
    name: string;
    code: string;
    contactPerson: string;
  };
  purchaseConditions?: string; // شرایط خرید و قرارداد
  deliveryType?: string; // نوع تحویل و بارگیری
  unloadingDestination?: string; // مقصد نهایی تخلیه
  purchaseRef: string;
  relatedSupplyRef?: string; // شماره عطف درخواست تأمین
  externalTradeReference?: string; // کد رهگیری سامانه جامع تجارت
  externalWarehouseReference?: string; // شناسه انبار در سامانه جامع انبارها
  parsinaRef?: string; // شماره عطف سامانه مالی پارسینا (اختیاری)
  parsinaRefPlaceholder: string;
  financialIntegrationStatus: FinancialIntegrationStatus; // وضعیت اتصال مالی (تفکیک از وضعیت رسید)
  driverData: {
    driverName: string;
    phone: string;
    vehiclePlate: string;
    vehicleType: string;
    waybillNumber: string;
    freightAmountRials: number;
    deliveryType?: string; // نوع تحویل
    deliveryLocation: string; // مقصد تخلیه و سکوی انبار
    unloadingDestination?: string; // سالن مقصد تخلیه
    unloadingSupervisor: string;
    weighbridgeGrossKg?: number;
    weighbridgeTareKg?: number;
    weighbridgeNetKg?: number;
  };
  items: WarehouseReceiptItem[];
  overallResult: ReceiptItemResult;
  participants: {
    warehouseKeeper: ReceiptParticipant;
    qualityReviewer: ReceiptParticipant;
    warehouseManager: ReceiptParticipant;
    finalApprover: ReceiptParticipant;
  };
  approvalStages?: ReceiptApprovalStage[]; // الگوی تأیید فعال سازمان
  approvalPatternLabel?: string;
  signatureSequence?: ConfigurableSignatureStep[]; // توالی امضاها و تأییدیه‌ها (پیکربندی‌پذیر)
  creatorExperience: {
    creator: Person;
    isDelegated: boolean;
    delegatorName?: string;
    fallbackName?: string;
  };
  attachments: {
    id: string;
    title: string;
    url: string;
  }[];
  linkedSupplyRequestId?: string;
  linkedLogisticsId?: string;
  status: 'draft' | 'under_inspection' | 'confirmed' | 'mismatch_flagged' | 'rejected';
}

// Fulfillment / Warehouse Exit
export type WarehouseExitStatus =
  | 'blocked'
  | 'partial'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'returned';

export type WarehouseDispatchStatus = WarehouseExitStatus;

export interface WarehouseExitItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  requestedCartons?: number;
  requestedQuantity: number;
  dispatchedCartons?: number;
  dispatchedQuantity: number;
  unit: string;
  salePriceRials?: number;
  unitWeightKg: number;
  notes?: string;
}

export interface WarehouseExitSignature {
  roleKey: 'sales_responsible' | 'management' | 'ceo';
  roleLabel: string;
  signerName?: string;
  isSigned: boolean;
  signedAtJalali?: string;
  comments?: string;
}

export interface WarehouseExitRecord {
  id: string;
  code: string; // DSP-1403-057
  dateJalali: string;
  linkedSalesOrder: {
    id: string;
    code: string;
    customerName: string;
    approvedDateJalali: string;
    totalAmountRials: number;
  };
  buyer: {
    name: string;
    nationalId: string;
    phone: string;
    economicCode?: string;
  };
  postalCode?: string;
  deliveryAddress: string;
  salesConditions?: string;
  salesResponsible?: {
    id: string;
    name: string;
    role?: string;
  };
  freightAmountRials?: number;
  deliveryMode?: string;
  externalTradeReference?: string;
  externalWarehouseReference?: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  externalInventorySnapshot: {
    availableStockKg: number;
    sourceSystem: string;
    sourceTimestamp: string;
    isSufficient: boolean;
    shortageNotes?: string;
  };
  items: WarehouseExitItem[];
  status: WarehouseExitStatus;
  blockedReason?: string;
  logistics: {
    driverName: string;
    driverPhone: string;
    vehiclePlate: string;
    vehicleType: string;
    waybillNumber: string;
    freightAmountRials: number;
    deliveryConfirmed: boolean;
    exitTimestamp?: string;
  };
  dispatchActor?: {
    person: Person;
    dispatchedAtJalali: string;
    dispatchedAtTime: string;
  };
  approvalSignatures?: WarehouseExitSignature[];
  linkedLogisticsId?: string;
  linkedWorkItemId?: string;
  exitDateJalali?: string;
  exitTime?: string;
}

// Payment Request
export type PaymentContextType = 'company' | 'personal';

export type PaymentCategory =
  | 'supplier'
  | 'freight'
  | 'worker_expense'
  | 'driver_expense'
  | 'finance_tax'
  | 'operational_expense';

export type PaymentRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'ready'
  | 'ready_for_payment'
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'closed'
  | 'returned'
  | 'rejected'
  | 'blocked'
  | 'cancelled';

export interface PaymentBeneficiary {
  name: string;
  nationalOrEconomicCode: string;
  bankName: string;
  maskedIban: string;
  fullIban: string;
  maskedCard?: string;
  fullCard?: string;
  maskedAccount?: string;
  fullAccount?: string;
  beneficiaryType?: 'person' | 'company' | 'institution';
}

export interface PaymentExecutionRecord {
  executor: Person;
  executedAtJalali: string;
  executedAtTime: string;
  referenceCode: string;
  evidenceReceiptUrl?: string;
  evidenceReceiptName?: string;
  paymentMethod: 'پایا' | 'ساتنا' | 'کارت به کارت' | 'چک تضمینی' | 'نقدی تنخواه';
}

export interface PaymentAuditLog {
  id: string;
  timestampJalali: string;
  actorName: string;
  action: string;
  details?: string;
}

export interface PaymentRequestRecord {
  id: string;
  code: string; // PAY-1403-128
  dateJalali?: string;
  contextType: PaymentContextType;
  category: PaymentCategory;
  amountRials: number;
  amountInWordsPersian?: string;
  purpose: string;
  beneficiary: PaymentBeneficiary;
  requester: Person;
  reviewer: Person;
  approver: Person;
  executor: Person;
  accountingRecorder?: Person;
  accountingReference?: string;
  financialIntegrationStatus?: FinancialIntegrationStatus; // وضعیت اتصال به سیستم مالی
  status: PaymentRequestStatus;
  statusNote?: string;
  isSelfApprovalBlocked: boolean;
  unauthorizedRegionOrCategoryWarning?: string;
  currentBallHolder?: {
    person: Person;
    roleLabel: string;
    sinceJalali: string;
    nextActionLabel: string;
  };
  manualExecution?: PaymentExecutionRecord;
  attachments: {
    id: string;
    title: string;
    url: string;
    type?: string;
    sizeMb?: number;
    uploadedAtJalali?: string;
  }[];
  linkedRecords: {
    supplyRequestId?: string;
    logisticsId?: string;
    receiptId?: string;
    salesOrderId?: string;
    generalNote?: string;
  };
  auditLogs: PaymentAuditLog[];
  createdAtJalali: string;
}

// ================= FIELD SALES & VISITS TYPES =================

export type VisitOutcomeType =
  | 'success_draft'
  | 'followup_needed'
  | 'absent'
  | 'change_request'
  | 'customer_cancelled'
  | 'location_mismatch'
  | 'success_order'
  | 'success_payment'
  | 'renegotiation_needed'
  | 'customer_absent'
  | 'competitor_preferred'
  | 'financial_dispute'
  | 'cancelled_by_customer';

export interface CustomerChangeRequest {
  newAddress?: string;
  newPhone?: string;
  creditLimitIncreaseRials?: number;
  businessTypeChange?: string;
  notes: string;
}

export interface FieldVisitRecord {
  id: string;
  code: string; // VST-1403-01
  visitSequence: number;
  scheduledTime: string; // e.g. "۰۹:۳۰"
  timeWindow?: string; // e.g. "۰۹:۰۰ الی ۱۰:۱۵"
  purpose?: string; // e.g. "مذاکره سفارش روغن سرخ‌کردنی و عقد تفاهم‌نامه فصلی"
  customerId: string;
  customerName: string;
  customerTradeName?: string;
  contactPerson: string;
  contactPhone: string;
  province: string;
  city: string;
  address: string;
  // Visual-only representation coordinates for SVG map (NO real continuous GPS)
  mapCoord: { x: number; y: number };
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  assignedSalespersonId?: string;
  assignedSalespersonName: string;
  checkInTime?: string;
  checkOutTime?: string;
  eventLocationNote?: string;
  mockLocationEvidence?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    addressDescriptor: string;
    capturedAtTime: string;
  };
  idempotencyKey?: string;
  mandatoryResult?: {
    outcome: VisitOutcomeType;
    outcomeLabel: string;
    notes: string;
    callResultSummary?: string;
    customerChangeRequest?: CustomerChangeRequest;
    registeredAtJalali: string;
  };
  draftOrder?: {
    orderCode: string;
    itemsSummary: string;
    totalAmountRials: number;
    paymentTerm: string;
  };
  followUp?: {
    id: string;
    title: string;
    ownerName: string;
    dueDateJalali: string;
    notes: string;
  };
  receiptSubmission?: {
    trackingNumber: string;
    amountRials: number;
    bankName: string;
    receiptImageUrl: string;
    status: 'awaiting_finance_review' | 'confirmed' | 'rejected';
    registeredAtJalali: string;
  };
}

export type OfflineItemStatus = 'local_draft' | 'queued' | 'syncing' | 'synced' | 'conflict';

export interface OfflineQueueItem {
  id: string;
  idempotencyKey?: string;
  entityType: 'visit_result' | 'draft_order' | 'receipt_submission' | 'customer_change' | 'followup';
  title: string;
  clientTimestamp: string;
  status: OfflineItemStatus;
  retryCount?: number;
  conflictReason?: string;
  localPayload: any;
  serverPayload?: any;
}

// ================= MANUAL CALL / MESSENGER INTAKE TYPES =================

export type ManualIntakeChannel =
  | 'phone'
  | 'whatsapp'
  | 'bale'
  | 'eitaa'
  | 'telegram'
  | 'sms'
  | 'in_person'
  | 'paper_note';

export type IntakeResponsibleUnit =
  | 'sales'
  | 'logistics'
  | 'finance'
  | 'supply'
  | 'after_sales';

export type IntakeClassification =
  | 'price_inquiry'
  | 'new_order'
  | 'logistics_followup'
  | 'payment_slip'
  | 'quality_complaint'
  | 'address_change'
  | 'general_inquiry';

export type IntakePriority = 'normal' | 'high' | 'urgent';

export type IntakeState = 'unclassified' | 'triaged' | 'converted' | 'duplicate' | 'archived';

export interface ManualIntakeAttachment {
  id: string;
  type: 'voice' | 'handwritten_invoice' | 'receipt_screenshot' | 'paper_doc';
  name: string;
  size: string;
  url?: string;
}

export interface ManualIntakeRecord {
  id: string;
  code: string; // INT-1403-042
  channel: ManualIntakeChannel;
  senderName: string;
  senderContact: string;
  senderCompany?: string;
  senderRole?: string;
  receivedAtJalali: string;
  receivedAtTime: string;
  originalReference: string; // e.g. "واتساپ +98913... پیام ساعت ۱۰:۱۵"
  summary: string;
  attachments: ManualIntakeAttachment[];
  responsibleUnit: IntakeResponsibleUnit;
  classification: IntakeClassification;
  ownerName: string;
  dueDateJalali: string;
  priority: IntakePriority;
  state: IntakeState;
  convertedRecord?: {
    type: 'sales_order' | 'followup' | 'payment_request' | 'supply_logistics' | 'general_task';
    code: string;
    title: string;
    routeKey: string;
    convertedAtJalali: string;
  };
  duplicateOfCode?: string;
  traceLogs: {
    timestamp: string;
    actorName: string;
    action: string;
    details?: string;
  }[];
}

// ================= MANAGEMENT MONITOR & INTEGRATION TYPES =================

export type OperationalUnit =
  | 'all'
  | 'sales'
  | 'supply'
  | 'logistics'
  | 'warehouse'
  | 'finance'
  | 'field'
  | 'integrations';

export interface OperationalDrillRecord {
  id: string;
  code: string;
  title: string;
  unit: OperationalUnit;
  process: string;
  ownerName: string;
  currentAssigneeName?: string;
  sinceJalali?: string;
  whatHappened?: string;
  blockerReason?: string;
  nextAction?: string;
  nextActionAssignee?: string;
  customerOrParty: string;
  cityOrRegion: string;
  status: 'blocked' | 'waiting_approval' | 'overdue' | 'in_progress' | 'integration_failed';
  statusDescription: string;
  ageHours: number;
  priority: 'urgent' | 'high' | 'normal';
  routeKey: string;
  recordId: string;
  isPriceException?: boolean;
  isFieldTask?: boolean;
  linkedRecords?: {
    code: string;
    title: string;
    routeKey: string;
    relationLabel: string;
  }[];
  integrationDetails?: {
    sourceSystem: string;
    externalId: string;
    lastSyncJalali: string;
    errorCode?: string;
    errorMessage?: string;
    retryCount: number;
  };
}

export interface TraceabilityStep {
  stepNumber: number;
  code: string;
  title: string;
  stageName: string;
  unit: string;
  status: 'completed' | 'in_progress' | 'blocked' | 'pending';
  statusLabel: string;
  responsibleParty: string;
  currentAssignee: string;
  timeline: string;
  ageOrDuration: string;
  summary: string;
  keyDetails: { label: string; value: string }[];
  blockerOrNote?: string;
  nextAction: string;
  nextActionOwner: string;
  linkedRecords: { code: string; title: string; routeKey: string; relation: string }[];
  routeKey: string;
}

// ================= SHARED NOTIFICATIONS TYPES =================

export type NotificationCategory =
  | 'assignment'
  | 'approval'
  | 'return_reject'
  | 'overdue'
  | 'mention'
  | 'material_change'
  | 'integration_failure';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timeJalali: string;
  isRead: boolean;
  targetRouteKey: string;
  targetRecordId?: string;
  sourceActorName?: string;
  externalRef?: string;
  priority?: 'normal' | 'high' | 'urgent';
}
