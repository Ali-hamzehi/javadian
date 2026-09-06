import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeStyles = {
    sm: 'text-sm px-3 py-2 gap-2',
    md: 'text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-3 gap-3 min-h-[48px]',
  };

  const variantStyles = {
    primary:
      'bg-primary-700 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 shadow-sm border border-transparent',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400 border border-slate-200',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-primary-500 border border-slate-300 shadow-none',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus:ring-slate-400 border border-transparent',
    destructive:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm border border-transparent',
    subtle:
      'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 focus:ring-primary-400 border border-primary-100',
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
