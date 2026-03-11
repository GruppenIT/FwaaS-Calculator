import { z } from 'zod';

function validarCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i)) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits.charAt(10));
}

function validarCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits.charAt(i)) * (weights1[i] ?? 0);
  let rest = sum % 11;
  if (rest < 2) {
    if (parseInt(digits.charAt(12)) !== 0) return false;
  } else {
    if (parseInt(digits.charAt(12)) !== 11 - rest) return false;
  }
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits.charAt(i)) * (weights2[i] ?? 0);
  rest = sum % 11;
  if (rest < 2) return parseInt(digits.charAt(13)) === 0;
  return parseInt(digits.charAt(13)) === 11 - rest;
}

export const ESTADO_CIVIL_OPTIONS = [
  'solteiro',
  'casado',
  'divorciado',
  'viuvo',
  'uniao_estavel',
  'separado',
] as const;

export const ORIGEM_CAPTACAO_OPTIONS = [
  'indicacao',
  'site',
  'oab',
  'redes_sociais',
  'google',
  'outro',
] as const;

export const STATUS_CLIENTE_OPTIONS = ['prospecto', 'ativo', 'inativo', 'encerrado'] as const;

export const CONTATO_PREFERENCIAL_OPTIONS = ['email', 'telefone', 'whatsapp'] as const;

const enderecoSchema = z.object({
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  cep: z.string().optional(),
  pais: z.string().optional(),
});

export const createClienteSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(300),
  nomeSocial: z.string().max(300).optional(),
  cpfCnpj: z
    .string({ error: 'CPF ou CNPJ é obrigatório' })
    .min(1, 'CPF ou CNPJ é obrigatório')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        if (digits.length === 11) return validarCpf(val);
        if (digits.length === 14) return validarCnpj(val);
        return false;
      },
      { message: 'CPF ou CNPJ inválido' },
    ),
  rg: z.string().max(20).optional(),
  rgOrgaoEmissor: z.string().max(20).optional(),
  dataNascimento: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.enum(ESTADO_CIVIL_OPTIONS).optional(),
  profissao: z.string().max(200).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  emailSecundario: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().max(20).optional(),
  telefoneSecundario: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  endereco: enderecoSchema.optional(),
  enderecoComercial: enderecoSchema.optional(),
  observacoes: z.string().optional(),
  origemCaptacao: z.enum(ORIGEM_CAPTACAO_OPTIONS).optional(),
  indicadoPor: z.string().optional(),
  statusCliente: z.enum(STATUS_CLIENTE_OPTIONS).optional(),
  dataContrato: z.string().optional(),
  contatoPreferencial: z.enum(CONTATO_PREFERENCIAL_OPTIONS).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
