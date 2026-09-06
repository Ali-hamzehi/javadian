import React, { useState } from 'react';
import {
  getDocumentBasedPersonas,
  getPersonasByCategory,
  PERSONA_CATEGORIES,
  PersonaCategory,
  DocumentBasedPersona,
} from '../../runtime/documentBasedPersonas';
import { MockPersona } from '../../types';
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  UsersRound,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  Truck,
  ShoppingBag,
  CreditCard,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Avatar } from '../design-system/Avatar';

interface LoginScreenProps {
  onLogin?: (persona: MockPersona) => void;
  onSelectPersona?: (persona: MockPersona) => void;
  sessionNotice?: { message: string; type?: 'info' | 'warning' | 'error' } | null;
}

const CATEGORY_ICONS: Record<PersonaCategory, React.ComponentType<{ className?: string }>> = {
  purchasing_logistics_warehouse: Truck,
  sales_distribution: ShoppingBag,
  finance_payments: CreditCard,
  management_hybrid: Building2,
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onSelectPersona,
  sessionNotice,
}) => {
  const handleUserSelect = onLogin || onSelectPersona || (() => {});

  const [authMode, setAuthMode] = useState<'demo_personas' | 'credentials'>('demo_personas');
  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<PersonaCategory | 'all'>('all');
  const [expandedPersonaIds, setExpandedPersonaIds] = useState<Set<string>>(new Set());

  const documentPersonas = getDocumentBasedPersonas();
  const categorizedPersonas = getPersonasByCategory();

  const togglePersonaExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPersonaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedInput = usernameOrId.trim().toLowerCase();
    if (!trimmedInput) {
      setErrorMessage('لطفاً نام کاربری، ایمیل سازمانی یا نام شخص مستند را وارد کنید.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    setIsLoading(true);

    // Simulate enterprise auth handshake
    setTimeout(() => {
      setIsLoading(false);

      // Find matching mock persona by username, employeeId, email, documented name, or shortDisplayName
      const matched = documentPersonas.find(
        (p) =>
          p.username.toLowerCase() === trimmedInput ||
          p.employeeId === trimmedInput ||
          (p.email && p.email.toLowerCase() === trimmedInput) ||
          p.name.toLowerCase().includes(trimmedInput) ||
          p.shortDisplayName.toLowerCase().includes(trimmedInput) ||
          (p.personaKey && p.personaKey.toLowerCase().includes(trimmedInput))
      );

      if (matched) {
        handleUserSelect(matched);
      } else {
        setErrorMessage(
          'نام کاربری یا رمز عبور اشتباه است. راهنما: نام‌هایی مثل «آرش»، «منتظری»، «نادری» یا نام‌های کاربری را وارد کنید.'
        );
      }
    }, 300);
  };

  return (
    <div className="login-screen min-h-dvh bg-slate-900 flex flex-col justify-between items-center p-4 sm:p-6 text-slate-800 relative select-none">
      {/* Top Bar / Prototype Notice */}
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 py-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary-700 flex items-center justify-center text-white font-black shadow-none text-sm">
            ج
          </div>
          <span className="text-xs font-bold text-slate-300">
            شرکت بازرگانی و توزیع محصولات غذایی جوادیان
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setAuthMode((prev) => (prev === 'demo_personas' ? 'credentials' : 'demo_personas'))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {authMode === 'demo_personas' ? (
              <>
                <KeyRound className="w-3.5 h-3.5 text-primary-400" />
                <span>ورود با شناسه و رمز عبور</span>
              </>
            ) : (
              <>
                <UsersRound className="w-3.5 h-3.5 text-primary-400" />
                <span>ورود نمایشی (پرسوناهای مستند)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl my-auto relative z-10 py-4">
        {authMode === 'demo_personas' ? (
          /* ========================================================================= */
          /* DEMO PERSONA SELECTION VIEW (DOCUMENT-BASED DIRECTORY)                   */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 backdrop-blur-md shadow-none text-right">
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="inline-flex items-center gap-2 text-primary-700 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>سامانه عملیات جوادیان — انتخاب هویت بر مبنای اسناد واقعی</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  انتخاب حساب کاربری دمو
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  ارتباط فرد، سمت، مسئولیت واقعی، مجوز و محدوده مجوز (Scope) بر اساس اسناد رسمی کسب‌وکار
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthMode('credentials')}
                  className="text-xs font-medium cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 ml-1 text-slate-500" />
                  <span>ورود دستی</span>
                </Button>
              </div>
            </div>

            {/* Session Notice Banner (Logout or Expired) */}
            {sessionNotice && (
              <div
                className={`my-3 p-3 rounded-xl border text-xs flex items-center gap-3 ${
                  sessionNotice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : sessionNotice.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-primary-50 border-primary-200 text-primary-900'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 shrink-0 ${
                    sessionNotice.type === 'warning'
                      ? 'text-amber-600'
                      : sessionNotice.type === 'error'
                      ? 'text-rose-600'
                      : 'text-primary-700'
                  }`}
                />
                <span className="font-medium">{sessionNotice.message}</span>
              </div>
            )}

            {/* Guidelines Banner */}
            <div className="my-3 p-3 bg-primary-50/70 border border-primary-200/80 rounded-xl text-xs text-primary-950 leading-relaxed flex items-start gap-2.5">
              <FileCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">راهنمای ارزیابی دمو: </span>
                افراد مستند (<span className="font-bold">آرش، آقای یوسفی، آقای منتظری، آقای نادری</span>) دارای صلاحیت‌ها و محدودیت‌های قطعی مستند هستند. سایر حساب‌های ضروری برای تکمیل سناریوهای دمو با برچسب <span className="font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">حساب نمایشی (Placeholder)</span> تفکیک شده‌اند.
              </div>
            </div>

            {/* 4 Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryTab === 'all'
                    ? 'bg-primary-700 text-white shadow-none'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>همه حساب‌ها</span>
                <span
                  className={`text-caption px-1.5 py-0.2 rounded-full ${
                    activeCategoryTab === 'all' ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {documentPersonas.length}
                </span>
              </button>

              {(Object.keys(PERSONA_CATEGORIES) as PersonaCategory[]).map((catKey) => {
                const meta = PERSONA_CATEGORIES[catKey];
                const count = (categorizedPersonas[catKey] || []).length;
                const isSelected = activeCategoryTab === catKey;
                const CatIcon = CATEGORY_ICONS[catKey] || Building2;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setActiveCategoryTab(catKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary-700 text-white shadow-none'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{meta.title}</span>
                    <span
                      className={`text-caption px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-primary-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Personas Directory by Category */}
            <div className="space-y-6 pt-3 max-h-[64vh] overflow-y-auto pr-1">
              {(Object.keys(PERSONA_CATEGORIES) as PersonaCategory[])
                .filter((catKey) => activeCategoryTab === 'all' || activeCategoryTab === catKey)
                .map((catKey) => {
                  const meta = PERSONA_CATEGORIES[catKey];
                  const personasInCat = categorizedPersonas[catKey] || [];
                  if (personasInCat.length === 0) return null;

                  const CategoryIcon = CATEGORY_ICONS[catKey] || Building2;

                  return (
                    <div key={catKey} className="space-y-2.5">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                          <CategoryIcon className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-xs font-black text-slate-800">{meta.title}</h2>
                        <span className="text-caption text-slate-500">— {meta.description}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {personasInCat.map((persona) => {
                          const isExpanded = expandedPersonaIds.has(persona.id);
                          const isDocumented = persona.isDocumentedPerson;

                          return (
                            <div
                              key={persona.id}
                              className={`rounded-xl border transition-all p-3.5 flex flex-col justify-between text-right ${
                                isDocumented
                                  ? 'bg-emerald-50/30 border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50/50'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                {/* Card Header: Avatar, Name, Status Badge */}
                                <div className="flex items-start justify-between gap-2.5 mb-2">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <Avatar
                                      src={persona.avatar}
                                      alt={persona.name}
                                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-300 shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="text-xs font-black text-slate-900 truncate">
                                          {persona.name}
                                        </h3>
                                        {isDocumented ? (
                                          <span className="text-caption px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                            شخص مستند در اسناد
                                          </span>
                                        ) : (
                                          <span className="text-caption px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-300">
                                            حساب نمایشی (Placeholder)
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-caption text-slate-600 font-medium truncate mt-0.5">
                                        {persona.documentedPosition}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity Scope */}
                                <div className="text-caption text-slate-700 bg-slate-100/70 p-2 rounded-lg mb-2">
                                  <span className="font-bold text-slate-800">محدوده فعالیت مستند: </span>
                                  <span>{persona.activityScope}</span>
                                </div>

                                {/* Demo Goal: What can be demoed? */}
                                <div className="text-caption text-primary-950 bg-primary-50/60 border border-primary-100 p-2 rounded-lg mb-2.5">
                                  <span className="font-bold text-primary-800">با این حساب چه چیزی را می‌توان دمو کرد؟ </span>
                                  <span>{persona.demoGoal}</span>
                                </div>

                                {/* Expandable Permissions & Scope Details */}
                                {isExpanded && (
                                  <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-2 text-caption animate-in fade-in duration-150">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                                      <div className="font-bold text-slate-800">مجوزها و محدودیت‌های این حساب:</div>
                                      <div>
                                        <span className="font-medium text-slate-600">رسید انبار: </span>
                                        <span>{persona.warehouseReceiptScope.description}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-slate-600">دستور پرداخت: </span>
                                        <span>{persona.paymentScope.description}</span>
                                      </div>
                                    </div>

                                    <div className="text-caption text-slate-500 flex items-center gap-1">
                                      <span className="font-bold">منبع استناد: </span>
                                      <span>{persona.documentedEvidenceSource}</span>
                                    </div>

                                    {persona.tbdNotes.length > 0 && (
                                      <div className="text-caption text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                                        <span className="font-bold">قاعده نمایشی — نیازمند تأیید کسب‌وکار: </span>
                                        <span>{persona.tbdNotes[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => togglePersonaExpanded(persona.id, e)}
                                  className="text-caption text-primary-700 hover:text-primary-800 font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'بستن جزئیات' : 'دسترسی‌های این حساب'}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <Button
                                  type="button"
                                  variant={isDocumented ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => handleUserSelect(persona)}
                                  className="text-caption h-8 px-3 font-bold cursor-pointer"
                                >
                                  <span>ورود با این حساب</span>
                                  <ArrowRight className="w-3 h-3 mr-1" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MANUAL CREDENTIAL LOGIN VIEW                                             */
          /* ========================================================================= */
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 backdrop-blur-md shadow-none text-right">
            {/* Header Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                ورود با نام کاربری و رمز عبور
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                ورود به سامانه با نام شخص مستند یا شناسه پرسنلی
              </p>
            </div>

            {/* Session Notice Banner */}
            {sessionNotice && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-3 ${
                  sessionNotice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : sessionNotice.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-primary-50 border-primary-200 text-primary-900'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 shrink-0 ${
                    sessionNotice.type === 'warning'
                      ? 'text-amber-600'
                      : sessionNotice.type === 'error'
                      ? 'text-rose-600'
                      : 'text-primary-700'
                  }`}
                />
                <span className="font-medium">{sessionNotice.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              {/* Error Banner */}
              {errorMessage && (
                <div
                  id="login-error"
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Username / Employee ID Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="usernameInput"
                  className="block text-xs font-bold text-slate-700"
                >
                  شناسه پرسنلی، نام کاربری یا نام شخص مستند
                </label>
                <div className="relative">
                  <input
                    id="usernameInput"
                    aria-invalid={!!errorMessage}
                    aria-describedby={errorMessage ? 'login-error' : undefined}
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={usernameOrId}
                    onChange={(e) => {
                      setUsernameOrId(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="مثال: آرش، منتظری، نادری، یوسفی یا admin"
                    className="w-full h-10 px-4 pr-10 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-right font-medium"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-caption text-slate-500">
                  راهنمای سریع: برای آرش <code className="text-primary-700 font-bold">آرش</code>، برای مدیرعامل <code className="text-primary-700 font-bold">منتظری</code>، برای قم <code className="text-primary-700 font-bold">نادری</code>
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="passwordInput"
                  className="block text-xs font-bold text-slate-700"
                >
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    id="passwordInput"
                    aria-invalid={!!errorMessage}
                    aria-describedby={errorMessage ? 'login-error' : undefined}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="رمز عبور خود را وارد کنید"
                    className="w-full h-10 px-10 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-right font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center h-10 font-bold text-xs cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? 'در حال بررسی هویت...' : 'ورود به سامانه'}
                </Button>
              </div>

              {/* Back to Demo Directory Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAuthMode('demo_personas')}
                  className="w-full justify-center h-10 font-bold text-xs text-primary-700 border-primary-300 bg-primary-50/50 hover:bg-primary-100/70 cursor-pointer"
                >
                  <UsersRound className="w-4 h-4 ml-1.5 text-primary-600" />
                  <span>بازگشت به فهرست پرسوناهای مستند دمو</span>
                </Button>
              </div>

              {/* Recovery Guidance */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-caption text-slate-500">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>فراموشی رمز یا مسدودی؟</span>
                </span>
                <span className="text-slate-600 font-medium">پشتیبانی فناوری و عملیات</span>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl py-3 text-center text-slate-300 text-caption relative z-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© ۱۴۰۴ سامانه عملیات و زنجیره تأمین جوادیان — نسخه پیش‌نمایش ارزیابی UI/UX</span>
        <span className="text-slate-300">طراحی مبتنی بر اسناد مستند کسب‌وکار و تفکیک وظایف</span>
      </footer>
    </div>
  );
};
