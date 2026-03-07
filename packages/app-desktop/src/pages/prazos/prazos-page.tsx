import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { PrazoModal } from './prazo-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { PrazoRow } from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  cumprido: 'bg-causa-success/10 text-causa-success',
  perdido: 'bg-causa-danger/10 text-causa-danger',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  cumprido: 'Cumprido',
  perdido: 'Perdido',
};

const TIPO_LABELS: Record<string, string> = {
  ncpc: 'NCPC',
  clt: 'CLT',
  jec: 'JEC',
  outros: 'Outros',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function diasRestantes(dataFatal: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fatal = new Date(dataFatal + 'T00:00:00');
  return Math.ceil((fatal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function PrazosPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [prazos, setPrazos] = useState<PrazoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarPrazos(filtroStatus ? { status: filtroStatus } : undefined);
      setPrazos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar prazos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleCreated() {
    setShowModal(false);
    toast('Prazo criado com sucesso.', 'success');
    carregar();
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

  return (
    <div>
      <PageHeader
        title="Prazos"
        description="Prazos processuais e alertas"
        action={
          can('processos:editar') ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Novo prazo
            </Button>
          ) : undefined
        }
      />

      {/* Filtro por status */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'pendente', label: 'Pendentes' },
          { value: 'cumprido', label: 'Cumpridos' },
          { value: 'perdido', label: 'Perdidos' },
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
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Descrição
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Processo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Data Fatal
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">
                Responsável
              </th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows rows={5} cols={7} />
            ) : prazos.length === 0 ? (
              <EmptyState
                icon={Clock}
                message="Nenhum prazo encontrado."
                colSpan={7}
              />
            ) : (
              prazos.map((p) => {
                const dias = diasRestantes(p.dataFatal);
                const urgente = p.status === 'pendente' && dias <= 3;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa ${urgente ? 'bg-causa-danger/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {urgente && (
                          <AlertTriangle size={14} className="text-causa-danger shrink-0" />
                        )}
                        <span className="text-base-causa text-[var(--color-text)] font-medium">
                          {p.descricao}
                        </span>
                      </div>
                      {p.status === 'pendente' && (
                        <span
                          className={`text-xs-causa ${dias <= 1 ? 'text-causa-danger' : dias <= 3 ? 'text-causa-warning' : 'text-[var(--color-text-muted)]'}`}
                        >
                          {dias < 0
                            ? `${Math.abs(dias)} dia(s) atrasado`
                            : dias === 0
                              ? 'Vence hoje'
                              : `${dias} dia(s) restante(s)`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                      {p.numeroCnj ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                      {formatDate(p.dataFatal)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                        {TIPO_LABELS[p.tipoPrazo] ?? p.tipoPrazo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${STATUS_STYLES[p.status] ?? ''}`}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
                      {p.responsavelNome ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status === 'pendente' && can('processos:editar') && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(p.id, 'cumprido')}
                            title="Marcar como cumprido"
                            className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-success/10 text-[var(--color-text-muted)] hover:text-causa-success transition-causa cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {can('processos:excluir') && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(p.id)}
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

      {showModal && <PrazoModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}

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
