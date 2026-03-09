import { z } from 'zod';

export const PRIORIDADE_TAREFA_OPTIONS = ['baixa', 'normal', 'alta', 'urgente'] as const;
export const STATUS_TAREFA_OPTIONS = ['pendente', 'em_andamento', 'concluida', 'cancelada'] as const;
export const CATEGORIA_TAREFA_OPTIONS = [
  'peticao',
  'pesquisa',
  'ligacao',
  'reuniao',
  'revisao',
  'diligencia',
  'administrativo',
  'outro',
] as const;

export const createTarefaSchema = z.object({
  titulo: z.string().min(1).max(500),
  descricao: z.string().optional(),
  processoId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  criadoPor: z.string().uuid(),
  responsavelId: z.string().uuid(),
  prioridade: z.enum(PRIORIDADE_TAREFA_OPTIONS).default('normal'),
  status: z.enum(STATUS_TAREFA_OPTIONS).default('pendente'),
  categoria: z.enum(CATEGORIA_TAREFA_OPTIONS).optional(),
  dataLimite: z.string().optional(),
  tempoEstimadoMin: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;

export const CATEGORIA_DOCUMENTO_OPTIONS = [
  'peticao',
  'procuracao',
  'contrato',
  'substabelecimento',
  'certidao',
  'laudo_pericial',
  'comprovante',
  'sentenca',
  'acordao',
  'ata_audiencia',
  'correspondencia',
  'nota_fiscal',
  'outro',
] as const;
