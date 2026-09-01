import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none rounded-lg';
    
    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs focus-visible:ring-indigo-500 border border-transparent',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus-visible:ring-rose-500 border border-transparent',
      outline: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 shadow-2xs focus-visible:ring-indigo-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-transparent focus-visible:ring-gray-400',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 border border-transparent focus-visible:ring-gray-400',
      link: 'text-indigo-600 underline-offset-4 hover:underline p-0 h-auto font-normal focus-visible:ring-indigo-500',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs focus-visible:ring-emerald-500 border border-transparent',
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
