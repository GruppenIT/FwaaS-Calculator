import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Select = ({
  value,
  onValueChange,
  options,
  placeholder = 'Selecione...',
  label,
  error,
  disabled,
  className = '',
}: SelectProps) => {
  const selectId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm-causa font-medium text-[var(--color-text-muted)]"
        >
          {label}
        </label>
      )}
      <RadixSelect.Root
        {...(value !== undefined && { value })}
        {...(onValueChange !== undefined && { onValueChange })}
        {...(disabled !== undefined && { disabled })}
      >
        <RadixSelect.Trigger
          id={selectId}
          className={`
            inline-flex items-center justify-between
            h-9 px-3 w-full
            rounded-[var(--radius-md)]
            bg-[var(--color-surface)] text-[var(--color-text)]
            border text-base-causa
            focus-causa transition-causa
            disabled:opacity-50 disabled:pointer-events-none
            cursor-pointer
            ${error ? 'border-causa-danger' : 'border-[var(--color-border)]'}
          `}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="
              bg-[var(--color-surface)]
              border border-[var(--color-border)]
              rounded-[var(--radius-md)]
              shadow-[var(--shadow-md)]
              p-1 z-50
              w-[var(--radix-select-trigger-width)]
              max-h-[280px]
              overflow-hidden
            "
          >
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className="
                    px-3 py-2 text-sm-causa
                    rounded-[var(--radius-sm)]
                    cursor-pointer outline-none
                    text-[var(--color-text)]
                    data-[highlighted]:bg-[var(--color-surface-alt)]
                    select-none
                  "
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <span className="text-xs-causa text-causa-danger">{error}</span>}
    </div>
  );
};

Select.displayName = 'Select';
