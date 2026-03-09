import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const contatos = sqliteTable('contatos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo', {
    enum: [
      'correspondente',
      'perito',
      'testemunha',
      'oficial_justica',
      'mediador',
      'tradutor',
      'contador',
      'fornecedor',
      'outro',
    ],
  }).notNull(),
  cpfCnpj: text('cpf_cnpj'),
  oabNumero: text('oab_numero'),
  oabSeccional: text('oab_seccional'),
  email: text('email'),
  telefone: text('telefone'),
  whatsapp: text('whatsapp'),
  especialidade: text('especialidade'),
  comarcasAtuacao: text('comarcas_atuacao', { mode: 'json' }).$type<string[]>(),
  endereco: text('endereco', { mode: 'json' }).$type<{
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  }>(),
  observacoes: text('observacoes'),
  avaliacao: integer('avaliacao'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
