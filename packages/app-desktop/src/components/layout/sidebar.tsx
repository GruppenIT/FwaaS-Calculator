import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Blocks,
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useTheme } from '../../hooks/use-theme';
import { useAuth, useFeatures } from '../../lib/auth-context';
import { usePermission } from '../../hooks/use-permission';
import { useSidebar } from '../../hooks/use-sidebar';
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
        label: 'Docs não Classificados',
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
        to: '/app/integracoes',
        icon: Blocks,
        label: 'Integrações',
        permissions: ['conectores:executar'],
      },
      { to: '/app/usuarios', icon: Shield, label: 'Usuários', permissions: ['usuarios:gerenciar'] },
      { to: '/app/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

function getInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/);
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (parts.length >= 2 && first.length > 0 && second.length > 0) {
    return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  advogado: 'Advogado',
  estagiario: 'Estagiario',
  secretaria: 'Secretaria',
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { canAny } = usePermission();
  const features = useFeatures();
  const { collapsed, toggle, autoCollapsed } = useSidebar();

  return (
    <aside
      data-sidebar
      className={`${collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'} h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0 transition-all duration-200 overflow-hidden`}
    >
      {/* Logo */}
      <div className={`px-5 py-4 ${collapsed ? 'flex justify-center px-0' : ''}`}>
        <CausaLogo size={collapsed ? 24 : 32} />
      </div>

      {/* Toggle button — only on wide screens */}
      {!autoCollapsed && (
        <div className="px-2.5 mb-1">
          <button
            type="button"
            onClick={toggle}
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-surface-alt transition-causa cursor-pointer w-full flex items-center justify-center"
            title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      )}

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
              {!collapsed && (
                <div className="px-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
                  {section.title}
                </div>
              )}
              {visibleItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/app'}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2'} rounded-[var(--radius-md)] text-[14px] font-medium transition-causa focus-causa ${
                      isActive
                        ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                        : 'text-[var(--color-text)] hover:bg-causa-surface-alt'
                    }`
                  }
                >
                  <Icon size={18} />
                  {!collapsed && label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="px-3 pt-3 pb-2 border-t border-[var(--color-border)]">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2'}`}>
            <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-[11px] font-semibold shrink-0">
              {getInitials(user.email)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-text)] truncate leading-tight">
                  {user.email}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                  {formatRole(user.role)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`px-3 pb-3 pt-1 flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
        <button
          type="button"
          onClick={toggleTheme}
          title={collapsed ? (theme === 'light' ? 'Modo escuro' : 'Modo claro') : undefined}
          className={`flex items-center ${collapsed ? 'justify-center px-2.5 py-2 w-full' : 'gap-2 px-2.5 py-2 flex-1'} rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-causa-surface-alt transition-causa focus-causa cursor-pointer`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {!collapsed && (theme === 'light' ? 'Escuro' : 'Claro')}
        </button>
        <button
          type="button"
          onClick={logout}
          className={`flex items-center ${collapsed ? 'justify-center px-2.5 py-2 w-full' : 'gap-2 px-2.5 py-2'} rounded-[var(--radius-md)] text-[14px] text-[var(--color-text-muted)] hover:bg-causa-surface-alt transition-causa focus-causa cursor-pointer`}
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
