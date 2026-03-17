import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  autoCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'causa-sidebar-collapsed';
const NARROW_QUERY = '(max-width: 1024px)';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [autoCollapsed, setAutoCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(NARROW_QUERY).matches;
  });

  const [manualCollapsed, setManualCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(NARROW_QUERY);

    const handleChange = (e: MediaQueryListEvent) => {
      setAutoCollapsed(e.matches);
    };

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    // Only meaningful when not autoCollapsed (wide screens)
    setManualCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const collapsed = autoCollapsed || manualCollapsed;

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, autoCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return ctx;
}
