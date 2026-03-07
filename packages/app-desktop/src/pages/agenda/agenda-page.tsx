import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { EventoModal } from './evento-modal';
import * as api from '../../lib/api';
import type { AgendaRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  audiencia: 'Audiência',
  diligencia: 'Diligência',
  reuniao: 'Reunião',
  prazo: 'Prazo',
};

const TIPO_STYLES: Record<string, string> = {
  audiencia: 'bg-causa-primary/10 text-[var(--color-primary)]',
  diligencia: 'bg-causa-warning/10 text-causa-warning',
  reuniao: 'bg-causa-success/10 text-causa-success',
  prazo: 'bg-causa-danger/10 text-causa-danger',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

export function AgendaPage() {
  const [showModal, setShowModal] = useState(false);
  const [eventos, setEventos] = useState<AgendaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarAgenda();
      setEventos(data);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleCreated() {
    setShowModal(false);
    carregar();
  }

  async function handleDelete(id: string) {
    try {
      await api.excluirEvento(id);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
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
                Local
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm-causa text-[var(--color-text-muted)]">Carregando...</p>
                </td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Calendar
                    size={32}
                    className="mx-auto text-[var(--color-text-muted)]/30 mb-2"
                    strokeWidth={1}
                  />
                  <p className="text-sm-causa text-[var(--color-text-muted)]">
                    Nenhum evento cadastrado. Crie seu primeiro evento.
                  </p>
                </td>
              </tr>
            ) : (
              eventos.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">
                    {e.titulo}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${TIPO_STYLES[e.tipo] ?? ''}`}
                    >
                      {TIPO_LABELS[e.tipo] ?? e.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {formatDateTime(e.dataHoraInicio)}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {e.numeroCnj ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                    {e.local ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
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
    </div>
  );
}
