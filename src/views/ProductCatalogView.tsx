import { FieldGroup } from '../components/design-system/FieldGroup';
import { AdaptiveTable } from '../components/design-system/AdaptiveTable';
import React, { useState } from 'react';
import { Package, Layers, Scale, DollarSign, Search, Plus, CheckCircle2, Clock, History, Check, X, ShieldCheck } from 'lucide-react';
import {
  ProductRecord,
  ProductCategory,
  ProductUnit,
  ProductPrice,
  MockPersona,
} from '../types';
import {
  MOCK_PRODUCTS,
  MOCK_PRODUCT_CATEGORIES,
  MOCK_PRODUCT_UNITS,
} from '../data/mockMasterData';
import { Button } from '../components/design-system/Button';
import { TextInput, SelectInput, FormField, TextareaInput } from '../components/design-system/FormControls';
import { Drawer, ModalDialog } from '../components/design-system/ModalAndDrawer';
import { useToast } from '../components/design-system/ToastContext';
import { formatRials, toPersianDigits } from '../utils/formatters';

export type ProductCatalogSubRoute = 'products' | 'product_categories' | 'product_units' | 'pricing';

interface ProductCatalogViewProps {
  currentSubRoute?: ProductCatalogSubRoute;
  activePersona: MockPersona;
  onNavigateToSubRoute?: (subRoute: ProductCatalogSubRoute) => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  currentSubRoute = 'products',
  activePersona,
  onNavigateToSubRoute,
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<ProductCatalogSubRoute>(currentSubRoute);

  // Sync state if prop changes
  React.useEffect(() => {
    setActiveTab(currentSubRoute);
  }, [currentSubRoute]);

  const handleTabChange = (tab: ProductCatalogSubRoute) => {
    setActiveTab(tab);
    if (onNavigateToSubRoute) {
      onNavigateToSubRoute(tab);
    }
  };

  // Capabilities: Catalog Manager and System Admin can manage products & prices
  const isCatalogManagerOrAdmin =
    activePersona.personaKey === 'master_data_manager' ||
    activePersona.personaKey === 'admin_ops';

  const canManageProducts =
    isCatalogManagerOrAdmin ||
    activePersona.capabilities.includes('product.category_manage') ||
    activePersona.capabilities.includes('product.price_manage') ||
    activePersona.capabilities.includes('master_data.manage');

  const canManagePrices =
    isCatalogManagerOrAdmin ||
    activePersona.capabilities.includes('product.price_manage') ||
    activePersona.capabilities.includes('pricing.manage');

