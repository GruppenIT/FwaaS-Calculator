import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';

export const tarefas = sqliteTable('tarefas', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  criadoPor: text('criado_por')
    .notNull()
    .references(() => users.id),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => users.id),
  prioridade: text('prioridade', {
    enum: ['baixa', 'normal', 'alta', 'urgente'],
  })
    .notNull()
    .default('normal'),
  status: text('status', {
    enum: ['pendente', 'em_andamento', 'concluida', 'cancelada'],
  })
    .notNull()
    .default('pendente'),
  categoria: text('categoria', {
    enum: [
      'peticao',
      'pesquisa',
      'ligacao',
      'reuniao',
      'revisao',
      'diligencia',
      'administrativo',
      'outro',
    ],
  }),
  dataLimite: text('data_limite'),
  dataConclusao: text('data_conclusao'),
  tempoEstimadoMin: integer('tempo_estimado_min'),
  tempoGastoMin: integer('tempo_gasto_min'),
  observacoes: text('observacoes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
});
