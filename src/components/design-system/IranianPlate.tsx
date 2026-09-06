import React from 'react';
import { toPersianDigits } from '../../utils/formatters';

interface IranianPlateProps {
  plateString?: string;
  twoDigits?: string | number;
  letter?: string;
  threeDigits?: string | number;
  regionCode?: string | number;
  type?: 'commercial' | 'private' | 'government';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Iranian national vehicle license plate component
 * Supports auto-parsing string formatted as "۲۲ ع ۸۵۰ ایران ۱۱"
 * or manual props for twoDigits, letter, threeDigits, regionCode.
 */
export const IranianPlate: React.FC<IranianPlateProps> = ({
  plateString,
  twoDigits,
  letter,
  threeDigits,
  regionCode,
  type = 'commercial',
  size = 'md',
  className = '',
}) => {
  let pTwo = twoDigits === undefined ? '' : String(twoDigits);
  let pLetter = letter || '';
  let pThree = threeDigits === undefined ? '' : String(threeDigits);
  let pRegion = regionCode === undefined ? '' : String(regionCode);
  if (plateString) {
    const cleaned = plateString.trim().replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
    const standard = cleaned.match(/^(\d{2})\s*([آ-ی])\s*(\d{3})\s*(?:ایران|-)?\s*(\d{2})$/);
    const reversed = cleaned.match(/^ایران\s*(\d{2})\s*-\s*(\d{3})\s*([آ-ی])\s*(\d{2})$/);
    if (standard) [, pTwo, pLetter, pThree, pRegion] = standard;
    else if (reversed) { pRegion = reversed[1]; pThree = reversed[2]; pLetter = reversed[3]; pTwo = reversed[4]; }
    else return <span className="text-xs text-slate-500" dir="auto">{plateString === '---' ? 'پلاک ثبت نشده' : plateString}</span>;
  }
  if (!pTwo || !pLetter || !pThree || !pRegion) return <span className="text-xs text-slate-500">پلاک ثبت نشده</span>;

  // Commercial / Freight freight letter 'ع' is traditionally yellow background, private is white
  const isYellow = type === 'commercial' || pLetter === 'ع';

  const sizeClasses = {
    sm: 'h-6 text-caption px-1 gap-1 border',
    md: 'h-8 text-xs px-1.5 gap-1.5 border-[1.5px]',
    lg: 'h-10 text-sm px-2 gap-2 border-2',
  };

  const bgClasses = isYellow
    ? 'bg-amber-300 text-slate-950 border-slate-900 shadow-xs'
    : 'bg-white text-slate-950 border-slate-900 shadow-xs';

  return (
    <div
      dir="ltr"
      aria-label={`پلاک خودرو: ${toPersianDigits(pTwo)} ${pLetter} ${toPersianDigits(pThree)} ایران ${toPersianDigits(pRegion)}`}
      className={`inline-flex items-center rounded-sm font-black select-none tracking-normal font-mono ${bgClasses} ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: 'inherit' }}
    >
      {/* Left blue strip: I.R. IRAN Flag */}
      <div className="h-full bg-blue-700 text-white flex flex-col items-center justify-between py-0.5 px-1 rounded-xs shrink-0 select-none">
        <div className="w-3.5 h-2 flex flex-col border border-white/40 overflow-hidden rounded-2xs">
          <div className="h-1/3 bg-emerald-600" />
          <div className="h-1/3 bg-white" />
          <div className="h-1/3 bg-rose-600" />
        </div>
        <span className="text-[7px] leading-none uppercase font-bold tracking-tighter scale-90">I.R.</span>
      </div>

      {/* Main Numbers & Persian Letter */}
      <div className="flex items-center justify-center gap-1 font-black px-0.5">
        <span className="font-extrabold tracking-wide text-center">
          {toPersianDigits(pTwo)}
        </span>
        <span className="font-black text-center text-primary-950 px-0.5" style={{ minWidth: '1.2em' }}>
          {pLetter}
        </span>
        <span className="font-extrabold tracking-wide text-center">
          {toPersianDigits(pThree)}
        </span>
      </div>

      {/* Right Box: Iran Region Code */}
      <div className="border-l border-slate-900/50 pl-1 pr-0.5 flex flex-col items-center justify-center shrink-0 leading-none">
        <span className="text-[8px] font-bold text-slate-700 mb-0.5">ایران</span>
        <span className="font-black text-center text-[11px] leading-none">
          {toPersianDigits(pRegion)}
        </span>
      </div>
    </div>
  );
};
