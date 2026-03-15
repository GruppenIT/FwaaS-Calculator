import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm-causa font-medium text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`
            h-9 px-3 rounded-[var(--radius-md)]
            bg-[var(--color-surface)] text-[var(--color-text)]
            border text-base-causa
            focus-causa transition-causa
            placeholder:text-[var(--color-text-muted)]/60
            ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs-causa text-[var(--color-danger)]">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
