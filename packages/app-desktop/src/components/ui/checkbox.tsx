import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef } from 'react';

interface CheckboxProps {
  id?: string;
  label?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, label, checked, onCheckedChange, disabled, className = '' }, ref) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <RadixCheckbox.Root
          ref={ref}
          id={checkboxId}
          {...(checked !== undefined && { checked })}
          onCheckedChange={(state) => {
            if (typeof state === 'boolean') {
              onCheckedChange?.(state);
            }
          }}
          {...(disabled !== undefined && { disabled })}
          className="
            h-4 w-4 flex-shrink-0
            rounded-[var(--radius-sm)]
            border border-[var(--color-border)]
            bg-[var(--color-surface)]
            focus-causa transition-causa
            disabled:opacity-50 disabled:pointer-events-none
            data-[state=checked]:bg-[var(--color-primary)]
            data-[state=checked]:border-[var(--color-primary)]
            cursor-pointer
            inline-flex items-center justify-center
          "
        >
          <RadixCheckbox.Indicator>
            <Check size={10} strokeWidth={3} className="text-white" />
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm-causa text-[var(--color-text)] cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
