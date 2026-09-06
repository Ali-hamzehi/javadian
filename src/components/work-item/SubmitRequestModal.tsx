import React from 'react';
import { DialogSurface } from '../design-system/DialogSurface';
import { Button } from '../design-system/Button';
import { MockPersona } from '../../types';
import { getAuthorizedRequestTypes, RequestTypeOption } from '../../utils/roleExperience';
import {
  ShoppingBag,
  Boxes,
  CreditCard,
  MessageSquare,
  Truck,
  UserPlus,
  ArrowLeft,
  X,
  PlusCircle,
} from 'lucide-react';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: MockPersona;
  onSelectOption: (option: RequestTypeOption) => void;
}

const CATEGORY_ICONS = {
  sales: ShoppingBag,
  supply: Boxes,
  finance: CreditCard,
  warehouse: Truck,
  general: UserPlus,
};

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSelectOption,
}) => {
  const authorizedOptions = getAuthorizedRequestTypes(activePersona);

  if (!isOpen) return null;

  return (
    <DialogSurface
      isOpen={isOpen}
      onClose={onClose}
      title="ثبت درخواست یا عملیات جدید"
      className="max-w-xl w-full mx-auto"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ثبت درخواست جدید</h2>
              <p className="text-caption text-slate-500">
                اقدامات مجاز برای سمت شما: {activePersona.jobTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authorizedOptions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              هیچ نوع درخواستی برای این سمت سازمانی مجاز تعریف نشده است.
            </p>
            <p className="text-xs text-slate-500">
              در صورت نیاز به ثبت عملیات، با مدیر یا سرپرست واحد تماس بگیرید.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {authorizedOptions.map((opt) => {
              const Icon = CATEGORY_ICONS[opt.category] || PlusCircle;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onSelectOption(opt);
                    onClose();
                  }}
                  className="w-full text-right p-3.5 rounded-xl border border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-primary-100 text-slate-700 group-hover:text-primary-700 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-primary-900">
                        {opt.title}
                      </div>
                      <div className="text-caption text-slate-500 mt-0.5 line-clamp-1">
                        {opt.description}
                      </div>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-primary-700 group-hover:-translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </DialogSurface>
  );
};
