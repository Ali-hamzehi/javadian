import { FieldGroup } from '../components/design-system/FieldGroup';
import { DialogSurface } from '../components/design-system/DialogSurface';
import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Phone, MapPin, Clock, AlertTriangle, UserCheck, Plus, Search, FileText, Receipt, Copy, Check, Truck, ShieldAlert, ChevronLeft, X, PhoneCall, MessageSquare, Users } from 'lucide-react';
import {
  CustomerRecord,
  CustomerPhone,
  CustomerLocation,
  CustomerInteraction,
  MockPersona,
  Person,
} from '../types';
import { mockSalesWarehouseStore } from '../runtime/workflow';
import { formatRials } from '../utils/formatters';
import { getPersonaDisplayName, stripRoleSampleSuffix } from '../runtime/documentBasedPersonas';

interface CustomersViewProps {
  activePersona: MockPersona;
  onNavigateToRoute: (routeKey: string, params?: Record<string, string>) => void;
  onShowToast: (title: string, tone?: 'success' | 'danger' | 'warning' | 'info', description?: string) => void;
  selectedCustomerId?: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  activePersona,
  onNavigateToRoute,
  onShowToast,
  selectedCustomerId,
}) => {
  // Subscribe to mock store
  const [customers, setCustomers] = useState<CustomerRecord[]>(() =>
    mockSalesWarehouseStore.getCustomers()
  );

  useEffect(() => {
    const unsub = mockSalesWarehouseStore.subscribe(() => {
      setCustomers(mockSalesWarehouseStore.getCustomers());
    });
    return unsub;
  }, []);

  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    if (selectedCustomerId && customers.some((c) => c.id === selectedCustomerId)) {
      return selectedCustomerId;
    }
    return customers[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'phones' | 'locations' | 'salespersons' | 'orders'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');

  // Modals state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showAddInteractionModal, setShowAddInteractionModal] = useState(false);
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDismissDuplicateModal, setShowDismissDuplicateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for New Customer
  const [newCustTradeName, setNewCustTradeName] = useState('');
  const [newCustOfficialName, setNewCustOfficialName] = useState('');
  const [newCustNationalId, setNewCustNationalId] = useState('');
  const [newCustEconomicCode, setNewCustEconomicCode] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustProvince, setNewCustProvince] = useState('تهران');
  const [newCustCity, setNewCustCity] = useState('تهران');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustPostalCode, setNewCustPostalCode] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(10000000000); // 10B Rials
  const [newCustSalespersonName, setNewCustSalespersonName] = useState(getPersonaDisplayName(activePersona));

  // Dynamic duplicate check warning during typing in New Customer modal
  const duplicateCheckResult = useMemo(() => {
    if (!showNewCustomerModal) return { hasConflict: false };
    if (!newCustPhone && !newCustMobile && !newCustNationalId && !newCustTradeName) {
      return { hasConflict: false };
    }
    return mockSalesWarehouseStore.checkDuplicateConflict({
      phone: newCustPhone,
      mobile: newCustMobile,
      nationalId: newCustNationalId,
      tradeName: newCustTradeName,
    });
  }, [showNewCustomerModal, newCustPhone, newCustMobile, newCustNationalId, newCustTradeName]);

  // Form state for New Interaction
  const [intType, setIntType] = useState<CustomerInteraction['type']>('call');
  const [intTitle, setIntTitle] = useState('');
  const [intSummary, setIntSummary] = useState('');
  const [intAmount, setIntAmount] = useState<number | undefined>(undefined);
  const [intRefCode, setIntRefCode] = useState('');

  // Form state for Phone
  const [phoneLabel, setPhoneLabel] = useState('دفتر مرکزی');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneContactPerson, setPhoneContactPerson] = useState('');
  const [phoneIsPrimary, setPhoneIsPrimary] = useState(false);
  const [phoneNotes, setPhoneNotes] = useState('');

  // Form state for Location
  const [locTitle, setLocTitle] = useState('انبار مرکزی تخلیه');
  const [locType, setLocType] = useState<'office' | 'warehouse' | 'delivery_site' | 'workshop'>('warehouse');
  const [locAddress, setLocAddress] = useState('');
  const [locPostalCode, setLocPostalCode] = useState('');
  const [locRecipientName, setLocRecipientName] = useState('');
  const [locRecipientPhone, setLocRecipientPhone] = useState('');

  // Form state for Reassign
  const [newSalespersonId, setNewSalespersonId] = useState('p-sales');
  const [reassignReason, setReassignReason] = useState('تغییر حوزه‌بندی استانی و مدیریت حساب‌های بزرگ');

  // Dismiss duplicate modal reason
  const [dismissReason, setDismissReason] = useState('بررسی شد؛ مشتری شعبه مستقل حقوقی است و شماره تماس موقت بوده است.');

  // Current active customer
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === activeCustomerId) || customers[0];
  }, [customers, activeCustomerId]);

  // Orders for current customer
  const customerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return mockSalesWarehouseStore
      .getSalesOrders()
      .filter((o) => o.customerId === activeCustomer.id);
  }, [activeCustomer, customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.tradeName.toLowerCase().includes(q) ||
        c.officialName.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.nationalId.includes(q) ||
        c.phone.includes(q) ||
        c.mobile.includes(q) ||
        c.city.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === 'duplicate') return c.isDuplicateFlagged;
      if (filterStatus === 'needs_review') return c.status === 'needs_review';
      if (filterStatus === 'active') return c.status === 'active';
      if (filterStatus === 'suspended') return c.status === 'suspended';

      return true;
    });
  }, [customers, searchQuery, filterStatus]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (!activeCustomer?.interactions) return [];
    if (timelineFilter === 'all') return activeCustomer.interactions;
    return activeCustomer.interactions.filter((i) => i.type === timelineFilter);
  }, [activeCustomer, timelineFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('کپی شد', 'info', text);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustTradeName.trim() || !newCustPhone.trim()) {
      onShowToast('خطا در ثبت', 'danger', 'وارد کردن نام تجاری و شماره تماس الزامی است.');
      return;
    }

    const created = mockSalesWarehouseStore.addCustomer({
      officialName: newCustOfficialName.trim() || newCustTradeName.trim(),
      tradeName: newCustTradeName.trim(),
      nationalId: newCustNationalId.trim() || '---',
      economicCode: newCustEconomicCode.trim() || '---',
      phone: newCustPhone.trim(),
      mobile: newCustMobile.trim() || newCustPhone.trim(),
      province: newCustProvince,
      city: newCustCity,
      creditLimitRials: newCustCreditLimit,
      openBalanceRials: 0,
      status: 'active',
      tags: ['مشتری جدید', 'روغن خوراکی'],
      assignedSalesperson: {
        id: activePersona.id,
        name: newCustSalespersonName,
        role: stripRoleSampleSuffix(activePersona.jobTitle),
        department: activePersona.department,
      },
      locations: [
        {
          id: `loc-${Date.now()}`,
          type: 'delivery_site',
          title: 'نشانی اصلی تحویل',
          address: newCustAddress.trim() || `${newCustCity}، آدرس اعلامی مشتری`,
          postalCode: newCustPostalCode.trim() || '---',
          recipientName: newCustTradeName,
          recipientPhone: newCustMobile || newCustPhone,
        },
      ],
    });

    onShowToast('پرونده مشتری ثبت شد', 'success', `پرونده «${created.tradeName}» با شناسه ${created.code} با موفقیت تشکیل شد.`);
    setShowNewCustomerModal(false);
    setActiveCustomerId(created.id);
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intTitle.trim() || !activeCustomer) return;

    const labels: Record<CustomerInteraction['type'], string> = {
      order: 'سفارش فروش',
      call: 'تماس تلفنی',
      visit: 'ویزیت حضوری',
      followup: 'پیگیری مطالبات',
      receipt: 'فیش واریزی',
      assignment: 'انتساب مسئولیت',
    };

    mockSalesWarehouseStore.addCustomerInteraction(activeCustomer.id, {
      type: intType,
      typeLabel: labels[intType],
      title: intTitle.trim(),
      summary: intSummary.trim() || intTitle.trim(),
      dateJalali: '۱۴۰۴/۰۶/۱۲',
      time: 'هم‌اکنون',
      actorName: getPersonaDisplayName(activePersona),
      actorRole: stripRoleSampleSuffix(activePersona.jobTitle),
      amountRials: intAmount,
      referenceCode: intRefCode.trim() || undefined,
      statusBadge:
        intType === 'receipt'
          ? { text: 'دریافت شد', tone: 'success' }
          : intType === 'order'
          ? { text: 'ثبت شد', tone: 'info' }
          : { text: 'انجام شد', tone: 'info' },
    });

    onShowToast('تعامل ثبت شد', 'success', `رویداد «${intTitle}» در خط زمانی پرونده مشتری ثبت گردید.`);
    setShowAddInteractionModal(false);
    setIntTitle('');
    setIntSummary('');
    setIntAmount(undefined);
    setIntRefCode('');
  };

  const handleAddPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !activeCustomer) return;

    mockSalesWarehouseStore.addCustomerPhone(activeCustomer.id, {
      label: phoneLabel.trim(),
      number: phoneNumber.trim(),
      isPrimary: phoneIsPrimary,
      contactPerson: phoneContactPerson.trim() || undefined,
      notes: phoneNotes.trim() || undefined,
    });

    onShowToast('شماره تماس افزوده شد', 'success', `شماره ${phoneNumber} به دفترچه تلفن مشتری اضافه گردید.`);
    setShowAddPhoneModal(false);
    setPhoneNumber('');
    setPhoneContactPerson('');
    setPhoneNotes('');
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locAddress.trim() || !activeCustomer) return;

    mockSalesWarehouseStore.addCustomerLocation(activeCustomer.id, {
      title: locTitle.trim(),
      type: locType,
      address: locAddress.trim(),
      postalCode: locPostalCode.trim() || undefined,
      recipientName: locRecipientName.trim() || activeCustomer.tradeName,
      recipientPhone: locRecipientPhone.trim() || activeCustomer.phone,
    });

    onShowToast('نشانی جدید ثبت شد', 'success', `نشانی «${locTitle}» به پایگاه‌های تحویل مشتری اضافه گردید.`);
    setShowAddLocationModal(false);
    setLocAddress('');
    setLocPostalCode('');
    setLocRecipientName('');
    setLocRecipientPhone('');
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;

    const salespersonsMap: Record<string, Person> = {
      'p-sales': {
        id: 'p-sales',
        name: 'کارشناس فروش',
        role: 'کارشناس فروش',
        department: 'فروش و بازرگانی',
      },
      'p-field-sales': {
        id: 'p-field-sales',
        name: 'آقای نادری',
        role: 'مسئول فروش مویرگی استان قم',
        department: 'فروش مویرگی',
      },
      'p-comm-approver': {
        id: 'p-comm-approver',
        name: 'تأییدکننده بازرگانی',
        role: 'تأییدکننده بازرگانی',
        department: 'مدیریت بازرگانی',
      },
    };

    const targetPerson = salespersonsMap[newSalespersonId] || salespersonsMap['p-sales'];

    mockSalesWarehouseStore.reassignSalesperson(
      activeCustomer.id,
      targetPerson,
      reassignReason.trim(),
      getPersonaDisplayName(activePersona)
    );

    onShowToast(
      'مسئول فروش تغییر یافت',
      'success',
      `پرونده «${activeCustomer.tradeName}» به «${targetPerson.name}» واگذار شد و تاریخچه ثبت گردید.`
    );
    setShowReassignModal(false);
  };

  const handleDismissDuplicate = () => {
    if (!activeCustomer) return;
    mockSalesWarehouseStore.dismissDuplicateWarning(activeCustomer.id, dismissReason);
    onShowToast('هشدار تکراری برطرف شد', 'info', 'وضعیت عدم تعارض پرونده به ثبت رسید.');
    setShowDismissDuplicateModal(false);
  };

  return (
    <div id="customers-crm-view" className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                پرونده ۳۶۰ درجه مشتریان و CRM بازرگانی
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                مدیریت متمرکز خریداران، تماس‌ها، ویزیت‌ها، دفاتر تحویل، خط اعتباری و سابقه سفارشات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-create-customer"
            onClick={() => setShowNewCustomerModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تشکیل پرونده مشتری جدید
          </button>
        </div>
      </div>

      {/* Main Grid: Left Directory, Right 360 Customer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="customer-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام مشتری، کد، شماره..."
                className="w-full pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({customers.length})
              </button>
              <button
                onClick={() => setFilterStatus('duplicate')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  filterStatus === 'duplicate'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                هشدار تکراری (
                {customers.filter((c) => c.isDuplicateFlagged).length}
                )
              </button>
              <button
                onClick={() => setFilterStatus('needs_review')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterStatus === 'needs_review'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                نیازمند بررسی
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterStatus === 'active'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                فعال
              </button>
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-0.5">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">مشتری با این مشخصات یافت نشد</p>
                <p className="text-xs text-slate-500 mt-1">
                  عبارت دیگری را جستجو کنید یا فیلتر را تغییر دهید.
                </p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === activeCustomerId;
                const creditRatio = Math.min(
                  100,
                  Math.round((cust.openBalanceRials / cust.creditLimitRials) * 100)
                );

                return (
                  <div
                    key={cust.id}
                    id={`customer-card-${cust.id}`}
                    onClick={() => setActiveCustomerId(cust.id)}
                    className={`bg-white rounded-xl p-4 border transition-all cursor-pointer text-right relative ${
                      isSelected
                        ? 'border-emerald-500 shadow-none ring-1 ring-emerald-500/20 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm truncate">
                            {cust.tradeName}
                          </span>
                          <span className="text-caption font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cust.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {cust.city} — {cust.officialName}
                        </p>
                      </div>

                      {cust.isDuplicateFlagged && (
                        <span
                          title="هشدار پرونده تکراری یا تطبیق شماره"
                          className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-caption font-medium border border-amber-300"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          تکراری
                        </span>
                      )}
                    </div>

                    {/* Salesperson & Phone */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {cust.assignedSalesperson.name}
                      </span>
                      <span className="font-mono text-slate-600 text-caption">
                        {cust.mobile || cust.phone}
                      </span>
                    </div>

                    {/* Credit Bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-caption text-slate-500 mb-1">
                        <span>اعتبار مصرف‌شده:</span>
                        <span
                          className={`font-medium ${
                            creditRatio > 85 ? 'text-rose-600 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {creditRatio}٪
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            creditRatio > 85
                              ? 'bg-rose-500'
                              : creditRatio > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${creditRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 360 Customer Profile View (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeCustomer ? (
            <>
              {/* Duplicate Warning Banner if Flagged */}
              {activeCustomer.isDuplicateFlagged && (
                <div
                  id="duplicate-warning-banner"
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-amber-900 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        هشدار تطبیق تکراری (Duplicate Check Warning)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {activeCustomer.duplicateConflictNote ||
                          'شماره تلفن یا شناسه ملی این مشتری با پرونده دیگری همپوشانی دارد. لطفاً پیش از ثبت حواله خروج یا اعطای اعتبار مضاعف، تفکیک یا ادغام حساب را بررسی فرمایید.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-dismiss-duplicate"
                      onClick={() => setShowDismissDuplicateModal(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      تأیید اصالت و رفع هشدار
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Hero Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-800">
                        {activeCustomer.tradeName}
                      </h2>
                      <span className="font-mono text-xs px-3 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        {activeCustomer.code}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          activeCustomer.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : activeCustomer.status === 'needs_review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {activeCustomer.status === 'active'
                          ? 'پرونده فعال'
                          : activeCustomer.status === 'needs_review'
                          ? 'نیازمند بررسی تجاری'
                          : 'تعلیق موقت تحویل'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      نام رسمی ثبتی: {activeCustomer.officialName}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {activeCustomer.province}، {activeCustomer.city}
                      </span>
                      <span>شناسه ملی: <strong className="font-mono">{activeCustomer.nationalId}</strong></span>
                      {activeCustomer.economicCode && (
                        <span>کد اقتصادی: <strong className="font-mono">{activeCustomer.economicCode}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="btn-create-order-for-customer"
                      onClick={() =>
                        onNavigateToRoute('sales', {
                          preselectedCustomerId: activeCustomer.id,
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ثبت سفارش جدید
                    </button>
                    <button
                      id="btn-add-interaction"
                      onClick={() => setShowAddInteractionModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      ثبت تماس / فیش / پیگیری
                    </button>
                    <button
                      id="btn-reassign-salesperson"
                      onClick={() => setShowReassignModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      تغییر مسئول فروش
                    </button>
                  </div>
                </div>

                {/* Financial & Responsibility Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">سقف اعتباری مجاز</span>
                    <div className="mt-1">
                      <span className="text-sm font-bold text-slate-800 font-mono block">
                        {formatRials(activeCustomer.creditLimitRials)}
                      </span>
                      <span className="text-caption text-slate-500 block mt-0.5">
                        (معادل {(activeCustomer.creditLimitRials / 10000000).toLocaleString('fa-IR')} میلیون تومان)
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">مانده بدهی جاری (اسناد باز)</span>
                    <div className="mt-1">
                      <span className="text-sm font-bold text-amber-700 font-mono block">
                        {formatRials(activeCustomer.openBalanceRials)}
                      </span>
                      <span className="text-caption text-slate-500 block mt-0.5">
                        (معادل {(activeCustomer.openBalanceRials / 10000000).toLocaleString('fa-IR')} میلیون تومان)
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 block">مسئول مستقیم فروش</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {activeCustomer.assignedSalesperson.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {activeCustomer.assignedSalesperson.name}
                        </span>
                        <span className="text-caption text-slate-500">
                          {activeCustomer.assignedSalesperson.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tab Navigation Header */}
                <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
                  <button
                    id="tab-timeline"
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'timeline'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    خط زمانی تعاملات و CRM
                    <span className="px-1.5 py-0.5 rounded-full text-caption bg-slate-100 text-slate-600 font-mono">
                      {activeCustomer.interactions?.length || 0}
                    </span>
                  </button>

                  <button
                    id="tab-phones"
                    onClick={() => setActiveTab('phones')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'phones'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    دفترچه شماره‌های تماس
                    <span className="px-1.5 py-0.5 rounded-full text-caption bg-slate-100 text-slate-600 font-mono">
                      {activeCustomer.phones?.length || 1}
                    </span>
                  </button>

                  <button
                    id="tab-locations"
                    onClick={() => setActiveTab('locations')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'locations'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    نشانی‌ها و پایگاه‌های تحویل
                    <span className="px-1.5 py-0.5 rounded-full text-caption bg-slate-100 text-slate-600 font-mono">
                      {activeCustomer.locations?.length || 1}
                    </span>
                  </button>

                  <button
                    id="tab-salespersons"
                    onClick={() => setActiveTab('salespersons')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'salespersons'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    تاریخچه انتساب مسئولین فروش
                    <span className="px-1.5 py-0.5 rounded-full text-caption bg-slate-100 text-slate-600 font-mono">
                      {activeCustomer.salespersonHistory?.length || 1}
                    </span>
                  </button>

                  <button
                    id="tab-orders"
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'orders'
                        ? 'border-emerald-600 text-emerald-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    سفارشات فروش
                    <span className="px-1.5 py-0.5 rounded-full text-caption bg-slate-100 text-slate-600 font-mono">
                      {customerOrders.length}
                    </span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-5">
                  {/* TAB 1: CRM Timeline */}
                  {activeTab === 'timeline' && (
                    <div className="space-y-4">
                      {/* Timeline filter chips */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            onClick={() => setTimelineFilter('all')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'all'
                                ? 'bg-slate-800 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            همه تعاملات
                          </button>
                          <button
                            onClick={() => setTimelineFilter('order')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'order'
                                ? 'bg-emerald-600 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            سفارشات
                          </button>
                          <button
                            onClick={() => setTimelineFilter('call')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'call'
                                ? 'bg-blue-600 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            تماس‌ها
                          </button>
                          <button
                            onClick={() => setTimelineFilter('visit')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'visit'
                                ? 'bg-primary-700 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ویزیت‌ها
                          </button>
                          <button
                            onClick={() => setTimelineFilter('receipt')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'receipt'
                                ? 'bg-amber-600 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            فیش‌های واریزی
                          </button>
                          <button
                            onClick={() => setTimelineFilter('followup')}
                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                              timelineFilter === 'followup'
                                ? 'bg-rose-600 text-white font-medium'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            پیگیری مطالبات
                          </button>
                        </div>

                        <button
                          onClick={() => setShowAddInteractionModal(true)}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ثبت تعامل جدید
                        </button>
                      </div>

                      {/* Timeline Events Feed */}
                      <div className="relative border-r-2 border-slate-200 pr-6 space-y-6 mr-3">
                        {filteredTimeline.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-xs">
                            هیچ رکوردی در این دسته‌بندی یافت نشد.
                          </div>
                        ) : (
                          filteredTimeline.map((item) => {
                            const typeColors: Record<string, { bg: string; text: string; icon: any }> = {
                              order: { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: FileText },
                              call: { bg: 'bg-blue-500', text: 'text-blue-700', icon: PhoneCall },
                              visit: { bg: 'bg-primary-500', text: 'text-primary-700', icon: Users },
                              receipt: { bg: 'bg-amber-500', text: 'text-amber-700', icon: Receipt },
                              followup: { bg: 'bg-rose-500', text: 'text-rose-700', icon: Clock },
                              assignment: { bg: 'bg-slate-500', text: 'text-slate-700', icon: UserCheck },
                            };

                            const conf = typeColors[item.type] || typeColors.call;
                            const IconComponent = conf.icon;

                            return (
                              <div key={item.id} className="relative group">
                                {/* Bullet */}
                                <div
                                  className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${conf.bg}`}
                                />

                                {/* Event Card */}
                                <div className="bg-slate-50/80 hover:bg-slate-100/70 transition-colors p-4 rounded-xl border border-slate-200/80">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-caption font-bold px-2 py-0.5 rounded ${conf.text} bg-white border border-slate-200`}
                                      >
                                        {item.typeLabel}
                                      </span>
                                      <h4 className="text-sm font-bold text-slate-800">
                                        {item.title}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <span>{item.dateJalali}</span>
                                      {item.time && <span>- ساعت {item.time}</span>}
                                      {item.statusBadge && (
                                        <span
                                          className={`px-2 py-0.5 rounded text-caption font-medium ${
                                            item.statusBadge.tone === 'success'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : item.statusBadge.tone === 'danger'
                                              ? 'bg-rose-100 text-rose-800'
                                              : item.statusBadge.tone === 'warning'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}
                                        >
                                          {item.statusBadge.text}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                    {item.summary}
                                  </p>

                                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <span>ثبت‌کننده:</span>
                                      <strong className="text-slate-700">{item.actorName}</strong>
                                      {item.actorRole && <span>({item.actorRole})</span>}
                                    </span>

                                    {item.amountRials && (
                                      <span className="font-mono font-bold text-emerald-700">
                                        مبلغ: {formatRials(item.amountRials)}
                                        <span className="text-caption text-slate-500 font-normal mr-1">
                                          (معادل {(item.amountRials / 10000000).toLocaleString('fa-IR')} میلیون تومان)
                                        </span>
                                      </span>
                                    )}

                                    {item.linkRoute && (
                                      <button
                                        onClick={() =>
                                          onNavigateToRoute(
                                            item.linkRoute!,
                                            item.linkId ? { orderId: item.linkId } : undefined
                                          )
                                        }
                                        className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        مشاهده جزئیات
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Phone Numbers */}
                  {activeTab === 'phones' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            دفترچه شماره‌های تماس و مسئولان ارتباطی
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            شماره‌های ثابت، همراه مدیر بازرگانی، بارانداز و امور مالی
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddPhoneModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          افزودن شماره تماس
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(activeCustomer.phones || []).map((ph) => (
                          <div
                            key={ph.id}
                            className={`p-4 rounded-xl border transition-all ${
                              ph.isPrimary
                                ? 'bg-emerald-50/20 border-emerald-300'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-800">
                                    {ph.label}
                                  </h4>
                                  {ph.isPrimary && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-caption font-bold">
                                      شماره اصلی
                                    </span>
                                  )}
                                </div>
                                {ph.contactPerson && (
                                  <p className="text-xs text-slate-600 mt-1 font-medium">
                                    شخص پاسخگو: {ph.contactPerson}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => copyToClipboard(ph.number, ph.id)}
                                title="کپی شماره"
                                className="p-1.5 text-slate-500 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                               aria-label="کپی شماره">
                                {copiedId === ph.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-mono text-sm font-bold text-slate-800 tracking-wider dir-ltr text-right">
                                {ph.number}
                              </span>
                              {ph.notes && (
                                <span className="text-caption text-slate-500 truncate max-w-[180px]">
                                  {ph.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Delivery Locations */}
                  {activeTab === 'locations' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            نشانی‌ها، باراندازها و پایگاه‌های تخلیه کالا
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            مقاصد رسمی جهت ثبت حواله خروج انبار و صدور بارنامه حمل
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddLocationModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          افزودن نشانی جدید
                        </button>
                      </div>

                      <div className="space-y-3">
                        {activeCustomer.locations.map((loc) => (
                          <div
                            key={loc.id}
                            className="bg-slate-50/70 p-4 rounded-xl border border-slate-200"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                                  <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-800">
                                      {loc.title}
                                    </h4>
                                    <span className="text-caption px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                      {loc.type === 'warehouse'
                                        ? 'انبار کالا'
                                        : loc.type === 'office'
                                        ? 'دفتر مرکزی'
                                        : 'بارانداز هایپرمارکت'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {loc.address}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => copyToClipboard(loc.address, loc.id)}
                                title="کپی نشانی"
                                className="p-1.5 text-slate-500 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                               aria-label="کپی نشانی">
                                {copiedId === loc.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                              <span>
                                کد پستی ۱۰ رقمی:{' '}
                                <strong className="font-mono text-slate-700">
                                  {loc.postalCode || '---'}
                                </strong>
                              </span>
                              <span>
                                تحویل‌گیرنده:{' '}
                                <strong className="text-slate-700">
                                  {loc.recipientName} ({loc.recipientPhone})
                                </strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Salesperson History */}
                  {activeTab === 'salespersons' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            تاریخچه انتساب کارشناسان و مسئولین فروش
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ردیابی شفاف مسئول پرونده در هر دوره زمانی بر اساس دستورالعمل حاکمیت داده
                          </p>
                        </div>
                        <button
                          onClick={() => setShowReassignModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          تغییر کارشناس مسئول
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(activeCustomer.salespersonHistory || []).map((sh, idx) => {
                          const isCurrent = idx === 0 && !sh.unassignedAtJalali;

                          return (
                            <div
                              key={sh.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isCurrent
                                  ? 'bg-emerald-50/20 border-emerald-300'
                                  : 'bg-slate-50/70 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                      isCurrent
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {sh.salesperson.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-slate-800">
                                        {sh.salesperson.name}
                                      </h4>
                                      {isCurrent ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-caption font-bold">
                                          مسئول فعلی پرونده
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-caption">
                                          دوره گذشته
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {sh.salesperson.role} ({sh.salesperson.department})
                                    </p>
                                  </div>
                                </div>

                                <div className="text-left text-xs text-slate-500">
                                  <span>تاریخ تخصیص: </span>
                                  <strong className="text-slate-700">{sh.assignedAtJalali}</strong>
                                  {sh.unassignedAtJalali && (
                                    <div>
                                      <span>پایان مسئولیت: </span>
                                      <strong className="text-slate-700">{sh.unassignedAtJalali}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                                <span>
                                  تخصیص‌دهنده: <strong>{sh.assignedBy}</strong>
                                </span>
                                {sh.reason && (
                                  <span className="text-slate-500">علت: {sh.reason}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Orders */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            سفارشات ثبت‌شده برای این مشتری
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            فهرست سفارشات، شرایط پرداخت، وضعیت تأیید تجاری و حواله انبار
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            onNavigateToRoute('sales', {
                              preselectedCustomerId: activeCustomer.id,
                            })
                          }
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ثبت سفارش جدید
                        </button>
                      </div>

                      {customerOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          تاکنون سفارشی برای این مشتری در سامانه ثبت نشده است.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {customerOrders.map((ord) => (
                            <div
                              key={ord.id}
                              className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                      {ord.code}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-md">
                                      {ord.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    کانال: {ord.channelLabel} | ثبت‌کننده: {ord.createdByName}
                                  </p>
                                </div>

                                <div className="text-left">
                                  <span
                                    className={`px-3 py-1 rounded text-xs font-semibold inline-block ${
                                      ord.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ord.status === 'needs_price_approval'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {ord.statusLabel}
                                  </span>
                                  <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                                    {formatRials(ord.totalAmountRials)}
                                    <span className="text-caption text-slate-500 font-normal block">
                                      (معادل {(ord.totalAmountRials / 10000000).toLocaleString('fa-IR')} میلیون تومان)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                                <span>اقلام: {ord.items.length} ردیف روغن خوراکی</span>
                                <button
                                  onClick={() =>
                                    onNavigateToRoute('sales', { orderId: ord.id })
                                  }
                                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  مشاهده سفارش در ماژول فروش
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">یک مشتری را انتخاب نمایید</h3>
              <p className="text-xs text-slate-500 mt-1">
                برای مشاهده پرونده ۳۶۰ درجه، سوابق تماس، ویزیت‌ها و دفاتر تحویل از ستون راست انتخاب نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: New Customer Modal */}
      {showNewCustomerModal && (
        <DialogSurface isOpen onClose={() => setShowNewCustomerModal(false)} title="تشکیل پرونده مشتری جدید" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  تشکیل پرونده مشتری جدید (ثبت اطلاعات CRM)
                </h3>
              </div>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Duplicate Alert Box */}
            {duplicateCheckResult.hasConflict && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">هشدار بررسی پرونده تکراری:</strong>
                  <p className="mt-0.5 leading-relaxed">{duplicateCheckResult.conflictReason}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    نام تجاری / تابلوی فروشگاه یا شرکت *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustTradeName}
                    onChange={(e) => setNewCustTradeName(e.target.value)}
                    placeholder="مانند: فروشگاه‌های زنجیره‌ای افق"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    نام رسمی و ثبتی (طبق روزنامه رسمی)
                  </label>
                  <input
                    type="text"
                    value={newCustOfficialName}
                    onChange={(e) => setNewCustOfficialName(e.target.value)}
                    placeholder="شرکت پیشگامان بازرگانی پارس (سهامی خاص)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    شماره تلفن ثابت دفتر مرکزی *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="۰۲۱-۸۸۸۸۴۴۰۰"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    شماره همراه مسئول خرید / مدیر
                  </label>
                  <input
                    type="text"
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    placeholder="۰۹۱۲-۳۴۵-۶۷۸۹"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    شناسه ملی / کد ملی خریدار
                  </label>
                  <input
                    type="text"
                    value={newCustNationalId}
                    onChange={(e) => setNewCustNationalId(e.target.value)}
                    placeholder="۱۰۱۰۲۸۴۷۱۵۰"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    کد اقتصادی
                  </label>
                  <input
                    type="text"
                    value={newCustEconomicCode}
                    onChange={(e) => setNewCustEconomicCode(e.target.value)}
                    placeholder="۴۱۱۳-۸۷۲۱-۹۹۰۱"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">استان</label>
                  <select
                    value={newCustProvince}
                    onChange={(e) => setNewCustProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="مرکزی">مرکزی</option>
                    <option value="البرز">البرز</option>
                    <option value="فارس">فارس</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                  </select>
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">شهر</label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="تهران / کرج / اصفهان..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </FieldGroup>
              </div>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">
                  نشانی بارانداز و انبار تخلیه کالا
                </label>
                <textarea
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="خیابان، پلاک، نام انبار یا مرکز توزیع..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">کد پستی ۱۰ رقمی</label>
                  <input
                    type="text"
                    value={newCustPostalCode}
                    onChange={(e) => setNewCustPostalCode(e.target.value)}
                    placeholder="۱۹۹۱۸۴۷۱۲۳"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>

                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">
                    سقف اعتباری اولیه (ریال)
                  </label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
                    step={1000000000}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  تأیید و تشکیل پرونده
                </button>
              </div>
            </form>
          </div>
        </DialogSurface>
      )}

      {/* MODAL 2: Add CRM Interaction (Call, Visit, Receipt, Follow-up) */}
      {showAddInteractionModal && activeCustomer && (
        <DialogSurface isOpen onClose={() => setShowAddInteractionModal(false)} title="ثبت تعامل جدید" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                ثبت تعامل جدید برای «{activeCustomer.tradeName}»
              </h3>
              <button
                onClick={() => setShowAddInteractionModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInteraction} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع تعامل</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'call', label: 'تماس تلفنی' },
                    { id: 'visit', label: 'ویزیت حضوری' },
                    { id: 'receipt', label: 'فیش واریزی' },
                    { id: 'followup', label: 'پیگیری مطالبات' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setIntType(t.id as any)}
                      className={`py-2 text-center rounded-lg border font-medium cursor-pointer ${
                        intType === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">عنوان خلاصه رویداد *</label>
                <input
                  type="text"
                  required
                  value={intTitle}
                  onChange={(e) => setIntTitle(e.target.value)}
                  placeholder="مانند: مذاکره تلفنی پیرامون سفارش پارت جدید روغن سرخ‌کردنی"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">شرح و جزئیات</label>
                <textarea
                  rows={3}
                  value={intSummary}
                  onChange={(e) => setIntSummary(e.target.value)}
                  placeholder="شرح گفتگو، توافقات یا نکات مهم پیرامون پرونده..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              {intType === 'receipt' && (
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup>
                    <label className="block font-bold text-slate-700 mb-1">مبلغ واریز (ریال)</label>
                    <input
                      type="number"
                      value={intAmount || ''}
                      onChange={(e) => setIntAmount(Number(e.target.value))}
                      placeholder="۵۰۰۰۰۰۰۰۰۰"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <label className="block font-bold text-slate-700 mb-1">شماره پیگیری فیش</label>
                    <input
                      type="text"
                      value={intRefCode}
                      onChange={(e) => setIntRefCode(e.target.value)}
                      placeholder="RCP-1404-..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                    />
                  </FieldGroup>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInteractionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  ثبت در خط زمانی
                </button>
              </div>
            </form>
          </div>
        </DialogSurface>
      )}

      {/* MODAL 3: Add Phone Modal */}
      {showAddPhoneModal && activeCustomer && (
        <DialogSurface isOpen onClose={() => setShowAddPhoneModal(false)} title="افزودن شماره تماس" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">افزودن شماره تماس جدید</h3>
              <button
                onClick={() => setShowAddPhoneModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhone} className="space-y-4 mt-4 text-xs">
              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">عنوان / بخش *</label>
                <input
                  type="text"
                  required
                  value={phoneLabel}
                  onChange={(e) => setPhoneLabel(e.target.value)}
                  placeholder="مانند: انبار کهریزک، مدیر خرید، حسابداری"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">شماره تلفن / همراه *</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="۰۲۱-۸۸۸۸۲۲۱۱ یا ۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                />
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">نام شخص پاسخگو</label>
                <input
                  type="text"
                  value={phoneContactPerson}
                  onChange={(e) => setPhoneContactPerson(e.target.value)}
                  placeholder="آقای احمدی (سرپرست بارانداز)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-primary-phone"
                  checked={phoneIsPrimary}
                  onChange={(e) => setPhoneIsPrimary(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="chk-primary-phone" className="text-xs text-slate-700 cursor-pointer">
                  به عنوان شماره تماس اصلی پرونده انتخاب شود
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPhoneModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  ثبت شماره
                </button>
              </div>
            </form>
          </div>
        </DialogSurface>
      )}

      {/* MODAL 4: Add Location Modal */}
      {showAddLocationModal && activeCustomer && (
        <DialogSurface isOpen onClose={() => setShowAddLocationModal(false)} title="افزودن نقطه تحویل" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">افزودن نشانی و پایگاه تحویل</h3>
              <button
                onClick={() => setShowAddLocationModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">عنوان پایگاه *</label>
                  <input
                    type="text"
                    required
                    value={locTitle}
                    onChange={(e) => setLocTitle(e.target.value)}
                    placeholder="مانند: انبار شرق تهران"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </FieldGroup>
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">نوع مرکز</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="warehouse">انبار مرکزی کالا</option>
                    <option value="delivery_site">بارانداز فروشگاه / تحویل</option>
                    <option value="office">دفتر مرکزی</option>
                  </select>
                </FieldGroup>
              </div>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">نشانی کامل *</label>
                <textarea
                  rows={2}
                  required
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="استان، شهر، خیابان، پلاک، طبقه..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <div className="grid grid-cols-3 gap-3">
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">کد پستی ۱۰ رقمی</label>
                  <input
                    type="text"
                    value={locPostalCode}
                    onChange={(e) => setLocPostalCode(e.target.value)}
                    placeholder="۱۹۹۱۸۴۷۱۲۳"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">تحویل‌گیرنده</label>
                  <input
                    type="text"
                    value={locRecipientName}
                    onChange={(e) => setLocRecipientName(e.target.value)}
                    placeholder="آقای کاظمی"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </FieldGroup>
                <FieldGroup>
                  <label className="block font-bold text-slate-700 mb-1">تلفن هماهنگی</label>
                  <input
                    type="text"
                    value={locRecipientPhone}
                    onChange={(e) => setLocRecipientPhone(e.target.value)}
                    placeholder="۰۹۳۵۶۶۱۸۸۴۲"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-left dir-ltr"
                  />
                </FieldGroup>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  ثبت نشانی
                </button>
              </div>
            </form>
          </div>
        </DialogSurface>
      )}

      {/* MODAL 5: Reassign Salesperson Modal */}
      {showReassignModal && activeCustomer && (
        <DialogSurface isOpen onClose={() => setShowReassignModal(false)} title="تغییر مسئول مشتری" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                تغییر و تخصیص مسئول فروش پرونده
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4 mt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500">مسئول فعلی پرونده:</span>
                <strong className="block text-slate-800 font-bold mt-0.5">
                  {activeCustomer.assignedSalesperson.name} (
                  {activeCustomer.assignedSalesperson.role})
                </strong>
              </div>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">
                  انتخاب مسئول فروش جدید *
                </label>
                <select
                  value={newSalespersonId}
                  onChange={(e) => setNewSalespersonId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="p-sales">کارشناس فروش</option>
                  <option value="p-field-sales">آقای نادری (مسئول فروش مویرگی استان قم)</option>
                  <option value="p-comm-approver">تأییدکننده بازرگانی</option>
                </select>
              </FieldGroup>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">
                  علت تغییر و واگذاری پرونده *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="علت انتقال یا تغییر مسئول فروش را وارد کنید..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  ثبت انتقال و ثبت در تاریخچه
                </button>
              </div>
            </form>
          </div>
        </DialogSurface>
      )}

      {/* MODAL 6: Dismiss Duplicate Warning */}
      {showDismissDuplicateModal && activeCustomer && (
        <DialogSurface isOpen onClose={() => setShowDismissDuplicateModal(false)} title="بررسی پرونده تکراری" className="customer-dialog">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                تأیید اصالت و رفع هشدار پرونده تکراری
              </h3>
              <button
                onClick={() => setShowDismissDuplicateModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-600 cursor-pointer"
               aria-label="بستن">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                با تأیید اصالت، پرچم هشدار تکراری از روی پرونده «{activeCustomer.tradeName}» برداشته
                شده و دلیل عدم تعارض در پرونده ثبت می‌شود.
              </p>

              <FieldGroup>
                <label className="block font-bold text-slate-700 mb-1">
                  توضیح و مستند رفع تعارض *
                </label>
                <textarea
                  rows={3}
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </FieldGroup>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDismissDuplicateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDismissDuplicate}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  تأیید و رفع پرچم تکراری
                </button>
              </div>
            </div>
          </div>
        </DialogSurface>
      )}
    </div>
  );
};
