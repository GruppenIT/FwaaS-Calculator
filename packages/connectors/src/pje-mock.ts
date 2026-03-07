import type {
  IConector,
  ConfigConector,
  CertificadoConfig,
  ProcessoMinimo,
  ResultadoTeste,
  ResultadoPeticionamento,
  Movimentacao,
} from './interface.js';

export class PjeMockConnector implements IConector {
  nome = 'pje-mock';
  plataforma = 'pje' as const;
  versao = '0.1.0';
  tribunaisSuportados = ['TJSP', 'TJRJ', 'TJMG', 'TRF1', 'TRF3'];

  async testarConexao(_config: ConfigConector): Promise<ResultadoTeste> {
    // Simula latência de rede
    await delay(200 + Math.random() * 300);
    return {
      sucesso: true,
      mensagem: '[MOCK] Conexão PJe simulada com sucesso.',
      latenciaMs: 250,
    };
  }

  async buscarMovimentacoes(
    processo: ProcessoMinimo,
    _certificado: CertificadoConfig,
    ultimoSync: Date,
  ): Promise<Movimentacao[]> {
    await delay(500 + Math.random() * 500);

    const agora = new Date();
    if (agora.getTime() - ultimoSync.getTime() < 60_000) {
      return []; // Sem novidades se sync recente
    }

    // Retorna movimentação mock
    return [
      {
        id: `mov-mock-${Date.now()}`,
        processoId: processo.id,
        dataMovimento: new Date(),
        descricao: '[MOCK] Despacho: Vista ao autor para manifestação em 15 dias.',
        tipo: 'despacho',
        origem: 'conector_pje',
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
    await delay(1000 + Math.random() * 500);
    return {
      sucesso: true,
      protocolo: `PJE-MOCK-${Date.now()}`,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
