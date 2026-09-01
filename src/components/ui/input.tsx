import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs',
          icon && 'pl-9',
          className
        )}
        {...props}
      />
    </div>
  );
}
