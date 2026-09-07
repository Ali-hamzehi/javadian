import React, { useState } from 'react';
import { MockPersona } from '../../types';
import { MOCK_PERSONAS } from '../../data/mockData';
import {
  ROLE_FILTER_TABS,
  CLEAN_ROLE_METAS,
  RoleFilterCategory,
} from './roleDisplayConfig';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Avatar } from '../design-system/Avatar';

interface LoginScreenProps {
  onLogin?: (persona: MockPersona) => void;
  onSelectPersona?: (persona: MockPersona) => void;
  sessionNotice?: { message: string; type?: 'info' | 'warning' | 'error' } | null;
}

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
  const [activeCategory, setActiveCategory] = useState<RoleFilterCategory>('all');
  const [expandedRoleIds, setExpandedRoleIds] = useState<Set<string>>(new Set());

  const toggleAccordion = (id: string) => {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = usernameOrId.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage('لطفاً نام کاربری یا شناسه پرسنلی را وارد کنید.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const matched = MOCK_PERSONAS.find(
        (p) =>
          p.username.toLowerCase() === trimmed ||
          p.employeeId.toLowerCase() === trimmed ||
          (p.email && p.email.toLowerCase() === trimmed) ||
          p.name.toLowerCase().includes(trimmed)
      );

      if (matched) {
        handleUserSelect(matched);
      } else {
        setErrorMessage('شناسه کاربری یا رمز عبور اشتباه است.');
      }
    }, 300);
  };

  const filteredPersonas = MOCK_PERSONAS.filter((p) => {
    const meta = CLEAN_ROLE_METAS[p.id];
    if (!meta) return true;
    if (activeCategory === 'all') return true;
    return meta.category === activeCategory;
  });

  return (
    <div className="login-screen min-h-dvh bg-slate-900 flex flex-col justify-between items-center p-3 sm:p-6 text-slate-800 relative select-none">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-3 py-2 relative z-10 border-b border-slate-800/80 pb-3">
        {/* Logo, System Name, Demo Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary-700 flex items-center justify-center text-white font-black text-sm shadow-sm">
            ج
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-100">
              سامانه عملیات جوادیان
            </span>
            <span className="text-caption px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              نسخه نمایشی
            </span>
          </div>
        </div>

        {/* Header Action: Switch Auth Mode */}
        <div>
          {authMode === 'demo_personas' ? (
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary-400" />
              <span>ورود با شناسه</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthMode('demo_personas')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
              <span>انتخاب نقش</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl my-auto relative z-10 py-4">
        {authMode === 'demo_personas' ? (
          /* ========================================================================= */
          /* ROLE SELECTION VIEW                                                       */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-none text-right">
            {/* Hero Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  انتخاب نقش برای ورود
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  برای مشاهده امکانات، یکی از نقش‌های زیر را انتخاب کنید.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthMode('credentials')}
                  className="text-xs font-medium cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 ml-1 text-slate-500" />
                  <span>ورود با شناسه</span>
                </Button>
              </div>
            </div>

            {/* Session Notice Banner */}
            {sessionNotice && (
              <div
                className={`my-3 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
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
                <span className="font-semibold">{sessionNotice.message}</span>
              </div>
            )}

            {/* 5 Filter Tabs */}
            <div className="flex items-center gap-1.5 py-3 border-b border-slate-100 overflow-x-auto">
              {ROLE_FILTER_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? MOCK_PERSONAS.length
                    : MOCK_PERSONAS.filter((p) => CLEAN_ROLE_METAS[p.id]?.category === tab.key).length;
                const isSelected = activeCategory === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-primary-700 text-white shadow-none'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
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

            {/* Role Cards Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
            <div className="pt-4 max-h-[66vh] overflow-y-auto pr-0.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPersonas.map((persona) => {
                  const meta = CLEAN_ROLE_METAS[persona.id];
                  const cleanName = meta?.name || persona.name;
                  const cleanJob = meta?.jobTitle || persona.jobTitle;
                  const isDocumented = meta?.isDocumented ?? false;
                  const isExpanded = expandedRoleIds.has(persona.id);

                  return (
                    <div
                      key={persona.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between text-right ${
                        isDocumented
                          ? 'bg-emerald-50/25 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Line 1: Avatar, Name, Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              src={persona.avatar}
                              alt={cleanName}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            />
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-slate-900 truncate">
                                {cleanName}
                              </h3>
                              <p className="text-caption text-slate-600 truncate mt-0.5">
                                {cleanJob}
                              </p>
                            </div>
                          </div>

                          {isDocumented ? (
                            <span className="text-caption px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shrink-0">
                              نقش سازمانی
                            </span>
                          ) : (
                            <span className="text-caption px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-300 shrink-0">
                              نقش نمونه
                            </span>
                          )}
                        </div>

                        {/* Lines 2 & 3: Exactly 2 Key Capabilities */}
                        {meta?.keyCapabilities && (
                          <div className="space-y-1 my-2 bg-slate-50/90 p-2 rounded-lg border border-slate-100 text-caption text-slate-700">
                            {meta.keyCapabilities.map((cap, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                                <span className="truncate">{cap}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Line 4 (Accordion if expanded): Access Summary */}
                        {isExpanded && meta?.accessSummary && (
                          <div className="my-2 p-2.5 bg-primary-50/70 rounded-lg border border-primary-100 text-caption text-primary-950 space-y-1 animate-in fade-in duration-150">
                            <span className="font-bold text-primary-900 block">
                              در این نقش می‌توانید:
                            </span>
                            <p className="text-slate-700 leading-relaxed text-caption">
                              {meta.accessSummary}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Line 5: Card Actions (مشاهده دسترسی‌ها + ورود) */}
                      <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAccordion(persona.id)}
                          className="text-caption text-slate-600 hover:text-primary-700 font-bold flex items-center gap-0.5 cursor-pointer py-1"
                        >
                          <span>مشاهده دسترسی‌ها</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUserSelect(persona)}
                          className="text-caption h-8 px-3.5 font-bold cursor-pointer"
                        >
                          <span>ورود</span>
                          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MANUAL CREDENTIAL LOGIN VIEW                                             */
          /* ========================================================================= */
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-none text-right">
            {/* Header Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">
                ورود با شناسه و رمز عبور
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                ورود به سامانه با نام کاربری یا شناسه پرسنلی
              </p>
            </div>

            {/* Session Notice Banner */}
            {sessionNotice && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
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
                <span className="font-semibold">{sessionNotice.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4 text-right">
              {/* Error Banner */}
              {errorMessage && (
                <div
                  id="login-error"
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Username Input - Generic clean placeholder */}
              <div className="space-y-1.5">
                <label
                  htmlFor="usernameInput"
                  className="block text-xs font-bold text-slate-700"
                >
                  شناسه یا نام کاربری
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
                    placeholder="نام کاربری یا کد پرسنلی"
                    className="w-full h-10 px-4 pr-10 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-right font-medium"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
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

              {/* Submit Button */}
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

              {/* Back to Role Selection Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAuthMode('demo_personas')}
                  className="w-full justify-center h-10 font-bold text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 ml-1.5 text-slate-500" />
                  <span>بازگشت به انتخاب نقش</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-2.5 text-center text-slate-400 text-caption relative z-10 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>© سامانه عملیات جوادیان — نسخه نمایشی</span>
      </footer>
    </div>
  );
};
