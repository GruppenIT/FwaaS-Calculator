import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { honorarios } from './financeiro.js';
import { documentos } from './documentos.js';

export const parcelas = sqliteTable('parcelas', {
  id: text('id').primaryKey(),
  honorarioId: text('honorario_id')
    .notNull()
    .references(() => honorarios.id),
  numeroParcela: integer('numero_parcela').notNull(),
  valor: real('valor').notNull(),
  vencimento: text('vencimento').notNull(),
  status: text('status', {
    enum: ['pendente', 'pago', 'atrasado', 'cancelado'],
  })
    .notNull()
    .default('pendente'),
  dataPagamento: text('data_pagamento'),
  valorPago: real('valor_pago'),
  formaPagamento: text('forma_pagamento', {
    enum: ['pix', 'boleto', 'transferencia', 'dinheiro', 'cartao', 'cheque', 'deposito'],
  }),
  comprovanteDocId: text('comprovante_doc_id').references(() => documentos.id),
  juros: real('juros'),
  multa: real('multa'),
  desconto: real('desconto'),
  observacoes: text('observacoes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
