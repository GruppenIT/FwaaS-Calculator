import { useState, useEffect, useCallback } from 'react';
import { Plus, DollarSign, Eye, Pencil, Trash2, Download, X } from 'lucide-react';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { HonorarioModal } from './honorario-modal';
import type { HonorarioEditData } from './honorario-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { HonorarioRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  fixo: 'Fixo',
  exito: 'Êxito',
  por_hora: 'Por hora',
  sucumbencia: 'Sucumbência',
  dativos: 'Dativos',
  misto: 'Misto',
};

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  recebido: 'bg-causa-success/10 text-causa-success',
  inadimplente: 'bg-causa-danger/10 text-causa-danger',
  proposta: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  contratado: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  em_andamento: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  encerrado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  inadimplente: 'Inadimplente',
  proposta: 'Proposta',
  contratado: 'Contratado',
  em_andamento: 'Em andamento',
  encerrado: 'Encerrado',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

export function FinanceiroPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const [modalData, setModalData] = useState<HonorarioEditData | null | undefined>(undefined);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const showModal = modalData !== undefined;

  // Client-side filters
  const filtrados = honorarios.filter((h) => {
    if (filtroStatus && h.status !== filtroStatus) return false;
    if (periodoInicio) {
      if (!h.vencimento) return false;
      if (h.vencimento < periodoInicio) return false;
    }
    if (periodoFim) {
      if (!h.vencimento) return false;
      if (h.vencimento > periodoFim) return false;
    }
    return true;
  });

  const hasFilters = !!filtroStatus || !!periodoInicio || !!periodoFim;

  // Auto-select first row
  useEffect(() => {
    if (filtrados.length > 0) {
      if (!selectedId || !filtrados.find((h) => h.id === selectedId)) {
        setSelectedId(filtrados[0]!.id);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados]);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarHonorarios();
      setHonorarios(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar honorários.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(
      isEdit ? 'Honorário atualizado com sucesso.' : 'Honorário registrado com sucesso.',
      'success',
    );
    carregar();
  }

  function handleEdit(h: HonorarioRow) {
    setModalData({
      id: h.id,
      clienteId: h.clienteId,
      clienteNome: h.clienteNome,
      processoId: h.processoId,
      numeroCnj: h.numeroCnj,
      tipo: h.tipo,
      descricao: h.descricao,
      valor: h.valor,
      valorBaseExito: h.valorBaseExito,
      percentualExito: h.percentualExito,
      parcelamento: h.parcelamento,
      numeroParcelas: h.numeroParcelas,
      vencimento: h.vencimento,
      indiceCorrecao: h.indiceCorrecao,
      observacoes: h.observacoes,
      status: h.status,
    });
  }

  async function handleStatusChange(id: string, status: 'pendente' | 'recebido' | 'inadimplente') {
    try {
      await api.atualizarHonorario(id, { status });
      toast('Status atualizado.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao atualizar status.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirHonorario(deleteId);
      toast('Honorário excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir honorário.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function exportCsv() {
    const header = ['Cliente', 'Processo', 'Tipo', 'Valor', 'Vencimento', 'Status'];
    const lines = filtrados.map((h) => [
      h.clienteNome ?? '',
      h.numeroCnj ?? '',
      TIPO_LABELS[h.tipo] ?? h.tipo,
      h.valor.toFixed(2),
      h.vencimento ?? '',
      STATUS_LABELS[h.status] ?? h.status,
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'honorarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPendente = filtrados
    .filter((h) => h.status === 'pendente')
    .reduce((s, h) => s + h.valor, 0);
  const totalRecebido = filtrados
    .filter((h) => h.status === 'recebido')
    .reduce((s, h) => s + h.valor, 0);
  const totalInadimplente = filtrados
    .filter((h) => h.status === 'inadimplente')
    .reduce((s, h) => s + h.valor, 0);

  const columns: Column<HonorarioRow>[] = [
    {
      key: 'clienteNome',
      header: 'Cliente',
      render: (_value, row) => (
        <span className="text-base-causa text-[var(--color-text)] font-medium">
          {row.clienteNome ?? '—'}
        </span>
      ),
    },
    {
      key: 'numeroCnj',
      header: 'Processo',
      render: (_value, row) => (
        <span className="text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
          {row.numeroCnj ?? '—'}
        </span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (_value, row) => (
        <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
          {TIPO_LABELS[row.tipo] ?? row.tipo}
          {row.tipo === 'exito' && row.percentualExito ? ` ${row.percentualExito}%` : ''}
        </span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      align: 'right',
      render: (_value, row) => (
        <span className="text-base-causa text-[var(--color-text)] font-medium font-[var(--font-mono)]">
          {formatCurrency(row.valor)}
        </span>
      ),
    },
    {
      key: 'vencimento',
      header: 'Vencimento',
      render: (_value, row) => (
        <span className="text-sm-causa text-[var(--color-text-muted)]">
          {formatDate(row.vencimento)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_value, row) => (
        <select
          value={row.status}
          onChange={(e) =>
            handleStatusChange(
              row.id,
              e.target.value as 'pendente' | 'recebido' | 'inadimplente',
            )
          }
          onClick={(e) => e.stopPropagation()}
          disabled={!can('financeiro:editar')}
          className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium border-0 ${can('financeiro:editar') ? 'cursor-pointer' : 'cursor-default opacity-75'} ${STATUS_STYLES[row.status] ?? ''}`}
        >
          <option value="pendente">Pendente</option>
          <option value="recebido">Recebido</option>
          <option value="inadimplente">Inadimplente</option>
          <option value="proposta">Proposta</option>
          <option value="contratado">Contratado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="encerrado">Encerrado</option>
        </select>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      render: (_value, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
              onClick={() => handleEdit(row)}
              title="Ver detalhes"
            >
              <Eye size={14} />
            </button>
            {can('financeiro:editar') && (
              <button
                type="button"
                onClick={() => handleEdit(row)}
                className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
              >
                <Pencil size={14} />
              </button>
            )}
            {can('financeiro:excluir') && (
              <button
                type="button"
                onClick={() => setDeleteId(row.id)}
                className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
              >
                <Trash2 size={14} />
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
        title="Honorários"
        description="Controle financeiro do escritório"
        action={
          can('financeiro:editar') ? (
            <Button onClick={() => setModalData(null)}>
              <Plus size={16} />
              Novo honorário
            </Button>
          ) : undefined
        }
      />

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="recebido">Recebido</option>
          <option value="inadimplente">Inadimplente</option>
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-sm-causa text-[var(--color-text-muted)]">De</span>
          <input
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            className="h-9 px-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa"
          />
          <span className="text-sm-causa text-[var(--color-text-muted)]">até</span>
          <input
            type="date"
            value={periodoFim}
            onChange={(e) => setPeriodoFim(e.target.value)}
            className="h-9 px-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFiltroStatus('');
              setPeriodoInicio('');
              setPeriodoFim('');
            }}
            className="h-9 px-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-causa-surface-alt transition-causa cursor-pointer"
            title="Limpar filtros"
          >
            <X size={16} />
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtrados.length === 0}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-sm-causa hover:bg-causa-surface-alt transition-causa cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center gap-1.5"
          title="Exportar CSV"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Pendente</div>
          <div className="text-xl-causa text-causa-warning font-semibold">
            {formatCurrency(totalPendente)}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Recebido</div>
          <div className="text-xl-causa text-causa-success font-semibold">
            {formatCurrency(totalRecebido)}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Inadimplente</div>
          <div className="text-xl-causa text-causa-danger font-semibold">
            {formatCurrency(totalInadimplente)}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <DataTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={(loading ? [] : filtrados) as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r['id'] as string}
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r['id'] as string)}
          onActivate={(r) => { const h = filtrados.find(x => x.id === (r['id'] as string)); if (h) handleEdit(h); }}
          emptyIcon={DollarSign}
          emptyMessage="Nenhum honorário cadastrado. Comece registrando seus honorários."
        />
      </div>

      {showModal && (
        <HonorarioModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir honorário"
        message="Tem certeza que deseja excluir este honorário? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
