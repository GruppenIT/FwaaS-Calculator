import type { IConector } from './interface.js';
import type { Plataforma } from '@causa/shared';

const connectorRegistry = new Map<string, IConector>();

export function registerConnector(connector: IConector): void {
  connectorRegistry.set(connector.nome, connector);
}

export function getConnector(nome: string): IConector | undefined {
  return connectorRegistry.get(nome);
}

export function getConnectorsByPlataforma(plataforma: Plataforma): IConector[] {
  return Array.from(connectorRegistry.values()).filter((c) => c.plataforma === plataforma);
}

export function listConnectors(): IConector[] {
  return Array.from(connectorRegistry.values());
}
