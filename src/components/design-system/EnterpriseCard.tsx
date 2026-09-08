import React from 'react';

export type EnterpriseCardStatus =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface EnterpriseCardProps {
  children: React.ReactNode;
  status?: EnterpriseCardStatus;
  isInteractive?: boolean;
  onClick?: () => void;
  className?: string;
  id?: string;
}

export const EnterpriseCard: React.FC<EnterpriseCardProps> = ({
  children,
  status = 'default',
  isInteractive = false,
  onClick,
  className = '',
  id,
}) => {
  // Border right accent in RTL layout:
  const statusBorderClasses: Record<EnterpriseCardStatus, string> = {
    default: 'border-r-[#e6e8ef]',
    primary: 'border-r-4 border-r-[#6558d9]',
    success: 'border-r-4 border-r-[#138a61]',
    warning: 'border-r-4 border-r-[#b97318]',
    danger: 'border-r-4 border-r-[#c74b55]',
    info: 'border-r-4 border-r-[#3566c8]',
    neutral: 'border-r-4 border-r-[#697082]',
  };

  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:border-[#d5d8e2] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-150'
    : '';

  return (
    <div
      id={id}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick?.(); } } : undefined}
      className={`bg-white rounded-xl border border-[#e6e8ef] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between ${statusBorderClasses[status]} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
};

interface EnterpriseCardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  code?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const EnterpriseCardHeader: React.FC<EnterpriseCardHeaderProps> = ({
  title,
  subtitle,
  code,
  badge,
  icon,
  actions,
  className = '',
}) => {
  return (
    <div className={`p-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {icon && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            {code && (
              <span className="font-mono text-caption bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                {code}
              </span>
            )}
            {badge}
          </div>
          <h3 className="card-title font-extrabold text-base text-slate-900 leading-snug truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-caption text-slate-600 mt-0.5 leading-relaxed truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
    </div>
  );
};

interface EnterpriseCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const EnterpriseCardBody: React.FC<EnterpriseCardBodyProps> = ({
  children,
  className = '',
}) => {
  return <div className={`p-4 space-y-3 text-xs ${className}`}>{children}</div>;
};

interface EnterpriseCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const EnterpriseCardFooter: React.FC<EnterpriseCardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 text-xs ${className}`}>
      {children}
    </div>
  );
};

interface EnterpriseKeyValueProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}

export const EnterpriseKeyValue: React.FC<EnterpriseKeyValueProps> = ({
  label,
  value,
  icon,
  highlight = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="text-caption text-slate-600 font-medium flex items-center gap-1 truncate">
        {icon}
        <span>{label}</span>
      </span>
      <span className={`font-bold truncate ${highlight ? 'text-primary-800' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
};
