import { pgTable, text, integer, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { users } from './usuarios.js';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { tarefas } from './tarefas.js';

export const timesheets = pgTable('timesheets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  tarefaId: text('tarefa_id').references(() => tarefas.id),
  data: text('data').notNull(),
  duracaoMinutos: integer('duracao_minutos').notNull(),
  descricao: text('descricao').notNull(),
  tipoAtividade: text('tipo_atividade').notNull(),
  faturavel: boolean('faturavel').notNull().default(true),
  taxaHorariaAplicada: doublePrecision('taxa_horaria_aplicada'),
  valorCalculado: doublePrecision('valor_calculado'),
  aprovado: boolean('aprovado').notNull().default(false),
  aprovadoPor: text('aprovado_por').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
