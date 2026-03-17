import { useState, useEffect } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

interface TablePreferences {
  sortState: SortState | undefined;
  hiddenColumns: string[];
}

const DEFAULT_PREFERENCES: TablePreferences = {
  sortState: undefined,
  hiddenColumns: [],
};

function readFromStorage(tableId: string): TablePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = localStorage.getItem(`causa-table-${tableId}`);
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored) as Partial<TablePreferences>;
    return {
      sortState: parsed.sortState ?? undefined,
      hiddenColumns: Array.isArray(parsed.hiddenColumns) ? parsed.hiddenColumns : [],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useTablePreferences(tableId: string) {
  const [preferences, setPreferences] = useState<TablePreferences>(() =>
    readFromStorage(tableId),
  );

  useEffect(() => {
    try {
      localStorage.setItem(`causa-table-${tableId}`, JSON.stringify(preferences));
    } catch {
      // localStorage may be unavailable — silently ignore
    }
  }, [tableId, preferences]);

  function setSortState(state: SortState) {
    setPreferences((prev) => ({ ...prev, sortState: state }));
  }

  function toggleColumn(columnKey: string) {
    setPreferences((prev) => {
      const hidden = prev.hiddenColumns.includes(columnKey)
        ? prev.hiddenColumns.filter((k) => k !== columnKey)
        : [...prev.hiddenColumns, columnKey];
      return { ...prev, hiddenColumns: hidden };
    });
  }

  function isColumnVisible(columnKey: string): boolean {
    return !preferences.hiddenColumns.includes(columnKey);
  }

  return {
    sortState: preferences.sortState,
    setSortState,
    hiddenColumns: preferences.hiddenColumns,
    toggleColumn,
    isColumnVisible,
  };
}
