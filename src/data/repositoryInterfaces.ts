/**
 * Centralized Repository Interfaces
 * Keeps domain data cleanly behind typed interfaces for transfer-readiness.
 */

import {
  OperationalRecord,
  RecordStatus,
  RecordType,
  PriorityLevel,
  SalesOrderDetails,
  SupplyRequestRecord,
  LogisticsRecord,
  WarehouseReceiptRecord,
  WarehouseExitRecord,
  PaymentRequestRecord,
  FieldVisitRecord,
  ManualIntakeRecord,
  OperationalDrillRecord,
} from '../types';

export interface IOperationalRecordRepository {
  getAllRecords(): OperationalRecord[];
  getAuthorizedRecords?(actor: any): OperationalRecord[];
  getActionableApprovalItems?(actor: any): OperationalRecord[];
  isActionableApprovalRecord?(actor: any, record: OperationalRecord): boolean;
  getRecordById(id: string): OperationalRecord | undefined;
  filterRecords(params: {
    query?: string;
    type?: RecordType | 'all';
    status?: RecordStatus | 'all';
    priority?: PriorityLevel | 'all';
    hasBlocker?: boolean;
    ownerId?: string;
  }): OperationalRecord[];
  addComment(recordId: string, authorName: string, text: string, isInternal: boolean): boolean;
  resolveBlocker(recordId: string, resolverName: string, note: string): boolean;
  raiseBlocker(recordId: string, reporterName: string, reason: string, severity: 'warning' | 'critical'): boolean;
  approveRecord(recordId: string, approverName: string, note?: string): boolean;
  returnRecord(recordId: string, actorName: string, reason: string): boolean;
}

export interface ISalesRepository {
  getAllOrders(): SalesOrderDetails[];
  getOrderById(id: string): SalesOrderDetails | undefined;
}

export interface ISupplyLogisticsRepository {
  getSupplyRequests(): SupplyRequestRecord[];
  getLogisticsShipments(): LogisticsRecord[];
  getWarehouseReceipts(): WarehouseReceiptRecord[];
  getWarehouseExits(): WarehouseExitRecord[];
  getPaymentRequests(): PaymentRequestRecord[];
}

export interface IFieldOperationsRepository {
  getVisits(): FieldVisitRecord[];
  getVisitById(id: string): FieldVisitRecord | undefined;
}

export interface IManualIntakeRepository {
  getAllIntakes(): ManualIntakeRecord[];
  getIntakeById(id: string): ManualIntakeRecord | undefined;
}

export interface IManagementMonitorRepository {
  getDrillRecords(): OperationalDrillRecord[];
}
