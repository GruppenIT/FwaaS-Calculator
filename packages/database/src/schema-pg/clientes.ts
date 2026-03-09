import { pgTable, text, jsonb } from 'drizzle-orm/pg-core';
import { users } from './usuarios.js';
import type { EnderecoJson } from '../schema/clientes.js';

export const clientes = pgTable('clientes', {
  id: text('id').primaryKey(),
  tipo: text('tipo', { enum: ['PF', 'PJ'] }).notNull(),
  nome: text('nome').notNull(),
  nomeSocial: text('nome_social'),
  cpfCnpj: text('cpf_cnpj').unique(),
  rg: text('rg'),
  rgOrgaoEmissor: text('rg_orgao_emissor'),
  dataNascimento: text('data_nascimento'),
  nacionalidade: text('nacionalidade'),
  estadoCivil: text('estado_civil', {
    enum: ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'separado'],
  }),
  profissao: text('profissao'),
  email: text('email'),
  emailSecundario: text('email_secundario'),
  telefone: text('telefone'),
  telefoneSecundario: text('telefone_secundario'),
  whatsapp: text('whatsapp'),
  endereco: jsonb('endereco').$type<EnderecoJson>(),
  enderecoComercial: jsonb('endereco_comercial').$type<EnderecoJson>(),
  observacoes: text('observacoes'),
  origemCaptacao: text('origem_captacao', {
    enum: ['indicacao', 'site', 'oab', 'redes_sociais', 'google', 'outro'],
  }),
  indicadoPor: text('indicado_por'),
  statusCliente: text('status_cliente', {
    enum: ['prospecto', 'ativo', 'inativo', 'encerrado'],
  })
    .notNull()
    .default('ativo'),
  dataContrato: text('data_contrato'),
  contatoPreferencial: text('contato_preferencial', {
    enum: ['email', 'telefone', 'whatsapp'],
  }),
  tags: jsonb('tags').$type<string[]>(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
