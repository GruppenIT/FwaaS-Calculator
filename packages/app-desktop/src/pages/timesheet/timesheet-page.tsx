import { useState, useEffect, useCallback } from 'react';
import { Plus, Timer, Trash2, Pencil, CheckCircle } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { TimesheetModal } from './timesheet-modal';
import type { TimesheetEditData } from './timesheet-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { TimesheetRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  peticao: 'Petição',
  pesquisa_jurisprudencia: 'Pesquisa',
  reuniao_cliente: 'Reunião',
  audiencia: 'Audiência',
  diligencia: 'Diligência',
  revisao: 'Revisão',
  analise_documental: 'Análise Doc.',
  telefonema: 'Telefonema',
  email: 'E-mail',
  administrativo: 'Administrativo',
  deslocamento: 'Deslocamento',
  outro: 'Outro',
};

function formatDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function TimesheetPage() {
  const [registros, setRegistros] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<TimesheetEditData | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const { can } = usePermission();

  const canRegistrar = can('timesheet:registrar');
  const canAprovar = can('timesheet:aprovar');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listarTimesheets();
      setRegistros(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar registros.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    setEditData(undefined);
    setModalOpen(true);
  }

  function handleEdit(r: TimesheetRow) {
    setEditData({
      id: r.id,
      processoId: r.processoId ?? '',
      clienteId: r.clienteId ?? '',
      tarefaId: r.tarefaId ?? '',
      data: r.data,
      duracaoMinutos: String(r.duracaoMinutos),
      descricao: r.descricao,
      tipoAtividade: r.tipoAtividade,
      faturavel: r.faturavel,
      taxaHorariaAplicada: r.taxaHorariaAplicada ? String(r.taxaHorariaAplicada) : '',
    });
    setModalOpen(true);
  }

  async function handleSave(data: TimesheetEditData) {
    try {
      const payload: Record<string, unknown> = {
        data: data.data,
        duracaoMinutos: parseInt(data.duracaoMinutos) || 0,
        descricao: data.descricao,
        tipoAtividade: data.tipoAtividade,
        faturavel: data.faturavel,
      };
      if (data.processoId) payload.processoId = data.processoId;
      if (data.clienteId) payload.clienteId = data.clienteId;
      if (data.tarefaId) payload.tarefaId = data.tarefaId;
      if (data.taxaHorariaAplicada) {
        payload.taxaHorariaAplicada = parseFloat(data.taxaHorariaAplicada);
      }

      if (data.id) {
        await api.atualizarTimesheet(data.id, payload);
        toast('Registro atualizado.', 'success');
      } else {
        await api.criarTimesheet(payload);
        toast('Registro criado.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar registro.', 'error');
    }
  }

  async function handleAprovar(id: string) {
    try {
      await api.aprovarTimesheet(id);
      toast('Registro aprovado.', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao aprovar registro.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirTimesheet(deleteId);
      toast('Registro excluído.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir registro.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // Group by date for summary
  const totalMinutos = registros.reduce((s, r) => s + r.duracaoMinutos, 0);
  const totalFaturavel = registros
    .filter((r) => r.faturavel)
    .reduce((s, r) => s + r.duracaoMinutos, 0);
  const totalValor = registros.reduce((s, r) => s + (r.valorCalculado ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Timesheet"
        description="Registro de horas e atividades"
        action={
          canRegistrar ? (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Novo Registro
            </Button>
          ) : undefined
        }
      />

      {/* Totalizadores */}
      {!loading && registros.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <div className="text-sm-causa text-[var(--color-text-muted)]">Total de Horas</div>
            <div className="text-xl font-semibold text-[var(--color-text)]">
              {formatDuracao(totalMinutos)}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <div className="text-sm-causa text-[var(--color-text-muted)]">Horas Faturáveis</div>
            <div className="text-xl font-semibold text-causa-success">
              {formatDuracao(totalFaturavel)}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <div className="text-sm-causa text-[var(--color-text-muted)]">Valor Total</div>
            <div className="text-xl font-semibold text-[var(--color-text)]">
              {formatCurrency(totalValor)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm-causa">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-bg">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Data
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Atividade
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Descrição
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Duração
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Valor
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
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={Timer} message="Nenhum registro encontrado" />
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)] hover:bg-causa-bg/50 transition-causa"
                >
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      {TIPO_LABELS[r.tipoAtividade] ?? r.tipoAtividade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[var(--color-text)] max-w-xs truncate">{r.descricao}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {r.numeroCnj && <span>{r.numeroCnj}</span>}
                      {r.clienteNome && (
                        <span>
                          {r.numeroCnj ? ' · ' : ''}
                          {r.clienteNome}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)] font-medium">
                    {formatDuracao(r.duracaoMinutos)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {r.valorCalculado ? formatCurrency(r.valorCalculado) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.faturavel && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-causa-success/10 text-causa-success">
                          Faturável
                        </span>
                      )}
                      {r.aprovado ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-causa-success/10 text-causa-success">
                          Aprovado
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-causa-warning/10 text-causa-warning">
                          Pendente
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canAprovar && !r.aprovado && (
                        <button
                          type="button"
                          onClick={() => handleAprovar(r.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-causa-success hover:bg-causa-success/10 transition-causa cursor-pointer"
                          title="Aprovar"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {canRegistrar && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(r)}
                            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(r.id)}
                            className="p-1.5 rounded-[var(--radius-md)] text-causa-danger hover:bg-causa-danger/10 transition-causa cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
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
        <TimesheetModal
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
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro de tempo?"
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