  // ================= State: Products =================
  const [products, setProducts] = useState<ProductRecord[]>([...MOCK_PRODUCTS]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productBrandFilter, setProductBrandFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('cat-frying');
  const [newProdBrand, setNewProdBrand] = useState('برند نمونه ۱');
  const [newProdPackageType, setNewProdPackageType] = useState('بطری پت شفاف');
  const [newProdPackageSize, setNewProdPackageSize] = useState('۱.۵ لیتر');
  const [newProdBaseUnit, setNewProdBaseUnit] = useState('بطری');
  const [newProdConversionRatio, setNewProdConversionRatio] = useState(12);
  const [newProdRefPrice, setNewProdRefPrice] = useState(1250000);
  const [newProdMinPrice, setNewProdMinPrice] = useState(1180000);
  const [newProdKgPerCarton, setNewProdKgPerCarton] = useState(16.5);
  const [newProdDescription, setNewProdDescription] = useState('');

  // ================= State: Categories =================
  const [categories, setCategories] = useState<ProductCategory[]>([...MOCK_PRODUCT_CATEGORIES]);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
  const [newCatDescription, setNewCatDescription] = useState('');

  // ================= State: Units =================
  const [units, setUnits] = useState<ProductUnit[]>([...MOCK_PRODUCT_UNITS]);
  const [isCreateUnitModalOpen, setIsCreateUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');

  // ================= State: Pricing =================
  const [pricingSearch, setPricingSearch] = useState('');
  const [selectedPriceHistoryProduct, setSelectedPriceHistoryProduct] = useState<ProductRecord | null>(null);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [pricingTargetProduct, setPricingTargetProduct] = useState<ProductRecord | null>(null);
  const [newRefPriceInput, setNewRefPriceInput] = useState(0);
  const [newMinPriceInput, setNewMinPriceInput] = useState(0);
  const [effectiveStartDate, setEffectiveStartDate] = useState('۱۴۰۴/۰۹/۲۰');
  const [effectiveEndDate, setEffectiveEndDate] = useState('۱۴۰۴/۱۲/۲۹');
  const [isFutureRate, setIsFutureRate] = useState(false);
  const [priceChangeReason, setPriceChangeReason] = useState('');

  // ================= Handlers =================
  const handleToggleProductStatus = (prodId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          const nextStatus = p.status === 'active' ? 'inactive' : 'active';
          addToast(
            nextStatus === 'active'
              ? `کالای «${p.name}» فعال گردید.`
              : `کالای «${p.name}» غیرفعال و بایگانی موقت شد.`,
            { tone: nextStatus === 'active' ? 'success' : 'warning' }
          );
          return { ...p, status: nextStatus, isActive: nextStatus === 'active' };
        }
        return p;
      })
    );
    if (selectedProduct?.id === prodId) {
      setSelectedProduct((prev) =>
        prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active', isActive: prev.status !== 'active' } : null
      );
    }
  };

  const handleCreateProductSubmit = () => {
    if (!newProdName.trim() || !newProdCode.trim()) {
      addToast('لطفاً عنوان کالا و کد عطف را تکمیل نمایید.', { tone: 'danger' });
      return;
    }
    const cat = categories.find((c) => c.id === newProdCategoryId) || categories[0];
    const newProd: ProductRecord = {
      id: `prod-${Date.now()}`,
      code: newProdCode.trim(),
      name: newProdName.trim(),
      categoryId: cat.id,
      category: cat.name,
      brand: newProdBrand,
      packageType: newProdPackageType,
      packageSize: newProdPackageSize,
      baseUnit: newProdBaseUnit,
      secondaryUnit: 'کارتن',
      conversionRatio: Number(newProdConversionRatio) || 12,
      conversionDescription: `هر کارتن = ${toPersianDigits(newProdConversionRatio)} ${newProdBaseUnit}`,
      barcode: `626012${Math.floor(1000000 + Math.random() * 9000000)}`,
      referencePriceRials: Number(newProdRefPrice) || 0,
      currentPriceRials: Number(newProdRefPrice) || 0,
      minAllowedPriceRials: Number(newProdMinPrice) || 0,
      effectivePrice: {
        id: `prc-${Date.now()}`,
        productId: `prod-${Date.now()}`,
        productName: newProdName.trim(),
        unit: newProdBaseUnit,
        conversionFactor: Number(newProdConversionRatio) || 12,
        referencePriceRials: Number(newProdRefPrice) || 0,
        minPermittedPriceRials: Number(newProdMinPrice) || 0,
        validFrom: '۱۴۰۴/۰۶/۰۱',
        validTo: '۱۴۰۴/۱۲/۲۹',
        createdBy: `${activePersona.name} (${activePersona.jobTitle})`,
        createdAt: '۱۴۰۴/۰۶/۱۲',
        isActive: true,
      },
      priceList: [],
      priceHistory: [
        {
          dateJalali: '۱۴۰۴/۰۶/۱۲',
          priceRials: Number(newProdRefPrice) || 0,
          changedBy: activePersona.name,
          reason: 'ثبت اولیه کالا در کاتالوگ سامانه',
        },
      ],
      status: 'active',
      isActive: true,
      description: newProdDescription || 'محصول استاندارد تصفیه‌شده روغنی جوادیان',
      cartonConversion: {
        piecesPerCarton: Number(newProdConversionRatio) || 12,
        kgPerCarton: Number(newProdKgPerCarton) || 16.5,
        description: `هر کارتن = ${newProdConversionRatio} ${newProdBaseUnit}`,
      },
      stockAvailableKg: 10000,
      taxPercent: 9,
    };

    setProducts([newProd, ...products]);
    setIsCreateProductModalOpen(false);
    addToast(`کالای «${newProd.name}» با موفقیت در کاتالوگ ثبت گردید.`, { tone: 'success' });
    // Reset form
    setNewProdName('');
    setNewProdCode('');
    setNewProdDescription('');
  };

  const handleCreateCategorySubmit = () => {
    if (!newCatName.trim()) {
      addToast('نام دسته‌بندی الزامی است.', { tone: 'danger' });
      return;
    }
    const parent = categories.find((c) => c.id === newCatParentId);
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      parentId: newCatParentId || null,
      parentName: parent?.name,
      status: 'active',
      description: newCatDescription.trim(),
    };
    setCategories([...categories, newCat]);
    setIsCreateCategoryModalOpen(false);
    setNewCatName('');
    setNewCatDescription('');
    setNewCatParentId(null);
    addToast(`دسته‌بندی «${newCat.name}» افزوده شد.`, { tone: 'success' });
  };

  const handleToggleCategoryStatus = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          const next = c.status === 'active' ? 'inactive' : 'active';
          return { ...c, status: next };
        }
        return c;
      })
    );
    addToast('وضعیت دسته‌بندی به‌روزرسانی شد.', { tone: 'info' });
  };

  const handleUpdatePriceSubmit = () => {
    if (!pricingTargetProduct) return;
    if (newRefPriceInput <= 0 || newMinPriceInput <= 0) {
      addToast('لطفاً قیمت معتبر و بزرگتر از صفر وارد نمایید.', { tone: 'danger' });
      return;
    }
    if (newMinPriceInput > newRefPriceInput) {
      addToast('کف مجاز قیمت نمی‌تواند بالاتر از نرخ مرجع روز باشد.', { tone: 'danger' });
      return;
    }

    const updatedEffective: ProductPrice = {
      id: `prc-${Date.now()}`,
      productId: pricingTargetProduct.id,
      productName: pricingTargetProduct.name,
      unit: pricingTargetProduct.baseUnit,
      conversionFactor: pricingTargetProduct.conversionRatio,
      referencePriceRials: newRefPriceInput,
      minPermittedPriceRials: newMinPriceInput,
      validFrom: effectiveStartDate || '۱۴۰۴/۰۹/۲۰',
      validTo: effectiveEndDate || '۱۴۰۴/۱۲/۲۹',
      createdBy: `${activePersona.name} (${activePersona.jobTitle})`,
      createdAt: '۱۴۰۴/۰۹/۱۵',
      isActive: true,
    };

    const newHistoryItem = {
      dateJalali: effectiveStartDate || '۱۴۰۴/۰۹/۲۰',
      priceRials: newRefPriceInput,
      changedBy: activePersona.name,
      reason: priceChangeReason || (isFutureRate ? 'تصویب نرخ آتی با موعد اجرا' : 'تعدیل نرخ روزانه مصوب کاتالوگ'),
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === pricingTargetProduct.id) {
          return {
            ...p,
            referencePriceRials: newRefPriceInput,
            currentPriceRials: newRefPriceInput,
            minAllowedPriceRials: newMinPriceInput,
            effectivePrice: updatedEffective,
            priceHistory: [newHistoryItem, ...(p.priceHistory || [])],
          };
        }
        return p;
      })
    );

    setIsEditPriceModalOpen(false);
    setPricingTargetProduct(null);
    setPriceChangeReason('');
    addToast(
      isFutureRate
        ? `نرخ مصوب آتی برای «${pricingTargetProduct.name}» با موعد اثر ${effectiveStartDate} ثبت شد.`
        : `نرخ مصوب روز برای «${pricingTargetProduct.name}» با موفقیت ابلاغ گردید.`,
      { tone: 'success' }
    );
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && p.categoryId !== productCategoryFilter) return false;
    if (productBrandFilter !== 'all' && p.brand !== productBrandFilter) return false;
    if (productStatusFilter !== 'all' && p.status !== productStatusFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCategory) return false;
    }
    return true;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
    }
    return true;
  });

  // Filtered Pricing
  const filteredPricingProducts = products.filter((p) => {
    if (pricingSearch.trim()) {
      const q = pricingSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Brands list
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header & Functional SubTabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900">کاتالوگ و شناسنامه محصولات و کالاها</h2>
              <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                روغن‌های خوراکی و سبد غذایی جوادیان
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              مدیریت محصولات، ساختار درختی دسته‌بندی، ضرایب تبدیل واحد، بسته‌بندی کارتن و نرخ‌نامه روزانه
            </p>
          </div>
        </div>

        {/* 4 Dedicated Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 pb-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange('products')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-primary-700 text-white shadow-none'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>محصولات و کالاها</span>
            <span className={`px-1.5 py-0.2 rounded-full text-caption ${activeTab === 'products' ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {toPersianDigits(products.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('product_categories')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'product_categories'
                ? 'bg-primary-700 text-white shadow-none'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>دسته‌بندی محصولات</span>
            <span className={`px-1.5 py-0.2 rounded-full text-caption ${activeTab === 'product_categories' ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {toPersianDigits(categories.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('product_units')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'product_units'
                ? 'bg-primary-700 text-white shadow-none'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>واحدها و تبدیل واحد</span>
            <span className={`px-1.5 py-0.2 rounded-full text-caption ${activeTab === 'product_units' ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {toPersianDigits(units.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('pricing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-primary-700 text-white shadow-none'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>قیمت‌های مرجع و مصوب</span>
            <span className={`px-1.5 py-0.2 rounded-full text-caption ${activeTab === 'pricing' ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {toPersianDigits(products.filter((p) => p.status === 'active').length)}
            </span>
          </button>
        </div>
      </div>

      {/* ================= VIEW A: محصولات و کالاها ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="جستجوی نام کالا، کد کالا یا دسته‌بندی..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Brand Filter */}
              <select
                value={productBrandFilter}
                onChange={(e) => setProductBrandFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
              >
                <option value="all">همه برندها</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فقط کالاهای فعال</option>
                <option value="inactive">بایگانی / غیرفعال</option>
              </select>
            </div>

            {canManageProducts && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateProductModalOpen(true)}
              >
                تعریف محصول جدید
              </Button>
            )}
          </div>

          {/* Product List Table / Cards */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <AdaptiveTable className="w-full text-right text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">کد کالا</th>
                    <th className="p-3">عنوان محصول و مشخصات فنی</th>
                    <th className="p-3">دسته‌بندی و برند</th>
                    <th className="p-3">بسته‌بندی و ضریب تبدیل</th>
                    <th className="p-3">واحد پایه</th>
                    <th className="p-3">نرخ مصوب روز</th>
                    <th className="p-3">کف مجاز فروش</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        کالایی با مشخصات جستجو شده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr
                        key={prod.id}
                        className={`hover:bg-primary-50/40 transition-colors ${
                          prod.status === 'inactive' ? 'opacity-60 bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-600">{prod.code}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(prod)}
                            className="font-bold text-slate-900 hover:text-primary-700 text-right cursor-pointer"
                          >
                            {prod.name}
                          </button>
                          <div className="text-caption text-slate-500 mt-0.5">{prod.description}</div>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-caption">
                            {prod.category}
                          </span>
                          <div className="text-caption text-slate-500 mt-0.5">{prod.brand}</div>
                        </td>
                        <td className="p-3 font-mono text-caption text-slate-700">
                          {prod.conversionDescription}
                          <div className="text-caption text-slate-500">
                            وزن کارتن: {prod.cartonConversion.kgPerCarton} کیلوگرم
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{prod.baseUnit}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {formatRials(prod.currentPriceRials)}
                        </td>
                        <td className="p-3 font-mono text-emerald-800">
                          {formatRials(prod.minAllowedPriceRials)}
                        </td>
                        <td className="p-3 text-center">
                          {prod.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              فعال
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              بایگانی
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setSelectedProduct(prod)}
                            >
                              مشاهده شناسنامه
                            </Button>
                            {canManageProducts && (
                              <button
                                type="button"
                                onClick={() => handleToggleProductStatus(prod.id)}
                                title={prod.status === 'active' ? 'غیرفعال‌سازی / بایگانی' : 'فعال‌سازی مجدد'}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  prod.status === 'active'
                                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                }`}
                               aria-label={prod.status === 'active' ? 'غیرفعال‌سازی / بایگانی' : 'فعال‌سازی مجدد'}>
                                {prod.status === 'active' ? (
                                  <X className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </AdaptiveTable>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-caption text-slate-500">{prod.code}</span>
                      <h4 className="font-extrabold text-slate-900 mt-0.5">{prod.name}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-caption font-bold ${
                        prod.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {prod.status === 'active' ? 'فعال' : 'بایگانی'}
                    </span>
                  </div>

                  <div className="text-slate-600 text-caption space-y-1">
                    <div>دسته‌بندی: {prod.category} • برند: {prod.brand}</div>
                    <div>ضریب تبدیل: {prod.conversionDescription}</div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span>نرخ مصوب روز:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRials(prod.currentPriceRials)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" size="xs" onClick={() => setSelectedProduct(prod)}>
                      مشاهده و ویرایش
                    </Button>
                    {canManageProducts && (
                      <button
                        type="button"
                        onClick={() => handleToggleProductStatus(prod.id)}
                        className="text-caption font-bold text-primary-700 underline"
                      >
                        {prod.status === 'active' ? 'بایگانی' : 'فعال‌سازی'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW B: دسته‌بندی محصولات ================= */}
      {activeTab === 'product_categories' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="جستجوی دسته‌بندی..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            {canManageProducts && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateCategoryModalOpen(true)}
              >
                افزودن دسته‌بندی جدید
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              const countUsing = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-3 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">{cat.name}</h4>
                        <span className="text-caption text-slate-500">
                          {cat.parentName ? `زیرمجموعه: ${cat.parentName}` : 'دسته مادر (اصلی)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryStatus(cat.id)}
                      className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                        cat.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cat.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>

                  <p className="text-caption text-slate-500 leading-relaxed min-h-[32px]">
                    {cat.description || 'بدون توضیح تفصیلی'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-caption">تعداد محصولات منتسب:</span>
                    <span className="font-bold font-mono px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md">
                      {toPersianDigits(countUsing)} کالا
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= VIEW C: واحدها و تبدیل واحد ================= */}
      {activeTab === 'product_units' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none space-y-2">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary-700" />
              <span>ماتریس تبدیل واحدها در صنعت پخش روغن خوراکی</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              محصولات توزیع و پخش جوادیان بر پایه واحد شمارش مصرفی (مانند بطری ۱.۵ لیتری یا قوطی ۴.۵ کیلوگرمی) قیمت‌گذاری و نگهداری می‌شوند و توزیع آنها در قالب بسته‌های ثانویه (کارتن) با ضرایب مشخص انجام می‌پذیرد.
            </p>
          </div>

          {/* Defined Units Grid */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2">واحدهای پایه‌ای ثبت‌شده در سیستم</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {units.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-none text-center space-y-1"
                >
                  <span className="font-extrabold text-slate-900 text-sm block">{u.name}</span>
                  <span className="font-mono text-primary-700 text-xs font-bold block">({u.symbol})</span>
                  <span className="text-caption text-slate-500 block">{u.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Specific Conversion Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              جدول ضرایب تبدیل کالاها (واحد پایه به کارتن و وزن محاسباتی)
            </div>
            <div className="overflow-x-auto">
              <AdaptiveTable className="w-full text-right text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">کد کالا</th>
                    <th className="p-3">عنوان محصول</th>
                    <th className="p-3">واحد پایه</th>
                    <th className="p-3">واحد ثانویه</th>
                    <th className="p-3">ضریب در کارتن</th>
                    <th className="p-3">وزن ناخالص هر کارتن</th>
                    <th className="p-3">فرمول محاسباتی در سیستم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-600">{p.code}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-bold text-primary-700">{p.baseUnit}</td>
                      <td className="p-3 text-slate-700">{p.secondaryUnit}</td>
                      <td className="p-3 font-mono font-extrabold text-slate-900">
                        {toPersianDigits(p.conversionRatio)} {p.baseUnit}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {toPersianDigits(p.cartonConversion.kgPerCarton)} کیلوگرم
                      </td>
                      <td className="p-3 text-caption text-slate-500 font-mono">
                        ۱ کارتن = {p.conversionRatio} × {p.baseUnit} ({p.cartonConversion.kgPerCarton} kg)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdaptiveTable>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW D: قیمت‌های مرجع و مصوب ================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="جستجوی کالا، کد یا دسته‌بندی جهت مشاهده نرخ مصوب..."
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>مبنای اعتبارسنجی قیمت سفارش‌های فروش و مغایرت‌گیری انبار</span>
              </div>
              {canManagePrices && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    if (products.length > 0) {
                      setPricingTargetProduct(products[0]);
                      setNewRefPriceInput(products[0].currentPriceRials);
                      setNewMinPriceInput(products[0].minAllowedPriceRials);
                      setEffectiveStartDate('۱۴۰۴/۱۰/۰۱');
                      setEffectiveEndDate('۱۴۰۴/۱۲/۲۹');
                      setIsFutureRate(true);
                      setIsEditPriceModalOpen(true);
                    }
                  }}
                >
                  ثبت نرخ آتی / مصوب جدید
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <AdaptiveTable className="w-full text-right text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">محصول (کالا)</th>
                    <th className="p-3">کد کالا (SKU)</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">واحد قیمت‌گذاری</th>
                    <th className="p-3">نرخ مرجع روز (مصوب)</th>
                    <th className="p-3">حداقل قیمت مجاز فروش (کف)</th>
                    <th className="p-3">تاریخ اعتبار / موعد اثر</th>
                    <th className="p-3 text-center">وضعیت نرخ</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPricingProducts.map((p) => {
                    const eff = p.effectivePrice;
                    const isFuture = eff?.validFrom && eff.validFrom.localeCompare('۱۴۰۴/۰۹/۱۵') > 0;
                    return (
                      <tr key={p.id} className="hover:bg-primary-50/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{p.name}</td>
                        <td className="p-3 font-mono font-bold text-slate-600">{p.code}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-caption font-semibold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{p.baseUnit}</td>
                        <td className="p-3 font-mono font-extrabold text-primary-700 text-sm">
                          {formatRials(p.currentPriceRials)}
                        </td>
                        <td className="p-3 font-mono text-emerald-800 font-bold">
                          {formatRials(p.minAllowedPriceRials)}
                        </td>
                        <td className="p-3 font-mono text-caption text-slate-600">
                          {eff ? `${eff.validFrom} تا ${eff.validTo || 'پایان سال'}` : '۱۴۰۴/۰۹/۲۰ تا پایان سال'}
                        </td>
                        <td className="p-3 text-center">
                          {isFuture ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              در انتظار موعد اثر
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              معتبر و مصوب
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canManagePrices ? (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setPricingTargetProduct(p);
                                  setNewRefPriceInput(p.currentPriceRials);
                                  setNewMinPriceInput(p.minAllowedPriceRials);
                                  setEffectiveStartDate('۱۴۰۴/۰۹/۲۰');
                                  setEffectiveEndDate('۱۴۰۴/۱۲/۲۹');
                                  setIsFutureRate(false);
                                  setIsEditPriceModalOpen(true);
                                }}
                              >
                                تعیین / به‌روزرسانی نرخ
                              </Button>
                            ) : (
                              <span className="text-caption text-slate-500 font-medium ml-1">فقط‌خواندنی</span>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setSelectedPriceHistoryProduct(p)}
                              leftIcon={<History className="w-3.5 h-3.5" />}
                            >
                              تاریخچه
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </AdaptiveTable>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT DETAILS DRAWER ================= */}
      {selectedProduct && (
        <Drawer
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`شناسنامه فنی و بازرگانی: ${selectedProduct.name}`}
          subtitle={`کد سیستمی: ${selectedProduct.code} • برند: ${selectedProduct.brand}`}
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant={selectedProduct.status === 'active' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggleProductStatus(selectedProduct.id)}
              >
                {selectedProduct.status === 'active' ? 'بایگانی کردن کالا' : 'فعال‌سازی مجدد'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                بستن
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Top Snapshot */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block mb-0.5">دسته‌بندی</span>
                <span className="font-bold text-slate-800">{selectedProduct.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">واحد پایه</span>
                <span className="font-bold text-primary-700">{selectedProduct.baseUnit}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">نوع بسته‌بندی</span>
                <span className="font-bold text-slate-800">{selectedProduct.packageType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">حجم / وزن ظرف</span>
                <span className="font-bold text-slate-800">{selectedProduct.packageSize}</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-3 bg-primary-50/50 border border-primary-200 rounded-xl space-y-2">
              <div className="font-bold text-primary-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-700" />
                <span>قیمت‌گذاری و حدود اختیارات تخفیف</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-primary-100">
                  <span className="text-slate-500 block mb-1">قیمت مرجع روز (هر {selectedProduct.baseUnit})</span>
                  <span className="font-mono font-extrabold text-primary-700 text-sm">
                    {formatRials(selectedProduct.currentPriceRials)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-primary-100">
                  <span className="text-slate-500 block mb-1">کف مجاز کارشناس فروش</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatRials(selectedProduct.minAllowedPriceRials)}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversion Details */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-600" />
                <span>ضرایب تبدیل کارتن به واحد پایه و وزن ناخالص</span>
              </div>
              <div className="space-y-1.5 text-slate-600 leading-relaxed">
                <div>• تعداد در هر کارتن: {toPersianDigits(selectedProduct.cartonConversion.piecesPerCarton)} {selectedProduct.baseUnit}</div>
                <div>• وزن تقریبی هر کارتن: {toPersianDigits(selectedProduct.cartonConversion.kgPerCarton)} کیلوگرم</div>
                <div>• شرح استاندارد: {selectedProduct.cartonConversion.description}</div>
              </div>
            </div>

            {/* Price History */}
            {selectedProduct.priceHistory && selectedProduct.priceHistory.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>سابقه تغییرات نرخ مصوب</span>
                </div>
                <div className="space-y-1.5">
                  {selectedProduct.priceHistory.map((ph, idx) => (
                    <div key={idx} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-caption">
                      <div>
                        <span className="font-mono font-bold text-slate-700">{ph.dateJalali}</span>
                        <span className="text-slate-500 mr-2">— {ph.reason}</span>
                      </div>
                      <span className="font-mono font-bold text-primary-700">{formatRials(ph.priceRials)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ================= MODAL: CREATE PRODUCT ================= */}
      <ModalDialog
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        title="تعریف محصول جدید در کاتالوگ بازرگانی جوادیان"
        width="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCreateProductModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateProductSubmit}>
              ثبت نهایی محصول
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="نام و عنوان تجاری محصول" required>
              <TextInput
                placeholder="مثال: روغن سرخ‌کردنی — بطری ۲ لیتری"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
              />
            </FormField>

            <FormField label="کد یکتای محصول (SKU)" required>
              <TextInput
                placeholder="مثال: PRD-OIL-105"
                value={newProdCode}
                onChange={(e) => setNewProdCode(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="دسته‌بندی محصول" required>
              <SelectInput
                value={newProdCategoryId}
                onChange={(e) => setNewProdCategoryId(e.target.value)}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
              />
            </FormField>

            <FormField label="برند محصول">
              <TextInput
                value={newProdBrand}
                onChange={(e) => setNewProdBrand(e.target.value)}
              />
            </FormField>

            <FormField label="واحد پایه سنجش">
              <SelectInput
                value={newProdBaseUnit}
                onChange={(e) => setNewProdBaseUnit(e.target.value)}
                options={units.map((u) => ({ label: `${u.name} (${u.symbol})`, value: u.name }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="تعداد واحد در هر کارتن">
              <TextInput
                type="number"
                value={newProdConversionRatio}
                onChange={(e) => setNewProdConversionRatio(Number(e.target.value))}
              />
            </FormField>

            <FormField label="وزن هر کارتن (کیلوگرم)">
              <TextInput
                type="number"
                value={newProdKgPerCarton}
                onChange={(e) => setNewProdKgPerCarton(Number(e.target.value))}
              />
            </FormField>

            <FormField label="نوع و جنس بسته‌بندی">
              <TextInput
                value={newProdPackageType}
                onChange={(e) => setNewProdPackageType(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-primary-50/40 rounded-xl border border-primary-100">
            <FormField label="قیمت مرجع مصوب روز (ریال)" required>
              <TextInput
                type="number"
                value={newProdRefPrice}
                onChange={(e) => setNewProdRefPrice(Number(e.target.value))}
              />
            </FormField>

            <FormField label="کف مجاز تخفیف کارشناس فروش (ریال)" required>
              <TextInput
                type="number"
                value={newProdMinPrice}
                onChange={(e) => setNewProdMinPrice(Number(e.target.value))}
              />
            </FormField>
          </div>

          <FormField label="توضیحات تکمیلی و مشخصات کیفی">
            <TextareaInput
              rows={2}
              value={newProdDescription}
              onChange={(e) => setNewProdDescription(e.target.value)}
              placeholder="نقطه دود، ترکیبات، نشان استاندارد و شرایط انبارش..."
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= MODAL: CREATE CATEGORY ================= */}
      <ModalDialog
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        title="تعریف دسته‌بندی جدید محصولات"
        width="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCreateCategoryModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateCategorySubmit}>
              ثبت دسته‌بندی
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <FormField label="عنوان دسته‌بندی" required>
            <TextInput
              placeholder="مثال: روغن زیتون فرابکر"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </FormField>

          <FormField label="دسته‌بندی والد (اختیاری)">
            <SelectInput
              value={newCatParentId || ''}
              onChange={(e) => setNewCatParentId(e.target.value || null)}
              options={[
                { label: 'بدون والد (دسته مادر اصلی)', value: '' },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </FormField>

          <FormField label="شرح و کاربرد این دسته">
            <TextareaInput
              rows={2}
              value={newCatDescription}
              onChange={(e) => setNewCatDescription(e.target.value)}
              placeholder="توضیحات مصارف، بازار هدف یا شرایط اختصاصی نگهداری..."
            />
          </FormField>
        </div>
      </ModalDialog>

      {/* ================= MODAL: UPDATE REFERENCE PRICE ================= */}
      <ModalDialog
        isOpen={isEditPriceModalOpen}
        onClose={() => setIsEditPriceModalOpen(false)}
        title={isFutureRate ? `تصویب نرخ آتی برای کالا` : `تعیین و به‌روزرسانی نرخ مصوب: ${pricingTargetProduct?.name || ''}`}
        width="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setIsEditPriceModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdatePriceSubmit}>
              {isFutureRate ? 'ثبت و ابلاغ نرخ آتی' : 'تأیید و اعمال نرخ مصوب'}
            </Button>
          </div>
        }
      >
        {pricingTargetProduct && (
          <div className="space-y-3.5 text-xs">
            <FormField label="کالای هدف" required>
              <SelectInput
                value={pricingTargetProduct.id}
                onChange={(e) => {
                  const target = products.find((p) => p.id === e.target.value);
                  if (target) {
                    setPricingTargetProduct(target);
                    setNewRefPriceInput(target.currentPriceRials);
                    setNewMinPriceInput(target.minAllowedPriceRials);
                  }
                }}
                options={products.map((p) => ({
                  label: `${p.name} (کد: ${p.code} • ${p.category})`,
                  value: p.id,
                }))}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="نرخ مرجع مصوب (ریال)" required>
                <div>
                  <TextInput
                    type="number"
                    value={newRefPriceInput}
                    onChange={(e) => setNewRefPriceInput(Number(e.target.value))}
                  />
                  <div className="text-caption text-primary-700 font-mono mt-1 font-bold">
                    معادل: {formatRials(newRefPriceInput)}
                  </div>
                </div>
              </FormField>

              <FormField label="حداقل قیمت مجاز کارشناس فروش (ریال)" required>
                <div>
                  <TextInput
                    type="number"
                    value={newMinPriceInput}
                    onChange={(e) => setNewMinPriceInput(Number(e.target.value))}
                  />
                  <div className="text-caption text-emerald-700 font-mono mt-1 font-bold">
                    معادل: {formatRials(newMinPriceInput)}
                  </div>
                </div>
              </FormField>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <FieldGroup className="flex items-center justify-between">
                <span className="font-bold text-slate-800">نوع ابلاغ و دوره اعتبار:</span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={isFutureRate}
                    onChange={(e) => {
                      setIsFutureRate(e.target.checked);
                      if (e.target.checked) {
                        setEffectiveStartDate('۱۴۰۴/۱۰/۰۱');
                      } else {
                        setEffectiveStartDate('۱۴۰۴/۰۹/۲۰');
                      }
                    }}
                    className="rounded border-slate-300 text-primary-700 focus:ring-primary-500"
                  />
                  <span>نرخ آتی با موعد اجرای آینده</span>
                </label>
              </FieldGroup>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <FormField label="تاریخ آغاز اعتبار (موعد اثر)">
                  <TextInput
                    value={effectiveStartDate}
                    onChange={(e) => setEffectiveStartDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۴/۱۰/۰۱"
                  />
                </FormField>
                <FormField label="تاریخ پایان اعتبار">
                  <TextInput
                    value={effectiveEndDate}
                    onChange={(e) => setEffectiveEndDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۴/۱۲/۲۹"
                  />
                </FormField>
              </div>
            </div>

            <FormField label="علت یا مرجع تصویب نرخ">
              <TextInput
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                placeholder="مثال: مصوبه کارگروه تنظیم بازار روغن یا بخشنامه شماره ۴۸۲..."
              />
            </FormField>
          </div>
        )}
      </ModalDialog>

      {/* ================= MODAL: PRICE HISTORY ================= */}
      <ModalDialog
        isOpen={Boolean(selectedPriceHistoryProduct)}
        onClose={() => setSelectedPriceHistoryProduct(null)}
        title={`تاریخچه نرخ‌نامه: ${selectedPriceHistoryProduct?.name || ''}`}
        width="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedPriceHistoryProduct(null)}>
            بستن
          </Button>
        }
      >
        {selectedPriceHistoryProduct && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-900 flex justify-between items-center">
              <span>نرخ فعلی مصوب:</span>
              <span className="font-mono font-extrabold text-sm">
                {formatRials(selectedPriceHistoryProduct.currentPriceRials)}
              </span>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-700">سوابق ابلاغ‌های قیمتی:</h5>
              {selectedPriceHistoryProduct.priceHistory.map((ph, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-slate-800">{ph.dateJalali}</span>
                    <span className="font-mono text-primary-700">{formatRials(ph.priceRials)}</span>
                  </div>
                  <div className="text-caption text-slate-500 flex justify-between">
                    <span>{ph.reason}</span>
                    <span>ثبت: {ph.changedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};
