import { pgTable, text, boolean, jsonb } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';
import type { RecorrenciaJson, LembreteJson } from '../schema/agenda.js';

export const agenda = pgTable('agenda', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  tipo: text('tipo', {
    enum: [
      'audiencia',
      'diligencia',
      'reuniao',
      'prazo',
      'pericia',
      'mediacao',
      'conciliacao',
      'depoimento',
      'juri',
      'outro',
    ],
  }).notNull(),
  dataHoraInicio: text('data_hora_inicio').notNull(),
  dataHoraFim: text('data_hora_fim'),
  diaInteiro: boolean('dia_inteiro').notNull().default(false),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  participantes: jsonb('participantes').$type<string[]>(),
  local: text('local'),
  linkVideoconferencia: text('link_videoconferencia'),
  cor: text('cor'),
  recorrencia: jsonb('recorrencia').$type<RecorrenciaJson>(),
  lembretes: jsonb('lembretes').$type<LembreteJson[]>(),
  statusAgenda: text('status_agenda', {
    enum: ['agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado'],
  })
    .notNull()
    .default('agendado'),
  resultado: text('resultado'),
  criadoPor: text('criado_por').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
