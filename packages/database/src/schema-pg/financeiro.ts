import { pgTable, text, doublePrecision } from 'drizzle-orm/pg-core';
import { processos } from './processos.js';
import { clientes } from './clientes.js';

export const honorarios = pgTable('honorarios', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  tipo: text('tipo', { enum: ['fixo', 'exito', 'por_hora'] }).notNull(),
  valor: doublePrecision('valor').notNull(),
  percentualExito: doublePrecision('percentual_exito'),
  status: text('status', { enum: ['pendente', 'recebido', 'inadimplente'] })
    .notNull()
    .default('pendente'),
  vencimento: text('vencimento'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
