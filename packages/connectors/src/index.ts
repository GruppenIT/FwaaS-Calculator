export {
  registerConnector,
  getConnector,
  getConnectorsByPlataforma,
  listConnectors,
} from './registry.js';
export type {
  IConector,
  ConfigConector,
  CertificadoConfig,
  ProcessoMinimo,
  ResultadoTeste,
  ResultadoPeticionamento,
  StatusConector,
  ConnectorLog,
} from './interface.js';
export { PjeMockConnector } from './pje-mock.js';
export { EsajMockConnector } from './esaj-mock.js';
