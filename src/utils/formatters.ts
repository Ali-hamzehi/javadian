export function toPersianDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

export function toEnglishDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = str;
  persianDigits.forEach((pd, idx) => {
    res = res.replaceAll(pd, String(idx));
  });
  return res;
}

/**
 * Checks whether a given Jalali due date is overdue compared to current system reference date.
 * Current system reference date is 1404/06/15.
 */
export function isJalaliOverdue(dueDateJalali?: string, referenceDateJalali = '۱۴۰۴/۰۶/۱۵'): boolean {
  if (!dueDateJalali) return false;
  const engDue = toEnglishDigits(dueDateJalali).replace(/[^0-9/]/g, '').trim();
  const engRef = toEnglishDigits(referenceDateJalali).replace(/[^0-9/]/g, '').trim();
  if (!engDue.includes('/') || !engRef.includes('/')) return false;
  return engDue < engRef;
}

export function formatRials(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '— ریال';
  const parts = Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${toPersianDigits(parts)} ریال`;
}

/**
 * Convert integer to Persian words (حروف فارسی)
 * e.g. 25000000 -> "بیست و پنج میلیون"
 */
export function numberToPersianWords(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '';
  const n = typeof num === 'string' ? parseInt(num.replace(/,/g, ''), 10) : Math.floor(num);
  if (isNaN(n) || n === 0) return 'صفر';
  if (n < 0) return `منفی ${numberToPersianWords(Math.abs(n))}`;

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  function convertChunk(val: number): string {
    const parts: string[] = [];
    const h = Math.floor(val / 100);
    const rem = val % 100;
    if (h > 0) {
      parts.push(hundreds[h]);
    }
    if (rem >= 10 && rem < 20) {
      parts.push(teens[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (t > 0) parts.push(tens[t]);
      if (o > 0) parts.push(ones[o]);
    }
    return parts.join(' و ');
  }

  const chunks: string[] = [];
  let temp = n;
  let scaleIndex = 0;

  while (temp > 0 && scaleIndex < scales.length) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkText = convertChunk(chunk);
      const scaleText = scales[scaleIndex];
      chunks.unshift(scaleText ? `${chunkText} ${scaleText}` : chunkText);
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }

  return chunks.join(' و ');
}

export function formatRialsWithWords(amount?: number | null): { inRials: string; inTomans: string; wordsRials: string; wordsTomans: string } {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return { inRials: '۰ ریال', inTomans: '۰ تومان', wordsRials: 'صفر ریال', wordsTomans: 'صفر تومان' };
  }
  const rials = Math.round(Number(amount));
  const tomans = Math.floor(rials / 10);
  return {
    inRials: formatRials(rials),
    inTomans: `${toPersianDigits(Math.round(tomans).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','))} تومان`,
    wordsRials: `${numberToPersianWords(rials)} ریال`,
    wordsTomans: `${numberToPersianWords(tomans)} تومان`,
  };
}

export function formatNumber(val?: number | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '—';
  const parts = Math.round(Number(val)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(parts);
}

export function getPriorityMeta(priority: string) {
  switch (priority) {
    case 'critical':
      return {
        label: 'فوری و حیاتی',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-600',
      };
    case 'high':
      return {
        label: 'اولویت بالا',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'normal':
      return {
        label: 'عادی',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    case 'low':
      return {
        label: 'کم',
        bg: 'bg-slate-50 text-slate-500 border-slate-200',
        dot: 'bg-slate-300',
      };
    default:
      return {
        label: priority,
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getStatusMeta(status: string) {
  switch (status) {
    case 'blocked':
      return {
        label: 'دارای مانع عملیاتی',
        bg: 'bg-rose-50 text-rose-800 border-rose-300',
        border: 'border-rose-400',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        tone: 'danger' as const,
      };
    case 'pending_approval':
      return {
        label: 'در انتظار تأیید',
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        border: 'border-amber-400',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        tone: 'warning' as const,
      };
    case 'pending_review':
      return {
        label: 'در حال بررسی اولیه',
        bg: 'bg-sky-50 text-sky-800 border-sky-300',
        border: 'border-sky-400',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
        tone: 'info' as const,
      };
    case 'in_progress':
      return {
        label: 'در حال اجرا / اقدام',
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        border: 'border-indigo-400',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        tone: 'primary' as const,
      };
    case 'completed':
      return {
        label: 'تکمیل شده',
        bg: 'bg-teal-50 text-teal-800 border-teal-300',
        border: 'border-teal-400',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
        tone: 'success' as const,
      };
    case 'rejected':
      return {
        label: 'رد شده / عدم اقدام',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        border: 'border-slate-400',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
        tone: 'neutral' as const,
      };
    case 'draft':
    default:
      return {
        label: 'پیش‌نویس اولیه',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        border: 'border-slate-300',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        tone: 'neutral' as const,
      };
  }
}
