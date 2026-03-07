import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';

export const connectorLogs = pgTable('connector_logs', {
  id: text('id').primaryKey(),
  processoId: text('processo_id')
    .notNull()
    .references(() => processos.id),
  conectorNome: text('conector_nome').notNull(),
  maquinaHostname: text('maquina_hostname').notNull(),
  status: text('status', { enum: ['sucesso', 'erro', 'timeout', 'captcha'] }).notNull(),
  detalhes: jsonb('detalhes').$type<Record<string, unknown>>(),
  duracaoMs: integer('duracao_ms').notNull(),
  executadoAt: text('executado_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
