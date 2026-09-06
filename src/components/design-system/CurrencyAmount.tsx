import React from 'react';
import { getDualCurrency } from '../../utils/currencyUtils';

interface CurrencyAmountProps {
  amountRials: number;
  layout?: 'dual' | 'compact' | 'toman-only' | 'rials-only' | 'inline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
  className?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amountRials,
  layout = 'dual',
  size = 'md',
  highlight = false,
  className = '',
  tone = 'default',
}) => {
  if (!Number.isFinite(amountRials)) return <span className="text-xs text-slate-500">مبلغ ثبت نشده</span>;
  const { compactToman, tomanFormatted, rialsFormatted } = getDualCurrency(Number.isFinite(amountRials) ? amountRials : 0);

  const toneClasses = {
    default: 'text-slate-900',
    primary: 'text-primary-700',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
  };

  const mainSizeClasses = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-extrabold',
    lg: 'text-base font-black',
    xl: 'text-xl font-black',
  };

  const subSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-caption',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  if (layout === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
        <strong className={`${mainSizeClasses[size]} ${toneClasses[tone]}`}>{compactToman}</strong>
        <span className="text-slate-600 text-caption font-normal">({rialsFormatted})</span>
      </span>
    );
  }

  if (layout === 'compact') {
    return (
      <span
        title={rialsFormatted}
        className={`font-mono ${mainSizeClasses[size]} ${toneClasses[tone]} cursor-help ${className}`}
      >
        {compactToman}
      </span>
    );
  }

  if (layout === 'toman-only') {
    return (
      <span className={`font-mono ${mainSizeClasses[size]} ${toneClasses[tone]} ${className}`}>
        {tomanFormatted}
      </span>
    );
  }

  if (layout === 'rials-only') {
    return (
      <span className={`font-mono ${mainSizeClasses[size]} ${toneClasses[tone]} ${className}`}>
        {rialsFormatted}
      </span>
    );
  }

  // Default: dual stacked
  return (
    <span className={`inline-flex flex-col items-start leading-tight ${className}`}>
      <span className={`font-mono ${mainSizeClasses[size]} ${toneClasses[tone]} ${highlight ? 'tracking-tight' : ''}`}>
        {compactToman}
      </span>
      <span className={`font-mono text-slate-600 ${subSizeClasses[size]} font-normal mt-0.5`}>
        {rialsFormatted}
      </span>
    </span>
  );
};
