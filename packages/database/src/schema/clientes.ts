import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './usuarios';

export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey(), // uuid
  tipo: text('tipo', { enum: ['PF', 'PJ'] }).notNull(),
  nome: text('nome').notNull(),
  cpfCnpj: text('cpf_cnpj').unique(),
  email: text('email'),
  telefone: text('telefone'),
  endereco: text('endereco', { mode: 'json' }).$type<{
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  }>(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
