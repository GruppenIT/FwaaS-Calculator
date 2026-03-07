import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderOpen,
  Calendar,
  DollarSign,
  Plug,
  Settings,
  Shield,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../hooks/use-theme';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'GERAL',
    items: [
      { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/processos', icon: Briefcase, label: 'Processos' },
      { to: '/app/clientes', icon: Users, label: 'Clientes' },
      { to: '/app/agenda', icon: Calendar, label: 'Agenda' },
    ],
  },
  {
    title: 'FINANCEIRO',
    items: [
      { to: '/app/financeiro', icon: DollarSign, label: 'Honorários' },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { to: '/app/conectores', icon: Plug, label: 'Conectores' },
      { to: '/app/usuarios', icon: Shield, label: 'Usuários' },
      { to: '/app/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
          <span className="text-white font-bold text-sm font-[var(--font-brand)]">C</span>
        </div>
        <span className="text-lg-causa text-[var(--color-text)] font-[var(--font-brand)]">
          CAUSA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
              {section.title}
            </div>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-causa ${
                    isActive
                      ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                      : 'text-[var(--color-text)] hover:bg-causa-bg'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[var(--color-border)] flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer flex-1"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Escuro' : 'Claro'}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
