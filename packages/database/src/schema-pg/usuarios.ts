import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { roles } from './rbac';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  oabNumero: text('oab_numero'),
  oabSeccional: text('oab_seccional'),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id),
  certificadoA1Path: text('certificado_a1_path'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
