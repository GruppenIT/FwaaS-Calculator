import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { processos } from './processos';
import { clientes } from './clientes';

export const honorarios = sqliteTable('honorarios', {
  id: text('id').primaryKey(),
  processoId: text('processo_id').references(() => processos.id),
  clienteId: text('cliente_id').references(() => clientes.id),
  tipo: text('tipo', { enum: ['fixo', 'exito', 'por_hora'] }).notNull(),
  valor: real('valor').notNull(),
  percentualExito: real('percentual_exito'),
  status: text('status', { enum: ['pendente', 'recebido', 'inadimplente'] })
    .notNull()
    .default('pendente'),
  vencimento: text('vencimento'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
