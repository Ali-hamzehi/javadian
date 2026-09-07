import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'danger'
  | 'success'
  | 'warning'
  | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[44px] sm:min-h-[32px]',
    sm: 'text-xs sm:text-sm px-3 py-2 gap-2 min-h-[44px] sm:min-h-[36px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-5 py-3 gap-3 min-h-[48px]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 focus:ring-primary-500 shadow-xs border border-transparent font-semibold',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400 border border-slate-200 font-medium',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-primary-500 border border-slate-200 shadow-none font-medium',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-400 border border-transparent font-medium',
    destructive:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus:ring-rose-500 shadow-xs border border-transparent font-semibold',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus:ring-rose-500 shadow-xs border border-transparent font-semibold',
    success:
      'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus:ring-emerald-500 shadow-xs border border-transparent font-semibold',
    warning:
      'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500 shadow-xs border border-transparent font-semibold',
    subtle:
      'bg-primary-50 text-primary-800 hover:bg-primary-100 active:bg-primary-200 focus:ring-primary-400 border border-primary-200 font-medium',
  };

  return (
    <button
      type="button"
      data-size={size}
      data-variant={variant}
      aria-busy={isLoading || undefined}
      className={`ui-button ${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin text-current shrink-0" />}
      {!isLoading && rightIcon && <span aria-hidden="true" className="inline-flex shrink-0">{rightIcon}</span>}
      <span>{children}</span>
      {!isLoading && leftIcon && <span aria-hidden="true" className="inline-flex shrink-0">{leftIcon}</span>}
    </button>
  );
};
