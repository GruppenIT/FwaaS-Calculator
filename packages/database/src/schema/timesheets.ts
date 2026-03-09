import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './usuarios.js';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { tarefas } from './tarefas.js';

export const timesheets = sqliteTable('timesheets', {
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
  tipoAtividade: text('tipo_atividade', {
    enum: [
      'peticao',
      'pesquisa_jurisprudencia',
      'reuniao_cliente',
      'audiencia',
      'diligencia',
      'revisao',
      'analise_documental',
      'telefonema',
      'email',
      'administrativo',
      'deslocamento',
      'outro',
    ],
  }).notNull(),
  faturavel: integer('faturavel', { mode: 'boolean' }).notNull().default(true),
  taxaHorariaAplicada: real('taxa_horaria_aplicada'),
  valorCalculado: real('valor_calculado'),
  aprovado: integer('aprovado', { mode: 'boolean' }).notNull().default(false),
  aprovadoPor: text('aprovado_por').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
