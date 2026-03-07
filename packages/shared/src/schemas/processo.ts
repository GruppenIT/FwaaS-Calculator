import { z } from 'zod';

export const createProcessoSchema = z.object({
  numeroCnj: z.string().regex(
    /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
    'Formato CNJ inválido. Use: NNNNNNN-DD.AAAA.J.TT.OOOO',
  ),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  advogadoResponsavelId: z.string().min(1, 'Advogado responsável é obrigatório'),
  tribunalSigla: z.string().min(2, 'Tribunal é obrigatório').max(10),
  plataforma: z.enum(['pje', 'esaj', 'eproc', 'projudi']),
  area: z.enum(['civel', 'trabalhista', 'previdenciario', 'criminal', 'tributario']),
  fase: z.enum(['conhecimento', 'recursal', 'execucao']),
  valorCausa: z.number().positive().optional(),
  poloAtivo: z.array(z.object({
    nome: z.string(),
    cpfCnpj: z.string().optional(),
    tipo: z.enum(['autor', 'reu', 'terceiro']),
  })).optional(),
  poloPassivo: z.array(z.object({
    nome: z.string(),
    cpfCnpj: z.string().optional(),
    tipo: z.enum(['autor', 'reu', 'terceiro']),
  })).optional(),
});

export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;
