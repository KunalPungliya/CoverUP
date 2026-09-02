import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'accent' | 'dark';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-zinc-900 border-slate-300 font-semibold',
    secondary: 'bg-slate-100 text-zinc-800 border-slate-200 font-medium',
    destructive: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    outline: 'bg-white text-zinc-900 border-slate-300 font-semibold',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    warning: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    info: 'bg-sky-50 text-sky-900 border-sky-300 font-bold',
    accent: 'bg-[#FDDD35] text-zinc-950 border-[#e5c62b] font-bold shadow-2xs',
    dark: 'bg-zinc-950 text-white border-zinc-700 font-semibold',
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
