import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    secondary: 'bg-gray-50 text-gray-600 border-gray-200',
    destructive: 'bg-rose-50 text-rose-700 border-rose-200',
    outline: 'bg-white text-gray-700 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
