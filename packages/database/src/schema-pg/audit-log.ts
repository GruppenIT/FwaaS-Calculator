import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';
import { users } from './usuarios.js';

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  acao: text('acao').notNull(),
  recurso: text('recurso').notNull(),
  recursoId: text('recurso_id'),
  payloadAnterior: jsonb('payload_anterior').$type<Record<string, unknown>>(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
