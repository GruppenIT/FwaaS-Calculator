import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { GlobalSearch } from './global-search';
import { UpdateBanner } from '../update-banner';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with global search */}
        <header className="shrink-0 h-14 px-6 flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <GlobalSearch />
        </header>
        <UpdateBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
