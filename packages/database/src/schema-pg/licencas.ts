import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';

export const licencas = pgTable('licencas', {
  id: text('id').primaryKey(),
  chaveLicenca: text('chave_licenca').notNull().unique(),
  plano: text('plano', { enum: ['causa_solo', 'causa_escritorio', 'causa_equipe'] }).notNull(),
  seatsContratados: integer('seats_contratados').notNull().default(1),
  validadeAte: text('validade_ate').notNull(),
  featuresAtivas: jsonb('features_ativas').$type<string[]>(),
});
