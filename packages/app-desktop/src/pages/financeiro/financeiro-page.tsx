import { useState, useEffect, useCallback } from 'react';
import { Plus, DollarSign, Pencil, Trash2, Download, X } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Cliente
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Processo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-right px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Valor
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Vencimento
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={7} />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                message="Nenhum honorário cadastrado. Comece registrando seus honorários."
                colSpan={7}
              />
            ) : (
              filtrados.map((h) => {
                return (
                  <tr
                    key={h.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                  >
                    <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">
                      {h.clienteNome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                      {h.numeroCnj ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                        {TIPO_LABELS[h.tipo] ?? h.tipo}
                        {h.tipo === 'exito' && h.percentualExito ? ` ${h.percentualExito}%` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium text-right font-[var(--font-mono)]">
                      {formatCurrency(h.valor)}
                    </td>
                    <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                      {formatDate(h.vencimento)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={h.status}
                        onChange={(e) =>
                          handleStatusChange(
                            h.id,
                            e.target.value as 'pendente' | 'recebido' | 'inadimplente',
                          )
                        }
                        disabled={!can('financeiro:editar')}
                        className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium border-0 ${can('financeiro:editar') ? 'cursor-pointer' : 'cursor-default opacity-75'} ${STATUS_STYLES[h.status] ?? ''}`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="recebido">Recebido</option>
                        <option value="inadimplente">Inadimplente</option>
                        <option value="proposta">Proposta</option>
                        <option value="contratado">Contratado</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {can('financeiro:editar') && (
                          <button
                            type="button"
                            onClick={() => handleEdit(h)}
                            className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {can('financeiro:excluir') && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(h.id)}
                            className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
