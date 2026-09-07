import React, { useState, useEffect } from 'react';
import { MockPersona } from '../../types';
import { MOCK_PERSONAS } from '../../data/mockData';
import {
  ROLE_FILTER_TABS,
  CLEAN_ROLE_METAS,
  RoleFilterCategory,
} from './roleDisplayConfig';
import { Avatar } from '../design-system/Avatar';
import { Button } from '../design-system/Button';
import { X, Check, ArrowLeft } from 'lucide-react';
import { adaptPersona } from '../../runtime/documentBasedPersonas';

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (persona: MockPersona) => void;
  currentPersonaId?: string;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentPersonaId,
}) => {
  const [activeCategory, setActiveCategory] = useState<RoleFilterCategory>('all');

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPersonas = MOCK_PERSONAS.filter((p) => {
    const meta = CLEAN_ROLE_METAS[p.id];
    if (!meta) return true;
    if (activeCategory === 'all') return true;
    return meta.category === activeCategory;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 text-right"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selector-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 shrink-0 bg-slate-50/70">
          <div>
            <h2 id="role-selector-title" className="text-base font-bold text-slate-900">
              انتخاب نقش
            </h2>
            <p className="text-caption text-slate-500 mt-0.5">
              برای مشاهده امکانات، یکی از نقش‌های زیر را انتخاب کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-3 sm:px-5 border-b border-slate-100 bg-white overflow-x-auto shrink-0">
          {ROLE_FILTER_TABS.map((tab) => {
            const isSelected = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-caption font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-none'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body - Role Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPersonas.map((persona) => {
              const meta = CLEAN_ROLE_METAS[persona.id];
              const isCurrent = currentPersonaId === persona.id;
              const cleanName = meta?.name || persona.name;
              const cleanJob = meta?.jobTitle || persona.jobTitle;
              const isDocumented = meta?.isDocumented ?? false;

              return (
                <div
                  key={persona.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between text-right h-full ${
                    isCurrent
                      ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Role Type Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-caption px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                          isDocumented
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300 font-medium'
                        }`}
                      >
                        {isDocumented ? 'نقش سازمانی' : 'نقش نمونه'}
                      </span>
                    </div>

                    {/* Identity Row */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <Avatar
                        src={persona.avatar}
                        alt=""
                        aria-hidden="true"
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {cleanName}
                        </h3>
                        {cleanJob && cleanJob !== cleanName && (
                          <p className="text-caption text-slate-600 line-clamp-1 mt-0.5">
                            {cleanJob}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2 Key Capabilities */}
                    {meta?.keyCapabilities && (
                      <div className="space-y-1 my-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 text-caption text-slate-700">
                        {meta.keyCapabilities.map((cap, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                            <span className="truncate">{cap}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-caption text-slate-500">
                      {isCurrent ? 'نقش فعال فعلی' : ''}
                    </span>

                    <Button
                      type="button"
                      variant={isCurrent ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => onSelect(adaptPersona(persona))}
                      aria-label={`انتخاب نقش ${cleanName} — ${isDocumented ? 'نقش سازمانی' : 'نقش نمونه'}`}
                      className="text-caption h-8 px-3.5 font-bold cursor-pointer"
                    >
                      <span>{isCurrent ? 'فعال' : 'انتخاب'}</span>
                      {isCurrent ? (
                        <Check className="w-3.5 h-3.5 mr-1 text-primary-700" />
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs px-4"
          >
            انصراف
          </Button>
        </div>
      </div>
    </div>
  );
};
