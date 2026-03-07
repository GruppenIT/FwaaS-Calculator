import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, DollarSign, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ProcessoModal } from './processo-modal';
import type { ProcessoEditData } from './processo-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { PrazoRow, HonorarioRow } from '../../lib/api';

interface MovimentacaoRow {
  id: string;
  dataMovimento: string;
  descricao: string;
  tipo: string;
  origem: string;
  lido: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-causa-success/10 text-causa-success',
  arquivado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

const PRAZO_STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  cumprido: 'bg-causa-success/10 text-causa-success',
  perdido: 'bg-causa-danger/10 text-causa-danger',
};

const HONORARIO_STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  recebido: 'bg-causa-success/10 text-causa-success',
  inadimplente: 'bg-causa-danger/10 text-causa-danger',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function diasRestantes(dataFatal: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fatal = new Date(dataFatal + 'T00:00:00');
  return Math.ceil((fatal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermission();

  const [processo, setProcesso] = useState<api.ProcessoDetail | null>(null);
  const [clienteNome, setClienteNome] = useState<string>('');
  const [prazos, setPrazos] = useState<PrazoRow[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRow[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<ProcessoEditData | null | undefined>(undefined);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const [proc, movs, prazosData, honData] = await Promise.all([
        api.obterProcesso(id),
        api.listarMovimentacoes(id),
        api.listarPrazosDoProcesso(id),
        api.listarHonorariosDoProcesso(id),
      ]);
      setProcesso(proc);
      setMovimentacoes(movs);
      setPrazos(prazosData);
      setHonorarios(honData);

      // Resolve names
      if (proc.clienteId) {
        try {
          const c = await api.obterCliente(proc.clienteId);
          setClienteNome(c.nome);
        } catch {
          setClienteNome('—');
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar processo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleEdit() {
    if (!processo) return;
    setEditData({
      id: processo.id,
      numeroCnj: processo.numeroCnj,
      clienteId: processo.clienteId ?? '',
      clienteNome: clienteNome || null,
      tribunalSigla: processo.tribunalSigla,
      plataforma: processo.plataforma,
      area: processo.area,
      fase: processo.fase,
      status: processo.status,
      valorCausa: processo.valorCausa,
    });
  }

  function handleSaved() {
    setEditData(undefined);
    toast('Processo atualizado.', 'success');
    carregar();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-causa-surface-alt rounded w-1/3"></div>
        <div className="h-40 bg-causa-surface-alt rounded"></div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Processo não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/processos')}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl-causa text-[var(--color-text)] font-semibold font-[var(--font-mono)]">
            {processo.numeroCnj}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${STATUS_STYLES[processo.status] ?? ''}`}
            >
              {processo.status}
            </span>
            <span className="text-sm-causa text-[var(--color-text-muted)]">
              {processo.area} &middot; {processo.fase} &middot; {processo.tribunalSigla}
            </span>
          </div>
        </div>
        {can('processos:editar') && (
          <Button variant="secondary" onClick={handleEdit}>
            <Pencil size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Cliente">
          {processo.clienteId ? (
            <Link
              to={`/app/clientes/${processo.clienteId}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {clienteNome || '...'}
            </Link>
          ) : (
            '—'
          )}
        </InfoCard>
        <InfoCard label="Plataforma">{processo.plataforma.toUpperCase()}</InfoCard>
        <InfoCard label="Valor da causa">
          {processo.valorCausa ? formatCurrency(processo.valorCausa) : '—'}
        </InfoCard>
        <InfoCard label="Cadastrado em">{formatDate(processo.createdAt)}</InfoCard>
      </div>

      {/* Tabs-like sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prazos */}
        <Section title="Prazos" icon={Clock} count={prazos.length}>
          {prazos.length === 0 ? (
            <p className="text-sm-causa text-[var(--color-text-muted)] py-4 text-center">
              Nenhum prazo vinculado.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {prazos.map((p) => {
                const dias = diasRestantes(p.dataFatal);
                const urgente = p.status === 'pendente' && dias <= 3;
                return (
                  <div key={p.id} className={`px-4 py-3 ${urgente ? 'bg-causa-danger/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {urgente && <AlertTriangle size={12} className="text-causa-danger" />}
                        <span className="text-sm-causa text-[var(--color-text)] font-medium">
                          {p.descricao}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${PRAZO_STATUS_STYLES[p.status] ?? ''}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs-causa text-[var(--color-text-muted)] mt-1">
                      {formatDate(p.dataFatal)}
                      {p.status === 'pendente' && (
                        <span className={`ml-2 ${dias <= 1 ? 'text-causa-danger' : dias <= 3 ? 'text-causa-warning' : ''}`}>
                          {dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Vence hoje' : `${dias}d restantes`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Honorários */}
        <Section title="Honorários" icon={DollarSign} count={honorarios.length}>
          {honorarios.length === 0 ? (
            <p className="text-sm-causa text-[var(--color-text-muted)] py-4 text-center">
              Nenhum honorário vinculado.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {honorarios.map((h) => (
                <div key={h.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm-causa text-[var(--color-text)] font-medium font-[var(--font-mono)]">
                      {formatCurrency(h.valor)}
                    </span>
                    <span className="ml-2 text-xs-causa text-[var(--color-text-muted)]">
                      {h.tipo === 'fixo' ? 'Fixo' : h.tipo === 'exito' ? 'Êxito' : 'Por hora'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${HONORARIO_STATUS_STYLES[h.status] ?? ''}`}
                  >
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Movimentações - full width */}
      <Section title="Movimentações" icon={FileText} count={movimentacoes.length}>
        {movimentacoes.length === 0 ? (
          <p className="text-sm-causa text-[var(--color-text-muted)] py-4 text-center">
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {movimentacoes.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm-causa text-[var(--color-text)] font-medium">
                    {m.descricao}
                  </span>
                  <span className="text-xs-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                    {formatDate(m.dataMovimento)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa text-[var(--color-text-muted)]">
                    {m.tipo}
                  </span>
                  <span className="text-xs-causa text-[var(--color-text-muted)]">{m.origem}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {editData !== undefined && (
        <ProcessoModal
          onClose={() => setEditData(undefined)}
          onSaved={handleSaved}
          editData={editData}
        />
      )}
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
      <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-base-causa text-[var(--color-text)] font-medium">{children}</div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Clock;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
        <Icon size={16} className="text-[var(--color-text-muted)]" />
        <span className="text-sm-causa font-semibold text-[var(--color-text)]">{title}</span>
        <span className="text-xs-causa text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="max-h-80 overflow-auto">{children}</div>
    </div>
  );
}
