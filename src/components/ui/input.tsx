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
          'h-9 w-full border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-xs text-[#2B2D27]',
          'placeholder:text-[#9A9B91]',
          'focus:outline-none focus:border-[#9AB54D]',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs',
          icon && 'pl-9',
          className
        )}
        {...props}
      />
    </div>
  );
}
