import { FileText, Clock, AlertTriangle } from 'lucide-react';
import type { MovimentacaoRow, PrazoRow } from '../../lib/api';

interface ProcessoTimelineProps {
  movimentacoes: MovimentacaoRow[];
  prazos: PrazoRow[];
}

type TimelineItem = {
  id: string;
  date: string;
  type: 'movimentacao' | 'prazo';
  description: string;
  metadata: string;
  urgente: boolean;
  status?: string;
  teor?: string | null;
};

function parseDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
}

function formatShortDate(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatMonthYear(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function monthKey(iso: string): string {
  const d = parseDate(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prazoNodeColor(item: TimelineItem): string {
  if (item.status === 'cumprido') return 'var(--color-success)';
  if (item.status === 'perdido') return 'var(--color-danger)';
  return 'var(--color-tier-warning, #f59e0b)';
}

export function ProcessoTimeline({ movimentacoes, prazos }: ProcessoTimelineProps) {
  const items: TimelineItem[] = [
    ...movimentacoes.map(
      (m): TimelineItem => ({
        id: `mov-${m.id}`,
        date: m.dataMovimento,
        type: 'movimentacao',
        description: m.descricao,
        metadata: `${m.tipo} — ${m.origem}`,
        urgente: m.urgente,
        teor: m.teor,
      })
    ),
    ...prazos.map(
      (p): TimelineItem => ({
        id: `pra-${p.id}`,
        date: p.dataFatal,
        type: 'prazo',
        description: p.descricao,
        metadata: `${p.fatal ? 'Fatal' : 'Prazo'} — ${p.tipoPrazo}`,
        urgente: false,
        status: p.status,
      })
    ),
  ].sort((a, b) => {
    const da = parseDate(a.date).getTime();
    const db = parseDate(b.date).getTime();
    return db - da;
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
        <Clock size={32} strokeWidth={1.5} />
        <span className="text-sm-causa">Nenhum evento registrado</span>
      </div>
    );
  }

  // Group by month
  const groups: { key: string; label: string; items: TimelineItem[] }[] = [];
  for (const item of items) {
    const key = monthKey(item.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, label: formatMonthYear(item.date), items: [item] });
    }
  }

  return (
    <div className="space-y-0 py-2">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Month separator */}
          <div className="flex items-center gap-3 py-3 px-1">
            <span className="text-xs-causa font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Events in this month */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[51px] top-0 bottom-0 w-px"
              style={{ background: 'var(--color-border)' }}
            />

            <div className="space-y-1">
              {group.items.map((item) => {
                const nodeColor =
                  item.type === 'movimentacao' ? 'var(--color-primary)' : prazoNodeColor(item);

                return (
                  <div
                    key={item.id}
                    className={[
                      'flex items-start gap-0',
                      item.urgente ? 'border-l-2 border-l-causa-danger pl-0' : '',
                    ].join(' ')}
                  >
                    {/* Date column */}
                    <div className="w-[52px] shrink-0 pt-2.5 pr-2 text-right">
                      <span className="text-xs-causa font-[var(--font-mono)] text-[var(--color-text-muted)] leading-none">
                        {formatShortDate(item.date)}
                      </span>
                    </div>

                    {/* Circle node */}
                    <div className="relative z-10 shrink-0 mt-2 -mx-3">
                      <div
                        className="w-6 h-6 rounded-full bg-[var(--color-surface)] flex items-center justify-center"
                        style={{ border: `2px solid ${nodeColor}` }}
                      >
                        {item.type === 'movimentacao' ? (
                          <FileText size={12} style={{ color: nodeColor }} />
                        ) : (
                          <Clock size={12} style={{ color: nodeColor }} />
                        )}
                      </div>
                    </div>

                    {/* Content card */}
                    <div
                      className={[
                        'flex-1 ml-4 mb-2 rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
                        'bg-[var(--color-surface)] px-3 py-2.5',
                        item.urgente ? 'border-l-2 border-l-causa-danger' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm-causa text-[var(--color-text)] font-medium leading-snug">
                          {item.description}
                        </span>
                        {item.urgente && (
                          <AlertTriangle
                            size={12}
                            className="text-causa-danger shrink-0 mt-0.5"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs-causa text-[var(--color-text-muted)]">
                          {item.metadata}
                        </span>
                        {item.status && (
                          <span
                            className="inline-flex px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium"
                            style={{
                              background: `${nodeColor}1a`,
                              color: nodeColor,
                            }}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.teor && (
                        <p className="text-xs-causa text-[var(--color-text-muted)] mt-1 line-clamp-2">
                          {item.teor}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
