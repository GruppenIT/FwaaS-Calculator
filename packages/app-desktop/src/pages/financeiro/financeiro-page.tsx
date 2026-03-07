import { useState, useEffect, useCallback } from 'react';
import { Plus, DollarSign, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { HonorarioModal } from './honorario-modal';
import * as api from '../../lib/api';
import type { HonorarioRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  fixo: 'Fixo',
  exito: 'Êxito',
  por_hora: 'Por hora',
};

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  pendente: { label: 'Pendente', style: 'bg-causa-warning/10 text-causa-warning', icon: Clock },
  recebido: { label: 'Recebido', style: 'bg-causa-success/10 text-causa-success', icon: CheckCircle },
  inadimplente: { label: 'Inadimplente', style: 'bg-causa-danger/10 text-causa-danger', icon: AlertTriangle },
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
  const [showModal, setShowModal] = useState(false);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarHonorarios();
      setHonorarios(data);
    } catch (err) {
      console.error('Erro ao carregar honorários:', err);
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

  async function handleStatusChange(id: string, status: 'pendente' | 'recebido' | 'inadimplente') {
    try {
      await api.atualizarStatusHonorario(id, status);
      carregar();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

  const totalPendente = honorarios.filter((h) => h.status === 'pendente').reduce((s, h) => s + h.valor, 0);
  const totalRecebido = honorarios.filter((h) => h.status === 'recebido').reduce((s, h) => s + h.valor, 0);
  const totalInadimplente = honorarios.filter((h) => h.status === 'inadimplente').reduce((s, h) => s + h.valor, 0);

  return (
    <div>
      <PageHeader
        title="Honorários"
        description="Controle financeiro do escritório"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Novo honorário
          </Button>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Pendente</div>
          <div className="text-xl-causa text-causa-warning font-semibold">{formatCurrency(totalPendente)}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Recebido</div>
          <div className="text-xl-causa text-causa-success font-semibold">{formatCurrency(totalRecebido)}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="text-sm-causa text-[var(--color-text-muted)] mb-1">Inadimplente</div>
          <div className="text-xl-causa text-causa-danger font-semibold">{formatCurrency(totalInadimplente)}</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Cliente</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Processo</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Tipo</th>
              <th className="text-right px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Valor</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Vencimento</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm-causa text-[var(--color-text-muted)]">Carregando...</p>
                </td>
              </tr>
            ) : honorarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <DollarSign size={32} className="mx-auto text-[var(--color-text-muted)]/30 mb-2" strokeWidth={1} />
                  <p className="text-sm-causa text-[var(--color-text-muted)]">
                    Nenhum honorário cadastrado. Comece registrando seus honorários.
                  </p>
                </td>
              </tr>
            ) : (
              honorarios.map((h) => {
                const statusCfg = STATUS_CONFIG[h.status] ?? STATUS_CONFIG.pendente!;
                return (
                  <tr key={h.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa">
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
                        onChange={(e) => handleStatusChange(h.id, e.target.value as 'pendente' | 'recebido' | 'inadimplente')}
                        className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium border-0 cursor-pointer ${statusCfg.style}`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="recebido">Recebido</option>
                        <option value="inadimplente">Inadimplente</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && <HonorarioModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
