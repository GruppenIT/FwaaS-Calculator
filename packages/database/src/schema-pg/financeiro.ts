import { pgTable, text, doublePrecision, boolean, integer } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';

export const honorarios = pgTable('honorarios', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  tipo: text('tipo', {
    enum: ['fixo', 'exito', 'por_hora', 'sucumbencia', 'dativos', 'misto'],
  }).notNull(),
  descricao: text('descricao'),
  valor: doublePrecision('valor').notNull(),
  valorBaseExito: doublePrecision('valor_base_exito'),
  percentualExito: doublePrecision('percentual_exito'),
  parcelamento: boolean('parcelamento').notNull().default(false),
  numeroParcelas: integer('numero_parcelas'),
  status: text('status', {
    enum: [
      'pendente',
      'recebido',
      'inadimplente',
      'proposta',
      'contratado',
      'em_andamento',
      'encerrado',
    ],
  })
    .notNull()
    .default('pendente'),
  vencimento: text('vencimento'),
  contratoDocumentoId: text('contrato_documento_id'),
  indiceCorrecao: text('indice_correcao'),
  observacoes: text('observacoes'),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
