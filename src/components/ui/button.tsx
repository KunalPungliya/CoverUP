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
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';
    
    const variants = {
      default: 'bg-[#20231C] text-[#F8F6EE] hover:bg-[#30352A] active:scale-[0.97] shadow-[3px_3px_0_#C7F36B] border border-[#30342C] font-semibold',
      accent: 'bg-[#C7F36B] text-[#171914] hover:bg-[#B5E853] active:scale-[0.97] font-bold shadow-[3px_3px_0_#5E6F31] border border-[#A4C34A]',
      destructive: 'bg-[#FFF0EE] text-[#A54C46] hover:bg-[#FFE5E2] border border-[#E3A5A0] font-semibold',
      outline: 'bg-[#FAF9F5] text-[#2B2D27] border border-[#D8D5CB] hover:bg-[#F4F1E7] hover:border-[#9AB54D] font-medium',
      secondary: 'bg-[#242820] text-[#F4F0E5] hover:bg-[#2B3026] border border-[#30342C]',
      ghost: 'text-[#A3A79B] hover:bg-[#20231D] hover:text-[#F8F5EC] border border-transparent',
      link: 'text-[#C7F36B] underline-offset-4 hover:underline p-0 h-auto font-normal',
      success: 'bg-[#EDF7CE] text-[#4E6B18] hover:bg-[#E2F0B5] border border-[#BFDB78] font-bold',
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
