import { z } from 'zod';

export const OAB_TIPO_OPTIONS = ['pleno', 'suplementar', 'estagiario'] as const;

export const AREA_ATUACAO_OPTIONS = [
  'civel',
  'trabalhista',
  'previdenciario',
  'criminal',
  'tributario',
  'familia',
  'empresarial',
  'outro',
] as const;

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  oabNumero: z.string().max(10).optional(),
  oabSeccional: z.string().length(2).optional(),
  oabTipo: z.enum(OAB_TIPO_OPTIONS).optional(),
  telefone: z.string().max(20).optional(),
  roleId: z.string().min(1, 'Papel é obrigatório'),
  areaAtuacao: z.enum(AREA_ATUACAO_OPTIONS).optional(),
  especialidade: z.string().optional(),
  taxaHoraria: z.number().positive().optional(),
  dataAdmissao: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
