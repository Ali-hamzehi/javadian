import { toPersianDigits, formatNumber, formatRials } from './formatters';

/**
 * Enhanced currency conversion and smart enterprise formatting.
 * Works seamlessly alongside formatters.ts
 */

/**
 * Converts Rial amount to Toman (divides by 10)
 */
export function rialsToToman(rials: number): number {
  return rials / 10;
}

/**
 * Formats an amount in Toman with Persian digits and separator.
 * e.g. 450,000,000 Rials -> "۴۵,۰۰۰,۰۰۰ تومان"
 */
export function formatToman(rials: number): string {
  const toman = rialsToToman(rials);
  return `${toman.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} تومان`;
}

/**
 * Formats amounts into human-readable Persian words for enterprise scale
 * e.g.
 * 2,640,000,000 Rials (264 million Toman) -> "۲۶۴ میلیون تومان"
 * 26,400,000,000 Rials (2.64 billion Toman) -> "۲.۶۴ میلیارد تومان"
 * 45,000,000 Rials (4.5 million Toman) -> "۴.۵ میلیون تومان"
 */
export function formatCompactToman(rials: number): string {
  const toman = rialsToToman(rials);
  const absToman = Math.abs(toman);

  if (absToman >= 1_000_000_000) {
    const billions = toman / 1_000_000_000;
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(2).replace(/\.?0+$/, '');
    return `${toPersianDigits(formatted)} میلیارد تومان`;
  }

  if (absToman >= 1_000_000) {
    const millions = toman / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1).replace(/\.?0+$/, '');
    return `${toPersianDigits(formatted)} میلیون تومان`;
  }

  if (absToman >= 1_000) {
    const thousands = toman / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1).replace(/\.?0+$/, '');
    return `${toPersianDigits(formatted)} هزار تومان`;
  }

  return `${toman.toLocaleString('fa-IR', { maximumFractionDigits: 1 })} تومان`;
}

/**
 * Returns dual-currency structured display object
 */
export function getDualCurrency(rials: number) {
  return {
    rialsFormatted: formatRials(rials),
    tomanFormatted: formatToman(rials),
    compactToman: formatCompactToman(rials),
    rawRials: rials,
    rawToman: rialsToToman(rials),
  };
}
