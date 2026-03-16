import type { ElementType, ReactNode, KeyboardEvent } from 'react';
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
  onRowClick?: (row: T) => void;
  sortState?: SortState;
  onSort?: (state: SortState) => void;
  emptyIcon?: ElementType;
  emptyMessage?: string;
  className?: string;
  animateFirstLoad?: boolean;
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
  sortState,
  onSort,
  emptyIcon = Inbox,
  emptyMessage = 'Nenhum registro encontrado',
  className = '',
  animateFirstLoad,
}: DataTableProps<T>) {
  function handleHeaderClick(column: Column<T>) {
    if (!column.sortable || !onSort) return;
    onSort(nextSortState(column.key, sortState));
  }

  function handleRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <table className="table-fixed w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => {
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
        <tbody>
          {data.length === 0 ? (
            <EmptyState icon={emptyIcon} message={emptyMessage} colSpan={columns.length} />
          ) : (
            data.map((row, idx) => {
              const rowKey = keyExtractor(row);
              const clickable = !!onRowClick;
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
                  className={`border-b border-[var(--color-border)] last:border-0 even:bg-[var(--color-surface-alt)]/50 ${
                    clickable
                      ? 'hover:bg-[var(--color-surface-alt)] cursor-pointer transition-causa focus-visible:outline-none focus-causa'
                      : ''
                  }`}
                  style={staggerStyle}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                  onKeyDown={clickable ? (e) => handleRowKeyDown(e, row) : undefined}
                >
                  {columns.map((col) => {
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
