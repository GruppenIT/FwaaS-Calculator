import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Trash2, Video } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { EventoModal } from './evento-modal';
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
  pericia: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
  mediacao: 'bg-[#ec4899]/10 text-[#ec4899]',
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
  const [showModal, setShowModal] = useState(false);
  const [eventos, setEventos] = useState<AgendaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');

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

  function handleCreated() {
    setShowModal(false);
    toast('Evento criado com sucesso.', 'success');
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

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Audiências, diligências e compromissos"
        action={
          <Button onClick={() => setShowModal(true)}>
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

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Título
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Início
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Processo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Local
              </th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={7} />
            ) : filtrados.length === 0 ? (
              <EmptyState
                icon={Calendar}
                message="Nenhum evento cadastrado. Crie seu primeiro evento."
                colSpan={7}
              />
            ) : (
              filtrados.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                  style={e.cor ? { borderLeftColor: e.cor, borderLeftWidth: 3 } : undefined}
                >
                  <td className="px-4 py-3">
                    <span className="text-base-causa text-[var(--color-text)] font-medium">
                      {e.titulo}
                    </span>
                    {e.descricao && (
                      <p className="text-xs-causa text-[var(--color-text-muted)] line-clamp-1 mt-0.5">
                        {e.descricao}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${TIPO_STYLES[e.tipo] ?? ''}`}
                    >
                      {TIPO_LABELS[e.tipo] ?? e.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {e.diaInteiro ? formatDate(e.dataHoraInicio) : formatDateTime(e.dataHoraInicio)}
                    {e.diaInteiro && (
                      <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
                        dia inteiro
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {e.numeroCnj ?? '—'}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-1">
                      {e.local ?? '—'}
                      {e.linkVideoconferencia && (
                        <a
                          href={e.linkVideoconferencia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          title="Videoconferência"
                        >
                          <Video size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeleteId(e.id)}
                      className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <EventoModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

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
