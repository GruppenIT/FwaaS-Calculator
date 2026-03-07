import { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, UserX } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { UsuarioModal } from './usuario-modal';
import * as api from '../../lib/api';

interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  oabNumero: string | null;
  oabSeccional: string | null;
  role: string | null;
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

export function UsuariosPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar usuários.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleCreated() {
    setShowModal(false);
    toast('Usuário criado com sucesso.', 'success');
    carregar();
  }

  async function handleDeactivate() {
    if (!deactivateId) return;
    setDeactivating(true);
    try {
      await api.desativarUsuario(deactivateId);
      toast('Usuário desativado.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao desativar usuário.', 'error');
    } finally {
      setDeactivating(false);
      setDeactivateId(null);
    }
  }

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
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Nome
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Email
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                OAB
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Papel
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={6} />
            ) : usuarios.length === 0 ? (
              <EmptyState
                icon={Shield}
                message="Nenhum usuário cadastrado além do administrador."
                colSpan={6}
              />
            ) : (
              usuarios.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">
                    {user.nome}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {user.oabNumero ? `${user.oabNumero}/${user.oabSeccional}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 text-[var(--color-primary)] text-xs-causa font-medium">
                      {ROLE_LABELS[user.role ?? ''] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${
                        user.ativo
                          ? 'bg-causa-success/10 text-causa-success'
                          : 'bg-causa-surface-alt text-[var(--color-text-muted)]'
                      }`}
                    >
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.ativo && user.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => setDeactivateId(user.id)}
                        title="Desativar usuário"
                        className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <UsuarioModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

      <ConfirmDialog
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="Desativar usuário"
        message="Tem certeza que deseja desativar este usuário? Ele perderá acesso ao sistema."
        confirmLabel="Desativar"
        loading={deactivating}
      />
    </div>
  );
}
