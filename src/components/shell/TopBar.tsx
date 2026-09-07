import { Avatar } from '../design-system/Avatar';
import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  UsersRound,
  ChevronDown,
  ShieldAlert,
  Check,
  Briefcase,
  LogOut,
  Download,
  RotateCcw,
  CheckCircle2,
  Truck,
  ShoppingBag,
  CreditCard,
  Building2,
} from 'lucide-react';
import { MockPersona } from '../../types';
import {
  adaptPersona,
  getPersonasByCategory,
  PERSONA_CATEGORIES,
  PersonaCategory,
  getDocumentBasedPersonas,
  getPersonaDisplayName,
  getPersonaTypeLabel,
  getPersonaSubtitle,
} from '../../runtime/documentBasedPersonas';
import { mockRepository, clearPersistedState, hasPersistedState } from '../../runtime/workflow';
import { Button } from '../design-system/Button';
import { usePWA } from '../pwa/PWAContext';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  activePersona: MockPersona;
  onSelectPersona: (persona: MockPersona) => void;
  onSwitchResponsibility?: (delegationId: string) => void;
  onSignOut?: () => void;
  pageTitle: string;
  breadcrumbs: string[];
  initialPersonaMenuOpen?: boolean;
  initialUserMenuOpen?: boolean;
}

