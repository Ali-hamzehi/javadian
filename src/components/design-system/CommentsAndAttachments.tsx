import React, { useState } from 'react';
import { RecordAttachment, RecordComment } from '../../types';
import { PersonDisplay } from './PersonDisplay';
import { Button } from './Button';
import { TextareaInput, Checkbox } from './FormControls';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Upload,
  Lock,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

interface CommentsSectionProps {
  comments: RecordComment[];
  onAddComment?: (text: string, isInternal: boolean) => void;
  canComment?: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  comments,
  onAddComment,
  canComment = true,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(commentText, isInternal);
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-700" />
          <span>یادداشت‌ها و توضیحات پرونده</span>
        </h4>
        <span className="text-xs text-slate-500">{comments.length} نظر</span>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            هنوز توضیحی برای این پرونده ثبت نشده است.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg p-3 border text-xs leading-relaxed ${
                comment.isInternal
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                <PersonDisplay person={comment.author} size="sm" showDetails={false} />
                <div className="flex items-center gap-2">
                  {comment.isInternal && (
                    <span className="inline-flex items-center gap-1 text-caption font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      یادداشت محرمانه داخلی
                    </span>
                  )}
                  <span className="text-caption text-slate-500">{comment.createdAtJalali}</span>
                </div>
              </div>
              <p className="whitespace-pre-line text-xs text-slate-800 font-normal">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {canComment && onAddComment && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
          <TextareaInput
            rows={2}
            placeholder="یادداشت جدید یا توضیح درباره اقدام جاری بنویسید..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <Checkbox
              id="chk-internal"
              checked={isInternal}
              onChange={setIsInternal}
              label="یادداشت داخلی (فقط قابل رؤیت برای مدیران واحد)"
            />
            <Button size="sm" type="submit" disabled={!commentText.trim()}>
              ثبت یادداشت
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

interface AttachmentsSectionProps {
  attachments: RecordAttachment[];
  onUploadMock?: (fileName: string) => void;
  canUpload?: boolean;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  attachments,
  onUploadMock,
  canUpload = true,
}) => {
  const getFileIcon = (type: RecordAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'image':
        return <FileImage className="w-4 h-4 text-sky-600" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleUploadClick = () => {
    if (!onUploadMock) return;
    const names = ['نامه_رسمی_مشتری.pdf', 'فیش_واریزی_بانک.pdf', 'آنالیز_تضمین_کیفیت.excel'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    onUploadMock(randomName);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary-700" />
          <span>پیوست‌ها و اسناد ضمیمه</span>
        </h4>
        {canUpload && onUploadMock && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={handleUploadClick}
          >
            بارگذاری فایل
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.length === 0 ? (
          <p className="col-span-full text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            هیچ فایلی ضمیمه نشده است.
          </p>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded bg-slate-100 shrink-0">{getFileIcon(att.type)}</div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-900 truncate" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-caption text-slate-500">
                    {att.size} • {att.uploadedAtJalali}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="p-1.5 text-slate-500 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors cursor-pointer shrink-0"
                title="دانلود فایل"
                onClick={() => alert(`دانلود فایل پیش‌نمایش: ${att.name}`)}
               aria-label="دانلود فایل">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
