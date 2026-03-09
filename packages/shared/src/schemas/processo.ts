import { z } from 'zod';

export const PLATAFORMA_OPTIONS = [
  'pje',
  'esaj',
  'eproc',
  'projudi',
  'tucujuris',
  'sei',
  'outro',
] as const;

export const AREA_OPTIONS = [
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
] as const;

export const FASE_OPTIONS = [
  'conhecimento',
  'recursal',
  'execucao',
  'cumprimento_sentenca',
  'liquidacao',
] as const;

export const STATUS_PROCESSO_OPTIONS = [
  'ativo',
  'arquivado',
  'encerrado',
  'suspenso',
  'baixado',
] as const;

export const GRAU_OPTIONS = ['primeiro', 'segundo', 'superior', 'stf'] as const;

export const RITO_OPTIONS = ['ordinario', 'sumario', 'sumarissimo', 'especial', 'juizado'] as const;

export const PRIORIDADE_PROCESSO_OPTIONS = [
  'normal',
  'idoso',
  'deficiente',
  'grave_enfermidade',
  'reu_preso',
] as const;

export const CLIENTE_QUALIDADE_OPTIONS = ['autor', 'reu', 'terceiro', 'interessado'] as const;

export const TIPO_RELACAO_OPTIONS = [
  'apenso',
  'incidental',
  'recurso',
  'execucao_provisoria',
] as const;

const parteSchema = z.object({
  nome: z.string(),
  cpfCnpj: z.string().optional(),
  tipo: z.enum(['autor', 'reu', 'terceiro', 'assistente', 'litisconsorte', 'amicus_curiae']),
  qualificacao: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  advogadoNome: z.string().optional(),
  advogadoOab: z.string().optional(),
  isPessoaJuridica: z.boolean().optional(),
});

export const createProcessoSchema = z.object({
  numeroCnj: z
    .string()
    .regex(
      /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
      'Formato CNJ inválido. Use: NNNNNNN-DD.AAAA.J.TT.OOOO',
    ),
  numeroAntigo: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  clienteQualidade: z.enum(CLIENTE_QUALIDADE_OPTIONS).optional(),
  advogadoResponsavelId: z.string().min(1, 'Advogado responsável é obrigatório'),
  advogadosSecundarios: z.array(z.string()).optional(),
  tribunalSigla: z.string().min(2, 'Tribunal é obrigatório').max(10),
  plataforma: z.enum(PLATAFORMA_OPTIONS),
  area: z.enum(AREA_OPTIONS),
  fase: z.enum(FASE_OPTIONS),
  grau: z.enum(GRAU_OPTIONS).optional(),
  comarca: z.string().optional(),
  vara: z.string().optional(),
  juiz: z.string().optional(),
  classeProcessual: z.string().optional(),
  classeDescricao: z.string().optional(),
  assuntoPrincipal: z.string().optional(),
  assuntoDescricao: z.string().optional(),
  subarea: z.string().optional(),
  rito: z.enum(RITO_OPTIONS).optional(),
  prioridade: z.enum(PRIORIDADE_PROCESSO_OPTIONS).optional(),
  segredoJustica: z.boolean().optional(),
  justicaGratuita: z.boolean().optional(),
  valorCausa: z.number().positive().optional(),
  valorCondenacao: z.number().optional(),
  dataDistribuicao: z.string().optional(),
  dataTransitoJulgado: z.string().optional(),
  dataEncerramento: z.string().optional(),
  processoRelacionadoId: z.string().optional(),
  tipoRelacao: z.enum(TIPO_RELACAO_OPTIONS).optional(),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
  advogadoContrario: z.string().optional(),
  oabContrario: z.string().optional(),
  poloAtivo: z.array(parteSchema).optional(),
  poloPassivo: z.array(parteSchema).optional(),
});

export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;
