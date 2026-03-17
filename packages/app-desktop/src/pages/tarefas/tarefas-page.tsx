import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, CheckSquare, Trash2, Pencil, CheckCircle2, Eye } from 'lucide-react';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { TarefaModal } from './tarefa-modal';
import type { TarefaEditData } from './tarefa-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { TarefaRow } from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  em_andamento: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  concluida: 'bg-causa-success/10 text-causa-success',
  cancelada: 'bg-causa-danger/10 text-causa-danger',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const PRIORIDADE_STYLES: Record<string, string> = {
  baixa: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
  normal: '',
  alta: 'bg-causa-warning/10 text-causa-warning',
  urgente: 'bg-causa-danger/10 text-causa-danger',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

const CATEGORIA_LABELS: Record<string, string> = {
  peticao: 'Petição',
  pesquisa: 'Pesquisa',
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  revisao: 'Revisão',
  diligencia: 'Diligência',
  administrativo: 'Administrativo',
  outro: 'Outro',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TarefasPage() {
  const [tarefas, setTarefas] = useState<TarefaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<TarefaEditData | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { toast } = useToast();
  const { can } = usePermission();

  const canCreate = can('tarefas:criar');
  const canEditAll = can('tarefas:editar_todos');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filtros: { status?: string } = {};
      if (statusFilter) filtros.status = statusFilter;
      const data = await api.listarTarefas(filtros);
      setTarefas(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar tarefas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tarefas.length > 0) {
      if (!selectedId || !tarefas.find((t) => t.id === selectedId)) {
        setSelectedId(tarefas[0]!.id);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefas]);

  function handleNew() {
    setEditData(undefined);
    setModalOpen(true);
  }

  function handleEdit(t: TarefaRow) {
    setEditData({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao ?? '',
      processoId: t.processoId ?? '',
      clienteId: t.clienteId ?? '',
      responsavelId: t.responsavelId,
      prioridade: t.prioridade,
      status: t.status,
      categoria: t.categoria ?? '',
      dataLimite: t.dataLimite ?? '',
      tempoEstimadoMin: t.tempoEstimadoMin?.toString() ?? '',
      tempoGastoMin: t.tempoGastoMin?.toString() ?? '',
      observacoes: t.observacoes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave(data: TarefaEditData) {
    try {
      const payload: Record<string, unknown> = {
        titulo: data.titulo,
        responsavelId: data.responsavelId,
        prioridade: data.prioridade,
        status: data.status,
      };
      if (data.descricao) payload.descricao = data.descricao;
      if (data.processoId) payload.processoId = data.processoId;
      if (data.clienteId) payload.clienteId = data.clienteId;
      if (data.categoria) payload.categoria = data.categoria;
      if (data.dataLimite) payload.dataLimite = data.dataLimite;
      if (data.tempoEstimadoMin) payload.tempoEstimadoMin = Number(data.tempoEstimadoMin);
      if (data.tempoGastoMin) payload.tempoGastoMin = Number(data.tempoGastoMin);
      if (data.observacoes) payload.observacoes = data.observacoes;

      if (data.id) {
        await api.atualizarTarefa(data.id, payload);
        toast('Tarefa atualizada.', 'success');
      } else {
        await api.criarTarefa(payload);
        toast('Tarefa criada.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar tarefa.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirTarefa(deleteId);
      toast('Tarefa excluída.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir tarefa.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleConcluir(id: string) {
    try {
      await api.atualizarTarefa(id, { status: 'concluida' });
      toast('Tarefa concluída.', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao concluir tarefa.', 'error');
    }
  }

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'concluida', label: 'Concluídas' },
    { value: 'cancelada', label: 'Canceladas' },
  ];

  const columns = useMemo<Column<TarefaRow>[]>(
    () => [
      {
        key: 'titulo',
        header: 'Título',
        render: (_value, row) => (
          <div>
            <div className="font-medium text-[var(--color-text)]">{row.titulo}</div>
            {row.numeroCnj && (
              <div className="text-xs text-[var(--color-text-muted)]">{row.numeroCnj}</div>
            )}
          </div>
        ),
      },
      {
        key: 'responsavelNome',
        header: 'Responsável',
        render: (_value, row) => (
          <span className="text-[var(--color-text)]">{row.responsavelNome ?? '—'}</span>
        ),
      },
      {
        key: 'categoria',
        header: 'Categoria',
        render: (_value, row) => (
          <span className="text-[var(--color-text)]">
            {row.categoria ? (CATEGORIA_LABELS[row.categoria] ?? row.categoria) : '—'}
          </span>
        ),
      },
      {
        key: 'prioridade',
        header: 'Prioridade',
        render: (_value, row) => (
          <>
            {row.prioridade !== 'normal' && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDADE_STYLES[row.prioridade] ?? ''}`}
              >
                {PRIORIDADE_LABELS[row.prioridade] ?? row.prioridade}
              </span>
            )}
            {row.prioridade === 'normal' && (
              <span className="text-[var(--color-text-muted)]">Normal</span>
            )}
          </>
        ),
      },
      {
        key: 'dataLimite',
        header: 'Data Limite',
        render: (_value, row) => (
          <span className="text-[var(--color-text)]">
            {row.dataLimite ? formatDate(row.dataLimite) : '—'}
          </span>
        ),
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
        key: 'acoes',
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
              {row.status !== 'concluida' && row.status !== 'cancelada' && (
                <button
                  type="button"
                  onClick={() => handleConcluir(row.id)}
                  className="p-1.5 rounded-[var(--radius-md)] text-causa-success hover:bg-causa-success/10 transition-causa cursor-pointer"
                  title="Concluir"
                >
                  <CheckCircle2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleEdit(row)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              {canEditAll && (
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEditAll],
  );

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Gerenciamento de tarefas e atividades"
        action={
          canCreate ? (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Nova Tarefa
            </Button>
          ) : undefined
        }
      />

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
          data={(loading ? [] : tarefas) as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => r['id'] as string}
          selectedKey={selectedId}
          onSelect={(r) => setSelectedId(r['id'] as string)}
          emptyIcon={CheckSquare}
          emptyMessage="Nenhuma tarefa encontrada"
          onActivate={(r) => { const t = tarefas.find(x => x.id === (r['id'] as string)); if (t) handleEdit(t); }}
        />
      </div>

      {modalOpen && (
        <TarefaModal
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
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
