import { useState } from 'react';
import { Plus, MoreHorizontal, Shield, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { UsuarioModal } from './usuario-modal';

export interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  oabNumero: string | null;
  oabSeccional: string | null;
  role: string;
  ativo: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  socio: 'Sócio',
  advogado: 'Advogado',
  estagiario: 'Estagiário',
  secretaria: 'Secretária',
  financeiro: 'Financeiro',
};

// TODO: dados reais via IPC/banco
const MOCK_USERS: UsuarioRow[] = [];

export function UsuariosPage() {
  const [showModal, setShowModal] = useState(false);
  const [users] = useState<UsuarioRow[]>(MOCK_USERS);

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie os membros do escritório"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Novo usuário
          </Button>
        }
      />

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Nome</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Email</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">OAB</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Papel</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Shield size={32} className="mx-auto text-[var(--color-text-muted)]/30 mb-2" strokeWidth={1} />
                  <p className="text-sm-causa text-[var(--color-text-muted)]">
                    Nenhum usuário cadastrado além do administrador.
                  </p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa">
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">{user.nome}</td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">{user.email}</td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {user.oabNumero ? `${user.oabNumero}/${user.oabSeccional}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 text-[var(--color-primary)] text-xs-causa font-medium">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${
                      user.ativo
                        ? 'bg-causa-success/10 text-causa-success'
                        : 'bg-causa-surface-alt text-[var(--color-text-muted)]'
                    }`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <UsuarioModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
