import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-9 w-full border border-[#D8D5CB] bg-[#F7F5EE] px-3 py-1 font-mono text-xs text-[#2B2D27]',
          'shadow-2xs transition-all focus:outline-none focus:border-[#9AB54D]',
          'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
