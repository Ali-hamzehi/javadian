import { AdaptiveTable } from '../design-system/AdaptiveTable';
import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import {
  MockPersona,
  WarehouseExitRecord,
  WarehouseExitStatus,
} from '../../types';
import { mockSalesWarehouseStore } from '../../runtime/workflow';
import { ModalDialog } from '../design-system/ModalAndDrawer';
import { Button } from '../design-system/Button';
import { FormField, TextInput, SelectInput } from '../design-system/FormControls';
import { useToast } from '../design-system/ToastContext';
import { toPersianDigits, formatNumber } from '../../utils/formatters';

interface RecordDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  exitRecord: WarehouseExitRecord;
  activePersona: MockPersona;
  onUpdated: (updatedExit: WarehouseExitRecord) => void;
}

export const RecordDispatchModal: React.FC<RecordDispatchModalProps> = ({
  isOpen,
  onClose,
  exitRecord,
  activePersona,
  onUpdated,
}) => {
  const { addToast } = useToast();

  const [outcome, setOutcome] = useState<WarehouseExitStatus>(
    exitRecord.status === 'blocked' ? 'blocked' : 'dispatched'
  );
  const [blockedReason, setBlockedReason] = useState(
    exitRecord.blockedReason ||
      'کسری فیزیکی موجودی در انبار کهریزک — نیاز به انتقال از انبار کارخانه شکوهیه'
  );

  const [itemDispatches, setItemDispatches] = useState(
    exitRecord.items.map((it) => ({
      itemId: it.id,
      productName: it.productName,
      unit: it.unit,
      requestedCartons: it.requestedCartons || 0,
      requestedQuantity: it.requestedQuantity,
      dispatchedCartons:
        it.dispatchedCartons > 0
          ? it.dispatchedCartons
          : it.requestedCartons || Math.round(it.requestedQuantity / 12),
      dispatchedQuantity:
        it.dispatchedQuantity > 0 ? it.dispatchedQuantity : it.requestedQuantity,
      notes: it.notes || '',
    }))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (outcome === 'blocked' && !blockedReason.trim()) {
      addToast('ثبت شرح علت مانع و کسری انبار الزامی است', { tone: 'danger' });
      return;
    }

    const payload = itemDispatches.map((d) => ({
      itemId: d.itemId,
      dispatchedQuantity: outcome === 'blocked' ? 0 : Number(d.dispatchedQuantity) || 0,
      dispatchedCartons: outcome === 'blocked' ? 0 : Number(d.dispatchedCartons) || 0,
      notes: d.notes,
    }));

    const success = mockSalesWarehouseStore.updateDispatchQuantities(
      exitRecord.id,
      payload,
      activePersona,
      outcome,
      outcome === 'blocked' ? blockedReason : undefined
    );

    if (success) {
      const updated = mockSalesWarehouseStore.getWarehouseExitById(exitRecord.id);
      if (updated) onUpdated(updated);

      addToast('عملیات ترخیص و خروج انبار ثبت شد', {
        description:
          outcome === 'dispatched'
            ? `حواله ${exitRecord.code} با موفقیت ترخیص و تحویل ناوگان حمل گردید.`
            : outcome === 'blocked'
            ? `حواله ${exitRecord.code} به دلیل کسری انبار مسدود اعلام شد.`
            : `ارسال جزئی برای حواله ${exitRecord.code} ثبت شد.`,
        tone: outcome === 'blocked' ? 'warning' : 'success',
      });

      onClose();
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`ثبت ترخیص و تعیین مقادیر خروجی فیزیکی: ${exitRecord.code}`}
      width="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            <CheckCircle2 className="w-4 h-4 ml-1" />
            ثبت قطعی در بخش انبار
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Outcome Selector */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="font-bold text-slate-800 block text-xs">
            نتیجه بررسی و ترخیص در بارانداز انبار:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOutcome('dispatched')}
              className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                outcome === 'dispatched'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ترخیص و خروج کامل</span>
              </div>
              <p className="text-caption text-slate-500 mt-1">
                تطابق کامل مقادیر و تحویل به ناوگان حمل
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOutcome('partial')}
              className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                outcome === 'partial'
                  ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-teal-800">
                <Clock className="w-3.5 h-3.5" />
                <span>ارسال جزئی (پارت ۱)</span>
              </div>
              <p className="text-caption text-slate-500 mt-1">
                بخشی از بار ارسال و الباقی در صف تولید/ورود
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOutcome('blocked')}
              className={`p-3 rounded-lg border text-right transition-all cursor-pointer ${
                outcome === 'blocked'
                  ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>مسدود (کسری انبار)</span>
              </div>
              <p className="text-caption text-slate-500 mt-1">
                عدم امکان ترخیص تا ورود کالا به انبار
              </p>
            </button>
          </div>

          {outcome === 'blocked' && (
            <div className="pt-2">
              <FormField label="علت مانع خروج (Blocker Description)" required>
                <TextInput
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="شرح دقیق علت عدم امکان بارگیری و ترخیص..."
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Dispatch Quantities Table */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">
              تعیین مقادیر واقعی بارگیری‌شده (تطبیق کارتن و تعداد):
            </span>
            <span className="text-caption text-slate-500">
              مسئول ترخیص: <strong className="text-slate-800">{activePersona.name}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <AdaptiveTable className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2">نام کالا</th>
                  <th className="p-2 text-center">کارتن درخواستی</th>
                  <th className="p-2 text-center">کارتن خروجی واقعی</th>
                  <th className="p-2 text-center">تعداد کل ارسالی</th>
                  <th className="p-2">ملاحظات و بهر تولید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemDispatches.map((item, idx) => (
                  <tr key={item.itemId}>
                    <td className="p-2 font-bold text-slate-900">{item.productName}</td>

                    <td className="p-2 text-center font-mono font-bold text-slate-600">
                      {toPersianDigits(item.requestedCartons)}
                    </td>

                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={outcome === 'blocked'}
                        value={item.dispatchedCartons}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setItemDispatches(
                            itemDispatches.map((d, i) =>
                              i === idx
                                ? {
                                    ...d,
                                    dispatchedCartons: val,
                                    dispatchedQuantity: val * 12,
                                  }
                                : d
                            )
                          );
                        }}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold text-primary-900 disabled:opacity-40"
                      />
                    </td>

                    <td className="p-2 text-center font-mono font-bold text-primary-900">
                      {outcome === 'blocked' ? '۰' : toPersianDigits(item.dispatchedQuantity)}{' '}
                      {item.unit}
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemDispatches(
                            itemDispatches.map((d, i) =>
                              i === idx ? { ...d, notes: val } : d
                            )
                          );
                        }}
                        placeholder="شماره پالت یا بهر..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-caption"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdaptiveTable>
          </div>
        </div>
      </form>
    </ModalDialog>
  );
};
