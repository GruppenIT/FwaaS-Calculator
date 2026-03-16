import React from 'react';

/**
 * Returns a UTC midnight Date from a date string like "2026-03-16".
 * Date-only ISO strings are parsed as UTC by spec, so this is timezone-safe.
 */
function utcMidnight(dateStr: string): Date {
  // "2026-03-16" → parse as UTC midnight directly
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/**
 * Returns UTC midnight for today's local date.
 * We use local year/month/day so "today" means the calendar day in the
 * user's timezone, not UTC day.
 */
function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Calculates days remaining from today (local calendar date) until dataFatal.
 * Returns negative values for overdue deadlines.
 */
export function diasRestantes(dataFatal: string): number {
  const hoje = todayUtcMidnight();
  const fatal = utcMidnight(dataFatal);
  return Math.ceil((fatal.getTime() - hoje.getTime()) / 86400000);
}

/**
 * Formats the absolute date (dd/mm/yyyy) in Portuguese locale.
 */
function formatAbsoluteDate(dataFatal: string): string {
  const date = new Date(dataFatal);
  // Use UTC date parts to avoid timezone shifting the date
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Returns display text and CSS tier class for a given number of remaining days.
 *
 * Tier mapping:
 *   dias < 0   → "X d atras"        fatal (red)
 *   dias = 0   → "Hoje"             fatal (red)
 *   dias = 1   → "Amanha"           urgent (amber)
 *   dias <= 3  → "N dias"           urgent (amber)
 *   dias <= 7  → "Prox. semana"     warning (blue)
 *   else       → absolute date      muted
 */
export function formatCountdown(
  dias: number,
  dataFatal?: string,
): { text: string; tierClass: string } {
  if (dias < 0) {
    return {
      text: `${Math.abs(dias)} d atras`,
      tierClass: 'text-[var(--color-tier-fatal)]',
    };
  }
  if (dias === 0) {
    return {
      text: 'Hoje',
      tierClass: 'text-[var(--color-tier-fatal)]',
    };
  }
  if (dias === 1) {
    return {
      text: 'Amanha',
      tierClass: 'text-[var(--color-tier-urgent)]',
    };
  }
  if (dias <= 3) {
    return {
      text: `${dias} dias`,
      tierClass: 'text-[var(--color-tier-urgent)]',
    };
  }
  if (dias <= 7) {
    return {
      text: 'Prox. semana',
      tierClass: 'text-[var(--color-tier-warning)]',
    };
  }
  return {
    text: dataFatal ? formatAbsoluteDate(dataFatal) : `${dias} dias`,
    tierClass: 'text-[var(--color-text-muted)]',
  };
}

interface PrazoCountdownProps {
  dataFatal: string;
  status: string;
}

/**
 * Displays a countdown for a prazo deadline using tier colors.
 *
 * - For non-pending prazos (cumprido/perdido/suspenso), shows the absolute date
 *   in muted color — no countdown urgency needed.
 * - For pendente prazos, computes relative countdown with appropriate tier color.
 * - The native title attribute provides a zero-dependency accessible tooltip
 *   always showing the full absolute date (dd/mm/yyyy).
 */
export function PrazoCountdown({ dataFatal, status }: PrazoCountdownProps) {
  const absoluteDate = formatAbsoluteDate(dataFatal);

  if (status !== 'pendente') {
    return (
      <span className="text-[var(--color-text-muted)]" title={absoluteDate}>
        {absoluteDate}
      </span>
    );
  }

  const dias = diasRestantes(dataFatal);
  const { text, tierClass } = formatCountdown(dias, dataFatal);

  return (
    <span className={tierClass} title={absoluteDate}>
      {text}
    </span>
  );
}
