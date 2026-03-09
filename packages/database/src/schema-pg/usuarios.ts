import { pgTable, text, boolean, doublePrecision } from 'drizzle-orm/pg-core';
import { roles } from './rbac.js';

export const users = pgTable('users', {
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
  taxaHoraria: doublePrecision('taxa_horaria'),
  dataAdmissao: text('data_admissao'),
  certificadoA1Path: text('certificado_a1_path'),
  certificadoA1Validade: text('certificado_a1_validade'),
  certificadoA3Configurado: boolean('certificado_a3_configurado').notNull().default(false),
  avatarPath: text('avatar_path'),
  ativo: boolean('ativo').notNull().default(true),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
