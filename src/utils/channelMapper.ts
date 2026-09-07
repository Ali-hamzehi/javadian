/**
 * Central Presentation Channel Mapper
 * Maps internal sales channel enums and codes to friendly Persian UI labels.
 * Preserves underlying business logic and raw data models intact.
 */

export const CHANNEL_PERSIAN_MAP: Record<string, string> = {
  phone: 'تماس تلفنی',
  in_person: 'مراجعه حضوری',
  whatsapp: 'واتساپ',
  telegram: 'تلگرام',
  field_visit: 'ویزیت میدانی',
  visit: 'ویزیت میدانی',
  other: 'سایر',
};

/**
 * Converts any raw channel code or internal enum into a clean Persian display label.
 * Returns safe fallback 'سایر' for unknown or empty values.
 */
export function getChannelDisplayName(channel?: string | null, rawLabel?: string | null): string {
  // If a meaningful Persian label is already provided without raw English keyword 'phone', use it
  if (rawLabel && !rawLabel.toLowerCase().includes('phone') && rawLabel.trim().length > 0) {
    return rawLabel;
  }

  if (!channel) return 'سایر';

  const normalized = channel.toLowerCase().trim();
  return CHANNEL_PERSIAN_MAP[normalized] || 'سایر';
}
