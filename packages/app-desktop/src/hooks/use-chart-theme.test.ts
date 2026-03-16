import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCssVar } from './use-chart-theme';

describe('resolveCssVar', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'getComputedStyle',
      vi.fn(() => ({
        getPropertyValue: (prop: string) => {
          const map: Record<string, string> = {
            '--color-primary': ' #3b82f6 ',
            '--color-warning': ' #f59e0b ',
            '--color-success': ' #10b981 ',
            '--color-danger': ' #ef4444 ',
            '--color-text-muted': ' #6b7280 ',
            '--color-accent-amber': ' #f59e0b ',
            '--color-accent-emerald': ' #10b981 ',
            '--color-border': ' #e5e7eb ',
            '--color-surface': ' #ffffff ',
            '--color-text': ' #111827 ',
          };
          return map[prop] ?? '';
        },
      })),
    );

    vi.stubGlobal('document', {
      documentElement: {},
    });
  });

  it('Test 1: resolveCssVar returns a trimmed string', () => {
    const result = resolveCssVar('--color-primary');
    expect(typeof result).toBe('string');
    expect(result).toBe('#3b82f6');
    expect(result.startsWith(' ')).toBe(false);
    expect(result.endsWith(' ')).toBe(false);
  });

  it('returns empty string for unknown var', () => {
    const result = resolveCssVar('--unknown-var');
    expect(result).toBe('');
  });
});
