import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const licencas = sqliteTable('licencas', {
  id: text('id').primaryKey(),
  chaveLicenca: text('chave_licenca').notNull().unique(),
  plano: text('plano', { enum: ['causa_solo', 'causa_escritorio', 'causa_equipe'] }).notNull(),
  seatsContratados: integer('seats_contratados').notNull().default(1),
  validadeAte: text('validade_ate').notNull(),
  featuresAtivas: text('features_ativas', { mode: 'json' }).$type<string[]>(),
});
