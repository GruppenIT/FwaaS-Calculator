import { DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

export function FinanceiroPage() {
  return (
    <div>
      <PageHeader title="Honorários" description="Controle financeiro do escritório" />

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
        <DollarSign size={48} className="mx-auto text-[var(--color-text-muted)]/30 mb-4" strokeWidth={1} />
        <h2 className="text-lg-causa text-[var(--color-text)] mb-1">Módulo financeiro em desenvolvimento</h2>
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          Honorários e contas a receber estarão disponíveis em breve.
        </p>
      </div>
    </div>
  );
}
