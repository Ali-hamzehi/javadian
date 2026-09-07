import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { DialogSurface } from './DialogSurface';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <button type="button" onClick={onClose} aria-label="بستن پنجره" title="بستن پنجره" className="shrink-0 inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
    <X aria-hidden="true" className="w-5 h-5" />
  </button>
);

export const ModalDialog: React.FC<ModalDialogProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'md' }) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };
  return (
    <DialogSurface isOpen={isOpen} onClose={onClose} title={title}>
      <div className={`dialog-panel ${widths[maxWidth]}`}>
        <div className="dialog-header"><span className="text-base font-bold text-slate-900">{title}</span><CloseButton onClose={onClose} /></div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </DialogSurface>
  );
};
export const Modal = ModalDialog;

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأیید و ادامه',
  cancelText = 'انصراف',
  variant = 'destructive',
  isLoading = false,
}) => {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-full shrink-0 ${
            variant === 'destructive'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-primary-100 text-primary-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-700 leading-relaxed pt-1">{message}</p>
      </div>
    </ModalDialog>
  );
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | 'full';
}
export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, subtitle, children, footer, width = 'lg' }) => {
  const widths = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-4xl' };
  return (
    <DialogSurface isOpen={isOpen} onClose={onClose} title={title} className="drawer-surface">
      <div className={`dialog-panel drawer-panel ${widths[width]}`}>
        <div className="dialog-header bg-slate-50">
          <div className="min-w-0"><span className="text-base font-bold text-slate-900 block">{title}</span>{subtitle && <p className="text-caption text-slate-600 mt-1">{subtitle}</p>}</div>
          <CloseButton onClose={onClose} />
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </DialogSurface>
  );
};
