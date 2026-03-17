import { useState, useEffect, useRef } from 'react';
import { Columns } from 'lucide-react';

interface ColumnVisibilityToggleProps {
  columns: { key: string; header: string }[];
  hiddenColumns: string[];
  onToggle: (columnKey: string) => void;
}

export function ColumnVisibilityToggle({
  columns,
  hiddenColumns,
  onToggle,
}: ColumnVisibilityToggleProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleDocumentClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [open]);

  // Only show columns that have a header (exclude action columns)
  const togglableColumns = columns.filter((col) => col.header !== '');

  // Count currently visible columns among togglable ones
  const visibleCount = togglableColumns.filter((col) => !hiddenColumns.includes(col.key)).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm-causa font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-causa"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Columns size={14} />
        Colunas
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 z-50 min-w-[180px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-md)] py-1"
          role="listbox"
        >
          {togglableColumns.map((col) => {
            const isVisible = !hiddenColumns.includes(col.key);
            // Disable unchecking if only 2 visible columns remain and this is one of them
            const isDisabled = isVisible && visibleCount <= 2;

            return (
              <label
                key={col.key}
                className={`flex items-center gap-2 px-3 py-2 text-sm-causa cursor-pointer hover:bg-[var(--color-surface-alt)] transition-causa ${
                  isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  disabled={isDisabled}
                  onChange={() => {
                    if (!isDisabled) onToggle(col.key);
                  }}
                  className="accent-[var(--color-primary)]"
                />
                <span className="text-[var(--color-text)]">{col.header}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
