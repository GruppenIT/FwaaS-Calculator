import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Clock, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
import { ColumnVisibilityToggle } from '../../components/ui/column-visibility-toggle';
import { PrazoCountdown, diasRestantes } from './prazo-countdown';
import { PrazoModal } from './prazo-modal';
import type { PrazoEditData } from './prazo-modal';
import { usePermission } from '../../hooks/use-permission';
import { useTablePreferences } from '../../hooks/use-table-preferences';
import * as api from '../../lib/api';
import type { PrazoRow } from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  cumprido: 'bg-causa-success/10 text-causa-success',
  perdido: 'bg-causa-danger/10 text-causa-danger',
  suspenso: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  cumprido: 'Cumprido',
  perdido: 'Perdido',
  suspenso: 'Suspenso',
};

const TIPO_LABELS: Record<string, string> = {
  ncpc: 'NCPC',
  clt: 'CLT',
  jec: 'JEC',
  tributario: 'Tributário',
  administrativo: 'Administrativo',
  contratual: 'Contratual',
  outros: 'Outros',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PrazosPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tierFilter = searchParams.get('tier');
  const [modalData, setModalData] = useState<PrazoEditData | null | undefined>(undefined);
  const [prazos, setPrazos] = useState<PrazoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { sortState, setSortState, hiddenColumns, toggleColumn } = useTablePreferences('prazos');

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarPrazos(filtroStatus ? { status: filtroStatus } : undefined);
      setPrazos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar prazos.', 'error');
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [filtroStatus, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const showModal = modalData !== undefined;

  // Apply tier filter from URL param
  const filtrados = useMemo(() => {
    if (!tierFilter) return prazos;
    return prazos.filter((p) => {
      const dias = diasRestantes(p.dataFatal);
      if (tierFilter === 'fatal') return dias <= 1;
      if (tierFilter === 'urgente') return dias >= 2 && dias <= 3;
      if (tierFilter === 'semana') return dias >= 4 && dias <= 7;
      if (tierFilter === 'proximo') return dias >= 8;
      return true;
    });
  }, [prazos, tierFilter]);

  const sorted = useMemo(() => {
    if (!sortState || sortState.direction === null) return filtrados;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortState.key] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortState.key] ?? '');
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filtrados, sortState]);

  // Keyboard shortcut: N to open create modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showModal || !!deleteId) return;

      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;

      if ((e.key === 'n' || e.key === 'N') && !isInput) {
        if (can('processos:editar')) {
          e.preventDefault();
          setModalData(null);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, deleteId, can]);

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(isEdit ? 'Prazo atualizado com sucesso.' : 'Prazo criado com sucesso.', 'success');
    carregar();
  }

  function handleEdit(p: PrazoRow) {
    setModalData({
      id: p.id,
      processoId: p.processoId,
      numeroCnj: p.numeroCnj,
      descricao: p.descricao,
      dataFatal: p.dataFatal,
      dataInicio: p.dataInicio,
      diasPrazo: p.diasPrazo,
      tipoPrazo: p.tipoPrazo,
      categoriaPrazo: p.categoriaPrazo,
      prioridade: p.prioridade,
      fatal: p.fatal,
      status: p.status,
      responsavelId: p.responsavelId,
      observacoes: p.observacoes,
    });
  }

  async function handleStatusChange(id: string, status: 'cumprido' | 'perdido') {
    try {
      await api.atualizarStatusPrazo(id, status);
      toast('Status atualizado.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao atualizar prazo.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirPrazo(deleteId);
      toast('Prazo excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir prazo.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const columns: Column<PrazoRow>[] = [
    {
      key: 'descricao',
      header: 'Descricao',
      width: 'w-[250px]',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="truncate">{String(value ?? '')}</div>
          <PrazoCountdown dataFatal={row.dataFatal} status={row.status} />
        </div>
      ),
    },
    {
      key: 'numeroCnj',
      header: 'Processo',
      width: 'w-[200px]',
      sortable: true,
      render: (value) =>
        value ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{String(value)}</span>
        ) : (
          <span className="text-[var(--color-text-muted)]">-</span>
        ),
    },
    {
      key: 'dataFatal',
      header: 'Data Fatal',
      width: 'w-[110px]',
      sortable: true,
      render: (value) => formatDate(String(value ?? '')),
    },
    {
      key: 'tipoPrazo',
      header: 'Tipo',
      width: 'w-[100px]',
      render: (value) => (
        <span className="text-xs-causa px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg)] text-[var(--color-text-muted)]">
          {TIPO_LABELS[String(value ?? '')] ?? String(value ?? '')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[100px]',
      render: (value) => {
        const s = String(value ?? '');
        return (
          <span
            className={`text-xs-causa font-medium px-2 py-0.5 rounded-[var(--radius-sm)] ${STATUS_STYLES[s] ?? ''}`}
          >
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: 'responsavelNome',
      header: 'Responsavel',
      width: 'w-[140px]',
      render: (value) => <span className="truncate block">{String(value ?? '-')}</span>,
    },
    {
      key: 'id',
      header: '',
      width: 'w-[100px]',
      align: 'right',
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {can('prazos:cumprido') && row.status === 'pendente' && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-causa-success transition-causa cursor-pointer"
              onClick={() => handleStatusChange(row.id, 'cumprido')}
              title="Marcar como cumprido"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          {can('prazos:editar') && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa cursor-pointer"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={14} />
            </button>
          )}
          {can('prazos:excluir') && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
              onClick={() => setDeleteId(row.id)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Prazos"
        description="Prazos processuais e alertas"
        action={
          can('processos:editar') ? (
            <Button onClick={() => setModalData(null)}>
              <Plus size={16} />
              Novo prazo
            </Button>
          ) : undefined
        }
      />

      {/* Filtro por status + Column visibility */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {[
          { value: '', label: 'Todos' },
          { value: 'pendente', label: 'Pendentes' },
          { value: 'cumprido', label: 'Cumpridos' },
          { value: 'perdido', label: 'Perdidos' },
          { value: 'suspenso', label: 'Suspensos' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFiltroStatus(f.value);
              setLoading(true);
            }}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer ${
              filtroStatus === f.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-causa-surface-alt'
            }`}
          >
            {f.label}
          </button>
        ))}
        <ColumnVisibilityToggle
          columns={columns
            .filter((c) => c.header)
            .map((c) => ({ key: String(c.key), header: String(c.header) }))}
          hiddenColumns={hiddenColumns}
          onToggle={toggleColumn}
        />
      </div>

      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={(loading ? [] : sorted) as unknown as Record<string, unknown>[]}
        keyExtractor={(r) => r['id'] as string}
        onRowClick={(r) => navigate('/app/processos/' + (r['processoId'] as string))}
        {...(sortState !== undefined ? { sortState } : {})}
        onSort={setSortState}
        hiddenColumns={hiddenColumns}
        animateFirstLoad={isFirstLoad}
        emptyIcon={Clock}
        emptyMessage="Nenhum prazo encontrado"
      />

      {showModal && (
        <PrazoModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir prazo"
        message="Tem certeza que deseja excluir este prazo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
