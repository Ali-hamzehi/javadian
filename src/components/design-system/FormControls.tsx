import React, { useState, useId, createContext, useContext } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface FieldContextValue {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}
const FieldContext = createContext<FieldContextValue | undefined>(undefined);
// Connect native controls inside a wrapper, as well as reusable controls via context.
function connectNativeControls(children: React.ReactNode, field: FieldContextValue): React.ReactNode {
  let connected = false;
  const visit = (nodes: React.ReactNode): React.ReactNode => React.Children.map(nodes, child => {
    if (!React.isValidElement<Record<string, any>>(child)) return child;
    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type) && !connected) {
      connected = true;
      return React.cloneElement(child, { ...field, ...child.props, id: field.id,
        'aria-describedby': [child.props['aria-describedby'], field['aria-describedby']].filter(Boolean).join(' ') || undefined,
        'aria-invalid': field['aria-invalid'] || child.props['aria-invalid'] });
    }
    if (typeof child.type === 'string' || child.type === React.Fragment) {
      return React.cloneElement(child, {}, visit(child.props.children));
    }
    return child;
  });
  return visit(children);
}

interface FormFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  required,
  hint,
  error,
  children,
  className = '',
}) => {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  const field = { id: fieldId, 'aria-describedby': describedBy, 'aria-invalid': !!error, 'aria-required': required };
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={fieldId} className="block text-label font-semibold text-slate-700">
        {label}{required && <span aria-hidden="true" className="text-rose-700 mr-1">*</span>}
      </label>
      <FieldContext.Provider value={field}>{connectNativeControls(children, field)}</FieldContext.Provider>
      {hint && !error && <p id={`${fieldId}-hint`} className="text-caption text-slate-600">{hint}</p>}
      {error && <p id={`${fieldId}-error`} role="alert" className="flex items-start gap-1 text-caption text-rose-700 font-medium">
        <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
      </p>}
    </div>
  );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  prefixIcon?: React.ReactNode;
  suffixAdornment?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  error,
  prefixIcon,
  suffixAdornment,
  className = '',
  disabled,
  ...props
}) => {
  const field = useContext(FieldContext);
  return (
    <div className="relative flex items-center w-full">
      {prefixIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          {prefixIcon}
        </div>
      )}
      <input
        {...field}
        className={`w-full rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 py-2 transition-all focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
          prefixIcon ? 'pr-9' : 'pr-3'
        } ${suffixAdornment ? 'pl-14' : 'pl-3'} ${
          error
            ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
            : 'border-slate-300 focus:ring-primary-100 focus:border-primary-600'
        } ${className}`}
        disabled={disabled}
        {...props}
        id={field?.id || props.id}
      />
      {suffixAdornment && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-medium text-slate-500">
          {suffixAdornment}
        </div>
      )}
    </div>
  );
};

interface RialInputProps {
  value?: number;
  onChange?: (val: number) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  error?: boolean;
}

export const RialInput: React.FC<RialInputProps> = ({
  value,
  onChange,
  placeholder = 'مبلغ را وارد کنید',
  id,
  disabled,
  error,
}) => {
  const field = useContext(FieldContext);
  const [internalText, setInternalText] = useState(() => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    const formatted = num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    setInternalText(formatted);
    if (onChange) {
      onChange(num);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        {...field}
        id={id || field?.id}
        type="text"
        inputMode="numeric"
        value={internalText}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 py-2 pr-3 pl-14 transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
            : 'border-slate-300 focus:ring-primary-100 focus:border-primary-600'
        }`}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
        ریال
      </span>
    </div>
  );
};

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { label: string; value: string | number }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({
  options,
  error,
  className = '',
  ...props
}) => {
  const field = useContext(FieldContext);
  return (
    <select
        {...field}
      className={`w-full rounded-lg border text-sm text-slate-900 bg-white py-2 px-3 transition-all focus:outline-none focus:ring-2 ${
        error
          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
          : 'border-slate-300 focus:ring-primary-100 focus:border-primary-600'
      } ${className}`}
      {...props}
      id={field?.id || props.id}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextareaInput: React.FC<TextareaInputProps> = ({
  error,
  className = '',
  rows = 3,
  ...props
}) => {
  const field = useContext(FieldContext);
  return (
    <textarea
        {...field}
      rows={rows}
      className={`w-full rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400 p-3 transition-all focus:outline-none focus:ring-2 resize-y ${
        error
          ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
          : 'border-slate-300 focus:ring-primary-100 focus:border-primary-600'
      } ${className}`}
      {...props}
      id={field?.id || props.id}
    />
  );
};

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled,
}) => {
  const field = useContext(FieldContext);
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <div className="relative flex items-center mt-0.5">
        <input
        {...field}
          id={id || field?.id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className="w-4 h-4 rounded border border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-700 peer-focus-visible:ring-offset-2 peer-checked:bg-primary-700 peer-checked:border-primary-600 flex items-center justify-center transition-colors">
          {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-800">{label}</span>
        {description && <span className="text-caption text-slate-500">{description}</span>}
      </div>
    </label>
  );
};

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, description }) => {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-full text-right flex items-center justify-between gap-3 cursor-pointer select-none py-1 rounded-lg"
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-800">{label}</span>
        {description && <span className="text-caption text-slate-500">{description}</span>}
      </div>
      <div
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
          checked ? 'bg-primary-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-none ring-0 transition duration-200 ease-in-out ${
            checked ? '-translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
};

interface ValidationSummaryProps {
  errors: string[];
  onDismiss?: () => void;
  title?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  onDismiss,
  title = 'لطفاً موارد زیر را قبل از ذخیره برطرف کنید:',
}) => {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg bg-rose-50 border border-rose-300 p-4 mb-4 text-rose-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <h4 className="text-xs font-bold">{title}</h4>
        </div>
        {onDismiss && (
          <button
            aria-label="بستن خلاصه خطاها" type="button"
            onClick={onDismiss}
            className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-rose-800 pr-2">
        {errors.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
};
