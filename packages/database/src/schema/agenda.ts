import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';

export interface RecorrenciaJson {
  tipo: 'diario' | 'semanal' | 'mensal';
  intervalo: number;
  diasSemana?: number[];
  dataFim?: string;
}

export interface LembreteJson {
  minutos: number;
  tipo: 'notificacao' | 'email';
}

export const agenda = sqliteTable('agenda', {
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
  diaInteiro: integer('dia_inteiro', { mode: 'boolean' }).notNull().default(false),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  participantes: text('participantes', { mode: 'json' }).$type<string[]>(),
  local: text('local'),
  linkVideoconferencia: text('link_videoconferencia'),
  cor: text('cor'),
  recorrencia: text('recorrencia', { mode: 'json' }).$type<RecorrenciaJson>(),
  lembretes: text('lembretes', { mode: 'json' }).$type<LembreteJson[]>(),
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
