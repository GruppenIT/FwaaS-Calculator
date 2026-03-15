import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** @deprecated Use size="sm" instead */
  compact?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]',
  danger:
    'bg-[var(--color-surface)] text-[var(--color-danger)] border border-[var(--color-danger)] hover:bg-[var(--color-danger)]/5',
  ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8',
  md: 'h-9',
  lg: 'h-10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size, compact = false, className = '', children, disabled, ...props },
    ref,
  ) => {
    // Resolve size: explicit size prop takes precedence; compact is a deprecated alias for sm
    const resolvedSize: ButtonSize = size ?? (compact ? 'sm' : 'md');
    const height = sizeStyles[resolvedSize];

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
