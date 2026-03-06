import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { processos } from './processos';

export const connectorLogs = sqliteTable('connector_logs', {
  id: text('id').primaryKey(),
  processoId: text('processo_id')
    .notNull()
    .references(() => processos.id),
  conectorNome: text('conector_nome').notNull(),
  maquinaHostname: text('maquina_hostname').notNull(),
  status: text('status', { enum: ['sucesso', 'erro', 'timeout', 'captcha'] }).notNull(),
  detalhes: text('detalhes', { mode: 'json' }).$type<Record<string, unknown>>(),
  duracaoMs: integer('duracao_ms').notNull(),
  executadoAt: text('executado_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
