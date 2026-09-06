import React from 'react';
import { LayoutGrid, List, Activity } from 'lucide-react';
import { CurrencyAmount } from './CurrencyAmount';
import { moneyWords } from '../../utils/financial';
export function AmountInWords({ amount }: { amount: number }) {
  return <span aria-live="polite" className="block text-xs text-primary-700 leading-6 mt-1">{moneyWords(amount)}</span>;
}
export function ViewSwitcher({ value, onChange }: { value: 'cards' | 'table'; onChange: (value: 'cards' | 'table') => void }) {
  return <div role="group" aria-label="شیوه نمایش" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 gap-1">{(['cards', 'table'] as const).map(mode => <button type="button" key={mode} aria-pressed={value === mode} onClick={() => onChange(mode)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${value === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{mode === 'cards' ? <LayoutGrid size={15} /> : <List size={15} />}{mode === 'cards' ? 'کارتی' : 'جدولی'}</button>)}</div>;
}
export function MetricStrip({ total, pending, amount, label = 'در انتظار اقدام' }: { total: number; pending: number; amount: number; label?: string }) {
  const ratio = total ? Math.min(100, Math.round(pending / total * 100)) : 0;
  return <section aria-label="شاخص‌های زنده" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div className="metric-card"><span className="text-xs text-slate-500">کل پرونده‌ها</span><strong className="block text-3xl mt-3 text-slate-900 tabular-nums">{total.toLocaleString('fa-IR')}</strong><span className="text-xs text-slate-500">بر اساس داده‌های موجود</span></div>
    <div className="metric-card"><span className="flex items-center gap-2 text-xs text-slate-600"><Activity size={16} />{label}{pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 motion-safe:animate-pulse" />}</span><strong className="block text-3xl mt-3 tabular-nums">{pending.toLocaleString('fa-IR')}</strong><div role="progressbar" aria-label="سهم پرونده‌های نیازمند اقدام" aria-valuenow={ratio} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-slate-100 my-2 overflow-hidden"><div style={{ width: `${ratio}%` }} className="h-full rounded-full bg-amber-500" /></div><span className="text-xs text-slate-500">{ratio.toLocaleString('fa-IR')}٪ از کل پرونده‌ها</span></div>
    <div className="metric-card"><span className="text-xs text-slate-500">ارزش کل پرونده‌ها</span><div className="mt-4"><CurrencyAmount amountRials={amount} size="lg" /></div></div>
  </section>;
}
