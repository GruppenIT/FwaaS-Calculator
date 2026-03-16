import { eq, and, lt } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

/**
 * Calcula data fatal a partir de data de início + dias de prazo.
 * Para contagem de dias úteis, exclui sábados e domingos.
 * Para dias corridos, simplesmente soma os dias.
 */
export function calcularDataFatal(
  dataInicio: string,
  diasPrazo: number,
  tipoContagem: 'uteis' | 'corridos' = 'corridos',
): string {
  const inicio = new Date(dataInicio + 'T00:00:00');

  if (tipoContagem === 'corridos') {
    inicio.setDate(inicio.getDate() + diasPrazo);
    return inicio.toISOString().split('T')[0] ?? '';
  }

  // Dias úteis: pular sábados (6) e domingos (0)
  let diasContados = 0;
  const atual = new Date(inicio);
  while (diasContados < diasPrazo) {
    atual.setDate(atual.getDate() + 1);
    const dow = atual.getDay();
    if (dow !== 0 && dow !== 6) {
      diasContados++;
    }
  }
  return atual.toISOString().split('T')[0] ?? '';
}

/**
 * Marca parcelas com vencimento passado e status "pendente" como "atrasado".
 * Retorna o número de parcelas atualizadas.
 */
export async function marcarParcelasAtrasadas(
  db: CausaDatabase,
  schema: CausaSchema,
): Promise<number> {
  const dbq = db as unknown as DatabaseQueryBuilder;
  const hoje = new Date().toISOString().split('T')[0] ?? '';

  // Find overdue parcelas
  const atrasadas = await dbq
    .select({ id: schema.parcelas.id })
    .from(schema.parcelas)
    .where(and(eq(schema.parcelas.status, 'pendente'), lt(schema.parcelas.vencimento, hoje)));

  for (const p of atrasadas) {
    await dbq
      .update(schema.parcelas)
      .set({ status: 'atrasado' })
      .where(eq(schema.parcelas.id, p.id));
  }

  return atrasadas.length;
}

/**
 * Verifica clientes com 60+ anos e atualiza a prioridade dos processos
 * para "idoso" quando aplicável.
 * Retorna o número de processos atualizados.
 */
export async function atualizarPrioridadePorIdade(
  db: CausaDatabase,
  schema: CausaSchema,
): Promise<number> {
  const dbq = db as unknown as DatabaseQueryBuilder;

  // Get all active processos with their clients' birth dates
  const processos = await dbq
    .select({
      processoId: schema.processos.id,
      prioridade: schema.processos.prioridade,
      dataNascimento: schema.clientes.dataNascimento,
    })
    .from(schema.processos)
    .leftJoin(schema.clientes, eq(schema.processos.clienteId, schema.clientes.id))
    .where(eq(schema.processos.status, 'ativo'));

  const hoje = new Date();
  let count = 0;

  for (const p of processos) {
    if (!p.dataNascimento || p.prioridade === 'idoso') continue;

    const nasc = new Date(p.dataNascimento + 'T00:00:00');
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNasc = nasc.getMonth();
    if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nasc.getDate())) {
      idade--;
    }

    if (idade >= 60) {
      await dbq
        .update(schema.processos)
        .set({ prioridade: 'idoso' })
        .where(eq(schema.processos.id, p.processoId));
      count++;
    }
  }

  return count;
}
