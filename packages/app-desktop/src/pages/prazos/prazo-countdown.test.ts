import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCountdown, diasRestantes } from './prazo-countdown';

describe('formatCountdown', () => {
  it('Test 1: dias=-3 returns "3 d atras" with fatal tier', () => {
    const result = formatCountdown(-3);
    expect(result).toEqual({
      text: '3 d atras',
      tierClass: 'text-[var(--color-tier-fatal)]',
    });
  });

  it('Test 2: dias=0 returns "Hoje" with fatal tier', () => {
    const result = formatCountdown(0);
    expect(result).toEqual({
      text: 'Hoje',
      tierClass: 'text-[var(--color-tier-fatal)]',
    });
  });

  it('Test 3: dias=1 returns "Amanha" with urgent tier', () => {
    const result = formatCountdown(1);
    expect(result).toEqual({
      text: 'Amanha',
      tierClass: 'text-[var(--color-tier-urgent)]',
    });
  });

  it('Test 4: dias=2 returns "2 dias" with urgent tier', () => {
    const result = formatCountdown(2);
    expect(result).toEqual({
      text: '2 dias',
      tierClass: 'text-[var(--color-tier-urgent)]',
    });
  });

  it('Test 5: dias=3 returns "3 dias" with urgent tier', () => {
    const result = formatCountdown(3);
    expect(result).toEqual({
      text: '3 dias',
      tierClass: 'text-[var(--color-tier-urgent)]',
    });
  });

  it('Test 6: dias=5 returns "Prox. semana" with warning tier', () => {
    const result = formatCountdown(5);
    expect(result).toEqual({
      text: 'Prox. semana',
      tierClass: 'text-[var(--color-tier-warning)]',
    });
  });

  it('Test 7: dias=15 returns a formatted date string with muted tier', () => {
    // Use a fixed date string so the absolute date formatting is deterministic
    const result = formatCountdown(15, '2026-04-01');
    expect(result.tierClass).toBe('text-[var(--color-text-muted)]');
    // Should contain a date-like string (dd/mm/yyyy format)
    expect(result.text).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('diasRestantes', () => {
  beforeEach(() => {
    // Fix "today" to 2026-03-16 for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for same day', () => {
    const result = diasRestantes('2026-03-16');
    expect(result).toBe(0);
  });

  it('returns 1 for tomorrow', () => {
    const result = diasRestantes('2026-03-17');
    expect(result).toBe(1);
  });

  it('returns negative for past dates', () => {
    const result = diasRestantes('2026-03-13');
    expect(result).toBeLessThan(0);
  });
});
