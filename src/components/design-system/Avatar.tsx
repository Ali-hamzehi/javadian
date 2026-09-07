import React from 'react';

/** A portable visual identity for a demo persona; never requests a remote avatar. */
export const Avatar: React.FC<
  React.ImgHTMLAttributes<HTMLImageElement> & { 'aria-hidden'?: boolean | 'true' | 'false' }
> = ({ alt = '', className = '', 'aria-hidden': ariaHidden }) => {
  const isDecorative = ariaHidden === true || ariaHidden === 'true' || !alt;
  return (
    <span
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : alt}
      aria-hidden={isDecorative ? 'true' : undefined}
      className={`inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold shrink-0 ${className}`}
    >
      {alt ? alt.trim().slice(0, 1) : 'ج'}
    </span>
  );
};
