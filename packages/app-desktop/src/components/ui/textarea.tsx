import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm-causa font-medium text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : undefined}
          className={`
            px-3 py-2
            rounded-[var(--radius-md)]
            bg-[var(--color-surface)] text-[var(--color-text)]
            border text-base-causa
            focus-causa transition-causa
            placeholder:text-[var(--color-text-muted)]/60
            resize-y min-h-[80px]
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

Textarea.displayName = 'Textarea';
