import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Search, Pencil, Trash2, Download, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
import { Badge } from '../../components/ui/badge';
import type { BadgeStatus } from '../../components/ui/badge';
import { ProcessoModal } from './processo-modal';
import type { ProcessoEditData } from './processo-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { ProcessoListRow } from '../../lib/api';

export const STATUS_TO_BADGE: Record<string, BadgeStatus> = {
  ativo: 'active',
  suspenso: 'suspended',
  arquivado: 'archived',
  encerrado: 'closed',
  baixado: 'archived',
};

const PRIORIDADE_STYLES: Record<string, string> = {
  normal: '',
  idoso: 'bg-causa-warning/10 text-causa-warning',
  deficiente: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  grave_enfermidade: 'bg-causa-danger/10 text-causa-danger',
  reu_preso: 'bg-causa-danger/10 text-causa-danger',
};

const AREA_LABELS: Record<string, string> = {
  civel: 'Cível',
  trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário',
  criminal: 'Criminal',
  tributario: 'Tributário',
  familia: 'Família',
  consumidor: 'Consumidor',
  ambiental: 'Ambiental',
  administrativo: 'Administrativo',
  outro: 'Outro',
};

export function ProcessosPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<ProcessoEditData | null | undefined>(undefined);
  const [processos, setProcessos] = useState<ProcessoListRow[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [sortState, setSortState] = useState<
    { key: string; direction: 'asc' | 'desc' | null } | undefined
  >(undefined);

  const showModal = modalData !== undefined;

  const filtrados = processos.filter((p) => {
    if (filtroStatus && p.status !== filtroStatus) return false;
    if (filtroArea && p.area !== filtroArea) return false;
    return true;
  });

  const sorted = useMemo(() => {
    if (!sortState || sortState.direction === null) return filtrados;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortState.key] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortState.key] ?? '');
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filtrados, sortState]);

  const areas = [...new Set(processos.map((p) => p.area))].sort();
  const hasFilters = !!filtroStatus || !!filtroArea;

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarProcessos(busca || undefined);
      setProcessos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar processos.', 'error');
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [busca, toast]);

  useEffect(() => {
    const timer = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(timer);
  }, [carregar, busca]);

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(
      isEdit ? 'Processo atualizado com sucesso.' : 'Processo cadastrado com sucesso.',
      'success',
    );
    carregar();
  }

  function handleEdit(p: ProcessoListRow) {
    setModalData({
      id: p.id,
      numeroCnj: p.numeroCnj,
      numeroAntigo: null,
      clienteId: '',
      clienteNome: p.clienteNome,
      clienteQualidade: null,
      tribunalSigla: p.tribunalSigla,
      plataforma: p.plataforma,
      area: p.area,
      fase: p.fase,
      status: p.status,
      grau: p.grau,
      comarca: p.comarca,
      vara: null,
      juiz: null,
      rito: null,
      prioridade: p.prioridade,
      segredoJustica: false,
      justicaGratuita: false,
      valorCausa: p.valorCausa,
      observacoes: null,
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirProcesso(deleteId);
      toast('Processo excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir processo.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function exportCsv(rows: ProcessoListRow[]) {
    const header = [
      'Número CNJ',
      'Cliente',
      'Advogado',
      'Tribunal',
      'Área',
      'Comarca',
      'Prioridade',
      'Status',
    ];
    const lines = rows.map((p) => [
      p.numeroCnj,
      p.clienteNome ?? '',
      p.advogadoNome ?? '',
      p.tribunalSigla,
      p.area,
      p.comarca ?? '',
      p.prioridade,
      p.status,
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<ProcessoListRow>[] = [
    {
      key: 'numeroCnj',
      header: 'Numero CNJ',
      width: 'w-[220px]',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <span
            className="text-[var(--color-primary)] font-medium"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
          >
            {String(value ?? '')}
          </span>
          {row.prioridade !== 'normal' && (
            <span
              className={`inline-flex px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${PRIORIDADE_STYLES[row.prioridade] ?? ''}`}
            >
              {row.prioridade === 'idoso'
                ? 'Idoso'
                : row.prioridade === 'deficiente'
                  ? 'PCD'
                  : row.prioridade === 'grave_enfermidade'
                    ? 'Enf.'
                    : row.prioridade === 'reu_preso'
                      ? 'Preso'
                      : row.prioridade}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'clienteNome',
      header: 'Cliente',
      width: 'w-[200px]',
      sortable: true,
      render: (value) => <span className="truncate block">{String(value ?? '-')}</span>,
    },
    {
      key: 'advogadoNome',
      header: 'Advogado',
      width: 'w-[160px]',
      sortable: true,
      render: (value) => <span className="truncate block">{String(value ?? '-')}</span>,
    },
    {
      key: 'tribunalSigla',
      header: 'Tribunal',
      width: 'w-[80px]',
    },
    {
      key: 'area',
      header: 'Area',
      width: 'w-[100px]',
      render: (value) => AREA_LABELS[String(value ?? '')] ?? String(value ?? ''),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[100px]',
      render: (value) => {
        const mapped = STATUS_TO_BADGE[String(value ?? '')] ?? 'archived';
        return <Badge status={mapped} />;
      },
    },
    {
      key: 'id',
      header: '',
      width: 'w-[80px]',
      align: 'right',
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {can('processos:editar') && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa cursor-pointer"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={14} />
            </button>
          )}
          {can('processos:excluir') && (
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
        title="Processos"
        description="Acompanhe todos os processos do escritório"
        action={
          can('processos:criar') ? (
            <Button onClick={() => setModalData(null)}>
              <Plus size={16} />
              Novo processo
            </Button>
          ) : undefined
        }
      />

      {/* Busca + Filtros */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar por número CNJ, nome do cliente ou comarca..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa cursor-pointer"
        >
          <option value="">Status</option>
          <option value="ativo">Ativo</option>
          <option value="arquivado">Arquivado</option>
          <option value="encerrado">Encerrado</option>
          <option value="suspenso">Suspenso</option>
          <option value="baixado">Baixado</option>
        </select>
        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa cursor-pointer"
        >
          <option value="">Área</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a] ?? a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFiltroStatus('');
              setFiltroArea('');
            }}
            className="h-9 px-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-causa-surface-alt transition-causa cursor-pointer"
            title="Limpar filtros"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => exportCsv(filtrados)}
          disabled={filtrados.length === 0}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-sm-causa hover:bg-causa-surface-alt transition-causa cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center gap-1.5"
          title="Exportar CSV"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={(loading ? [] : sorted) as unknown as Record<string, unknown>[]}
        keyExtractor={(r) => r['id'] as string}
        onRowClick={(r) => navigate(`/app/processos/${r['id'] as string}`)}
        {...(sortState !== undefined ? { sortState } : {})}
        onSort={setSortState}
        animateFirstLoad={isFirstLoad}
        emptyIcon={Briefcase}
        emptyMessage={
          busca || hasFilters ? 'Nenhum processo encontrado.' : 'Cadastre seu primeiro processo.'
        }
      />

      {showModal && (
        <ProcessoModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir processo"
        message="Tem certeza que deseja excluir este processo? Prazos e honorários vinculados podem ser afetados."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
