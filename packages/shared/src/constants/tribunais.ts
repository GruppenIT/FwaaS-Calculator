export interface TribunalInfo {
  sigla: string;
  nome: string;
  plataforma: 'pje' | 'esaj' | 'eproc' | 'projudi';
  prioridade: 'P1' | 'P2' | 'P3';
}

/** Tribunais suportados — P1 = MVP, P2 = v1.5, P3 = futuro */
export const TRIBUNAIS: TribunalInfo[] = [
  // P1 — MVP
  { sigla: 'TRF1', nome: 'Tribunal Regional Federal da 1ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TRF2', nome: 'Tribunal Regional Federal da 2ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TRF3', nome: 'Tribunal Regional Federal da 3ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TRF4', nome: 'Tribunal Regional Federal da 4ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TRF5', nome: 'Tribunal Regional Federal da 5ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TRF6', nome: 'Tribunal Regional Federal da 6ª Região', plataforma: 'pje', prioridade: 'P1' },
  { sigla: 'TJSP', nome: 'Tribunal de Justiça de São Paulo', plataforma: 'esaj', prioridade: 'P1' },

  // P2 — v1.5
  { sigla: 'TJRS', nome: 'Tribunal de Justiça do Rio Grande do Sul', plataforma: 'eproc', prioridade: 'P2' },
  { sigla: 'TJSC', nome: 'Tribunal de Justiça de Santa Catarina', plataforma: 'eproc', prioridade: 'P2' },
  { sigla: 'TJPR', nome: 'Tribunal de Justiça do Paraná', plataforma: 'projudi', prioridade: 'P2' },
  { sigla: 'TJMG', nome: 'Tribunal de Justiça de Minas Gerais', plataforma: 'pje', prioridade: 'P2' },
];
