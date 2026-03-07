import type { Movimentacao, Plataforma } from './processo.js';

export interface ConfigConector {
  tribunalSigla: string;
  plataforma: Plataforma;
  timeout?: number;
}

export interface CertificadoConfig {
  caminhoArquivo: string;
  /** Senha obtida do Windows Credential Manager em runtime — nunca persistida */
  senha: string;
}

export interface ResultadoTeste {
  sucesso: boolean;
  mensagem: string;
  latenciaMs: number;
}

export interface ProcessoMinimo {
  id: string;
  numeroCnj: string;
  tribunalSigla: string;
  plataforma: Plataforma;
}

export interface ResultadoPeticionamento {
  sucesso: boolean;
  protocolo?: string;
  mensagemErro?: string;
}

export type StatusConector = 'sucesso' | 'erro' | 'timeout' | 'captcha';

export interface ConnectorLog {
  id: string;
  processoId: string;
  conectorNome: string;
  maquinaHostname: string;
  status: StatusConector;
  detalhes: Record<string, unknown>;
  duracaoMs: number;
  executadoAt: Date;
}

export interface IConector {
  nome: string;
  plataforma: Plataforma;
  versao: string;
  tribunaisSuportados: string[];

  testarConexao(config: ConfigConector): Promise<ResultadoTeste>;

  buscarMovimentacoes(
    processo: ProcessoMinimo,
    certificado: CertificadoConfig,
    ultimoSync: Date,
  ): Promise<Movimentacao[]>;

  peticionar?(
    processo: ProcessoMinimo,
    documento: Buffer,
    certificado: CertificadoConfig,
  ): Promise<ResultadoPeticionamento>;
}
