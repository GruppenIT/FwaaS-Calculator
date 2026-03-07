import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Search, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ClienteModal } from './cliente-modal';
import type { ClienteEditData } from './cliente-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';

interface ClienteRow {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  createdAt: string;
}

export function ClientesPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const [modalData, setModalData] = useState<ClienteEditData | null | undefined>(undefined);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showModal = modalData !== undefined;

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarClientes(busca || undefined);
      setClientes(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar clientes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [busca, toast]);

  useEffect(() => {
    const timer = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(timer);
  }, [carregar, busca]);

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(isEdit ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.', 'success');
    carregar();
  }

  function handleEdit(c: ClienteRow) {
    setModalData({
      id: c.id,
      tipo: c.tipo,
      nome: c.nome,
      cpfCnpj: c.cpfCnpj,
      email: c.email,
      telefone: c.telefone,
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirCliente(deleteId);
      toast('Cliente excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir cliente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pessoas físicas e jurídicas do escritório"
        action={
          can('clientes:criar') ? (
            <Button onClick={() => setModalData(null)}>
              <Plus size={16} />
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      {/* Busca */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Nome / Razão Social
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                CPF/CNPJ
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Contato
              </th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={5} />
            ) : clientes.length === 0 ? (
              <EmptyState
                icon={Users}
                message={busca ? 'Nenhum cliente encontrado.' : 'Cadastre seu primeiro cliente para começar.'}
                colSpan={5}
              />
            ) : (
              clientes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">
                    {c.nome}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {c.cpfCnpj ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                    {c.email ?? c.telefone ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {can('clientes:editar') && (
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {can('clientes:excluir') && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
                          className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ClienteModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cliente"
        message="Tem certeza que deseja excluir este cliente? Processos vinculados podem ser afetados."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
