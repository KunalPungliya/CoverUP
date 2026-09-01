import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'accent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none rounded-lg';
    
    const variants = {
      default: 'bg-zinc-950 text-white hover:bg-zinc-800 active:bg-zinc-900 shadow-xs focus-visible:ring-zinc-900 border border-zinc-900',
      accent: 'bg-[#FDDD35] text-zinc-950 hover:bg-[#FACC15] active:bg-[#EAB308] font-semibold shadow-xs focus-visible:ring-amber-400 border border-amber-300',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus-visible:ring-rose-500 border border-transparent',
      outline: 'bg-white text-zinc-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 shadow-2xs focus-visible:ring-zinc-900',
      secondary: 'bg-slate-100 text-zinc-800 hover:bg-slate-200 active:bg-slate-300 border border-transparent focus-visible:ring-slate-400',
      ghost: 'text-zinc-700 hover:bg-slate-100 hover:text-zinc-950 active:bg-slate-200 border border-transparent focus-visible:ring-slate-400',
      link: 'text-zinc-950 underline-offset-4 hover:underline p-0 h-auto font-normal focus-visible:ring-zinc-900',
      success: 'bg-[#00BA68] text-white hover:bg-[#009E57] active:bg-[#008749] shadow-xs focus-visible:ring-emerald-500 border border-transparent font-medium',
    };


    const sizes = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-6 text-base',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
