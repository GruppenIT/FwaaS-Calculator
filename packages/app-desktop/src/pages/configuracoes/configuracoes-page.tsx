import { Settings } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

export function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader title="Configurações" description="Preferências do sistema" />

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-12 text-center">
        <Settings size={48} className="mx-auto text-[var(--color-text-muted)]/30 mb-4" strokeWidth={1} />
        <h2 className="text-lg-causa text-[var(--color-text)] mb-1">Configurações em desenvolvimento</h2>
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          Certificado A1, intervalo de sync e preferências do escritório.
        </p>
      </div>
    </div>
  );
}
