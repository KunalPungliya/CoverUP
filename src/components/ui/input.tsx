import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  );
}
