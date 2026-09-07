import { FieldGroup } from '../components/design-system/FieldGroup';
import React, { useState } from 'react';
import { Phone, MessageSquare, Send, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight, Plus, User, Search, ExternalLink, Mic, Image as ImageIcon, Repeat } from 'lucide-react';
import {
  MockPersona,
  ManualIntakeRecord,
  ManualIntakeChannel,
  IntakeResponsibleUnit,
  IntakeClassification,
  IntakePriority,
  IntakeState,
} from '../types';
import { MOCK_MANUAL_INTAKES } from '../data/mockOperationsPrompt4';
import { Button } from '../components/design-system/Button';
import { Modal } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { EmptyState } from '../components/design-system/SystemStates';
import { toPersianDigits } from '../utils/formatters';

interface ManualIntakeViewProps {
  activePersona: MockPersona;
  onNavigateToRoute?: (routeKey: string, recordId?: string) => void;
}

export const ManualIntakeView: React.FC<ManualIntakeViewProps> = ({
  activePersona,
  onNavigateToRoute,
}) => {
  const { addToast } = useToast();

  // State
  const [intakes, setIntakes] = useState<ManualIntakeRecord[]>(MOCK_MANUAL_INTAKES);
  const [selectedIntake, setSelectedIntake] = useState<ManualIntakeRecord | null>(null);

  // Filters
  const [filterState, setFilterState] = useState<IntakeState | 'all'>('all');
  const [filterChannel, setFilterChannel] = useState<ManualIntakeChannel | 'all'>('all');
  const [filterUnit, setFilterUnit] = useState<IntakeResponsibleUnit | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [conversionType, setConversionType] = useState<
    'sales_order' | 'followup' | 'payment_request' | 'supply_logistics' | 'general_task'
  >('sales_order');

  // New Intake Form State
  const [newChannel, setNewChannel] = useState<ManualIntakeChannel>('phone');
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderContact, setNewSenderContact] = useState('');
  const [newSenderCompany, setNewSenderCompany] = useState('');
  const [newOriginalRef, setNewOriginalRef] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newUnit, setNewUnit] = useState<IntakeResponsibleUnit>('sales');
  const [newClassification, setNewClassification] = useState<IntakeClassification>('price_inquiry');
  const [newPriority, setNewPriority] = useState<IntakePriority>('normal');
  const [newDueDate, setNewDueDate] = useState('۱۴۰۳/۰۸/۲۵');

  // Filtered List
  const filteredIntakes = intakes.filter((item) => {
    if (filterState !== 'all' && item.state !== filterState) return false;
    if (filterChannel !== 'all' && item.channel !== filterChannel) return false;
    if (filterUnit !== 'all' && item.responsibleUnit !== filterUnit) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(q);
      const matchSender = item.senderName.toLowerCase().includes(q);
      const matchCompany = item.senderCompany?.toLowerCase().includes(q) || false;
      const matchSummary = item.summary.toLowerCase().includes(q);
      if (!matchCode && !matchSender && !matchCompany && !matchSummary) return false;
    }
    return true;
  });

  const getChannelBadge = (ch: ManualIntakeChannel) => {
    switch (ch) {
      case 'phone':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
            <Phone className="w-3 h-3" />
            تماس تلفنی
          </span>
        );
      case 'whatsapp':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
            <MessageSquare className="w-3 h-3" />
            واتساپ
          </span>
        );
      case 'telegram':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            <Send className="w-3 h-3" />
            تلگرام
          </span>
        );
      case 'sms':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
            <MessageSquare className="w-3 h-3" />
            پیامک متنی
          </span>
        );
      case 'in_person':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            <User className="w-3 h-3" />
            مراجعه حضوری
          </span>
        );
      case 'paper_note':
        return (
          <span className="flex items-center gap-1 text-caption font-bold bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
            <FileText className="w-3 h-3" />
            یادداشت کاغذی
          </span>
        );
    }
  };

  const getStateBadge = (st: IntakeState) => {
    switch (st) {
      case 'unclassified':
        return (
          <span className="text-caption font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            صف دسته‌بندی‌نشده
          </span>
        );
      case 'triaged':
        return (
          <span className="text-caption font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ارجاع‌شده به مسئول
          </span>
        );
      case 'converted':
        return (
          <span className="text-caption font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            تبدیل‌شده به پرونده
          </span>
        );
      case 'duplicate':
        return (
          <span className="text-caption font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            پیام تکراری
          </span>
        );
      case 'archived':
        return <span className="text-caption font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">بایگانی</span>;
    }
  };

  const getPriorityBadge = (pr: IntakePriority) => {
    if (pr === 'urgent') return <span className="text-caption font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">فوری</span>;
    if (pr === 'high') return <span className="text-caption font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">مهم</span>;
    return <span className="text-caption text-slate-500">عادی</span>;
  };

  // Handlers
  const handleCreateIntake = () => {
    if (!newSenderName || !newSummary) {
      addToast('لطفاً نام فرستنده و خلاصه پیام را وارد کنید', { tone: 'destructive' });
      return;
    }

    const newCode = `INT-1403-0${Math.floor(82 + Math.random() * 15)}`;
    const newRecord: ManualIntakeRecord = {
      id: `intk-${Date.now()}`,
      code: newCode,
      channel: newChannel,
      senderName: newSenderName,
      senderContact: newSenderContact || 'ثبت دستی',
      senderCompany: newSenderCompany || undefined,
      receivedAtJalali: '۱۴۰۳/۰۸/۲۴',
      receivedAtTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      originalReference: newOriginalRef || 'ثبت مستقیم توسط اپراتور',
      summary: newSummary,
      attachments: [],
      responsibleUnit: newUnit,
      classification: newClassification,
      ownerName: activePersona.name,
      dueDateJalali: newDueDate,
      priority: newPriority,
      state: 'unclassified',
      traceLogs: [
        {
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          actorName: activePersona.name,
          action: 'ثبت اولیه پیام ورودی در صف تریاژ',
        },
      ],
    };

    setIntakes([newRecord, ...intakes]);
    setSelectedIntake(newRecord);
    setIsCreateModalOpen(false);

    // Reset fields
    setNewSenderName('');
    setNewSenderContact('');
    setNewSenderCompany('');
    setNewOriginalRef('');
    setNewSummary('');

    addToast(`پیام ورودی ${newCode} با موفقیت ثبت شد`, {
      description: 'در صف دسته‌بندی قرار گرفت و آماده ارجاع یا تبدیل است.',
      tone: 'success',
    });
  };

  const handleConvert = () => {
    if (!selectedIntake) return;

    let targetCode = '';
    let targetTitle = '';
    let targetRoute = '';

    if (conversionType === 'sales_order') {
      targetCode = `ORD-1403-${Math.floor(1000 + Math.random() * 8999)}`;
      targetTitle = `پیش‌نویس سفارش حاصل از پیام ${selectedIntake.code}`;
      targetRoute = 'sales_orders';
    } else if (conversionType === 'followup') {
      targetCode = `FLW-1403-${Math.floor(100 + Math.random() * 899)}`;
      targetTitle = `پیگیری مذاکره با ${selectedIntake.senderName}`;
      targetRoute = 'field_followups';
    } else if (conversionType === 'payment_request') {
      targetCode = `PAY-1403-${Math.floor(150 + Math.random() * 400)}`;
      targetTitle = `درخواست بررسی فیش واریزی ${selectedIntake.senderName}`;
      targetRoute = 'payment_requests';
    } else if (conversionType === 'supply_logistics') {
      targetCode = `LOG-1403-${Math.floor(50 + Math.random() * 90)}`;
      targetTitle = `اقدام ترابری و هماهنگی بارگیر`;
      targetRoute = 'logistics';
    } else {
      targetCode = `TSK-1403-${Math.floor(200 + Math.random() * 600)}`;
      targetTitle = `اقدام کاری: ${selectedIntake.summary.substring(0, 30)}...`;
      targetRoute = 'inbox';
    }

    const updatedIntake: ManualIntakeRecord = {
      ...selectedIntake,
      state: 'converted',
      convertedRecord: {
        type: conversionType,
        code: targetCode,
        title: targetTitle,
        routeKey: targetRoute,
        convertedAtJalali: '۱۴۰۳/۰۸/۲۴ - ۱۱:۳۰',
      },
      traceLogs: [
        ...selectedIntake.traceLogs,
        {
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          actorName: activePersona.name,
          action: `تبدیل ساخت‌یافته پیام به پرونده رسمی: ${targetCode}`,
        },
      ],
    };

    setIntakes((prev) => prev.map((item) => (item.id === selectedIntake.id ? updatedIntake : item)));
    setSelectedIntake(updatedIntake);
    setIsConvertModalOpen(false);

    addToast(`پیام به پرونده «${targetCode}» تبدیل شد`, {
      description: 'شناسه عطف، سابقه لاگ و ردیابی کامل ثبت گردید.',
      tone: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-primary-50 text-primary-700 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                ثبت تعاملات و پیام‌های ورودی
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                ثبت دستی تعاملات
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ثبت ساخت‌یافته پیام‌های تلفنی، واتساپ، تلگرام، پیامک، مراجعه حضوری و دست‌خط‌های اداری همراه با حفظ زنجیره
              عطف
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            ثبت تعامل جدید
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی کد، فرستنده، شرکت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* State Filter */}
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as any)}
            className="p-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="unclassified">صف دسته‌بندی‌نشده</option>
            <option value="triaged">ارجاع‌شده به مسئول</option>
            <option value="converted">تبدیل‌شده به پرونده</option>
            <option value="duplicate">پیام‌های تکراری</option>
          </select>

          {/* Channel Filter */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value as any)}
            className="p-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">همه کانال‌های ارتباطی</option>
            <option value="whatsapp">واتساپ</option>
            <option value="phone">تماس تلفنی</option>
            <option value="telegram">تلگرام</option>
            <option value="sms">پیامک متنی</option>
            <option value="in_person">مراجعه حضوری</option>
            <option value="paper_note">یادداشت کاغذی</option>
          </select>

          {/* Unit Filter */}
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value as any)}
            className="p-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">همه واحدهای مسئول</option>
            <option value="sales">واحد فروش</option>
            <option value="logistics">واحد لجستیک و حمل</option>
            <option value="finance">واحد مالی و خزانه‌داری</option>
            <option value="supply">واحد تأمین و انبار</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List and Detail Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Intake Items List */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{toPersianDigits(filteredIntakes.length)} پیام در صف</span>
            <span>مرتب‌سازی بر اساس زمان دریافت</span>
          </div>

          {filteredIntakes.length === 0 ? (
            <EmptyState
              title="پیامی با این مشخصات یافت نشد"
              description="فیلترهای جستجو، کانال یا واحد ارجاع را تغییر دهید یا پیام جدیدی از درگاه تلفن/پیام‌رسان ثبت نمایید."
              actionText="بازنشانی فیلترها"
              onAction={() => {
                setSearchQuery('');
                setFilterChannel('all');
                setFilterState('all');
                setFilterUnit('all');
              }}
            />
          ) : (
            filteredIntakes.map((item) => {
              const isSelected = selectedIntake?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIntake(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white text-xs space-y-2 ${
                    isSelected
                      ? 'border-primary-600 ring-2 ring-primary-600/20 shadow-none'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Header line */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getChannelBadge(item.channel)}
                      <span className="font-mono font-bold text-slate-900">{item.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      {getStateBadge(item.state)}
                    </div>
                  </div>

                  {/* Sender & Contact */}
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold">{item.senderName}</span>
                    {item.senderCompany && (
                      <span className="text-caption text-slate-500 font-normal">
                        {item.senderCompany}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-slate-600 text-caption line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Converted Pill if any */}
                  {item.convertedRecord && (
                    <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 text-caption flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        تبدیل‌شده به: <strong>{item.convertedRecord.code}</strong>
                      </span>
                      <span className="text-caption text-emerald-700 font-mono">
                        {item.convertedRecord.routeKey}
                      </span>
                    </div>
                  )}

                  {/* Duplicate note if any */}
                  {item.duplicateOfCode && (
                    <div className="p-1.5 bg-slate-100 text-slate-700 rounded text-caption flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-slate-500" />
                      پیام تکراری عطف به: <strong>{item.duplicateOfCode}</strong>
                    </div>
                  )}

                  {/* Footer line */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-caption text-slate-500">
                    <span>
                      دریافت: {item.receivedAtJalali} - {item.receivedAtTime}
                    </span>
                    <span>مسئول: {item.ownerName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Intake Detail & Actions */}
        <div className="lg:col-span-6 xl:col-span-7">
          {selectedIntake ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5 sticky top-20 shadow-none">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-slate-100 px-3 py-0.5 rounded text-slate-800">
                      {selectedIntake.code}
                    </span>
                    {getChannelBadge(selectedIntake.channel)}
                    {getStateBadge(selectedIntake.state)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedIntake.senderName}{' '}
                    {selectedIntake.senderCompany ? `• ${selectedIntake.senderCompany}` : ''}
                  </h3>
                </div>

                {/* Convert Button */}
                {selectedIntake.state !== 'converted' && selectedIntake.state !== 'duplicate' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsConvertModalOpen(true)}
                    leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    تبدیل به کار رسمی...
                  </Button>
                )}
              </div>

              {/* Conversion Lineage Trace if converted */}
              {selectedIntake.convertedRecord && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ردیابی عطف: پیام به پرونده رسمی تبدیل گردیده است
                    </span>
                    <span className="font-mono text-caption text-emerald-800">
                      {selectedIntake.convertedRecord.convertedAtJalali}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {selectedIntake.convertedRecord.code}: {selectedIntake.convertedRecord.title}
                      </span>
                      <span className="text-caption text-slate-500">
                        مسیر پرونده: {selectedIntake.convertedRecord.routeKey}
                      </span>
                    </div>
                    {onNavigateToRoute && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          onNavigateToRoute(
                            selectedIntake.convertedRecord!.routeKey,
                            selectedIntake.convertedRecord!.code
                          )
                        }
                        leftIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        مشاهده پرونده
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Sender & Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-500 block text-caption">مخاطب / فرستنده:</span>
                  <span className="font-bold text-slate-800">{selectedIntake.senderName}</span>
                  {selectedIntake.senderRole && (
                    <span className="text-slate-500 block text-caption">{selectedIntake.senderRole}</span>
                  )}
                  <div className="pt-1 flex items-center gap-1 text-primary-700 font-mono">
                    <Phone className="w-3 h-3" />
                    <span>{selectedIntake.senderContact}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-slate-500 block text-caption">ارجاع مبدأ (Original Reference):</span>
                  <span className="font-mono text-slate-800 text-caption block break-all">
                    {selectedIntake.originalReference}
                  </span>
                  <div className="pt-1 text-caption text-slate-500 flex items-center gap-2">
                    <span>زمان: {selectedIntake.receivedAtJalali}</span>
                    <span>ساعت: {selectedIntake.receivedAtTime}</span>
                  </div>
                </div>
              </div>

              {/* Content / Summary */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block">شرح کامل پیام یا تماس ثبت‌شده:</span>
                <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedIntake.summary}
                </div>
              </div>

              {/* Attachments Section */}
              {selectedIntake.attachments.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">پیوست‌ها و اسناد دریافتی:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedIntake.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {att.type === 'voice' ? (
                            <Mic className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : att.type === 'handwritten_invoice' ? (
                            <ImageIcon className="w-4 h-4 text-primary-700 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate font-medium text-slate-800">{att.name}</span>
                        </div>
                        <span className="text-caption text-slate-500 font-mono shrink-0">{att.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Metadata */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 block text-caption">واحد مسئول:</span>
                  <span className="font-bold text-slate-800">{selectedIntake.responsibleUnit}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">طبقه‌بندی:</span>
                  <span className="font-bold text-slate-800">{selectedIntake.classification}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">کارشناس اقدام:</span>
                  <span className="font-bold text-slate-800">{selectedIntake.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-caption">مهلت سررسید:</span>
                  <span className="font-bold text-rose-600 font-mono">{selectedIntake.dueDateJalali}</span>
                </div>
              </div>

              {/* Trace Audit Log */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">لاگ‌های ردگیری و ثبت اقدام (Trace Logs):</span>
                <div className="space-y-1">
                  {selectedIntake.traceLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-caption p-2 bg-slate-50 rounded text-slate-600"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        <span>{log.action}</span>
                        <span className="text-slate-500 font-medium">({log.actorName})</span>
                      </div>
                      <span className="font-mono text-caption text-slate-500">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              یک پیام ورودی را از لیست انتخاب کنید تا جزئیات و دکمه تبدیل آن نمایش داده شود.
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: CREATE MANUAL INTAKE ================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="ثبت دستی تماس یا پیام ورودی جدید"
        size="lg"
      >
        <div className="space-y-3.5 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
            <strong>نکته طراحی:</strong> این فرم به شما اجازه می‌دهد هرگونه دستور تلفنی، چت واتساپ، اس‌ام‌اس یا یادداشت
            کاغذی تحویل‌شده را به یک سند ساخت‌یافته درون‌سازمانی با ردیابی دقیق تبدیل کنید.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">کانال ارتباطی دریافتی:</label>
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="phone">تماس تلفنی مستقیم (Phone)</option>
                <option value="whatsapp">پیام‌رسان واتساپ (WhatsApp)</option>
                <option value="telegram">پیام‌رسان تلگرام (Telegram)</option>
                <option value="sms">پیامک متنی (SMS)</option>
                <option value="in_person">مراجعه حضوری به کارخانه یا دفتر</option>
                <option value="paper_note">یادداشت کاغذی / دست‌خط اداری</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">نام فرستنده یا تماس‌گیرنده:</label>
              <input
                type="text"
                placeholder="مثال: مهندس حسینی"
                value={newSenderName}
                onChange={(e) => setNewSenderName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">شماره تماس یا آی‌دی مخاطب:</label>
              <input
                type="text"
                placeholder="مثال: ۰۹۱۲..."
                value={newSenderContact}
                onChange={(e) => setNewSenderContact(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">نام شرکت یا طرف حساب (اختیاری):</label>
              <input
                type="text"
                placeholder="مثال: صنایع بتن زاینده‌رود"
                value={newSenderCompany}
                onChange={(e) => setNewSenderCompany(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <label className="block font-bold text-slate-700 mb-1">شناسه یا ارجاع اصلی (Original Reference):</label>
            <input
              type="text"
              placeholder="مثال: پیام صوتی واتساپ ساعت ۱۰:۱۵ یا دست‌نویس شماره ۴"
              value={newOriginalRef}
              onChange={(e) => setNewOriginalRef(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300"
            />
          </FieldGroup>

          <FieldGroup>
            <label className="block font-bold text-slate-700 mb-1">خلاصه پیام / شرح درخواست:</label>
            <textarea
              rows={3}
              placeholder="شرح دقیق نیاز، کالا، وزن، مهلت یا محتوای مکالمه..."
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300"
            />
          </FieldGroup>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">واحد مسئول رسیدگی:</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="sales">واحد فروش</option>
                <option value="logistics">واحد لجستیک و حمل</option>
                <option value="finance">واحد مالی و حسابداری</option>
                <option value="supply">واحد بازرگانی و تأمین</option>
                <option value="after_sales">پشتیبانی و خدمات</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">طبقه‌بندی موضوع:</label>
              <select
                value={newClassification}
                onChange={(e) => setNewClassification(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="price_inquiry">استعلام قیمت روز</option>
                <option value="new_order">سفارش خرید جدید</option>
                <option value="logistics_followup">پیگیری ارسال و ترابری</option>
                <option value="payment_slip">اعلام واریز وجه و فیش</option>
                <option value="quality_complaint">شکایت کیفی یا مغایرت</option>
                <option value="address_change">تغییر آدرس تخلیه</option>
                <option value="general_inquiry">موضوع عمومی / سایر</option>
              </select>
            </FieldGroup>

            <FieldGroup>
              <label className="block font-bold text-slate-700 mb-1">اولویت اقدام:</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="normal">عادی</option>
                <option value="high">مهم</option>
                <option value="urgent">فوری و اضطراری</option>
              </select>
            </FieldGroup>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              انصراف
            </Button>
            <Button size="sm" variant="primary" onClick={handleCreateIntake}>
              ثبت پیام در صف تریاژ
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: CONVERT TO STRUCTURED WORK ================= */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title={`تبدیل پیام ${selectedIntake?.code || ''} به کار ساخت‌یافته`}
        size="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            نوع سندی را که می‌خواهید از این پیام غیررسمی ایجاد شود انتخاب نمایید. پیوند عطف به صورت غیرقابل حذف ذخیره
            می‌گردد.
          </p>

          <div className="space-y-2">
            {[
              {
                type: 'sales_order',
                title: 'پیش‌نویس سفارش فروش (Sales Order Draft)',
                desc: 'ایجاد قرارداد و پیش‌فاکتور رسمی در کارتابل فروش',
              },
              {
                type: 'followup',
                title: 'اقدام پیگیری فروش و مذاکره (Follow-up)',
                desc: 'ثبت وظیفه تماس، جلسه یا ارسال نمونه در تقویم کارشناس',
              },
              {
                type: 'payment_request',
                title: 'درخواست / فیش پرداخت مالی (Payment Draft)',
                desc: 'ارجاع فیش یا مطالبه مالی به کارتابل خزانه‌داری',
              },
              {
                type: 'supply_logistics',
                title: 'درخواست تأمین یا اعزام باربری (Logistics Request)',
                desc: 'هماهنگی کامیون، ثبت بارنامه یا خرید مواد اولیه',
              },
              {
                type: 'general_task',
                title: 'وظیفه عمومی کارتابل (General Work Task)',
                desc: 'اقدام اجرایی داخلی با تعیین مهلت برای همکاران',
              },
            ].map((opt) => (
              <label
                key={opt.type}
                className={`p-3 rounded-lg border block cursor-pointer transition-colors ${
                  conversionType === opt.type
                    ? 'border-primary-600 bg-primary-50/60 text-primary-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="conversionType"
                    checked={conversionType === opt.type}
                    onChange={() => setConversionType(opt.type as any)}
                    className="w-4 h-4 text-primary-700"
                  />
                  <span>{opt.title}</span>
                </div>
                <p className="mt-1 text-caption text-slate-500 pr-6 font-normal">{opt.desc}</p>
              </label>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsConvertModalOpen(false)}>
              انصراف
            </Button>
            <Button size="sm" variant="primary" onClick={handleConvert}>
              تأیید و تولید پرونده رسمی
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
