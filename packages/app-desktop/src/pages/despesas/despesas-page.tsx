import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, Trash2, Pencil } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DespesaModal } from './despesa-modal';
import type { DespesaEditData } from './despesa-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { DespesaRow } from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  pago: 'bg-causa-success/10 text-causa-success',
  reembolsado: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  cancelado: 'bg-causa-danger/10 text-causa-danger',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  reembolsado: 'Reembolsado',
  cancelado: 'Cancelado',
};

const TIPO_LABELS: Record<string, string> = {
  custas_judiciais: 'Custas Judiciais',
  pericia: 'Perícia',
  diligencia: 'Diligência',
  correspondente: 'Correspondente',
  copia_autenticada: 'Cópia Autenticada',
  cartorio: 'Cartório',
  deslocamento: 'Deslocamento',
  correio: 'Correio',
  publicacao: 'Publicação',
  outra: 'Outra',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function DespesasPage() {
  const [despesas, setDespesas] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<DespesaEditData | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { toast } = useToast();
  const { can } = usePermission();

  const canCreate = can('despesas:criar');
  const canApprove = can('despesas:aprovar');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filtros: { status?: string } = {};
      if (statusFilter) filtros.status = statusFilter;
      const data = await api.listarDespesas(filtros);
      setDespesas(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar despesas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    setEditData(undefined);
    setModalOpen(true);
  }

  function handleEdit(d: DespesaRow) {
    setEditData({
      id: d.id,
      processoId: d.processoId ?? '',
      tipo: d.tipo,
      descricao: d.descricao,
      valor: d.valor.toString(),
      data: d.data,
      antecipadoPor: d.antecipadoPor,
      reembolsavel: d.reembolsavel,
      status: d.status,
    });
    setModalOpen(true);
  }

  async function handleSave(data: DespesaEditData) {
    try {
      const payload: Record<string, unknown> = {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: Number(data.valor),
        data: data.data,
        antecipadoPor: data.antecipadoPor,
        reembolsavel: data.reembolsavel,
        status: data.status,
      };
      if (data.processoId) payload.processoId = data.processoId;

      if (data.id) {
        await api.atualizarDespesa(data.id, payload);
        toast('Despesa atualizada.', 'success');
      } else {
        await api.criarDespesa(payload);
        toast('Despesa criada.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar despesa.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirDespesa(deleteId);
      toast('Despesa excluída.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir despesa.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const totalPendente = despesas
    .filter((d) => d.status === 'pendente')
    .reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas
    .filter((d) => d.status === 'pago')
    .reduce((sum, d) => sum + d.valor, 0);

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'pago', label: 'Pagos' },
    { value: 'reembolsado', label: 'Reembolsados' },
    { value: 'cancelado', label: 'Cancelados' },
  ];

  return (
    <div>
      <PageHeader
        title="Despesas"
        description="Controle de despesas processuais"
        action={
          canCreate ? (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Nova Despesa
            </Button>
          ) : undefined
        }
      />

      {/* Totalizadores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs-causa text-[var(--color-text-muted)]">Total Pendente</div>
          <div className="text-lg font-semibold text-causa-warning font-[var(--font-mono)]">
            {formatCurrency(totalPendente)}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs-causa text-[var(--color-text-muted)]">Total Pago</div>
          <div className="text-lg font-semibold text-causa-success font-[var(--font-mono)]">
            {formatCurrency(totalPago)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            type="button"
            onClick={() => setStatusFilter(sf.value)}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer ${
              statusFilter === sf.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-causa-bg'
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm-causa">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-bg">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Descrição
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Processo
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Valor
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Data
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows cols={7} rows={5} />
            ) : despesas.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={Receipt} message="Nenhuma despesa encontrada" />
                </td>
              </tr>
            ) : (
              despesas.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-border)] hover:bg-causa-bg/50 transition-causa"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-text)]">{d.descricao}</div>
                    {d.reembolsavel && (
                      <div className="text-xs text-[var(--color-text-muted)]">Reembolsável</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {TIPO_LABELS[d.tipo] ?? d.tipo}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{d.numeroCnj ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-[var(--font-mono)] text-[var(--color-text)]">
                    {formatCurrency(d.valor)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{formatDate(d.data)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] ?? ''}`}
                    >
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(d)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      {canApprove && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(d.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-causa-danger hover:bg-causa-danger/10 transition-causa cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
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

      {modalOpen && (
        <DespesaModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initial={editData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
