import { Plug } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

export function ConectoresPage() {
  return (
    <div>
      <PageHeader title="Conectores" description="Status dos conectores de tribunal" />

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
        <Plug
          size={48}
          className="mx-auto text-[var(--color-text-muted)]/30 mb-4"
          strokeWidth={1}
        />
        <h2 className="text-lg-causa text-[var(--color-text)] mb-1">
          Conectores em desenvolvimento
        </h2>
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          PJe e e-SAJ serão os primeiros conectores disponíveis.
        </p>
      </div>
    </div>
  );
}
