import React from 'react';
import { getPriorityMeta, getStatusMeta, toPersianDigits } from '../../utils/formatters';
import { Clock, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const meta = getStatusMeta(status);
  const external: Record<string, { label: string; domain: string; tone: string }> = {
    DEFERRED: { label: 'موکول به تصمیم کارفرما', domain: 'prototype', tone: 'neutral' },
    NOT_CONNECTED: { label: 'متصل نیست', domain: 'integration', tone: 'warning' },
    NOT_CONFIGURED: { label: 'پیکربندی نشده', domain: 'integration', tone: 'warning' },
    NOT_POSTED: { label: 'ثبت نشده در سیستم مالی', domain: 'integration', tone: 'neutral' },
    PROTOTYPE_ONLY: { label: 'صرفاً نمایشی', domain: 'prototype', tone: 'neutral' },
  };
  const state = external[status];
  const tone = state?.tone || meta.tone;
  const tones: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    info: 'bg-info-surface text-info border-blue-300',
    primary: 'bg-info-surface text-info border-blue-300',
    warning: 'bg-warning-surface text-warning border-amber-300',
    danger: 'bg-danger-surface text-danger border-red-300',
    success: 'bg-success-surface text-success border-green-300',
  };
  const displayLabel = label || state?.label || meta.label;
  return (
    <span data-domain={state?.domain || 'business'} data-status={status}
      className={`status-badge inline-flex flex-wrap items-center gap-2 px-3 py-1 text-caption font-semibold rounded-full border ${tones[tone]} ${className}`}>
      <span>{displayLabel}</span>
      {state && <bdi dir="ltr">{status}</bdi>}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const meta = getPriorityMeta(priority);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${meta.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      <span>{meta.label}</span>
    </span>
  );
};

interface OwnershipBadgeProps {
  ownerName: string;
  durationHours?: number;
  isDelegated?: boolean;
  delegatorName?: string;
  className?: string;
}

export const OwnershipBadge: React.FC<OwnershipBadgeProps> = ({
  ownerName,
  durationHours,
  isDelegated,
  delegatorName,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1 ${className}`}>
      <div className="flex items-center gap-1 font-medium text-slate-800">
        <span>دست:</span>
        <span className="font-semibold text-primary-900">{ownerName}</span>
      </div>

      {isDelegated && (
        <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 text-caption font-bold px-1.5 py-0.5 rounded border border-amber-300">
          <ShieldAlert className="w-3 h-3 text-amber-700" />
          جانشین {delegatorName}
        </span>
      )}

      {durationHours !== undefined && (
        <span className="flex items-center gap-0.5 text-slate-500 text-caption border-r border-slate-200 pr-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{toPersianDigits(durationHours)} ساعت</span>
        </span>
      )}
    </div>
  );
};

interface ChipProps {
  label: string;
  count?: number;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ label, count, isSelected = false, onClick, icon }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-primary-700 text-white border border-primary-600 shadow-none'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-caption font-bold ${
            isSelected ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {toPersianDigits(count)}
        </span>
      )}
    </button>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'blocked' | 'deferred' | 'not-connected' | 'not-configured' | 'prototype-only';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-success-surface text-success border-green-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-info-surface text-info border-blue-300',
    pending: 'bg-warning-surface text-warning border-amber-300',
    blocked: 'bg-danger-surface text-danger border-red-300',
    deferred: 'bg-slate-100 text-slate-700 border-slate-300 border-dashed',
    'not-connected': 'bg-warning-surface text-warning border-amber-300 border-dashed',
    'not-configured': 'bg-warning-surface text-warning border-amber-300 border-dashed',
    'prototype-only': 'bg-slate-100 text-slate-700 border-slate-300 border-dashed',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

