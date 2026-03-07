import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './usuarios.js';

export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey(), // uuid
  tipo: text('tipo', { enum: ['PF', 'PJ'] }).notNull(),
  nome: text('nome').notNull(),
  cpfCnpj: text('cpf_cnpj').unique(),
  email: text('email'),
  telefone: text('telefone'),
  endereco: text('endereco', { mode: 'json' }).$type<{
    logradouro?: string | undefined;
    numero?: string | undefined;
    complemento?: string | undefined;
    bairro?: string | undefined;
    cidade?: string | undefined;
    uf?: string | undefined;
    cep?: string | undefined;
  }>(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
