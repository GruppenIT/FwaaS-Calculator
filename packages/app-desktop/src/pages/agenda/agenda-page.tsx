import { Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

export function AgendaPage() {
  return (
    <div>
      <PageHeader title="Agenda" description="Audiências, diligências e compromissos" />

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
        <Calendar size={48} className="mx-auto text-[var(--color-text-muted)]/30 mb-4" strokeWidth={1} />
        <h2 className="text-lg-causa text-[var(--color-text)] mb-1">Agenda em desenvolvimento</h2>
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          Visualização mensal e semanal estará disponível em breve.
        </p>
      </div>
    </div>
  );
}
