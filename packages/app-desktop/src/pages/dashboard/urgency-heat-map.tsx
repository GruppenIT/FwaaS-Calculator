import React from 'react';
import type { PrazoRow } from '../../lib/api';
import { diasRestantes } from '../prazos/prazo-countdown';

export interface TierCounts {
  fatal: number;
  fatalVencido: number;
  urgente: number;
  semana: number;
  proximo: number;
}

/**
 * Buckets an array of prazos into urgency tiers.
 *
 * Only 'pendente' status prazos are counted — cumprido/perdido/suspenso are excluded.
 *
 * Tier day ranges:
 *   fatalVencido: dias < 0   (also counted in fatal)
 *   fatal:        dias <= 1
 *   urgente:      dias <= 3
 *   semana:       dias <= 7
 *   proximo:      dias > 7
 */
export function computeTierCounts(prazos: PrazoRow[]): TierCounts {
  const counts: TierCounts = {
    fatal: 0,
    fatalVencido: 0,
    urgente: 0,
    semana: 0,
    proximo: 0,
  };

  for (const prazo of prazos) {
    if (prazo.status !== 'pendente') continue;

    const dias = diasRestantes(prazo.dataFatal);

    if (dias < 0) {
      counts.fatal++;
      counts.fatalVencido++;
    } else if (dias <= 1) {
      counts.fatal++;
    } else if (dias <= 3) {
      counts.urgente++;
    } else if (dias <= 7) {
      counts.semana++;
    } else {
      counts.proximo++;
    }
  }

  return counts;
}

interface TierConfig {
  key: keyof Omit<TierCounts, 'fatalVencido'>;
  label: string;
  range: string;
  colorVar: string;
  bgVar: string;
}

const TIER_CONFIG: TierConfig[] = [
  {
    key: 'fatal',
    label: 'Fatal',
    range: '0–1 dias',
    colorVar: 'var(--color-tier-fatal)',
    bgVar: 'var(--color-tier-fatal)',
  },
  {
    key: 'urgente',
    label: 'Urgente',
    range: '2–3 dias',
    colorVar: 'var(--color-tier-urgent)',
    bgVar: 'var(--color-tier-urgent)',
  },
  {
    key: 'semana',
    label: 'Esta semana',
    range: '4–7 dias',
    colorVar: 'var(--color-tier-warning)',
    bgVar: 'var(--color-tier-warning)',
  },
  {
    key: 'proximo',
    label: 'Proximo',
    range: '8+ dias',
    colorVar: 'var(--color-tier-info)',
    bgVar: 'var(--color-tier-info)',
  },
];

interface UrgencyHeatMapProps {
  prazos: PrazoRow[];
  onTierClick?: (tier: string) => void;
}

/**
 * 2x2 urgency grid showing prazo counts by tier.
 *
 * Each cell shows: large count number in tier color, tier label, day range.
 * The fatal cell appends "(X vencido)" when overdue prazos exist.
 * Clicking a cell triggers onTierClick(tier.key) for navigation to filtered prazos.
 */
export function UrgencyHeatMap({ prazos, onTierClick }: UrgencyHeatMapProps) {
  const counts = computeTierCounts(prazos);

  return (
    <div className="grid grid-cols-2 gap-3">
      {TIER_CONFIG.map((tier) => {
        const count = counts[tier.key];
        const isFatal = tier.key === 'fatal';
        const vencidoSuffix =
          isFatal && counts.fatalVencido > 0 ? ` (${counts.fatalVencido} vencido)` : '';

        return (
          <button
            key={tier.key}
            type="button"
            onClick={() => onTierClick?.(tier.key)}
            className="relative flex flex-col gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left cursor-pointer hover:bg-[var(--color-surface-hover,var(--color-surface))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            style={{
              borderLeftWidth: '3px',
              borderLeftColor: tier.colorVar,
            }}
          >
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ color: tier.colorVar }}
            >
              {count}
              {vencidoSuffix}
            </span>
            <span className="text-sm font-medium text-[var(--color-text)]">{tier.label}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{tier.range}</span>
          </button>
        );
      })}
    </div>
  );
}
