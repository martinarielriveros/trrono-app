import React from 'react';
import { cn } from '../lib/utils';
import { esAR } from '../i18n/es-AR';

interface RoleBadgeProps {
  role: 'user' | 'vendor' | 'admin';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const roleStyles = {
    user: 'bg-sky-100 text-sky-800 border-sky-300',
    vendor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    admin: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  const roleLabel = esAR.roles[role];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        roleStyles[role],
        className
      )}
    >
      {roleLabel}
    </span>
  );
};
