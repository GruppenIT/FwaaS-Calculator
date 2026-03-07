import { Monitor, Network } from 'lucide-react';
import type { Topologia } from './setup-page';

interface Props {
  selected: Topologia | null;
  onSelect: (topologia: Topologia) => void;
}

const OPTIONS: { id: Topologia; icon: typeof Monitor; title: string; subtitle: string; description: string }[] = [
  {
    id: 'solo',
    icon: Monitor,
    title: 'CAUSA Solo',
    subtitle: 'Notebook único',
    description: 'Tudo no seu computador. Banco SQLite local. Ideal para advogado autônomo.',
  },
  {
    id: 'escritorio',
    icon: Network,
    title: 'CAUSA Escritório',
    subtitle: 'Rede local',
    description: 'PostgreSQL em servidor local. Múltiplos advogados na mesma rede.',
  },
];

export function StepTopologia({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-xl-causa text-[var(--color-text)] mb-1">
        Como você vai usar o CAUSA?
      </h2>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-6">
        Escolha a topologia do seu escritório. Você pode alterar depois.
      </p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ id, icon: Icon, title, subtitle, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`
              w-full text-left p-4 rounded-[var(--radius-md)] border transition-causa cursor-pointer
              ${selected === id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-causa-surface-alt'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0
                  ${selected === id
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'bg-causa-surface-alt text-[var(--color-text-muted)]'
                  }
                `}
              >
                <Icon size={20} />
              </div>
              <div>
                <div className="text-md-causa text-[var(--color-text)]">{title}</div>
                <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">{subtitle}</div>
                <div className="text-sm-causa text-[var(--color-text-muted)]">{description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
