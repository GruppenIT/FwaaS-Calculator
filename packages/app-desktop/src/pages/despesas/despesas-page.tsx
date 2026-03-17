import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, Trash2, Pencil, Eye } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (despesas.length > 0) {
      if (!selectedId || !despesas.find((d) => d.id === selectedId)) {
        setSelectedId(despesas[0]!.id);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [despesas]);

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

  const columns: Column<DespesaRow>[] = [
    {
      key: 'descricao',
      header: 'Descrição',
      render: (_value, row) => (
        <div>
          <div className="font-medium text-[var(--color-text)]">{row.descricao}</div>
          {row.reembolsavel && (
            <div className="text-xs text-[var(--color-text-muted)]">Reembolsável</div>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (_value, row) => TIPO_LABELS[row.tipo] ?? row.tipo,
    },
    {
      key: 'numeroCnj',
      header: 'Processo',
      render: (_value, row) => row.numeroCnj ?? '—',
    },
    {
      key: 'valor',
      header: 'Valor',
      align: 'right',
      render: (_value, row) => (
        <span className="font-[var(--font-mono)]">{formatCurrency(row.valor)}</span>
      ),
    },
    {
      key: 'data',
      header: 'Data',
      render: (_value, row) => formatDate(row.data),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_value, row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.status] ?? ''}`}
        >
          {STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (_value, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-causa-bg transition-causa cursor-pointer"
              onClick={() => handleEdit(row)}
              title="Ver detalhes"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
            {canApprove && (
              <button
                type="button"
                onClick={() => setDeleteId(row.id)}
                className="p-1.5 rounded-[var(--radius-md)] text-causa-danger hover:bg-causa-danger/10 transition-causa cursor-pointer"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ),
    },
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
        <DataTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={(loading ? [] : despesas) as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r['id'] as string}
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r['id'] as string)}
          onActivate={(r) => { const d = despesas.find(x => x.id === (r['id'] as string)); if (d) handleEdit(d); }}
          emptyIcon={Receipt}
          emptyMessage="Nenhuma despesa encontrada"
        />
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