const CATEGORY_ICONS: Record<PersonaCategory, React.ComponentType<{ className?: string }>> = {
  purchasing_logistics_warehouse: Truck,
  sales_distribution: ShoppingBag,
  finance_payments: CreditCard,
  management_hybrid: Building2,
};

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  activePersona,
  onSelectPersona,
  onSwitchResponsibility,
  onSignOut,
  pageTitle = 'سامانه عملیات جوادیان',
  breadcrumbs = [],
  initialPersonaMenuOpen = false,
  initialUserMenuOpen = false,
}) => {
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(initialPersonaMenuOpen);
  const [isResponsibilityMenuOpen, setIsResponsibilityMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(initialUserMenuOpen);

  const personaRef = useRef<HTMLDivElement>(null);
  const respRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const { isStandalone, isInstallable, setShowInstallGuide } = usePWA();

  const adaptedActive = adaptPersona(activePersona);
  const categorizedPersonas = getPersonasByCategory();
  const allPersonas = getDocumentBasedPersonas();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setIsPersonaMenuOpen(false);
      }
      if (respRef.current && !respRef.current.contains(event.target as Node)) {
        setIsResponsibilityMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute urgent task counts
  const scopedCounts = mockRepository.computeScopedTaskCounts(activePersona);
  const hasUrgent = (scopedCounts.blocked || 0) > 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 transition-all">
      {/* Right: Hamburger (mobile) + Page Title & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="باز کردن منوی ناوبری"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate block">
            {pageTitle}
          </span>
          <nav aria-label="موقعیت در سامانه" className="hidden sm:flex items-center gap-1.5 text-caption text-slate-600 truncate mt-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-500">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-primary-700 font-bold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      {/* Left: Actions + Demo Persona Switcher + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search Trigger (Desktop only) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 min-h-[40px] text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
          title="جستجوی سریع (Ctrl+K)"
          aria-label="جستجوی سراسری (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline text-slate-600 font-medium">جستجو...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-caption font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="کارهای من و اعلان‌ها"
          aria-label="کارهای من و اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          {hasUrgent && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          )}
        </button>

        {/* ACTIVE RESPONSIBILITY SWITCHER (If persona has delegated responsibilities) */}
        {activePersona.delegatedResponsibilities && activePersona.delegatedResponsibilities.length > 0 && (
          <div className="hidden md:block relative" ref={respRef}>
            <button
              type="button"
              onClick={() => setIsResponsibilityMenuOpen(!isResponsibilityMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 transition-colors cursor-pointer"
              title="تغییر مسئولیت فعال"
              aria-expanded={isResponsibilityMenuOpen}
              aria-label="تغییر مسئولیت فعال"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden xl:inline text-caption">مسئولیت:</span>
              <span className="truncate max-w-[90px] sm:max-w-[120px]">
                {activePersona.activeResponsibilityId
                  ? activePersona.delegatedResponsibilities.find(
                      (d) => d.id === activePersona.activeResponsibilityId
                    )?.title || 'مسئولیت اصلی'
                  : 'مسئولیت اصلی'}
              </span>
              <ChevronDown className="w-3 h-3 text-amber-700 shrink-0" />
            </button>

            {isResponsibilityMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-right animate-in fade-in duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block">انتخاب مسئولیت اقدام</span>
                  <span className="text-caption text-slate-500">حکم جانشینی یا پست اصلی</span>
                </div>

                <div className="mt-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchResponsibility?.('');
                      setIsResponsibilityMenuOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-right text-xs transition-colors flex items-start justify-between cursor-pointer ${
                      !activePersona.activeResponsibilityId
                        ? 'bg-amber-50 text-amber-950 font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{adaptedActive.jobTitle}</span>
                      <span className="text-caption text-slate-500 block">پست رسمی و مستقیم سازمانی</span>
                    </div>
                    {!activePersona.activeResponsibilityId && (
                      <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                  </button>

                  {activePersona.delegatedResponsibilities.map((del) => {
                    const isSelected = activePersona.activeResponsibilityId === del.id;
                    return (
                      <button
                        key={del.id}
                        type="button"
                        onClick={() => {
                          onSwitchResponsibility?.(del.id);
                          setIsResponsibilityMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg text-right text-xs transition-colors flex items-start justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 text-amber-950 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="block font-bold">{del.title}</span>
                          <span className="text-caption text-slate-500 block">
                            تفویض از طرف: {del.originalOwnerName} ({del.department})
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEMO PERSONA SWITCHER */}
        <div className="hidden sm:block relative" ref={personaRef}>
          <button
            type="button"
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg text-xs font-bold text-primary-900 transition-colors cursor-pointer shadow-none"
            title="تغییر نقش"
            aria-expanded={isPersonaMenuOpen}
            aria-label="تغییر نقش"
          >
            <UsersRound className="w-3.5 h-3.5 text-primary-700 shrink-0" />
            <span
              className={`hidden sm:inline text-white text-caption px-1.5 py-0.2 rounded font-black ${
                adaptedActive.isDocumentedPerson ? 'bg-emerald-700' : 'bg-slate-600'
              }`}
            >
              {getPersonaTypeLabel(adaptedActive)}
            </span>
            <span className="truncate max-w-[100px] sm:max-w-[130px] text-xs">{getPersonaDisplayName(adaptedActive)}</span>
            <ChevronDown className="w-3 h-3 text-primary-700 shrink-0" />
          </button>

          {isPersonaMenuOpen && (
            <div className="persona-menu absolute left-0 mt-1.5 w-84 max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-right animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">تغییر نقش کاربر</h4>
                  <p className="text-caption text-slate-500 mt-0.5">تفکیک بر اساس ۴ حوزه سازمانی</p>
                </div>
                <span className="text-caption bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  {allPersonas.length} نقش
                </span>
              </div>

              <div className="p-2 space-y-3">
                {(Object.keys(PERSONA_CATEGORIES) as PersonaCategory[]).map((catKey) => {
                  const meta = PERSONA_CATEGORIES[catKey];
                  const personasInCat = categorizedPersonas[catKey] || [];
                  const CatIcon = CATEGORY_ICONS[catKey] || Building2;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 text-caption font-black text-slate-700 bg-slate-50 rounded">
                        <CatIcon className="w-3 h-3 text-slate-500" />
                        <span>{meta.title}</span>
                      </div>

                      <div className="space-y-0.5">
                        {personasInCat.map((persona) => {
                          const isSelected = activePersona.id === persona.id;
                          return (
                            <button
                              key={persona.id}
                              type="button"
                              onClick={() => {
                                onSelectPersona(persona);
                                setIsPersonaMenuOpen(false);
                              }}
                              aria-label={`انتخاب نقش ${getPersonaDisplayName(persona)} — ${getPersonaTypeLabel(persona)}`}
                              className={`w-full p-2 rounded-lg text-right text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-primary-50 border border-primary-300 text-primary-950 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Avatar
                                src={persona.avatar}
                                alt=""
                                aria-hidden="true"
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200 mt-0.5"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-slate-900 text-xs truncate">
                                    {getPersonaDisplayName(persona)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {persona.isDocumentedPerson ? (
                                      <span className="text-caption bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                        نقش سازمانی
                                      </span>
                                    ) : (
                                      <span className="text-caption bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                        نقش نمونه
                                      </span>
                                    )}
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-700 shrink-0" />}
                                  </div>
                                </div>
                                <p className="text-caption text-slate-500 truncate">{getPersonaSubtitle(persona)}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            aria-label="منوی کاربر"
            aria-expanded={isUserMenuOpen}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center justify-center p-1 min-w-[44px] min-h-[44px] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Avatar
              src={activePersona.avatar}
              alt=""
              aria-hidden="true"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-600"
              referrerPolicy="no-referrer"
            />
          </button>

          {isUserMenuOpen && (
            <div className="persona-menu absolute left-0 mt-1.5 w-68 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-right animate-in fade-in duration-150 space-y-2">
              <div className="pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-900 block truncate">{getPersonaDisplayName(adaptedActive)}</span>
                  {adaptedActive.isDocumentedPerson ? (
                    <span className="text-caption font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      نقش سازمانی
                    </span>
                  ) : (
                    <span className="text-caption font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      نقش نمونه
                    </span>
                  )}
                </div>
                {getPersonaSubtitle(adaptedActive) && (
                  <span className="text-caption text-slate-600 font-medium block">{getPersonaSubtitle(adaptedActive)}</span>
                )}
                {adaptedActive.department && adaptedActive.department !== getPersonaSubtitle(adaptedActive) && (
                  <span className="text-caption text-slate-500 block">{adaptedActive.department}</span>
                )}
              </div>

              <div className="text-caption text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>نوع نقش:</span>
                  <strong className={adaptedActive.isDocumentedPerson ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                    {getPersonaTypeLabel(adaptedActive)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>سطح دسترسی:</span>
                  <strong className="text-primary-700">
                    {activePersona.capabilities.length > 0 ? 'کاربر مجاز' : 'بدون مجوز (۴۰۳)'}
                  </strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span>وضعیت اتصال:</span>
                  <span className="px-2 py-0.5 rounded-full text-caption font-bold bg-emerald-100 text-emerald-800">
                    فعال و متصل
                  </span>
                </div>
              </div>

              {/* Mobile Persona Switcher in User Menu */}
              <div className="sm:hidden pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsPersonaMenuOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UsersRound className="w-3.5 h-3.5 text-primary-700" />
                    <span>تغییر نقش ({allPersonas.length} نقش)</span>
                  </span>
                  <span className="text-caption bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded font-bold">
                    {adaptedActive.name}
                  </span>
                </button>
              </div>

              {isInstallable && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowInstallGuide(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-primary-700" />
                      <span>نصب برنامه</span>
                    </span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'آیا مایلید تمام داده‌های تغییریافته و سفارش‌های ذخیره‌شده را پاک کرده و سامانه را به داده‌های اولیه بازگردانید؟'
                      )
                    ) {
                      clearPersistedState();
                    }
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                  title="پاکسازی LocalStorage و بازگشت به داده‌های پیش‌فرض"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>بازنشانی داده‌های نمونه</span>
                  </span>
                  {hasPersistedState() && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="داده‌های ذخیره‌شده محلی موجود است" />
                  )}
                </button>
              </div>

              {onSignOut && (
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5 ml-2" />
                    خروج از حساب کاربری
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
