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
      'bg-[#6558d9] text-white hover:bg-[#5548c7] active:bg-[#4b3eb9] shadow-[0_6px_16px_rgba(101,88,217,0.16)] focus:ring-[#6558d9] border border-transparent font-bold',
    secondary:
      'bg-[#f0eeff] text-[#4b3eb9] hover:bg-[#e8e4ff] active:bg-[#ded8ff] focus:ring-[#6558d9] border border-transparent font-bold',
    outline:
      'bg-white text-slate-700 hover:bg-[#fbfbfd] hover:text-slate-900 active:bg-[#f0f2f5] focus:ring-[#6558d9] border border-[#e6e8ef] hover:border-[#d5d8e2] shadow-[0_1px_2px_rgba(0,0,0,0.02)] font-bold',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-400 border border-transparent font-medium',
    destructive:
      'bg-[#fff0f1] text-[#c74b55] hover:bg-[#ffe2e5] active:bg-[#ffd3d7] border border-[#ffd0d4] focus:ring-[#c74b55] font-semibold',
    danger:
      'bg-[#fff0f1] text-[#c74b55] hover:bg-[#ffe2e5] active:bg-[#ffd3d7] border border-[#ffd0d4] focus:ring-[#c74b55] font-semibold',
    success:
      'bg-[#eaf7f1] text-[#138a61] hover:bg-[#ddf2e8] active:bg-[#d0eddf] border border-[#bce8d4] focus:ring-[#138a61] font-semibold',
    warning:
      'bg-[#fcf3e8] text-[#b97318] hover:bg-[#faebda] active:bg-[#f5e1c8] border border-[#f5debe] focus:ring-[#b97318] font-semibold',
    subtle:
      'bg-[#f0eeff] text-[#6558d9] hover:bg-[#e8e4ff] active:bg-[#ded8ff] focus:ring-[#6558d9] border border-[#e4dfff] font-medium',
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
