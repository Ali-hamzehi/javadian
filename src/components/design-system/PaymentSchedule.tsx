import React, { useState } from 'react';
import { CalendarClock, CreditCard } from 'lucide-react';
import { CurrencyAmount } from './CurrencyAmount';
import { useWorkflowRevision, notifyWorkflow } from '../../runtime/workflow';
export type PaymentScheduleData = { due: string; chequeNumber: string; isCheque: boolean };
const schedules = new Map<string, PaymentScheduleData>();
export function getPaymentSchedule(id: string) { return schedules.get(id); }
export function daysUntilDue(due: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
  const [y, m, d] = due.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}
export function DueBadge({ id, settled = false }: { id: string; settled?: boolean }) {
  useWorkflowRevision();
  const due = schedules.get(id)?.due;
  const days = due ? daysUntilDue(due) : null;
  if (settled || days === null) return null;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs mt-2 ${days <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}><CalendarClock size={13} />{days < 0 ? `${Math.abs(days).toLocaleString('fa-IR')} روز از سررسید گذشته` : days === 0 ? 'سررسید امروز' : `${days.toLocaleString('fa-IR')} روز تا سررسید`}</span>;
}
export const PaymentSchedule: React.FC<{ id: string; amount: number; beneficiary: string; canEdit: boolean; settled: boolean }> = ({ id, amount, beneficiary, canEdit, settled }) => {
  useWorkflowRevision();
  const initial = schedules.get(id) || { due: '', chequeNumber: '', isCheque: false };
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  return <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 space-y-4">
    <div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><CreditCard size={18} />برنامه پرداخت و مشخصات چک</h3><DueBadge id={id} settled={settled} /></div>
    <div className="text-xs text-slate-600">در وجه: {beneficiary}</div><CurrencyAmount amountRials={amount} size="lg" />
    <div className="grid sm:grid-cols-2 gap-3"><label className="text-xs space-y-2"><span className="block">تاریخ سررسید (انتخاب تقویم)</span><input disabled={!canEdit || settled} type="date" value={value.due} onChange={e => { setSaved(false); setValue({ ...value, due: e.target.value }); }} className="border rounded-lg bg-white p-2 w-full" />{value.due && <span className="block">{new Date(value.due + 'T12:00:00').toLocaleDateString('fa-IR')}</span>}</label><label className="text-xs space-y-2"><span className="block">شماره چک / شناسه صیادی</span><input disabled={!canEdit || settled} value={value.chequeNumber} onChange={e => { setSaved(false); setValue({ ...value, chequeNumber: e.target.value, isCheque: !!e.target.value }); }} className="border rounded-lg bg-white p-2 w-full" placeholder="در صورت پرداخت با چک" /></label></div>
    {canEdit && !settled && <button type="button" onClick={() => { schedules.set(id, value); notifyWorkflow(); setSaved(true); }} className="rounded-lg bg-teal-800 text-white px-4 py-2 text-xs">ثبت برنامه پرداخت</button>}
    {saved && <p role="status" className="text-xs text-teal-800">برنامه پرداخت ثبت شد.</p>}
  </section>;
}
