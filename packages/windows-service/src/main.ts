import {
  registerConnector,
  PjeMockConnector,
  EsajMockConnector,
  listConnectors,
} from '@causa/connectors';
import type {
  IConector,
  ProcessoMinimo,
  CertificadoConfig,
  ConfigConector,
} from '@causa/connectors';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const API_URL = process.env.CAUSA_API_URL ?? 'http://localhost:3456';

interface ServiceConfig {
  apiUrl: string;
  pollIntervalMs: number;
  accessToken?: string;
}

let running = false;

function loadConfig(): ServiceConfig {
  return {
    apiUrl: API_URL,
    pollIntervalMs: POLL_INTERVAL_MS,
    ...(process.env.CAUSA_SERVICE_TOKEN != null && {
      accessToken: process.env.CAUSA_SERVICE_TOKEN,
    }),
  };
}

function registerMockConnectors() {
  registerConnector(new PjeMockConnector());
  registerConnector(new EsajMockConnector());
  console.log(
    '[Service] Conectores registrados:',
    listConnectors()
      .map((c) => c.nome)
      .join(', '),
  );
}

async function _syncProcesso(
  connector: IConector,
  processo: ProcessoMinimo,
  certificado: CertificadoConfig,
  ultimoSync: Date,
): Promise<number> {
  try {
    const movimentacoes = await connector.buscarMovimentacoes(processo, certificado, ultimoSync);
    if (movimentacoes.length > 0) {
      console.log(
        `[Service] ${processo.numeroCnj}: ${movimentacoes.length} nova(s) movimentação(ões)`,
      );
    }
    return movimentacoes.length;
  } catch (err) {
    console.error(
      `[Service] Erro ao sincronizar ${processo.numeroCnj}:`,
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}

async function pollCycle(_config: ServiceConfig) {
  const connectors = listConnectors();
  if (connectors.length === 0) {
    console.log('[Service] Nenhum conector registrado. Pulando ciclo.');
    return;
  }

  console.log(`[Service] Iniciando ciclo de sincronização (${connectors.length} conector(es))...`);

  // Em produção, buscaríamos processos ativos da API
  // Por ora, apenas logamos que o ciclo rodou
  const _demoCert: CertificadoConfig = {
    caminhoArquivo: '/mock/certificado.pfx',
    senha: 'mock-senha',
  };

  // Teste de conexão com cada conector
  for (const connector of connectors) {
    const config: ConfigConector = {
      tribunalSigla: 'TJSP',
      plataforma: connector.plataforma,
      timeout: 10000,
    };

    try {
      const result = await connector.testarConexao(config);
      console.log(`[Service] ${connector.nome}: ${result.mensagem} (${result.latenciaMs}ms)`);
    } catch (err) {
      console.error(`[Service] ${connector.nome}: falha no teste de conexão`, err);
    }
  }

  console.log('[Service] Ciclo de sincronização concluído.');
}

async function start() {
  console.log('[CAUSA Windows Service] Iniciando...');

  const config = loadConfig();
  registerMockConnectors();

  running = true;

  // Primeiro ciclo imediato
  await pollCycle(config);

  // Loop de polling
  while (running) {
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
    if (!running) break;
    await pollCycle(config);
  }

  console.log('[CAUSA Windows Service] Encerrado.');
}

function stop() {
  console.log('[CAUSA Windows Service] Parando...');
  running = false;
}

// Graceful shutdown
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start().catch((err) => {
  console.error('[CAUSA Windows Service] Erro fatal:', err);
  process.exit(1);
});
