import { useState, useEffect } from 'react';
import { Briefcase, Clock, AlertTriangle, Users, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import * as api from '../../lib/api';

interface StatCardProps {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center ${color}`}>
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

export function DashboardPage() {
  const [stats, setStats] = useState({
    processosAtivos: 0,
    clientes: 0,
    prazosPendentes: 0,
    prazosFatais: 0,
    honorariosPendentes: 0,
  });

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch((err) => console.error('Erro ao carregar dashboard:', err));
  }, []);

  const total = stats.processosAtivos + stats.clientes;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do escritório"
      />

      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Processos ativos"
          value={stats.processosAtivos}
          color="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        />
        <StatCard
          icon={Clock}
          label="Prazos pendentes"
          value={stats.prazosPendentes}
          color="bg-causa-warning/10 text-causa-warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Prazos fatais"
          value={stats.prazosFatais}
          color="bg-causa-danger/10 text-causa-danger"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={stats.clientes}
          color="bg-causa-success/10 text-causa-success"
        />
        <StatCard
          icon={DollarSign}
          label="A receber"
          value={stats.honorariosPendentes > 0 ? `R$ ${stats.honorariosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0'}
          color="bg-causa-warning/10 text-causa-warning"
        />
      </div>

      {total === 0 && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
          <Briefcase size={48} className="mx-auto text-[var(--color-text-muted)]/30 mb-4" strokeWidth={1} />
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
