import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, hint, leftAddon, rightAddon, className, id, ...props },
  ref
) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 text-gray-400">{leftAddon}</div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900',
            'placeholder:text-gray-300 text-sm',
            'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all',
            'hover:border-gray-300',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
            leftAddon && 'pl-10',
            rightAddon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 text-gray-400">{rightAddon}</div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
