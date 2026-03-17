import type { ElementType, ReactNode, KeyboardEvent } from 'react';
import { useRef, useMemo, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react';
import { EmptyState } from './empty-state';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  /** @deprecated Use selectedKey + onSelect instead */
  onRowClick?: (row: T) => void;
  selectedKey?: string | number | null;
  onSelect?: (row: T) => void;
  onActivate?: (row: T) => void;
  sortState?: SortState;
  onSort?: (state: SortState) => void;
  emptyIcon?: ElementType;
  emptyMessage?: string;
  className?: string;
  animateFirstLoad?: boolean;
  hiddenColumns?: string[];
}

function SortIcon({
  columnKey,
  sortState,
}: {
  columnKey: string;
  sortState: SortState | undefined;
}) {
  if (!sortState || sortState.key !== columnKey || sortState.direction === null) {
    return <ArrowUpDown size={14} className="inline-block ml-1 opacity-40" />;
  }
  if (sortState.direction === 'asc') {
    return <ArrowUp size={14} className="inline-block ml-1 text-[var(--color-primary)]" />;
  }
  return <ArrowDown size={14} className="inline-block ml-1 text-[var(--color-primary)]" />;
}

function nextSortState(columnKey: string, current?: SortState): SortState {
  if (!current || current.key !== columnKey || current.direction === null) {
    return { key: columnKey, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { key: columnKey, direction: 'desc' };
  }
  return { key: columnKey, direction: null };
}

const ALIGN_MAP = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  onSelect,
  onActivate,
  sortState,
  onSort,
  emptyIcon = Inbox,
  emptyMessage = 'Nenhum registro encontrado',
  className = '',
  animateFirstLoad,
  hiddenColumns,
}: DataTableProps<T>) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const isSelectable = onSelect !== undefined;
  const isClickable = isSelectable || !!onRowClick;

  const visibleColumns = useMemo(() => {
    if (!hiddenColumns || hiddenColumns.length === 0) return columns;
    return columns.filter((col) => !hiddenColumns.includes(col.key));
  }, [columns, hiddenColumns]);

  // Focus the selected row when selectedKey changes via keyboard
  useEffect(() => {
    if (selectedKey == null || !tbodyRef.current) return;
    const row = tbodyRef.current.querySelector(`tr[data-row-key="${selectedKey}"]`) as HTMLElement | null;
    if (row && document.activeElement !== row) {
      // Only focus if a table row already has focus (keyboard navigation)
      if (document.activeElement?.closest('tbody') === tbodyRef.current) {
        row.focus();
      }
    }
  }, [selectedKey]);

  function handleHeaderClick(column: Column<T>) {
    if (!column.sortable || !onSort) return;
    onSort(nextSortState(column.key, sortState));
  }

  function handleRowClick(row: T) {
    if (onSelect) {
      onSelect(row);
    } else if (onRowClick) {
      onRowClick(row);
    }
  }

  function handleRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onActivate) {
        onActivate(row);
      } else if (onRowClick) {
        onRowClick(row);
      }
    }
  }

  function handleTbodyKeyDown(e: KeyboardEvent<HTMLTableSectionElement>) {
    if (!isClickable) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const currentRow = (e.target as HTMLElement).closest('tr');
    if (!currentRow) return;
    const targetRow =
      e.key === 'ArrowDown'
        ? (currentRow.nextElementSibling as HTMLElement | null)
        : (currentRow.previousElementSibling as HTMLElement | null);
    if (targetRow) {
      targetRow.focus();
      // Select the row that receives focus
      const rowKey = targetRow.getAttribute('data-row-key');
      if (rowKey && onSelect) {
        const targetData = data.find((r) => String(keyExtractor(r)) === rowKey);
        if (targetData) onSelect(targetData);
      }
    }
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <table className="table-fixed w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {visibleColumns.map((col) => {
              const alignClass = ALIGN_MAP[col.align ?? 'left'];
              return (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs-causa font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ${alignClass} ${col.width ?? ''} ${
                    col.sortable
                      ? 'cursor-pointer select-none hover:text-[var(--color-text)] transition-causa'
                      : ''
                  }`}
                  onClick={() => handleHeaderClick(col)}
                >
                  <span className="inline-flex items-center gap-0">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} sortState={sortState} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody ref={tbodyRef} onKeyDown={handleTbodyKeyDown}>
          {data.length === 0 ? (
            <EmptyState icon={emptyIcon} message={emptyMessage} colSpan={visibleColumns.length} />
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedKey != null && rowKey === selectedKey;
              const staggerStyle =
                animateFirstLoad && idx < 10
                  ? {
                      animationName: 'rowFadeIn',
                      animationDuration: '200ms',
                      animationTimingFunction: 'ease-out',
                      animationFillMode: 'both' as const,
                      animationDelay: `${idx * 20}ms`,
                    }
                  : undefined;
              return (
                <tr
                  key={rowKey}
                  data-row-key={rowKey}
                  className={`border-b border-[var(--color-border)] last:border-0 ${
                    isSelected
                      ? 'bg-[var(--color-primary)]/10'
                      : 'even:bg-[var(--color-surface-alt)]/50'
                  } ${
                    isClickable
                      ? 'hover:bg-[var(--color-surface-alt)] cursor-pointer transition-causa focus-visible:outline-none focus-causa'
                      : ''
                  }`}
                  style={staggerStyle}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? () => handleRowClick(row) : undefined}
                  onDoubleClick={onActivate ? () => onActivate(row) : undefined}
                  onKeyDown={isClickable ? (e) => handleRowKeyDown(e, row) : undefined}
                >
                  {visibleColumns.map((col) => {
                    const alignClass = ALIGN_MAP[col.align ?? 'left'];
                    const rawValue = row[col.key];
                    const cellContent = col.render
                      ? col.render(rawValue, row)
                      : rawValue != null
                        ? String(rawValue)
                        : '';
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm-causa text-[var(--color-text)] ${alignClass} ${col.width ?? ''}`}
                      >
                        <div className="min-w-0 truncate">{cellContent}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
