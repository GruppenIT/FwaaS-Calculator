import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { roles } from './rbac';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // uuid
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  oabNumero: text('oab_numero'),
  oabSeccional: text('oab_seccional'),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id),
  certificadoA1Path: text('certificado_a1_path'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
