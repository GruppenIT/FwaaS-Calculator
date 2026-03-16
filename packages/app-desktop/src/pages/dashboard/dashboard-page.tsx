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
  CheckSquare,
  CreditCard,
  Mail,
  Gavel,
  MapPin,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/ui/page-header';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import * as api from '../../lib/api';
import type {
  PrazoRow,
  HonorarioRow,
  DashboardStats,
  TimelineEntry,
  ProdutividadeEntry,
} from '../../lib/api';
import { useFeatures } from '../../lib/auth-context';

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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatMinutesToHours(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

function diasRestantes(dataFatal: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fatal = new Date(dataFatal + 'T00:00:00');
  return Math.ceil((fatal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function diasAtraso(vencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + 'T00:00:00');
  return Math.ceil((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { financeiro: financeiroEnabled } = useFeatures();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    processosAtivos: 0,
    clientes: 0,
    prazosPendentes: 0,
    prazosFatais: 0,
    honorariosPendentes: 0,
    tarefasPendentes: 0,
    parcelasAtrasadas: 0,
    movimentacoesNaoLidas: 0,
    audienciasSemana: [],
    parcelasAtrasadasList: [],
  });
  const [prazosUrgentes, setPrazosUrgentes] = useState<PrazoRow[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [produtividade, setProdutividade] = useState<ProdutividadeEntry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [dashStats, prazosData, honData, timelineData, prodData] = await Promise.all([
          api.getDashboardStats(),
          api.listarPrazos({ status: 'pendente' }),
          financeiroEnabled ? api.listarHonorarios() : Promise.resolve([]),
          api.getDashboardTimeline(),
          api.getDashboardProdutividade(),
        ]);
        setStats(dashStats);
        setTimeline(timelineData);
        setProdutividade(prodData);

        // Prazos: proximos 7 dias, ordenados por data
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

  const totalParcelasAtrasadasValor = stats.parcelasAtrasadasList.reduce((s, p) => s + p.valor, 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visao geral do escritorio" />

      {/* Stat Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 7 }, (_, i) => (
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
              icon={CheckSquare}
              label="Tarefas pendentes"
              value={stats.tarefasPendentes}
              color="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              onClick={() => navigate('/app/tarefas')}
            />
            {/* 4.2.3 - Movimentacoes nao lidas */}
            <StatCard
              icon={Mail}
              label="Mov. nao lidas"
              value={stats.movimentacoesNaoLidas}
              color="bg-causa-warning/10 text-causa-warning"
              onClick={() => navigate('/app/processos')}
            />
            {financeiroEnabled ? (
              <StatCard
                icon={DollarSign}
                label="A receber"
                value={totalPendente > 0 ? formatCurrency(totalPendente) : 'R$ 0'}
                color="bg-causa-warning/10 text-causa-warning"
                onClick={() => navigate('/app/financeiro')}
              />
            ) : (
              <StatCard
                icon={CreditCard}
                label="Parcelas atrasadas"
                value={stats.parcelasAtrasadas}
                color="bg-causa-danger/10 text-causa-danger"
              />
            )}
          </>
        )}
      </div>

      {/* Row 2: Prazos + Audiencias da semana */}
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
                            {vencido ? `${Math.abs(dias)}d atrasado` : hoje ? 'Hoje' : `${dias}d`}
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

          {/* 4.2.4 - Audiencias da semana */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
              <div className="flex items-center gap-2">
                <Gavel size={16} className="text-[var(--color-primary)]" />
                <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                  Audiencias da semana
                </span>
                {stats.audienciasSemana.length > 0 && (
                  <span className="text-xs-causa text-white bg-[var(--color-primary)] px-1.5 py-0.5 rounded-full font-medium">
                    {stats.audienciasSemana.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/app/agenda')}
                className="text-xs-causa text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1"
              >
                Ver agenda <ArrowRight size={12} />
              </button>
            </div>
            <div className="max-h-72 overflow-auto">
              {stats.audienciasSemana.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-6 justify-center text-sm-causa text-[var(--color-text-muted)]">
                  <CheckCircle size={16} className="text-causa-success" />
                  Nenhuma audiencia esta semana
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {stats.audienciasSemana
                    .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))
                    .map((aud) => (
                      <div key={aud.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm-causa text-[var(--color-text)] font-medium">
                            {aud.titulo}
                          </span>
                          <span
                            className={`text-xs-causa font-medium px-2 py-0.5 rounded-full ${
                              aud.statusAgenda === 'confirmado'
                                ? 'bg-causa-success/10 text-causa-success'
                                : aud.statusAgenda === 'cancelado'
                                  ? 'bg-causa-danger/10 text-causa-danger'
                                  : 'bg-causa-surface-alt text-[var(--color-text-muted)]'
                            }`}
                          >
                            {aud.statusAgenda}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs-causa text-[var(--color-text-muted)]">
                          <span>{formatDateTime(aud.dataHoraInicio)}</span>
                          {aud.local && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {aud.local}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Parcelas atrasadas + Resumo Financeiro */}
      {!loading && total > 0 && (
        <div className={`grid grid-cols-1 ${financeiroEnabled ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
          {/* 4.2.5 - Parcelas atrasadas */}
          {stats.parcelasAtrasadasList.length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-causa-danger" />
                  <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                    A receber (atrasado)
                  </span>
                  <span className="text-xs-causa text-white bg-causa-danger px-1.5 py-0.5 rounded-full font-medium">
                    {stats.parcelasAtrasadasList.length}
                  </span>
                </div>
                <span className="text-sm-causa font-semibold text-causa-danger font-[var(--font-mono)]">
                  {formatCurrency(totalParcelasAtrasadasValor)}
                </span>
              </div>
              <div className="max-h-56 overflow-auto">
                <div className="divide-y divide-[var(--color-border)]">
                  {stats.parcelasAtrasadasList
                    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
                    .map((p) => {
                      const dias = diasAtraso(p.vencimento);
                      return (
                        <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-sm-causa text-[var(--color-text)]">
                              Parcela {p.numeroParcela}
                            </span>
                            <span className="text-xs-causa text-[var(--color-text-muted)] ml-2">
                              venc. {formatDate(p.vencimento)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs-causa text-causa-danger font-medium">
                              {dias}d atrasado
                            </span>
                            <span className="text-sm-causa font-semibold font-[var(--font-mono)] text-[var(--color-text)]">
                              {formatCurrency(p.valor)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Resumo Financeiro */}
          {financeiroEnabled && (
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
                    <span className="text-sm-causa text-[var(--color-text-muted)]">
                      Total geral
                    </span>
                    <span className="text-lg-causa text-[var(--color-text)] font-semibold font-[var(--font-mono)]">
                      {formatCurrency(totalPendente + totalRecebido + totalInadimplente)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 4: Charts - Timeline + Produtividade */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 4.2.6 - Timeline de atividade */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
              <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                Atividade (30 dias)
              </span>
            </div>
            <div className="p-4" style={{ height: 260 }}>
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="data"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(v) => formatShortDate(v as string)}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="movimentacoes"
                      name="Movimentacoes"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="prazos"
                      name="Prazos"
                      stroke="var(--color-accent-amber)"
                      fill="var(--color-accent-amber)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="tarefas"
                      name="Tarefas"
                      stroke="var(--color-accent-emerald)"
                      fill="var(--color-accent-emerald)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm-causa text-[var(--color-text-muted)]">
                  Sem dados de atividade
                </div>
              )}
            </div>
          </div>

          {/* 4.2.7 - Produtividade / Timesheet */}
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
              <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                Produtividade (7 dias)
              </span>
            </div>
            <div className="p-4" style={{ height: 260 }}>
              {produtividade.some((p) => p.minutos > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={produtividade} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="data"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      tickFormatter={(v) => formatMinutesToHours(v as number)}
                    />
                    <Tooltip
                      labelFormatter={(v) => formatShortDate(v as string)}
                      formatter={(v) => [formatMinutesToHours(Number(v ?? 0)), 'Tempo']}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="minutos"
                      name="Horas trabalhadas"
                      fill="var(--color-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm-causa text-[var(--color-text-muted)]">
                  Sem registros de timesheet
                </div>
              )}
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
