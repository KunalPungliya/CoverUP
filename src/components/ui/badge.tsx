import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'accent' | 'dark';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-zinc-800 border-slate-200',
    secondary: 'bg-slate-50 text-slate-600 border-slate-200',
    destructive: 'bg-rose-50 text-rose-700 border-rose-200',
    outline: 'bg-white text-zinc-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    info: 'bg-sky-50 text-sky-800 border-sky-200 font-semibold',
    accent: 'bg-[#FDDD35]/20 text-zinc-900 border-[#FDDD35] font-semibold',
    dark: 'bg-zinc-950 text-white border-zinc-800 font-medium',
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
