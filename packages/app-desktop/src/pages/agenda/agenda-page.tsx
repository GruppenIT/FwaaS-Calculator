import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, Trash2, Video, Eye } from 'lucide-react';
import { DataTable } from '../../components/ui/data-table';
import type { Column } from '../../components/ui/data-table';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { EventoModal } from './evento-modal';
import type { EventoEditData } from './evento-modal';
import * as api from '../../lib/api';
import type { AgendaRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  audiencia: 'Audiência',
  diligencia: 'Diligência',
  reuniao: 'Reunião',
  prazo: 'Prazo',
  pericia: 'Perícia',
  mediacao: 'Mediação',
  conciliacao: 'Conciliação',
  depoimento: 'Depoimento',
  juri: 'Júri',
  outro: 'Outro',
};

const TIPO_STYLES: Record<string, string> = {
  audiencia: 'bg-causa-primary/10 text-[var(--color-primary)]',
  diligencia: 'bg-causa-warning/10 text-causa-warning',
  reuniao: 'bg-causa-success/10 text-causa-success',
  prazo: 'bg-causa-danger/10 text-causa-danger',
  pericia: 'bg-causa-accent-purple/10 text-causa-accent-purple',
  mediacao: 'bg-causa-accent-pink/10 text-causa-accent-pink',
  conciliacao: 'bg-causa-success/10 text-causa-success',
  depoimento: 'bg-causa-warning/10 text-causa-warning',
  juri: 'bg-causa-danger/10 text-causa-danger',
  outro: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
};

const STATUS_STYLES: Record<string, string> = {
  agendado: 'bg-causa-warning/10 text-causa-warning',
  confirmado: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  realizado: 'bg-causa-success/10 text-causa-success',
  cancelado: 'bg-causa-danger/10 text-causa-danger',
  reagendado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function AgendaPage() {
  const { toast } = useToast();
  const [modalData, setModalData] = useState<EventoEditData | null | undefined>(undefined);
  const [eventos, setEventos] = useState<AgendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtrados = eventos.filter((e) => {
    if (filtroStatus && e.statusAgenda !== filtroStatus) return false;
    return true;
  });

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarAgenda();
      setEventos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar agenda.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (filtrados.length > 0) {
      if (!selectedId || !filtrados.find((e) => e.id === selectedId)) {
        setSelectedId(filtrados[0]!.id);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrados]);

  const showModal = modalData !== undefined;

  function handleEdit(e: AgendaRow) {
    setModalData({
      id: e.id,
      titulo: e.titulo,
      descricao: e.descricao ?? '',
      tipo: e.tipo,
      dataHoraInicio: e.dataHoraInicio.slice(0, 16),
      dataHoraFim: e.dataHoraFim?.slice(0, 16) ?? '',
      diaInteiro: e.diaInteiro,
      local: e.local ?? '',
      linkVideoconferencia: e.linkVideoconferencia ?? '',
      cor: e.cor ?? '',
      processoId: e.processoId ?? '',
      numeroCnj: e.numeroCnj ?? '',
    });
  }

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(isEdit ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.', 'success');
    carregar();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirEvento(deleteId);
      toast('Evento excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir evento.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await api.atualizarEvento(id, { statusAgenda: status });
      toast('Status atualizado.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao atualizar status.', 'error');
    }
  }

  const columns: Column<AgendaRow>[] = useMemo(
    () => [
      {
        key: 'titulo',
        header: 'Título',
        render: (_value, e) => (
          <div className="flex items-start gap-2 min-w-0">
            {e.cor && (
              <div
                className="flex-shrink-0 w-1 self-stretch rounded-full mt-0.5"
                style={{ backgroundColor: e.cor }}
              />
            )}
            <div className="min-w-0">
              <span className="text-base-causa text-[var(--color-text)] font-medium block truncate">
                {e.titulo}
              </span>
              {e.descricao && (
                <p className="text-xs-causa text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                  {e.descricao}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        width: 'w-32',
        render: (_value, e) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${TIPO_STYLES[e.tipo] ?? ''}`}
          >
            {TIPO_LABELS[e.tipo] ?? e.tipo}
          </span>
        ),
      },
      {
        key: 'dataHoraInicio',
        header: 'Início',
        width: 'w-40',
        render: (_value, e) => (
          <span className="text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
            {e.diaInteiro ? formatDate(e.dataHoraInicio) : formatDateTime(e.dataHoraInicio)}
            {e.diaInteiro && (
              <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">dia inteiro</span>
            )}
          </span>
        ),
      },
      {
        key: 'numeroCnj',
        header: 'Processo',
        width: 'w-40',
        render: (_value, e) => (
          <span className="text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
            {e.numeroCnj ?? '—'}
          </span>
        ),
      },
      {
        key: 'statusAgenda',
        header: 'Status',
        width: 'w-36',
        render: (_value, e) => (
          <div onClick={(ev) => ev.stopPropagation()}>
            <select
              value={e.statusAgenda}
              onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
              className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium border-0 cursor-pointer ${STATUS_STYLES[e.statusAgenda] ?? ''}`}
            >
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
              <option value="reagendado">Reagendado</option>
            </select>
          </div>
        ),
      },
      {
        key: 'local',
        header: 'Local',
        render: (_value, e) => (
          <div className="flex items-center gap-1 text-sm-causa text-[var(--color-text-muted)]">
            <span className="truncate">{e.local ?? '—'}</span>
            {e.linkVideoconferencia && (
              <a
                href={e.linkVideoconferencia}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-[var(--color-primary)] hover:text-[var(--color-primary)]"
                title="Videoconferência"
                onClick={(ev) => ev.stopPropagation()}
              >
                <Video size={12} />
              </a>
            )}
          </div>
        ),
      },
      {
        key: 'id',
        header: '',
        width: 'w-[70px]',
        align: 'right',
        render: (_value, e) => (
          <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleEdit(e)}
              className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
              title="Ver detalhes"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteId(e.id)}
              className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleStatusChange],
  );

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Audiências, diligências e compromissos"
        action={
          <Button onClick={() => setModalData(null)}>
            <Plus size={16} />
            Novo evento
          </Button>
        }
      />

      {/* Filtro por status */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'agendado', label: 'Agendados' },
          { value: 'confirmado', label: 'Confirmados' },
          { value: 'realizado', label: 'Realizados' },
          { value: 'cancelado', label: 'Cancelados' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltroStatus(f.value)}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer ${
              filtroStatus === f.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-causa-surface-alt'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={(loading ? [] : filtrados) as unknown as Record<string, unknown>[]}
        keyExtractor={(r) => r['id'] as string}
        selectedKey={selectedId}
        onSelect={(r) => setSelectedId(r['id'] as string)}
        onActivate={(r) => {
          const ev = filtrados.find((e) => e.id === (r['id'] as string));
          if (ev) handleEdit(ev);
        }}
        emptyIcon={Calendar}
        emptyMessage="Nenhum evento cadastrado. Crie seu primeiro evento."
      />

      {showModal && (
        <EventoModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
