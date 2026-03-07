import { Briefcase, Clock, AlertTriangle, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

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
  // TODO: dados reais via query ao banco
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do escritório"
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Processos ativos"
          value={0}
          color="bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        />
        <StatCard
          icon={Clock}
          label="Prazos esta semana"
          value={0}
          color="bg-causa-warning/10 text-causa-warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Prazos fatais"
          value={0}
          color="bg-causa-danger/10 text-causa-danger"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={0}
          color="bg-causa-success/10 text-causa-success"
        />
      </div>

      {/* Estado vazio */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
        <Briefcase size={48} className="mx-auto text-[var(--color-text-muted)]/30 mb-4" strokeWidth={1} />
        <h2 className="text-lg-causa text-[var(--color-text)] mb-1">
          Nenhum processo cadastrado
        </h2>
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          Comece cadastrando seu primeiro cliente e importando um processo.
        </p>
      </div>
    </div>
  );
}
