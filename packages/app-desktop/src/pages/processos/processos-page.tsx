import { useState, useEffect, useCallback } from 'react';
import { Plus, Briefcase, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { ProcessoModal } from './processo-modal';
import * as api from '../../lib/api';

interface ProcessoRow {
  id: string;
  numeroCnj: string;
  clienteNome: string | null;
  advogadoNome: string | null;
  tribunalSigla: string;
  area: string;
  status: 'ativo' | 'arquivado' | 'encerrado';
  ultimoSyncAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-causa-success/10 text-causa-success',
  arquivado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

export function ProcessosPage() {
  const [showModal, setShowModal] = useState(false);
  const [processos, setProcessos] = useState<ProcessoRow[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarProcessos(busca || undefined);
      setProcessos(data);
    } catch (err) {
      console.error('Erro ao carregar processos:', err);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    const timer = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(timer);
  }, [carregar, busca]);

  function handleCreated() {
    setShowModal(false);
    carregar();
  }

  return (
    <div>
      <PageHeader
        title="Processos"
        description="Acompanhe todos os processos do escritório"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Novo processo
          </Button>
        }
      />

      {/* Busca */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por número CNJ ou nome do cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Número CNJ</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Cliente</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Advogado</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Tribunal</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Área</th>
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
            ) : processos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Briefcase size={32} className="mx-auto text-[var(--color-text-muted)]/30 mb-2" strokeWidth={1} />
                  <p className="text-sm-causa text-[var(--color-text-muted)]">
                    {busca ? 'Nenhum processo encontrado.' : 'Cadastre seu primeiro processo.'}
                  </p>
                </td>
              </tr>
            ) : (
              processos.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa cursor-pointer">
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-[var(--font-mono)] font-medium">{p.numeroCnj}</td>
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)]">{p.clienteNome ?? '—'}</td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">{p.advogadoNome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                      {p.tribunalSigla}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] capitalize">{p.area}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${STATUS_STYLES[p.status] ?? ''}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <ProcessoModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
