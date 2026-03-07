export const PLANOS = {
  causa_solo: {
    nome: 'CAUSA Solo',
    descricao: 'Advogado autônomo, notebook único',
    maxSeats: 1,
    topologia: 'solo',
  },
  causa_escritorio: {
    nome: 'CAUSA Escritório',
    descricao: 'Escritório de 2 a 20 advogados, rede local',
    maxSeats: 20,
    topologia: 'escritorio',
  },
  causa_equipe: {
    nome: 'CAUSA Equipe',
    descricao: 'Escritório de 21+ advogados',
    maxSeats: 100,
    topologia: 'escritorio',
  },
} as const;

export type PlanoId = keyof typeof PLANOS;
export type Topologia = 'solo' | 'escritorio';
