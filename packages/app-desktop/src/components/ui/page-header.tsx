import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string | undefined;
}

interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  breadcrumb?: BreadcrumbItem[] | undefined;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 mb-1.5">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-[var(--color-text-muted)] text-xs-causa select-none">›</span>
              )}
              {item.to ? (
                <Link
                  to={item.to}
                  className="text-xs-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-xs-causa text-[var(--color-text-muted)]">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl-causa text-[var(--color-text)]">{title}</h1>
          {description && (
            <p className="text-sm-causa text-[var(--color-text-muted)] mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
