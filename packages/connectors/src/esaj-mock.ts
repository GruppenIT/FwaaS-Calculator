import type {
  IConector,
  ConfigConector,
  CertificadoConfig,
  ProcessoMinimo,
  ResultadoTeste,
  ResultadoPeticionamento,
  Movimentacao,
} from './interface.js';

export class EsajMockConnector implements IConector {
  nome = 'esaj-mock';
  plataforma = 'esaj' as const;
  versao = '0.1.0';
  tribunaisSuportados = ['TJSP', 'TJSC', 'TJMS'];

  async testarConexao(_config: ConfigConector): Promise<ResultadoTeste> {
    await delay(300 + Math.random() * 200);
    return {
      sucesso: true,
      mensagem: '[MOCK] Conexão e-SAJ simulada com sucesso.',
      latenciaMs: 350,
    };
  }

  async buscarMovimentacoes(
    processo: ProcessoMinimo,
    _certificado: CertificadoConfig,
    ultimoSync: Date,
  ): Promise<Movimentacao[]> {
    await delay(600 + Math.random() * 400);

    const agora = new Date();
    if (agora.getTime() - ultimoSync.getTime() < 60_000) {
      return [];
    }

    return [
      {
        id: `mov-esaj-mock-${Date.now()}`,
        processoId: processo.id,
        dataMovimento: new Date(),
        descricao: '[MOCK] Publicação: Intimação para audiência designada para 30 dias.',
        tipo: 'intimacao',
        origem: 'conector_esaj',
        lido: false,
        createdAt: new Date(),
      },
    ];
  }

  async peticionar(
    _processo: ProcessoMinimo,
    _documento: Buffer,
    _certificado: CertificadoConfig,
  ): Promise<ResultadoPeticionamento> {
    await delay(1200 + Math.random() * 300);
    return {
      sucesso: true,
      protocolo: `ESAJ-MOCK-${Date.now()}`,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
