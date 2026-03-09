import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const contatos = pgTable('contatos', {
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
  comarcasAtuacao: text('comarcas_atuacao'),
  endereco: text('endereco'),
  observacoes: text('observacoes'),
  avaliacao: integer('avaliacao'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
