export type AreaProcesso = 'civel' | 'trabalhista' | 'previdenciario' | 'criminal' | 'tributario';
export type FaseProcesso = 'conhecimento' | 'recursal' | 'execucao';
export type StatusProcesso = 'ativo' | 'arquivado' | 'encerrado';
export type Plataforma = 'pje' | 'esaj' | 'eproc' | 'projudi';

export interface Processo {
  id: string;
  numeroCnj: string;
  clienteId: string;
  advogadoResponsavelId: string;
  tribunalSigla: string;
  plataforma: Plataforma;
  area: AreaProcesso;
  fase: FaseProcesso;
  status: StatusProcesso;
  poloAtivo: ParteProcessual[];
  poloPassivo: ParteProcessual[];
  valorCausa: number | null;
  ultimoSyncAt: Date | null;
  createdAt: Date;
}

export interface ParteProcessual {
  nome: string;
  cpfCnpj?: string;
  tipo: 'autor' | 'reu' | 'terceiro';
}

export interface Movimentacao {
  id: string;
  processoId: string;
  dataMovimento: Date;
  descricao: string;
  tipo: 'despacho' | 'sentenca' | 'intimacao' | 'publicacao' | 'outros';
  origem: 'manual' | `conector_${string}`;
  lido: boolean;
  createdAt: Date;
}

export interface Prazo {
  id: string;
  processoId: string;
  movimentacaoId: string | null;
  descricao: string;
  dataFatal: Date;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'outros';
  status: 'pendente' | 'cumprido' | 'perdido';
  responsavelId: string;
  alertasEnviados: {
    dias: number[];
    enviados: string[];
  };
}

/**
 * Valida formato CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
 */
export function validarNumeroCnj(numero: string): boolean {
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(numero);
}
