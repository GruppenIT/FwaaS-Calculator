import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeTierCounts } from './urgency-heat-map';
import type { PrazoRow } from '../../lib/api';

// Fix "today" to 2026-03-16 for deterministic tests
const TODAY = '2026-03-16';

function makePrazo(overrides: Partial<PrazoRow>): PrazoRow {
  return {
    id: '1',
    processoId: 'p1',
    numeroCnj: null,
    descricao: 'Test prazo',
    dataFatal: TODAY,
    dataInicio: null,
    diasPrazo: null,
    tipoContagem: null,
    tipoPrazo: 'normal',
    categoriaPrazo: null,
    prioridade: 'normal',
    fatal: false,
    status: 'pendente',
    suspenso: false,
    responsavelId: 'u1',
    responsavelNome: null,
    observacoes: null,
    dataCumprimento: null,
    alertasEnviados: null,
    ...overrides,
  };
}

describe('computeTierCounts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Test 1: empty array returns all zeros', () => {
    const result = computeTierCounts([]);
    expect(result).toEqual({
      fatal: 0,
      fatalVencido: 0,
      urgente: 0,
      semana: 0,
      proximo: 0,
    });
  });

  it('Test 2: prazo with dias < 0 counts as fatal AND fatalVencido', () => {
    const prazo = makePrazo({ dataFatal: '2026-03-10', status: 'pendente' });
    const result = computeTierCounts([prazo]);
    expect(result.fatal).toBe(1);
    expect(result.fatalVencido).toBe(1);
    expect(result.urgente).toBe(0);
  });

  it('Test 3: prazo with dias=0 or dias=1 counts as fatal (not fatalVencido)', () => {
    const hoje = makePrazo({ dataFatal: '2026-03-16', status: 'pendente' });
    const amanha = makePrazo({ dataFatal: '2026-03-17', status: 'pendente' });
    const result = computeTierCounts([hoje, amanha]);
    expect(result.fatal).toBe(2);
    expect(result.fatalVencido).toBe(0);
  });

  it('Test 4: prazo with dias=2 or dias=3 counts as urgente', () => {
    const d2 = makePrazo({ dataFatal: '2026-03-18', status: 'pendente' });
    const d3 = makePrazo({ dataFatal: '2026-03-19', status: 'pendente' });
    const result = computeTierCounts([d2, d3]);
    expect(result.urgente).toBe(2);
    expect(result.fatal).toBe(0);
  });

  it('Test 5: prazo with dias=5 counts as semana', () => {
    const d5 = makePrazo({ dataFatal: '2026-03-21', status: 'pendente' });
    const result = computeTierCounts([d5]);
    expect(result.semana).toBe(1);
    expect(result.urgente).toBe(0);
  });

  it('Test 6: prazo with dias=10 counts as proximo', () => {
    const d10 = makePrazo({ dataFatal: '2026-03-26', status: 'pendente' });
    const result = computeTierCounts([d10]);
    expect(result.proximo).toBe(1);
    expect(result.semana).toBe(0);
  });

  it('Test 7: only pendente status prazos are counted', () => {
    const pendente = makePrazo({ dataFatal: '2026-03-16', status: 'pendente' });
    const cumprido = makePrazo({ dataFatal: '2026-03-16', status: 'cumprido' });
    const perdido = makePrazo({ dataFatal: '2026-03-16', status: 'perdido' });
    const suspenso = makePrazo({ dataFatal: '2026-03-16', status: 'suspenso' });
    const result = computeTierCounts([pendente, cumprido, perdido, suspenso]);
    expect(result.fatal).toBe(1);
    expect(result.fatalVencido).toBe(0);
  });
});
