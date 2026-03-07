import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  compact?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-causa-surface-alt',
  danger:
    'bg-[var(--color-surface)] text-causa-danger border border-causa-danger hover:bg-causa-danger/5',
  ghost:
    'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', compact = false, className = '', children, disabled, ...props }, ref) => {
    const height = compact ? 'h-8' : 'h-9';

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 px-4
          ${height} rounded-[var(--radius-md)]
          text-sm-causa font-medium
          transition-causa focus-causa
          disabled:opacity-50 disabled:pointer-events-none
          cursor-pointer
          ${variantStyles[variant]}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
