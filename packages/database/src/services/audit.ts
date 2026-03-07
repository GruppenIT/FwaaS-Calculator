import { v4 as uuid } from 'uuid';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client';
import type { CausaSchema } from '../schema-provider';

export interface AuditEntry {
  userId: string;
  acao: string;
  recurso: string;
  recursoId?: string;
  payloadAnterior?: Record<string, unknown>;
}

export class AuditService {
  private auditLog;

  constructor(private db: CausaDatabase, schema: CausaSchema) {
    this.auditLog = schema.auditLog;
  }

  /**
   * Registra uma ação sensível no audit log.
   * O audit log é append-only — sem UPDATE ou DELETE.
   */
  async registrar(entry: AuditEntry): Promise<void> {
    await (this.db as unknown as DatabaseQueryBuilder)
      .insert(this.auditLog)
      .values({
        id: uuid(),
        userId: entry.userId,
        acao: entry.acao,
        recurso: entry.recurso,
        recursoId: entry.recursoId ?? null,
        payloadAnterior: entry.payloadAnterior ?? null,
      });
  }
}
