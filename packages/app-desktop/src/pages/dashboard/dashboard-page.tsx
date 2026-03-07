import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import * as api from '../../lib/api';
import type { PrazoRow, HonorarioRow } from '../../lib/api';

interface StatCardProps {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, color, onClick }: StatCardProps) {
  return (
    <div
      className={`bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-5 ${onClick ? 'cursor-pointer hover:border-[var(--color-primary)]/30 transition-causa' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center ${color}`}
        >
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl-causa text-[var(--color-text)]">{value}</div>
          <div className="text-sm-causa text-[var(--color-text-muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function diasRestantes(dataFatal: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fatal = new Date(dataFatal + 'T00:00:00');
  return Math.ceil((fatal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    processosAtivos: 0,
    clientes: 0,
    prazosPendentes: 0,
    prazosFatais: 0,
    honorariosPendentes: 0,
  });
  const [prazosUrgentes, setPrazosUrgentes] = useState<PrazoRow[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashStats, prazosData, honData] = await Promise.all([
          api.getDashboardStats(),
          api.listarPrazos({ status: 'pendente' }),
          api.listarHonorarios(),
        ]);
        setStats(dashStats);

        // Prazos: próximos 7 dias, ordenados por data
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const em7dias = new Date(hoje);
        em7dias.setDate(em7dias.getDate() + 7);

        const urgentes = prazosData
          .filter((p) => {
            const fatal = new Date(p.dataFatal + 'T00:00:00');
            return fatal <= em7dias;
          })
          .sort((a, b) => a.dataFatal.localeCompare(b.dataFatal));
        setPrazosUrgentes(urgentes);
        setHonorarios(honData);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Erro ao carregar dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const totalPendente = honorarios
    .filter((h) => h.status === 'pendente')
    .reduce((s, h) => s + h.valor, 0);
  const totalRecebido = honorarios
    .filter((h) => h.status === 'recebido')
    .reduce((s, h) => s + h.valor, 0);
  const totalInadimplente = honorarios
    .filter((h) => h.status === 'inadimplente')
    .reduce((s, h) => s + h.valor, 0);

  const total = stats.processosAtivos + stats.clientes;

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral do escritório" />

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]" />
                <div className="flex-1">
                  <Skeleton className="h-7 w-12 mb-1" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={Briefcase}
              label="Processos ativos"
              value={stats.processosAtivos}
              color="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              onClick={() => navigate('/app/processos')}
            />
            <StatCard
              icon={Clock}
              label="Prazos pendentes"
              value={stats.prazosPendentes}
              color="bg-causa-warning/10 text-causa-warning"
              onClick={() => navigate('/app/prazos')}
            />
            <StatCard
              icon={AlertTriangle}
              label="Prazos fatais"
              value={stats.prazosFatais}
              color="bg-causa-danger/10 text-causa-danger"
              onClick={() => navigate('/app/prazos')}
            />
            <StatCard
              icon={Users}
              label="Clientes"
              value={stats.clientes}
              color="bg-causa-success/10 text-causa-success"
              onClick={() => navigate('/app/clientes')}
            />
            <StatCard
              icon={DollarSign}
              label="A receber"
              value={totalPendente > 0 ? formatCurrency(totalPendente) : 'R$ 0'}
              color="bg-causa-warning/10 text-causa-warning"
              onClick={() => navigate('/app/financeiro')}
            />
          </>
        )}
      </div>

      {/* Two columns: Prazos Urgentes + Resumo Financeiro */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Prazos Urgentes */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-causa-warning" />
                <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                  Prazos desta semana
                </span>
                {prazosUrgentes.length > 0 && (
                  <span className="text-xs-causa text-white bg-causa-danger px-1.5 py-0.5 rounded-full font-medium">
                    {prazosUrgentes.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/prazos')}
                className="text-xs-causa text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1"
              >
                Ver todos <ArrowRight size={12} />
              </button>
            </div>
            <div className="max-h-72 overflow-auto">
              {prazosUrgentes.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-6 justify-center text-sm-causa text-[var(--color-text-muted)]">
                  <CheckCircle size={16} className="text-causa-success" />
                  Nenhum prazo urgente esta semana
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {prazosUrgentes.map((p) => {
                    const dias = diasRestantes(p.dataFatal);
                    const vencido = dias < 0;
                    const hoje = dias === 0;
                    const urgente = dias <= 3;
                    return (
                      <div
                        key={p.id}
                        className={`px-4 py-3 ${vencido ? 'bg-causa-danger/5' : hoje ? 'bg-causa-warning/5' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm-causa text-[var(--color-text)] font-medium">
                            {p.descricao}
                          </span>
                          <span
                            className={`text-xs-causa font-medium px-2 py-0.5 rounded-full ${
                              vencido
                                ? 'bg-causa-danger/10 text-causa-danger'
                                : hoje
                                  ? 'bg-causa-warning/10 text-causa-warning'
                                  : urgente
                                    ? 'bg-causa-warning/10 text-causa-warning'
                                    : 'bg-causa-surface-alt text-[var(--color-text-muted)]'
                            }`}
                          >
                            {vencido
                              ? `${Math.abs(dias)}d atrasado`
                              : hoje
                                ? 'Hoje'
                                : `${dias}d`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs-causa text-[var(--color-text-muted)]">
                          {p.numeroCnj && (
                            <span className="font-[var(--font-mono)]">{p.numeroCnj}</span>
                          )}
                          <span>{formatDate(p.dataFatal)}</span>
                          {p.responsavelNome && <span>{p.responsavelNome}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                  Resumo financeiro
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/financeiro')}
                className="text-xs-causa text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1"
              >
                Ver detalhes <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <FinanceRow
                label="Pendente"
                value={totalPendente}
                color="text-causa-warning"
                bgColor="bg-causa-warning"
                total={totalPendente + totalRecebido + totalInadimplente}
              />
              <FinanceRow
                label="Recebido"
                value={totalRecebido}
                color="text-causa-success"
                bgColor="bg-causa-success"
                total={totalPendente + totalRecebido + totalInadimplente}
              />
              <FinanceRow
                label="Inadimplente"
                value={totalInadimplente}
                color="text-causa-danger"
                bgColor="bg-causa-danger"
                total={totalPendente + totalRecebido + totalInadimplente}
              />

              <div className="pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm-causa text-[var(--color-text-muted)]">Total geral</span>
                  <span className="text-lg-causa text-[var(--color-text)] font-semibold font-[var(--font-mono)]">
                    {formatCurrency(totalPendente + totalRecebido + totalInadimplente)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && total === 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
          <Briefcase
            size={48}
            className="mx-auto text-[var(--color-text-muted)]/30 mb-4"
            strokeWidth={1}
          />
          <h2 className="text-lg-causa text-[var(--color-text)] mb-1">
            Nenhum processo cadastrado
          </h2>
          <p className="text-sm-causa text-[var(--color-text-muted)]">
            Comece cadastrando seu primeiro cliente e importando um processo.
          </p>
        </div>
      )}
    </div>
  );
}

function FinanceRow({
  label,
  value,
  color,
  bgColor,
  total,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  total: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm-causa text-[var(--color-text-muted)]">{label}</span>
        <span className={`text-base-causa font-semibold font-[var(--font-mono)] ${color}`}>
          {formatCurrency(value)}
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bgColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
