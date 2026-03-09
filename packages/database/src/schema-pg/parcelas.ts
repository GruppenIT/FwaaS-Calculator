import { pgTable, text, doublePrecision, integer } from 'drizzle-orm/pg-core';
import { honorarios } from './financeiro.js';
import { documentos } from './documentos.js';

export const parcelas = pgTable('parcelas', {
  id: text('id').primaryKey(),
  honorarioId: text('honorario_id')
    .notNull()
    .references(() => honorarios.id),
  numeroParcela: integer('numero_parcela').notNull(),
  valor: doublePrecision('valor').notNull(),
  vencimento: text('vencimento').notNull(),
  status: text('status', {
    enum: ['pendente', 'pago', 'atrasado', 'cancelado'],
  })
    .notNull()
    .default('pendente'),
  dataPagamento: text('data_pagamento'),
  valorPago: doublePrecision('valor_pago'),
  formaPagamento: text('forma_pagamento', {
    enum: ['pix', 'boleto', 'transferencia', 'dinheiro', 'cartao', 'cheque', 'deposito'],
  }),
  comprovanteDocId: text('comprovante_doc_id').references(() => documentos.id),
  juros: doublePrecision('juros'),
  multa: doublePrecision('multa'),
  desconto: doublePrecision('desconto'),
  observacoes: text('observacoes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
