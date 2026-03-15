import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, onKeyDown, ...props }, ref) => {
    const isInteractive = Boolean(onClick);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick?.();
      }
      onKeyDown?.(e);
    };

    return (
      <div
        ref={ref}
        className={`
          bg-[var(--color-surface)]
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-sm)]
          border border-[var(--color-border)]
          p-5
          ${isInteractive ? 'hover:shadow-[var(--shadow-md)] cursor-pointer transition-causa' : ''}
          ${className}
        `}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
