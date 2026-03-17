import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Sidebar } from './sidebar';
import { GlobalSearch } from './global-search';
import { UpdateBanner } from '../update-banner';
import { BackupIndicator } from '../ui/backup-indicator';
import { DeadlineBanner } from './deadline-banner';
import { SidebarProvider } from '../../hooks/use-sidebar';

export function AppLayout() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <SidebarProvider>
    <div className="flex h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with global search */}
        <header className="shrink-0 h-14 px-6 flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <GlobalSearch />
        </header>
        <DeadlineBanner />
        <UpdateBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeInOut' as const }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BackupIndicator />
    </div>
    </SidebarProvider>
  );
}
