import React from 'react';

/** A portable visual identity for a demo persona; never requests a remote avatar. */
export const Avatar: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ alt = '', className = '' }) => (
  <span role="img" aria-label={alt} className={`inline-flex items-center justify-center bg-slate-100 text-slate-700 font-bold shrink-0 ${className}`}>
    {alt.trim().slice(0, 1) || 'ج'}
  </span>
);
