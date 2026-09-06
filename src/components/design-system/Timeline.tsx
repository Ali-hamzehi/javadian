import React from 'react';
import { TimelineEvent } from '../../types';
import { PersonDisplay } from './PersonDisplay';
import {
  FilePlus,
  ArrowLeftRight,
  MessageSquare,
  AlertOctagon,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Clock,
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'creation':
        return <FilePlus className="w-3.5 h-3.5 text-primary-700" />;
      case 'transition':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-slate-500" />;
      case 'blocker_raised':
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />;
      case 'blocker_cleared':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'approval':
        return <CheckCheck className="w-3.5 h-3.5 text-teal-600" />;
      case 'rejection':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getBorderColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'blocker_raised':
        return 'border-rose-300 bg-rose-50';
      case 'blocker_cleared':
        return 'border-emerald-300 bg-emerald-50';
      case 'approval':
        return 'border-teal-300 bg-teal-50';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  return (
    <div className={`relative pr-6 space-y-6 before:absolute before:right-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 ${className}`}>
      {events.map((evt, idx) => (
        <div key={evt.id || idx} className="relative group">
          {/* Timeline node icon */}
          <div
            className={`absolute -right-6 top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-none z-10 ${getBorderColor(
              evt.type
            )}`}
          >
            {getIcon(evt.type)}
          </div>

          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-bold text-slate-900 text-sm">{evt.title}</span>
              <span className="text-slate-500 flex items-center gap-1 text-caption">
                <Clock className="w-3 h-3 text-slate-500" />
                {evt.timestampJalali}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <PersonDisplay person={evt.actor} size="sm" showDetails={false} />
              <span className="text-caption text-slate-500">({evt.actor.role})</span>
            </div>

            {evt.note && (
              <p className="mt-2 text-xs text-slate-700 bg-white border border-slate-200 rounded p-2 leading-relaxed">
                {evt.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
