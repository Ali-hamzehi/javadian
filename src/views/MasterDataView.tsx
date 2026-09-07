import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState } from 'react';
import {
  CustomerRecord,
  ProductRecord,
  SupplierRecord,
  WarehouseRecord,
  MockPersona,
} from '../types';
import {
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
  MOCK_SUPPLIERS,
  MOCK_WAREHOUSES,
} from '../data/mockMasterData';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Chip, Badge } from '../components/design-system/Badges';
import { ModalDialog, Drawer } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { formatRials, formatNumber } from '../utils/formatters';
import { Search, Plus, AlertTriangle, MapPin } from 'lucide-react';
import { getDisplayPersonaName } from '../runtime/documentBasedPersonas';

interface MasterDataViewProps {
  initialTab?: 'customers' | 'products' | 'suppliers' | 'warehouses';
  activePersona?: MockPersona;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  initialTab = 'customers',
  activePersona,
}) => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'customers' | 'products' | 'suppliers' | 'warehouses'>(
    initialTab
  );

  // Datasets state
  const [customers, setCustomers] = useState<CustomerRecord[]>([...MOCK_CUSTOMERS]);
  const [products, setProducts] = useState<ProductRecord[]>([...MOCK_PRODUCTS]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([...MOCK_SUPPLIERS]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([...MOCK_WAREHOUSES]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Records for Drawer View
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseRecord | null>(null);

  // Duplicate Resolution Drawer/Modal
  const [duplicateCustomer, setDuplicateCustomer] = useState<CustomerRecord | null>(null);

  // Create Customer Modal State
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [newCustOfficialName, setNewCustOfficialName] = useState('');
  const [newCustTradeName, setNewCustTradeName] = useState('');
  const [newCustNationalId, setNewCustNationalId] = useState('');
  const [newCustEconomicCode, setNewCustEconomicCode] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustSalesperson, setNewCustSalesperson] = useState('کارشناس فروش — نقش نمونه');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(10000000000);

  // Create Product Modal State
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('روغن‌های خانوار');
  const [newProdPrice, setNewProdPrice] = useState(420000);
  const [newProdMinPrice, setNewProdMinPrice] = useState(400000);

  // Duplicate check handler
  const handleCreateCustomerSubmit = () => {
    if (!newCustOfficialName.trim() || !newCustNationalId.trim()) {
      addToast('لطفاً نام رسمی و شناسه ملی را وارد نمایید', { tone: 'danger' });
      return;
    }

    // Check if nationalId or phone already exists
    const existing = customers.find(
      (c) => c.nationalId === newCustNationalId || c.phone === newCustPhone
    );

    if (existing) {
      addToast('هشدار: تطابق و ثبت تکراری مشکوک شناسایی شد', {
        description: `شناسه ملی یا شماره تلفن با مشتری «${existing.tradeName}» یکسان است.`,
        tone: 'danger',
      });
      return;
    }

    const created: CustomerRecord = {
      id: `cust-${Date.now()}`,
      code: `CUST-1404-${Math.floor(100 + Math.random() * 900)}`,
      officialName: newCustOfficialName,
      tradeName: newCustTradeName || newCustOfficialName,
      nationalId: newCustNationalId,
      economicCode: newCustEconomicCode,
      phone: newCustPhone,
      mobile: newCustPhone,
      province: 'تهران',
      city: 'تهران',
      assignedSalesperson: {
        id: 'p-comm-approver',
        name: newCustSalesperson,
        role: 'کارشناس فروش',
        department: 'فروش و بازرگانی',
      },
      creditLimitRials: Number(newCustCreditLimit),
      openBalanceRials: 0,
      status: 'active',
      tags: ['مشتری جدید'],
      locations: [
        {
          id: 'loc-new',
          type: 'delivery_site',
          title: 'دفتر مرکزی / کارگاه',
          address: 'تهران، خیابان شریعتی',
          recipientName: 'مهندس ناظر کارگاه',
          recipientPhone: newCustPhone,
        },
      ],
      externalRef: `ERP-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setCustomers([created, ...customers]);
    setIsCreateCustomerOpen(false);
    addToast('مشتری جدید با موفقیت در بانک اطلاعات پایه ثبت شد', { tone: 'success' });
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              بانک اطلاعات پایه (Master Data) شرکت جوادیان
            </h2>
            <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              اطلاعات استاندارد سازمانی
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مدیریت یکپارچه اطلاعات مشتریان، کالاها، تأمین‌کنندگان و انبارها با پایش تکراری‌ها و تطبیق با سیستم‌های مرجع
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'customers' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateCustomerOpen(true)}
            >
              افزودن مشتری جدید
            </Button>
          )}
          {activeTab === 'products' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateProductOpen(true)}
            >
              افزودن کالای جدید
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-none space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <Chip
            label="مشتریان سازمانی"
            count={customers.length}
            isSelected={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
          />
          <Chip
            label="کالاها و محصولات"
            count={products.length}
            isSelected={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
          />
          <Chip
            label="تأمین‌کنندگان معتبر"
            count={suppliers.length}
            isSelected={activeTab === 'suppliers'}
            onClick={() => setActiveTab('suppliers')}
          />
          <Chip
            label="انبارها و سالن‌های لجستیک"
            count={warehouses.length}
            isSelected={activeTab === 'warehouses'}
            onClick={() => setActiveTab('warehouses')}
          />
        </div>

        {/* Search */}
        <div className="max-w-md">
          <TextInput
            prefixIcon={<Search className="w-4 h-4" />}
            placeholder="جستجو بر اساس نام، شناسه ملی، کد کالا یا شماره تماس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ================= TAB 1: CUSTOMERS ================= */}
      {activeTab === 'customers' && (
        <div className="space-y-3">
          {/* Duplicate Conflict Warning Bar if any customer has duplicate review flag */}
          {customers.some((c) => c.isDuplicateFlagged) && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">
                  توجه: ۱ پرونده مشتری دارای هشدار تکراری مشکوک به واسطه شناسه ملی یا شماره تلفن یکسان است.
                </span>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  const dup = customers.find((c) => c.isDuplicateFlagged);
                  if (dup) setDuplicateCustomer(dup);
                }}
              >
                بررسی تعارض و ادغام
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <AdaptiveTable className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="p-3 font-bold">نام رسمی و نام تجاری</th>
                    <th className="p-3 font-bold">شناسه ملی / کد اقتصادی</th>
                    <th className="p-3 font-bold">کارشناس مسئول</th>
                    <th className="p-3 font-bold">سقف اعتبار و مانده باز</th>
                    <th className="p-3 font-bold">تعداد شعب و کارگاه‌ها</th>
                    <th className="p-3 font-bold">شناسه مالی/ERP</th>
                    <th className="p-3 font-bold text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{c.tradeName}</div>
                        <div className="text-slate-500 text-caption mt-0.5">{c.officialName}</div>
                        {c.isDuplicateFlagged && (
                          <span className="inline-block mt-1 text-caption font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            نیاز به بررسی تکراری
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-slate-700">{c.nationalId}</div>
                        <div className="text-slate-500 font-mono text-caption">اقتصادی: {c.economicCode}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 font-bold">{c.assignedSalesperson.name}</div>
                        <div className="text-slate-500 text-caption mt-0.5">{c.phone}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-slate-900 font-bold">
                          سقف: {(c.creditLimitRials / 1000000000).toFixed(1)} میلیارد ریال
                        </div>
                        <div className="font-mono text-rose-600 text-caption mt-0.5">
                          بدهی باز: {(c.openBalanceRials / 1000000000).toFixed(1)} میلیارد ریال
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-700">{c.locations.length} آدرس ثبت‌شده</span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-caption">
                          {c.externalRef}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                        >
                          مشاهده پرونده
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdaptiveTable>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-none space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{c.tradeName}</h4>
                      <span className="text-caption text-slate-500">{c.officialName}</span>
                    </div>
                    <span className="font-mono text-caption text-slate-500 font-bold">{c.code}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">سقف اعتبار:</span>
                      <span className="font-mono font-bold">
                        {(c.creditLimitRials / 1000000000).toFixed(1)} میلیارد ریال
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">کارشناس فروش:</span>
                      <span className="font-bold text-primary-700">{c.assignedSalesperson.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setSelectedProduct(prod)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-caption font-mono text-slate-500 font-bold">{prod.code}</span>
                  <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{prod.name}</h3>
                  <span className="text-caption text-slate-500">{prod.category}</span>
                </div>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-caption font-bold rounded">
                  {prod.isActive ? 'فعال و مجاز' : 'غیرفعال'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">نرخ رسمی روز:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatRials(prod.currentPriceRials)} / {prod.baseUnit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">کف مجاز کارشناس:</span>
                  <span className="font-bold text-amber-700 font-mono">
                    {formatRials(prod.minAllowedPriceRials)}
                  </span>
                </div>
              </div>

              <div className="text-caption text-slate-600 bg-primary-50/50 p-2 rounded border border-primary-100">
                <span className="font-bold text-primary-950 block mb-0.5">ضابطه تبدیل کارتن/وزن:</span>
                <span>{prod.cartonConversion.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 3: SUPPLIERS ================= */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              onClick={() => setSelectedSupplier(sup)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-caption font-mono text-slate-500 font-bold">{sup.code}</span>
                  <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{sup.tradeName}</h3>
                  <span className="text-caption text-slate-500">{sup.officialName}</span>
                </div>
                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-caption font-bold rounded">
                  رتبه {sup.rating}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">شخص رابط:</span>
                  <span className="font-bold text-slate-800">{sup.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره شبا (تأییدشده):</span>
                  <span className="font-mono text-slate-700 font-bold">{sup.ibanMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">بانک عامل:</span>
                  <span className="text-slate-700">{sup.bankName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {sup.supplyCategories.map((cat, idx) => (
                  <span key={idx} className="text-caption bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 4: WAREHOUSES ================= */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              onClick={() => setSelectedWarehouse(wh)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3.5 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-caption font-mono text-slate-500 font-bold">{wh.code}</span>
                  <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{wh.title}</h3>
                  <div className="text-caption text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{wh.address}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-caption font-bold rounded">
                  سرپرست: {wh.managerName}
                </span>
              </div>

              {/* Real-time Inventory Snapshot */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>موجودی برخط اسنپ‌شات انبار:</span>
                  <span className="text-caption text-slate-500 font-mono">
                    آخرین تطبیق: {wh.externalInventorySnapshot.lastSyncedJalali}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-none">
                    <span className="text-slate-500 block text-caption">موجودی کل فیزیکی</span>
                    <span className="font-extrabold text-slate-900 font-mono text-xs">
                      {formatNumber(wh.externalInventorySnapshot.totalStockKg)} کیلوگرم
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-none">
                    <span className="text-amber-600 block text-caption">رزرو سفارشات</span>
                    <span className="font-extrabold text-amber-700 font-mono text-xs">
                      {formatNumber(wh.externalInventorySnapshot.reservedKg)} کیلوگرم
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-none">
                    <span className="text-emerald-600 block text-caption">موجودی آزاد فروش</span>
                    <span className="font-extrabold text-emerald-700 font-mono text-xs">
                      {formatNumber(wh.externalInventorySnapshot.availableKg)} کیلوگرم
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= CUSTOMER DETAIL DRAWER ================= */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `${selectedCustomer.tradeName} (${selectedCustomer.code})` : ''}
        subtitle={selectedCustomer ? `شناسه ملی: ${selectedCustomer.nationalId}` : ''}
        width="lg"
        footer={
          <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(null)}>
            بستن
          </Button>
        }
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">نام رسمی ثبتی:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.officialName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">کد اقتصادی:</span>
                <span className="font-mono text-slate-800">{selectedCustomer.economicCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">کارشناس مسئول فروش جوادیان:</span>
                <span className="font-bold text-primary-700">{getDisplayPersonaName(selectedCustomer.assignedSalesperson.name)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شناسه اتصال ERP مالی:</span>
                <span className="font-mono text-slate-800">{selectedCustomer.externalRef}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">شعب و کارگاه‌های تحویل بار</h4>
              <div className="space-y-2">
                {selectedCustomer.locations.map((loc) => (
                  <div key={loc.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-none">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{loc.title}</span>
                      {loc.type === 'delivery_site' && (
                        <span className="text-caption bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                          محل تحویل بار
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 mt-1 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ================= DUPLICATE REVIEW MODAL ================= */}
      <ModalDialog
        isOpen={!!duplicateCustomer}
        onClose={() => setDuplicateCustomer(null)}
        title="بررسی و رفع تعارض سوابق تکراری مشتری"
        width="md"
        footer={
          <div className="w-full flex justify-between">
            <Button size="sm" variant="outline" onClick={() => setDuplicateCustomer(null)}>
              انصراف
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                addToast('سوابق پرونده‌ها با تایید کارشناس تجمیع و به‌روزرسانی شد', { tone: 'success' });
                setDuplicateCustomer(null);
              }}
            >
              تأیید ادغام و رفع هشدار
            </Button>
          </div>
        }
      >
        {duplicateCustomer && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>تعارض شناسایی‌شده در سامانه</span>
              </div>
              <p className="leading-relaxed text-caption">
                {duplicateCustomer.duplicateConflictNote || 'شماره تماس یا شناسه ملی مشتری با پرونده دیگری مطابقت دارد.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-500 block">اقدام پیشنهادی سامانه:</span>
              <span className="font-bold text-slate-800">
                بررسی صحت مدارک ثبتی و ادغام پرونده‌های متناظر در یک مشتری مرجع واحد
              </span>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* ================= CREATE CUSTOMER MODAL ================= */}
      <ModalDialog
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        title="افزودن مشتری جدید به سامانه جوادیان"
        width="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCreateCustomerOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateCustomerSubmit}>
              ثبت مشتری
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="نام رسمی ثبتی شرکت / شخص" required>
              <TextInput
                value={newCustOfficialName}
                onChange={(e) => setNewCustOfficialName(e.target.value)}
                placeholder="مثال: شرکت صنایع ریخته‌گری سهند"
              />
            </FormField>

            <FormField label="نام تجاری / تابلویی">
              <TextInput
                value={newCustTradeName}
                onChange={(e) => setNewCustTradeName(e.target.value)}
                placeholder="مثال: ریخته‌گری سهند"
              />
            </FormField>

            <FormField label="شناسه ملی (کنترل تکراری)" required>
              <TextInput
                value={newCustNationalId}
                onChange={(e) => setNewCustNationalId(e.target.value)}
                placeholder="۱۰ یا ۱۱ رقمی"
              />
            </FormField>

            <FormField label="کد اقتصادی">
              <TextInput
                value={newCustEconomicCode}
                onChange={(e) => setNewCustEconomicCode(e.target.value)}
              />
            </FormField>

            <FormField label="تلفن تماس مستقیم">
              <TextInput
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="۰۲۱..."
              />
            </FormField>

            <FormField label="سقف اعتبار اولیه (ریال)">
              <TextInput
                type="number"
                value={newCustCreditLimit}
                onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
              />
            </FormField>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};
