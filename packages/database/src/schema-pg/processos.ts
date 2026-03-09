import { pgTable, text, doublePrecision, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';
import type { ParteProcessual } from '../schema/processos.js';

export const processos = pgTable('processos', {
  id: text('id').primaryKey(),
  numeroCnj: text('numero_cnj').notNull().unique(),
  numeroAntigo: text('numero_antigo'),
  clienteId: text('cliente_id')
    .notNull()
    .references(() => clientes.id),
  clienteQualidade: text('cliente_qualidade'),
  advogadoResponsavelId: text('advogado_responsavel_id')
    .notNull()
    .references(() => users.id),
  advogadosSecundarios: jsonb('advogados_secundarios').$type<string[]>(),
  tribunalSigla: text('tribunal_sigla').notNull(),
  plataforma: text('plataforma', {
    enum: ['pje', 'esaj', 'eproc', 'projudi', 'tucujuris', 'sei', 'outro'],
  }).notNull(),
  area: text('area', {
    enum: [
      'civel',
      'trabalhista',
      'previdenciario',
      'criminal',
      'tributario',
      'familia',
      'consumidor',
      'ambiental',
      'administrativo',
      'outro',
    ],
  }).notNull(),
  fase: text('fase', {
    enum: ['conhecimento', 'recursal', 'execucao', 'cumprimento_sentenca', 'liquidacao'],
  }).notNull(),
  status: text('status', { enum: ['ativo', 'arquivado', 'encerrado', 'suspenso', 'baixado'] })
    .notNull()
    .default('ativo'),
  grau: text('grau'),
  comarca: text('comarca'),
  vara: text('vara'),
  juiz: text('juiz'),
  classeProcessual: text('classe_processual'),
  classeDescricao: text('classe_descricao'),
  assuntoPrincipal: text('assunto_principal'),
  assuntoDescricao: text('assunto_descricao'),
  subarea: text('subarea'),
  rito: text('rito'),
  prioridade: text('prioridade').notNull().default('normal'),
  segredoJustica: boolean('segredo_justica').notNull().default(false),
  justicaGratuita: boolean('justica_gratuita').notNull().default(false),
  poloAtivo: jsonb('polo_ativo').$type<ParteProcessual[]>(),
  poloPassivo: jsonb('polo_passivo').$type<ParteProcessual[]>(),
  valorCausa: doublePrecision('valor_causa'),
  valorCondenacao: doublePrecision('valor_condenacao'),
  dataDistribuicao: text('data_distribuicao'),
  dataTransitoJulgado: text('data_transito_julgado'),
  dataEncerramento: text('data_encerramento'),
  processoRelacionadoId: text('processo_relacionado_id'),
  tipoRelacao: text('tipo_relacao'),
  tags: jsonb('tags').$type<string[]>(),
  observacoes: text('observacoes'),
  advogadoContrario: text('advogado_contrario'),
  oabContrario: text('oab_contrario'),
  ultimoSyncAt: text('ultimo_sync_at'),
  updatedAt: text('updated_at'),
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
  teor: text('teor'),
  tipo: text('tipo', {
    enum: [
      'despacho',
      'sentenca',
      'intimacao',
      'publicacao',
      'acordao',
      'citacao',
      'decisao_interlocutoria',
      'distribuicao',
      'juntada',
      'certidao',
      'outros',
    ],
  }).notNull(),
  origem: text('origem').notNull(),
  lido: boolean('lido').notNull().default(false),
  urgente: boolean('urgente').notNull().default(false),
  geraPrazo: boolean('gera_prazo').notNull().default(false),
  prazoGeradoId: text('prazo_gerado_id'),
  linkExterno: text('link_externo'),
  lidoPor: text('lido_por'),
  lidoAt: text('lido_at'),
  documentoAnexoId: text('documento_anexo_id'),
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
  dataInicio: text('data_inicio'),
  diasPrazo: integer('dias_prazo'),
  tipoContagem: text('tipo_contagem'),
  tipoPrazo: text('tipo_prazo', {
    enum: ['ncpc', 'clt', 'jec', 'tributario', 'administrativo', 'contratual', 'outros'],
  }).notNull(),
  categoriaPrazo: text('categoria_prazo'),
  prioridade: text('prioridade').notNull().default('normal'),
  fatal: boolean('fatal').notNull().default(false),
  status: text('status', { enum: ['pendente', 'cumprido', 'perdido', 'suspenso'] })
    .notNull()
    .default('pendente'),
  suspenso: boolean('suspenso').notNull().default(false),
  motivoSuspensao: text('motivo_suspensao'),
  dataSuspensao: text('data_suspensao'),
  dataRetomada: text('data_retomada'),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => users.id),
  responsaveisSecundarios: jsonb('responsaveis_secundarios').$type<string[]>(),
  observacoes: text('observacoes'),
  dataCumprimento: text('data_cumprimento'),
  cumpridoPor: text('cumprido_por'),
  alertasEnviados: jsonb('alertas_enviados').$type<{
    dias: number[];
    enviados: string[];
  }>(),
});
