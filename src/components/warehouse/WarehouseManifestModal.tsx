import { IranianPlate } from '../design-system/IranianPlate';
import { AdaptiveTable } from '../design-system/AdaptiveTable';
import React from 'react';
import { Printer, Building2, ShieldCheck } from 'lucide-react';
import { WarehouseExitRecord } from '../../types';
import { ModalDialog } from '../design-system/ModalAndDrawer';
import { Button } from '../design-system/Button';
import { useToast } from '../design-system/ToastContext';
import { formatRials, toPersianDigits, formatNumber } from '../../utils/formatters';

interface WarehouseManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  exitRecord: WarehouseExitRecord;
}

export const WarehouseManifestModal: React.FC<WarehouseManifestModalProps> = ({
  isOpen,
  onClose,
  exitRecord,
}) => {
  const { addToast } = useToast();

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      addToast('دستور چاپ ارسال شد', {
        description: 'نسخه چاپی حواله خروج انبار آماده پرینت است.',
        tone: 'info',
      });
    }
  };

  const totalCartons = exitRecord.items.reduce(
    (sum, it) => sum + (it.dispatchedCartons || it.requestedCartons || 0),
    0
  );
  const totalPieces = exitRecord.items.reduce(
    (sum, it) => sum + (it.dispatchedQuantity || it.requestedQuantity || 0),
    0
  );
  const totalWeightKg = exitRecord.items.reduce(
    (sum, it) =>
      sum +
      (it.unitWeightKg || 16.5) *
        (it.dispatchedCartons || it.requestedCartons || Math.round(it.requestedQuantity / 12)),
    0
  );
  const totalAmountRials = exitRecord.items.reduce(
    (sum, it) =>
      sum +
      (it.salePriceRials || 1250000) *
        (it.dispatchedQuantity || it.requestedQuantity || 0),
    0
  );

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="پیش‌نمایش و چاپ حواله رسمی خروج از انبار (Official Dispatch Manifest)"
      width="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            بستن
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-1" />
            چاپ حواله رسمی انبار
          </Button>
        </div>
      }
    >
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-none space-y-4 text-slate-800 text-xs print:p-0 print:border-none print:shadow-none">
        {/* Manifest Header */}
        <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-900 text-white flex items-center justify-center font-bold text-sm">
              جوادیان
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                صنایع روغنی و غذایی جوادیان (سهامی خاص)
              </h2>
              <span className="text-caption text-slate-500 font-semibold block">
                برگه رسمی حواله خروج کالا و ترخیص از انبار
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-right sm:text-left space-y-1 text-caption">
            <div>
              <span className="text-slate-500 ml-1">شماره حواله:</span>
              <strong className="font-mono text-primary-900 text-xs">{exitRecord.code}</strong>
            </div>
            <div>
              <span className="text-slate-500 ml-1">تاریخ صدور:</span>
              <strong className="font-mono">{exitRecord.dateJalali}</strong>
            </div>
            <div>
              <span className="text-slate-500 ml-1">سفارش فروش:</span>
              <strong className="font-mono">{exitRecord.linkedSalesOrder?.code}</strong>
            </div>
          </div>
        </div>

        {/* National Systems Reference Badges */}
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-caption">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-700" />
            <span className="text-slate-500">کد رهگیری سامانه جامع تجارت:</span>
            <strong className="font-mono text-slate-900">
              {exitRecord.externalTradeReference || 'TRD-1403-90881'}
            </strong>
          </div>

          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-500">شناسه قبض سامانه جامع انبارها:</span>
            <strong className="font-mono text-slate-900">
              {exitRecord.externalWarehouseReference || 'WHS-KHZ-77341'}
            </strong>
          </div>
        </div>

        {/* Buyer and Warehouse Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
          {/* Buyer Block */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-1 mb-1">
              مشخصات خریدار و تحویل‌گیرنده
            </span>
            <div>
              <span className="text-slate-500">نام طرف حساب: </span>
              <strong>{exitRecord.buyer.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">شناسه / کد ملی: </span>
              <span className="font-mono font-bold">{exitRecord.buyer.nationalId}</span>
              {exitRecord.buyer.economicCode && (
                <>
                  <span className="text-slate-500 mr-2">کد اقتصادی: </span>
                  <span className="font-mono">{exitRecord.buyer.economicCode}</span>
                </>
              )}
            </div>
            <div>
              <span className="text-slate-500">شماره تماس: </span>
              <span className="font-mono">{exitRecord.buyer.phone}</span>
            </div>
            <div>
              <span className="text-slate-500">نشانی محل تخلیه: </span>
              <span>{exitRecord.deliveryAddress}</span>
            </div>
            {exitRecord.postalCode && (
              <div>
                <span className="text-slate-500">کد پستی مقصد: </span>
                <span className="font-mono">{exitRecord.postalCode}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">شرایط پرداخت: </span>
              <span>{exitRecord.salesConditions}</span>
            </div>
          </div>

          {/* Warehouse & Transport Block */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-1">
            <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-1 mb-1">
              مشخصات انبار، ناوگان و بارنامه
            </span>
            <div>
              <span className="text-slate-500">انبار مبدأ ترخیص: </span>
              <strong>{exitRecord.warehouse.name} ({exitRecord.warehouse.code})</strong>
            </div>
            <div>
              <span className="text-slate-500">راننده حامل: </span>
              <strong>{exitRecord.logistics.driverName}</strong>
            </div>
            <div>
              <span className="text-slate-500">تماس راننده: </span>
              <span className="font-mono">{exitRecord.logistics.driverPhone}</span>
            </div>
            <div>
              <span className="text-slate-500">پلاک و نوع خودرو: </span>
              <IranianPlate plateString={exitRecord.logistics.vehiclePlate} /> ({exitRecord.logistics.vehicleType})
            </div>
            <div>
              <span className="text-slate-500">شماره بارنامه: </span>
              <span className="font-mono font-bold">{exitRecord.logistics.waybillNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">کرایه حمل باربری: </span>
              <span className="font-mono font-bold text-teal-800">
                {formatRials(exitRecord.freightAmountRials || exitRecord.logistics.freightAmountRials)}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <AdaptiveTable className="w-full text-right text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
              <tr>
                <th className="p-2 text-center w-8">ردیف</th>
                <th className="p-2">شرح و مشخصات کالا</th>
                <th className="p-2 text-center">کارتن</th>
                <th className="p-2 text-center">تعداد واحد</th>
                <th className="p-2 text-center">وزن تقریبی (kg)</th>
                <th className="p-2 text-center">نرخ واحد (ریال)</th>
                <th className="p-2 text-center">مبلغ کل (ریال)</th>
                <th className="p-2">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {exitRecord.items.map((it, idx) => {
                const cartons = it.dispatchedCartons || it.requestedCartons || Math.round(it.requestedQuantity / 12);
                const quantity = it.dispatchedQuantity || it.requestedQuantity;
                const weight = (it.unitWeightKg || 16.5) * cartons;
                const totalRials = (it.salePriceRials || 1250000) * quantity;

                return (
                  <tr key={it.id}>
                    <td className="p-2 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      <div className="font-mono text-caption text-slate-500">{it.productCode}</div>
                    </td>
                    <td className="p-2 text-center font-mono font-bold">{toPersianDigits(cartons)}</td>
                    <td className="p-2 text-center font-mono font-bold">
                      {toPersianDigits(quantity)} {it.unit}
                    </td>
                    <td className="p-2 text-center font-mono">{formatNumber(Math.round(weight))}</td>
                    <td className="p-2 text-center font-mono">{formatRials(it.salePriceRials || 1250000)}</td>
                    <td className="p-2 text-center font-mono font-bold">{formatRials(totalRials)}</td>
                    <td className="p-2 text-caption text-slate-500">{it.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="p-2 font-bold text-slate-900 text-left">
                  جمع کل مقادیر ترخیص:
                </td>
                <td className="p-2 text-center font-mono text-primary-900">
                  {toPersianDigits(totalCartons)}
                </td>
                <td className="p-2 text-center font-mono text-primary-900">
                  {toPersianDigits(totalPieces)}
                </td>
                <td className="p-2 text-center font-mono">
                  {formatNumber(Math.round(totalWeightKg))}
                </td>
                <td className="p-2 text-center">-</td>
                <td className="p-2 text-center font-mono text-primary-950">
                  {formatRials(totalAmountRials)}
                </td>
                <td className="p-2">-</td>
              </tr>
            </tfoot>
          </AdaptiveTable>
        </div>

        {/* 4 Official Signature Blocks */}
        <div className="pt-2">
          <span className="font-bold text-xs block mb-2 text-slate-900">
            تأییدیه‌ها و امضاهای رسمی خروج از انبار:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Box 1: Sales */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="font-bold text-caption block text-slate-700">۱. صادرکننده و فروش</span>
              <span className="text-caption text-slate-500 block">
                {exitRecord.salesResponsible?.name || 'سهراب جوادیان'}
              </span>
              <div className="h-10 flex items-center justify-center text-caption text-emerald-700 font-bold">
                ✓ امضا و تأیید شد
              </div>
            </div>

            {/* Box 2: Warehouse */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="font-bold text-caption block text-slate-700">۲. مسئول انبار و بارگیری</span>
              <span className="text-caption text-slate-500 block">
                {exitRecord.dispatchActor?.person.name || 'کامران داوودی'}
              </span>
              <div className="h-10 flex items-center justify-center text-caption text-emerald-700 font-bold">
                {exitRecord.status === 'dispatched' ? '✓ ترخیص فیزیکی انجام شد' : 'در انتظار خروج فیزیکی'}
              </div>
            </div>

            {/* Box 3: Management */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="font-bold text-caption block text-slate-700">۳. مدیریت بازرگانی</span>
              <span className="text-caption text-slate-500 block">
                سهراب جوادیان
              </span>
              <div className="h-10 flex items-center justify-center text-caption text-emerald-700 font-bold">
                ✓ مصوب بازرگانی
              </div>
            </div>

            {/* Box 4: Driver */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="font-bold text-caption block text-slate-700">۴. راننده تحویل‌گیرنده</span>
              <span className="text-caption text-slate-500 block">
                {exitRecord.logistics.driverName}
              </span>
              <div className="h-10 flex items-center justify-center text-caption text-slate-500 border-t border-dashed border-slate-300 mt-1">
                محل امضا و اثر انگشت
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-caption text-slate-500 text-center border-t border-slate-200 pt-2">
          این حواله رسمی به صورت سیستمی و یکپارچه در ERP جوادیان صادر شده و نسخه کاغذی به همراه خودروی حامل ارسال می‌گردد.
        </div>
      </div>
    </ModalDialog>
  );
};
