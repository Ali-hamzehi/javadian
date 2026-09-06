import { numberToPersianWords } from './formatters';
export function parseFinancialInput(value: string): number {
  const normalized = value.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[,٬\s]/g, '').replace(/٫/g, '.');
  return normalized.trim() ? Number(normalized) : NaN;
}
export function validRials(value: number) { return Number.isSafeInteger(value) && value > 0; }
export function moneyWords(rials: number) {
  if (!Number.isSafeInteger(rials) || rials < 0) return 'مبلغ معتبر به ریال وارد کنید';
  const remainder = rials % 10;
  return `${numberToPersianWords(Math.floor(rials / 10))} تومان${remainder ? ` و ${numberToPersianWords(remainder)} ریال` : ''}`;
}
