import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';

export const agenda = pgTable('agenda', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  tipo: text('tipo', { enum: ['audiencia', 'diligencia', 'reuniao', 'prazo'] }).notNull(),
  dataHoraInicio: text('data_hora_inicio').notNull(),
  dataHoraFim: text('data_hora_fim'),
  processoId: text('processo_id').references(() => processos.id),
  participantes: jsonb('participantes').$type<string[]>(),
  local: text('local'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
