import { v4 as uuid } from 'uuid';
import type { CausaDatabase } from '../client';
import { auditLog } from '../schema/audit-log';

export interface AuditEntry {
  userId: string;
  acao: string;
  recurso: string;
  recursoId?: string;
  payloadAnterior?: Record<string, unknown>;
}

export class AuditService {
  constructor(private db: CausaDatabase) {}

  /**
   * Registra uma ação sensível no audit log.
   * O audit log é append-only — sem UPDATE ou DELETE.
   */
  registrar(entry: AuditEntry): void {
    this.db
      .insert(auditLog)
      .values({
        id: uuid(),
        userId: entry.userId,
        acao: entry.acao,
        recurso: entry.recurso,
        recursoId: entry.recursoId ?? null,
        payloadAnterior: entry.payloadAnterior ?? null,
      })
      .run();
  }
}
