/**
 * Text sanitizer utility to enforce mandatory Javadian language rules:
 * - The word «کارتابل» must NEVER appear anywhere in the rendered UI.
 * - Replaces with «کارهای من», «تأییدهای من», or «وظایف».
 */
export function sanitizeKartabl(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/کارتابل شخصی/g, 'کارهای من')
    .replace(/کارتابل من/g, 'کارهای من')
    .replace(/کارتابل تأییدات/g, 'تأییدهای من')
    .replace(/کارتابل تأیید/g, 'تأییدهای من')
    .replace(/کارتابل و وظایف من/g, 'کارهای من')
    .replace(/کارتابل وظایف/g, 'فهرست وظایف')
    .replace(/کارتابل عمومی/g, 'کارهای من')
    .replace(/کارتابل‌ها/g, 'بخش وظایف')
    .replace(/کارتابلی/g, 'عملیاتی')
    .replace(/کارتابل/g, 'کارهای من');
}
