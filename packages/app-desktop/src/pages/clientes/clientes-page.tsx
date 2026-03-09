import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, Pencil, Trash2, Download } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ClienteModal } from './cliente-modal';
import type { ClienteEditData } from './cliente-modal';
import { usePermission } from '../../hooks/use-permission';
import type { ClienteData } from '../../lib/api';
import * as api from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  prospecto: 'bg-causa-info/10 text-causa-info',
  ativo: 'bg-causa-success/10 text-causa-success',
  inativo: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

const STATUS_LABELS: Record<string, string> = {
  '': 'Todos',
  prospecto: 'Prospecto',
  ativo: 'Ativo',
  inativo: 'Inativo',
  encerrado: 'Encerrado',
};

export function ClientesPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<ClienteEditData | null | undefined>(undefined);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
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

  const filteredClientes = filtroStatus
    ? clientes.filter((c) => c.statusCliente === filtroStatus)
    : clientes;

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(
      isEdit ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
      'success',
    );
    carregar();
  }

  function handleEdit(c: ClienteData) {
    setModalData(c);
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

      {/* Busca + Filtro Status + Export */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, email, telefone ou WhatsApp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa"
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const header = ['Nome', 'Tipo', 'CPF/CNPJ', 'Email', 'Telefone', 'WhatsApp', 'Status'];
            const lines = filteredClientes.map((c) => [
              c.nome,
              c.tipo,
              c.cpfCnpj ?? '',
              c.email ?? '',
              c.telefone ?? '',
              c.whatsapp ?? '',
              c.statusCliente ?? '',
            ]);
            const csv = [header, ...lines]
              .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
              .join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={filteredClientes.length === 0}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-sm-causa hover:bg-causa-surface-alt transition-causa cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center gap-1.5"
          title="Exportar CSV"
        >
          <Download size={14} />
          CSV
        </button>
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
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={6} />
            ) : filteredClientes.length === 0 ? (
              <EmptyState
                icon={Users}
                message={
                  busca || filtroStatus
                    ? 'Nenhum cliente encontrado.'
                    : 'Cadastre seu primeiro cliente para começar.'
                }
                colSpan={6}
              />
            ) : (
              filteredClientes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/clientes/${c.id}`)}
                      className="text-base-causa text-[var(--color-primary)] hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
                    >
                      {c.nome}
                    </button>
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
                    {c.email ?? c.telefone ?? c.whatsapp ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${STATUS_STYLES[c.statusCliente] ?? ''}`}
                    >
                      {c.statusCliente}
                    </span>
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
