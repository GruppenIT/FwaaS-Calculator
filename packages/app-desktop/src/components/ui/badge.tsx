import { type HTMLAttributes, forwardRef } from 'react';

export type BadgeStatus = 'active' | 'suspended' | 'archived' | 'closed';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  active: {
    label: 'Ativo',
    className:
      'bg-[var(--color-tier-info)]/10 text-[var(--color-tier-info)]',
  },
  suspended: {
    label: 'Suspenso',
    className:
      'bg-[var(--color-tier-warning)]/10 text-[var(--color-tier-warning)]',
  },
  archived: {
    label: 'Arquivado',
    className:
      'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
  },
  closed: {
    label: 'Encerrado',
    className:
      'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ status, className = '', ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5
          rounded-[var(--radius-sm)]
          text-xs-causa font-medium
          ${config.className}
          ${className}
        `}
        {...props}
      >
        {config.label}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
