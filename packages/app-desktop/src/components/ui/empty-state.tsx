import type { ElementType } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  message: string;
  description?: string;
  colSpan?: number;
}

export function EmptyState({ icon: Icon, message, description, colSpan }: EmptyStateProps) {
  const content = (
    <>
      <Icon size={32} className="mx-auto text-[var(--color-text-muted)]/30 mb-2" strokeWidth={1} />
      <p className="text-sm-causa text-[var(--color-text-muted)]">{message}</p>
      {description && (
        <p className="text-xs-causa text-[var(--color-text-muted)]/60 mt-1">{description}</p>
      )}
    </>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-12 text-center">
          {content}
        </td>
      </tr>
    );
  }

  return <div className="px-4 py-12 text-center">{content}</div>;
}
