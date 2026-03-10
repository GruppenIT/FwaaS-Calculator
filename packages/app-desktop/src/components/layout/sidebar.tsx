import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Plug,
  Settings,
  Shield,
  Moon,
  Sun,
  LogOut,
  CheckSquare,
  FileText,
  Receipt,
  Contact,
  Timer,
} from 'lucide-react';
import { useTheme } from '../../hooks/use-theme';
import { useAuth, useFeatures } from '../../lib/auth-context';
import { usePermission } from '../../hooks/use-permission';
import { CausaLogo } from '../ui/causa-logo';
import type { AppFeatures } from '../../lib/api';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  /** Permissões necessárias (OR) para exibir. Vazio = sempre visível. */
  permissions?: string[];
  /** Feature flag necessária para exibir o item */
  featureFlag?: keyof AppFeatures;
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
      {
        to: '/app/processos',
        icon: Briefcase,
        label: 'Processos',
        permissions: ['processos:ler_todos', 'processos:ler_proprios'],
      },
      { to: '/app/clientes', icon: Users, label: 'Clientes', permissions: ['clientes:ler_todos'] },
      {
        to: '/app/agenda',
        icon: Calendar,
        label: 'Agenda',
        permissions: ['agenda:gerenciar_todos'],
      },
      {
        to: '/app/prazos',
        icon: Clock,
        label: 'Prazos',
        permissions: ['processos:ler_todos', 'processos:ler_proprios'],
      },
      {
        to: '/app/tarefas',
        icon: CheckSquare,
        label: 'Tarefas',
        permissions: ['tarefas:ler_todos', 'tarefas:ler_proprios'],
      },
      {
        to: '/app/documentos',
        icon: FileText,
        label: 'Documentos',
        permissions: ['documentos:ler_todos'],
      },
      {
        to: '/app/timesheet',
        icon: Timer,
        label: 'Timesheet',
        permissions: ['timesheet:registrar', 'timesheet:ler_todos', 'timesheet:ler_proprios'],
      },
    ],
  },
  {
    title: 'FINANCEIRO',
    items: [
      {
        to: '/app/financeiro',
        icon: DollarSign,
        label: 'Honorários',
        permissions: ['financeiro:ler_todos', 'financeiro:ler_proprios'],
        featureFlag: 'financeiro',
      },
      {
        to: '/app/despesas',
        icon: Receipt,
        label: 'Despesas',
        permissions: ['despesas:ler_todos'],
      },
    ],
  },
  {
    title: 'REDE',
    items: [
      {
        to: '/app/contatos',
        icon: Contact,
        label: 'Contatos',
        permissions: ['contatos:gerenciar'],
      },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      {
        to: '/app/conectores',
        icon: Plug,
        label: 'Conectores',
        permissions: ['conectores:executar'],
      },
      { to: '/app/usuarios', icon: Shield, label: 'Usuários', permissions: ['usuarios:gerenciar'] },
      { to: '/app/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { canAny } = usePermission();
  const features = useFeatures();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Verificar status atual
    window.causaElectron?.getUpdateStatus().then((s) => {
      setUpdateAvailable(s.state === 'available' || s.state === 'downloaded');
    }).catch(() => {});
    // Escutar mudanças
    const unsub = window.causaElectron?.onUpdateStatus((s) => {
      setUpdateAvailable(s.state === 'available' || s.state === 'downloaded');
    });
    return () => { unsub?.(); };
  }, []);

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4">
        <CausaLogo size={32} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) =>
              (!item.permissions || canAny(item.permissions)) &&
              (!item.featureFlag || features[item.featureFlag]),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title} className="mb-4">
              <div className="px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                {section.title}
              </div>
              {visibleItems.map(({ to, icon: Icon, label }) => {
                const showBadge = updateAvailable && to === '/app/configuracoes';
                return (
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
                    <span className="relative">
                      <Icon size={18} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-surface)]" />
                      )}
                    </span>
                    {label}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
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
          onClick={logout}
          className="flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
