import React, { useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { CurrencyAmount } from './CurrencyAmount';
import { AmountInWords } from './WorkspaceTools';
import { parseFinancialInput, validRials } from '../../utils/financial';
type Quote = { id: string; supplier: string; amount: number; reference: string; terms: string };
const quotesByRequest = new Map<string, Quote[]>();
export const QuoteComparison: React.FC<{ requestId: string }> = ({ requestId }) => {
  const [quotes, setQuotes] = useState(() => quotesByRequest.get(requestId) || []);
  const [supplier, setSupplier] = useState(''); const [amount, setAmount] = useState('');
  const [reference, setReference] = useState(''); const [terms, setTerms] = useState('');
  const [error, setError] = useState('');
  const update = (next: Quote[]) => { setQuotes(next); quotesByRequest.set(requestId, next); };
  const minimum = Math.min(...quotes.map(q => q.amount));
  return <details className="border rounded-xl bg-white p-4" open><summary className="font-bold cursor-pointer">مقایسه استعلام‌ها و پیش‌فاکتورها ({quotes.length.toLocaleString('fa-IR')})</summary>
    <p className="text-xs text-slate-500 my-3">مبالغ کل را با شرایط یکسان شامل مالیات و حمل وارد کنید. کمترین قیمت به معنی انتخاب قطعی تأمین‌کننده نیست.</p>
    <div className="grid sm:grid-cols-2 gap-3">{quotes.map(q => <article key={q.id} className={`p-4 border rounded-xl ${q.amount === minimum ? 'bg-teal-50 border-teal-300' : 'bg-slate-50'}`}><div className="flex justify-between"><strong className="text-sm">{q.supplier}</strong><button type="button" aria-label={`حذف استعلام ${q.supplier}`} onClick={() => update(quotes.filter(x => x.id !== q.id))}><Trash2 size={16} /></button></div><div className="my-3"><CurrencyAmount amountRials={q.amount} /></div><p className="text-xs">{q.reference || 'بدون شماره پیش‌فاکتور'} • {q.terms || 'شرایط ثبت نشده'}</p>{q.amount === minimum && <span className="text-xs text-teal-700">کمترین مبلغ ثبت‌شده</span>}</article>)}</div>
    {!quotes.length && <p className="text-sm text-slate-500 flex gap-2 py-4"><FileText size={18} />اولین پیشنهاد واقعی تأمین‌کننده را برای شروع مقایسه ثبت کنید.</p>}
    <div className="grid sm:grid-cols-2 gap-3 mt-4">{[[supplier, setSupplier, 'نام تأمین‌کننده'], [amount, setAmount, 'مبلغ کل پیش‌فاکتور (ریال)'], [reference, setReference, 'شماره پیش‌فاکتور'], [terms, setTerms, 'شرایط پرداخت و تحویل']].map(([value, setter, label], i) => <label key={i} className="text-xs"><span className="block mb-1">{label as string}</span><input value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} className="border rounded-lg p-2 w-full" inputMode={i === 1 ? 'numeric' : 'text'} />{i === 1 && <AmountInWords amount={parseFinancialInput(amount)} />}</label>)}</div>
    {error && <p role="alert" className="text-xs text-rose-700 mt-2">{error}</p>}<button type="button" className="flex items-center gap-2 bg-slate-900 text-white rounded-lg px-4 py-2 text-xs mt-3" onClick={() => { const value = parseFinancialInput(amount); if (!supplier.trim() || !validRials(value)) { setError('نام تأمین‌کننده و مبلغ صحیح مثبت لازم است.'); return; } update([...quotes, { id: crypto.randomUUID(), supplier: supplier.trim(), amount: value, reference, terms }]); setSupplier(''); setAmount(''); setReference(''); setTerms(''); setError(''); }}><Plus size={15} />افزودن استعلام</button>
  </details>;
}
