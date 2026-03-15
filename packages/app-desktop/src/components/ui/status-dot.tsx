import { type HTMLAttributes, forwardRef } from 'react';
import { type BadgeStatus } from './badge';

interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
  label?: string;
}

const dotColorMap: Record<BadgeStatus, string> = {
  active: 'bg-[var(--color-tier-info)]',
  suspended: 'bg-[var(--color-tier-warning)]',
  archived: 'bg-[var(--color-text-muted)]',
  closed: 'bg-[var(--color-success)]',
};

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ status, label, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 ${className}`}
        {...props}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColorMap[status]}`}
        />
        {label && (
          <span className="text-xs-causa text-[var(--color-text)]">{label}</span>
        )}
      </span>
    );
  },
);

StatusDot.displayName = 'StatusDot';
