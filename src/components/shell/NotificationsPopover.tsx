import { DialogSurface } from '../design-system/DialogSurface';
import React, { useState } from 'react';
import { X, Bell, CheckCheck, AlertOctagon, Clock, ArrowLeft, CheckCircle2, Server, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '../design-system/Button';
import { AppNotification, MockPersona } from '../../types';
import { MOCK_NOTIFICATIONS } from '../../data/mockOperationsPrompt4';
import { toPersianDigits } from '../../utils/formatters';
import { mockRepository } from '../../runtime/workflow';
import { canActorViewRecord } from '../../utils/workItemAuthorization';
import { canAccessRoute } from '../../routes/routesConfig';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRecord: (code: string, routeKey?: string) => void;
  activePersona?: MockPersona;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onNavigateToRecord,
  activePersona,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const accessibleNotifs = notifications.filter((n) => {
    if (!activePersona) return true;
    if (n.targetRouteKey && !canAccessRoute(n.targetRouteKey, activePersona)) {
      return false;
    }
    if (n.targetRecordId) {
      const rec = mockRepository.getRecordById(n.targetRecordId);
      if (rec && !canActorViewRecord(activePersona, rec)) {
        return false;
      }
    }
    return true;
  });

  const unreadCount = accessibleNotifs.filter((n) => !n.isRead).length;

  const filteredNotifs = accessibleNotifs.filter((n) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'inbox') return n.category === 'assignment' || n.category === 'mention';
    if (filterCategory === 'approval') return n.category === 'approval';
    if (filterCategory === 'blocker') return n.category === 'return_reject' || n.category === 'overdue';
    if (filterCategory === 'integration') return n.category === 'integration_failure' || n.category === 'material_change';
    return n.category === filterCategory;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
    onNavigateToRecord(n.targetRecordId || '', n.targetRouteKey);
    onClose();
  };

  return (
    <DialogSurface isOpen={isOpen} onClose={onClose} title="اعلان‌ها و رویدادهای عملیاتی" className="drawer-surface">
      <div className="dialog-panel drawer-panel max-w-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-700" />
            <h4 className="text-xs font-bold text-slate-900">اعلان‌ها و رویدادهای عملیاتی</h4>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} aria-label="بستن اعلان‌ها" className="inline-flex items-center justify-center rounded-lg"><X className="w-5 h-5" /></button>
            {unreadCount > 0 && (
              <span className="text-caption font-bold bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                {toPersianDigits(unreadCount)} جدید
              </span>
            )}
            <button
              onClick={handleMarkAllRead}
              className="text-slate-500 hover:text-primary-700 text-caption p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="خواندن همه"
             aria-label="خواندن همه">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/70 border-b border-slate-200 text-caption overflow-x-auto">
          {[
            { id: 'all', label: 'همه' },
            { id: 'inbox', label: 'اقدام من' },
            { id: 'approval', label: 'تأییدها' },
            { id: 'blocker', label: 'موانع و عودت' },
            { id: 'integration', label: 'سامانه و موجودی' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-white text-slate-900 font-bold shadow-none'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">اعلانی در این دسته‌بندی وجود ندارد.</div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1.5 ${
                  !n.isRead ? 'bg-primary-50/40 border border-primary-100' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    {n.category === 'return_reject' && <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                    {n.category === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    {n.category === 'approval' && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    {n.category === 'assignment' && <CheckCircle2 className="w-3.5 h-3.5 text-primary-700 shrink-0" />}
                    {n.category === 'mention' && <Bell className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                    {n.category === 'integration_failure' && <Server className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    {n.category === 'material_change' && <AlertOctagon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    {n.title}
                  </span>
                  <span className="text-caption text-slate-500 font-mono shrink-0">{n.timeJalali}</span>
                </div>
                <p className="text-slate-600 text-caption leading-relaxed">{n.description}</p>
                <div className="pt-1 flex items-center justify-between text-caption text-primary-700 font-semibold">
                  <span className="font-mono text-slate-500">{n.targetRecordId || n.targetRouteKey}</span>
                  <div className="flex items-center gap-1">
                    <span>مشاهده پرونده</span>
                    <ArrowLeft className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <Button size="sm" variant="outline" fullWidth onClick={onClose}>
            بستن پنجره اعلان‌ها
          </Button>
        </div>
      </div>
    </DialogSurface>
  );
};


