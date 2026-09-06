import { Avatar } from './Avatar';
import React from 'react';
import { Person } from '../../types';
import { ShieldAlert, User } from 'lucide-react';

interface PersonDisplayProps {
  person: Person;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isDelegate?: boolean;
  delegatorName?: string;
  className?: string;
}

export const PersonDisplay: React.FC<PersonDisplayProps> = ({
  person,
  showDetails = true,
  size = 'md',
  isDelegate = false,
  delegatorName,
  className = '',
}) => {
  const avatarSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const actingDelegate = isDelegate || person.isActingDelegate;
  const targetDelegator = delegatorName || person.delegatorName;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        {person.avatar ? (
          <Avatar
            src={person.avatar}
            alt={person.name}
            className={`${avatarSizes[size]} rounded-full object-cover ring-1 ring-slate-200`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`${avatarSizes[size]} rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold`}
          >
            {person.name ? person.name.slice(0, 1) : <User className="w-4 h-4" />}
          </div>
        )}
        {actingDelegate && (
          <span
            title={`جانشین ${targetDelegator || ''}`}
            className="absolute -bottom-1 -left-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center ring-2 ring-white text-caption"
          >
            <ShieldAlert className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 text-sm truncate">{person.name}</span>
          {actingDelegate && (
            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-800 border border-amber-300 text-caption font-bold px-1.5 py-0.2 rounded">
              جانشین {targetDelegator}
            </span>
          )}
        </div>
        {showDetails && (
          <span className="text-xs text-slate-500 truncate">
            {person.role} • {person.department}
          </span>
        )}
      </div>
    </div>
  );
};
