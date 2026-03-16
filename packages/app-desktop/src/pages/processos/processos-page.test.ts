import { describe, it, expect } from 'vitest';
import { STATUS_TO_BADGE } from './processos-page';

describe('STATUS_TO_BADGE', () => {
  it('maps ativo to active', () => {
    expect(STATUS_TO_BADGE['ativo']).toBe('active');
  });
  it('maps suspenso to suspended', () => {
    expect(STATUS_TO_BADGE['suspenso']).toBe('suspended');
  });
  it('maps arquivado to archived', () => {
    expect(STATUS_TO_BADGE['arquivado']).toBe('archived');
  });
  it('maps encerrado to closed', () => {
    expect(STATUS_TO_BADGE['encerrado']).toBe('closed');
  });
  it('maps baixado to archived', () => {
    expect(STATUS_TO_BADGE['baixado']).toBe('archived');
  });
  it('has exactly 5 entries', () => {
    expect(Object.keys(STATUS_TO_BADGE)).toHaveLength(5);
  });
  it('all values are valid BadgeStatus', () => {
    const validStatuses = new Set(['active', 'suspended', 'archived', 'closed']);
    for (const value of Object.values(STATUS_TO_BADGE)) {
      expect(validStatuses.has(value)).toBe(true);
    }
  });
});
