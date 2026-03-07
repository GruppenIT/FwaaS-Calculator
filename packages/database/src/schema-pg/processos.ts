import { pgTable, text, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';
import { clientes } from './clientes';
import { users } from './usuarios';

export const processos = pgTable('processos', {
  id: text('id').primaryKey(),
  numeroCnj: text('numero_cnj').notNull().unique(),
  clienteId: text('cliente_id')
    .notNull()
    .references(() => clientes.id),
  advogadoResponsavelId: text('advogado_responsavel_id')
    .notNull()
    .references(() => users.id),
  tribunalSigla: text('tribunal_sigla').notNull(),
  plataforma: text('plataforma', { enum: ['pje', 'esaj', 'eproc', 'projudi'] }).notNull(),
  area: text('area', {
    enum: ['civel', 'trabalhista', 'previdenciario', 'criminal', 'tributario'],
  }).notNull(),
  fase: text('fase', { enum: ['conhecimento', 'recursal', 'execucao'] }).notNull(),
  status: text('status', { enum: ['ativo', 'arquivado', 'encerrado'] })
    .notNull()
    .default('ativo'),
  poloAtivo:
    jsonb('polo_ativo').$type<
      Array<{ nome: string; cpfCnpj?: string | undefined; tipo: string }>
    >(),
  poloPassivo:
    jsonb('polo_passivo').$type<
      Array<{ nome: string; cpfCnpj?: string | undefined; tipo: string }>
    >(),
  valorCausa: doublePrecision('valor_causa'),
  ultimoSyncAt: text('ultimo_sync_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const movimentacoes = pgTable('movimentacoes', {
  id: text('id').primaryKey(),
  processoId: text('processo_id')
    .notNull()
    .references(() => processos.id),
  dataMovimento: text('data_movimento').notNull(),
  descricao: text('descricao').notNull(),
  tipo: text('tipo', {
    enum: ['despacho', 'sentenca', 'intimacao', 'publicacao', 'outros'],
  }).notNull(),
  origem: text('origem').notNull(),
  lido: boolean('lido').notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const prazos = pgTable('prazos', {
  id: text('id').primaryKey(),
  processoId: text('processo_id')
    .notNull()
    .references(() => processos.id),
  movimentacaoId: text('movimentacao_id').references(() => movimentacoes.id),
  descricao: text('descricao').notNull(),
  dataFatal: text('data_fatal').notNull(),
  tipoPrazo: text('tipo_prazo', { enum: ['ncpc', 'clt', 'jec', 'outros'] }).notNull(),
  status: text('status', { enum: ['pendente', 'cumprido', 'perdido'] })
    .notNull()
    .default('pendente'),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => users.id),
  alertasEnviados: jsonb('alertas_enviados').$type<{
    dias: number[];
    enviados: string[];
  }>(),
});
