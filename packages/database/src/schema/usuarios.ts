import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { roles } from './rbac.js';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  oabNumero: text('oab_numero'),
  oabSeccional: text('oab_seccional'),
  oabTipo: text('oab_tipo'),
  telefone: text('telefone'),
  roleId: text('role_id')
    .notNull()
    .references(() => roles.id),
  areaAtuacao: text('area_atuacao'),
  especialidade: text('especialidade'),
  taxaHoraria: real('taxa_horaria'),
  dataAdmissao: text('data_admissao'),
  certificadoA1Path: text('certificado_a1_path'),
  certificadoA1Validade: text('certificado_a1_validade'),
  certificadoA3Configurado: integer('certificado_a3_configurado', { mode: 'boolean' })
    .notNull()
    .default(false),
  avatarPath: text('avatar_path'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
