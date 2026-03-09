import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { clientes } from './clientes.js';
import { users } from './usuarios.js';

export interface ParteProcessual {
  nome: string;
  cpfCnpj?: string;
  tipo: string;
  qualificacao?: string;
  email?: string;
  telefone?: string;
  advogadoNome?: string;
  advogadoOab?: string;
  isPessoaJuridica?: boolean;
}

export const processos = sqliteTable('processos', {
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
  advogadosSecundarios: text('advogados_secundarios', { mode: 'json' }).$type<string[]>(),
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
  segredoJustica: integer('segredo_justica', { mode: 'boolean' }).notNull().default(false),
  justicaGratuita: integer('justica_gratuita', { mode: 'boolean' }).notNull().default(false),
  poloAtivo: text('polo_ativo', { mode: 'json' }).$type<ParteProcessual[]>(),
  poloPassivo: text('polo_passivo', { mode: 'json' }).$type<ParteProcessual[]>(),
  valorCausa: real('valor_causa'),
  valorCondenacao: real('valor_condenacao'),
  dataDistribuicao: text('data_distribuicao'),
  dataTransitoJulgado: text('data_transito_julgado'),
  dataEncerramento: text('data_encerramento'),
  processoRelacionadoId: text('processo_relacionado_id'),
  tipoRelacao: text('tipo_relacao'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  observacoes: text('observacoes'),
  advogadoContrario: text('advogado_contrario'),
  oabContrario: text('oab_contrario'),
  ultimoSyncAt: text('ultimo_sync_at'),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const movimentacoes = sqliteTable('movimentacoes', {
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
  lido: integer('lido', { mode: 'boolean' }).notNull().default(false),
  urgente: integer('urgente', { mode: 'boolean' }).notNull().default(false),
  geraPrazo: integer('gera_prazo', { mode: 'boolean' }).notNull().default(false),
  prazoGeradoId: text('prazo_gerado_id'),
  linkExterno: text('link_externo'),
  lidoPor: text('lido_por'),
  lidoAt: text('lido_at'),
  documentoAnexoId: text('documento_anexo_id'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const prazos = sqliteTable('prazos', {
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
  fatal: integer('fatal', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['pendente', 'cumprido', 'perdido', 'suspenso'] })
    .notNull()
    .default('pendente'),
  suspenso: integer('suspenso', { mode: 'boolean' }).notNull().default(false),
  motivoSuspensao: text('motivo_suspensao'),
  dataSuspensao: text('data_suspensao'),
  dataRetomada: text('data_retomada'),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => users.id),
  responsaveisSecundarios: text('responsaveis_secundarios', { mode: 'json' }).$type<string[]>(),
  observacoes: text('observacoes'),
  dataCumprimento: text('data_cumprimento'),
  cumpridoPor: text('cumprido_por'),
  alertasEnviados: text('alertas_enviados', { mode: 'json' }).$type<{
    dias: number[];
    enviados: string[];
  }>(),
});
