import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl-causa text-[var(--color-text)]">{title}</h1>
        {description && (
          <p className="text-sm-causa text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
