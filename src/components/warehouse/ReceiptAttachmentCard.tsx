import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, RefreshCw, Eye, AlertCircle, FileCheck, Check } from 'lucide-react';
import { Button } from '../design-system/Button';
import { toPersianDigits } from '../../utils/formatters';

export interface ReceiptAttachmentItem {
  id: string;
  name: string;
  typeLabel: string;
  mimeType: string;
  sizeFormatted: string;
  sizeBytes: number;
  previewUrl?: string;
  uploadStatus: 'uploading' | 'uploaded';
  uploadedAtJalali: string;
}

interface ReceiptAttachmentCardProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  acceptedTypesDescription: string;
  accept: string;
  attachment: ReceiptAttachmentItem | null;
  isInvalid?: boolean;
  onFileSelected: (file: File) => void;
  onSampleLoaded: () => void;
  onRemove: () => void;
  onPreview: () => void;
}

export const ReceiptAttachmentCard: React.FC<ReceiptAttachmentCardProps> = ({
  id,
  title,
  icon: Icon,
  description,
  acceptedTypesDescription,
  accept,
  attachment,
  isInvalid,
  onFileSelected,
  onSampleLoaded,
  onRemove,
  onPreview,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div
      id={`attachment-card-${id}`}
      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
        isInvalid && !attachment
          ? 'bg-rose-50/40 border-rose-400 ring-1 ring-rose-300'
          : attachment
          ? 'bg-white border-emerald-300 shadow-none'
          : isDragging
          ? 'bg-primary-50/50 border-primary-400 border-dashed'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id={`input-file-${id}`}
      />

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                attachment
                  ? 'bg-emerald-100 text-emerald-800'
                  : isInvalid
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-xs">{title}</span>
                <span className="text-caption text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded font-bold">
                  الزامی *
                </span>
              </div>
              <span className="text-caption text-slate-500 block leading-tight mt-0.5">
                {description}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {attachment ? (
            <span className="text-caption px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              پیوست شد
            </span>
          ) : isInvalid ? (
            <span className="text-caption px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              فاقد پیوست
            </span>
          ) : (
            <span className="text-caption px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              در انتظار پیوست
            </span>
          )}
        </div>

        {/* Attachment status notice */}
        {attachment && (
          <div className="text-caption text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 mb-2 flex items-center justify-between">
            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
              <Check className="w-3 h-3 text-emerald-600" />
              فایل پیوست آماده ارسال
            </span>
          </div>
        )}

        {/* Uploaded Content Box */}
        {attachment ? (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 mb-2">
            <div className="flex items-center gap-3">
              {attachment.previewUrl ? (
                <div
                  onClick={onPreview}
                  className="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 cursor-pointer group relative"
                  title="کلیک برای مشاهده پیش‌نمایش"
                >
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                <div
                  onClick={onPreview}
                  className="w-12 h-12 rounded-lg border border-primary-200 bg-primary-50/70 text-primary-700 flex flex-col items-center justify-center shrink-0 cursor-pointer"
                  title="کلیک برای مشاهده پیش‌نمایش"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-caption font-bold mt-0.5 uppercase">PDF</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div
                  className="font-mono font-bold text-slate-800 text-xs truncate dir-ltr text-right"
                  title={attachment.name}
                >
                  {attachment.name}
                </div>
                <div className="flex items-center gap-2 text-caption text-slate-500 mt-0.5">
                  <span>{attachment.typeLabel}</span>
                  <span>•</span>
                  <span className="font-mono">{attachment.sizeFormatted}</span>
                </div>
                <div className="text-caption text-slate-500 mt-0.5">
                  ثبت سند: {attachment.uploadedAtJalali}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Dropzone state */
          <div
            className={`p-3 rounded-lg border-2 border-dashed text-center transition-colors mb-2 cursor-pointer ${
              isInvalid
                ? 'border-rose-300 bg-rose-50/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-6 h-6 text-slate-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-slate-700">
              کلیک برای انتخاب فایل یا رها کردن در این بخش
            </div>
            <div className="text-caption text-slate-500 mt-0.5">
              {acceptedTypesDescription}
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
        {attachment ? (
          <>
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="outline"
                onClick={onPreview}
                className="flex items-center gap-1 text-caption text-primary-700 border-primary-200 hover:bg-primary-50"
              >
                <Eye className="w-3 h-3" />
                پیش‌نمایش
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-caption"
              >
                <RefreshCw className="w-3 h-3" />
                جایگزینی
              </Button>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={onRemove}
              className="flex items-center gap-1 text-caption text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="w-3 h-3" />
              حذف
            </Button>
          </>
        ) : (
          <>
            <Button
              size="xs"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-caption"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              انتخاب فایل
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={onSampleLoaded}
              className="flex items-center gap-1 text-caption text-primary-700 hover:bg-primary-50"
              title="بارگذاری فایل آزمایشی استاندارد جهت تست فرم"
            >
              <FileCheck className="w-3.5 h-3.5 text-primary-500" />
              بارگذاری نمونه
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
