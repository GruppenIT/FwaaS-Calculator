import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './usuarios';

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  acao: text('acao').notNull(),
  recurso: text('recurso').notNull(),
  recursoId: text('recurso_id'),
  payloadAnterior: text('payload_anterior', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
