import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900',
          'shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600',
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
