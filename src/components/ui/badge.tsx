import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'accent' | 'dark';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-[#d9d6cb] bg-[#f4f1e8] text-[#68665d] font-mono text-[10px] uppercase tracking-[0.1em]',
    secondary: 'border-[#30342c] bg-[#242820] text-[#a3a79b] font-mono text-[10px]',
    destructive: 'border-[#e3a5a0] bg-[#fff0ee] text-[#a54c46] font-mono text-[10px] uppercase font-bold',
    outline: 'border-[#d8d5cb] bg-[#faf9f5] text-[#55574e] font-mono text-[10px]',
    success: 'border-[#bfdb78] bg-[#edf7ce] text-[#4e6b18] font-mono text-[10px] uppercase font-bold',
    warning: 'border-[#e7c779] bg-[#fff7df] text-[#8a6413] font-mono text-[10px] uppercase font-bold',
    info: 'border-[#a9bde0] bg-[#edf3fc] text-[#345689] font-mono text-[10px] uppercase font-bold',
    accent: 'bg-[#c7f36b] text-[#171914] border-[#a4c34a] font-bold shadow-2xs',
    dark: 'bg-[#20231c] text-[#f8f6ee] border-[#30342c] font-medium',
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
