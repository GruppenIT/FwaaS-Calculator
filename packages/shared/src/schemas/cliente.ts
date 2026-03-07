import { z } from 'zod';

function validarCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9]!)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]!);
}

function validarCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]!) * weights1[i]!;
  let rest = sum % 11;
  if (rest < 2) { if (parseInt(digits[12]!) !== 0) return false; }
  else { if (parseInt(digits[12]!) !== 11 - rest) return false; }
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]!) * weights2[i]!;
  rest = sum % 11;
  if (rest < 2) return parseInt(digits[13]!) === 0;
  return parseInt(digits[13]!) === 11 - rest;
}

export const createClienteSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(300),
  cpfCnpj: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, '');
      if (digits.length === 11) return validarCpf(val);
      if (digits.length === 14) return validarCnpj(val);
      return false;
    },
    { message: 'CPF ou CNPJ inválido' },
  ),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().max(20).optional(),
  endereco: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().length(2).optional(),
    cep: z.string().optional(),
  }).optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
