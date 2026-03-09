import { pgTable, text, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';
import { documentos } from './documentos.js';

export const despesas = pgTable('despesas', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  tipo: text('tipo', {
    enum: [
      'custas_judiciais',
      'pericia',
      'diligencia',
      'correspondente',
      'copia_autenticada',
      'cartorio',
      'deslocamento',
      'correio',
      'publicacao',
      'outra',
    ],
  }).notNull(),
  descricao: text('descricao').notNull(),
  valor: doublePrecision('valor').notNull(),
  data: text('data').notNull(),
  antecipadoPor: text('antecipado_por', {
    enum: ['escritorio', 'cliente'],
  }).notNull(),
  reembolsavel: boolean('reembolsavel').notNull().default(true),
  reembolsado: boolean('reembolsado').notNull().default(false),
  dataReembolso: text('data_reembolso'),
  comprovanteDocId: text('comprovante_doc_id').references(() => documentos.id),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => users.id),
  status: text('status', {
    enum: ['pendente', 'pago', 'reembolsado', 'cancelado'],
  })
    .notNull()
    .default('pendente'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
