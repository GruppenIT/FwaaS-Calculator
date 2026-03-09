import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateParcelaInput {
  honorarioId: string;
  numeroParcela: number;
  valor: number;
  vencimento: string;
  status?: string;
  observacoes?: string;
}

export interface PagarParcelaInput {
  dataPagamento: string;
  valorPago: number;
  formaPagamento?: string;
  comprovanteDocId?: string;
  juros?: number;
  multa?: number;
  desconto?: number;
}

export class ParcelaService {
  private parcelas;
  private honorarios;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.parcelas = schema.parcelas;
    this.honorarios = schema.honorarios;
  }

  /** Gera N parcelas automaticamente para um honorário parcelado */
  async gerarParcelas(
    honorarioId: string,
    numeroParcelas: number,
    valorTotal: number,
    primeiroVencimento: string,
  ): Promise<string[]> {
    const valorParcela = Math.round((valorTotal / numeroParcelas) * 100) / 100;
    const ids: string[] = [];

    for (let i = 0; i < numeroParcelas; i++) {
      const id = uuid();
      const venc = new Date(primeiroVencimento + 'T00:00:00');
      venc.setMonth(venc.getMonth() + i);
      const vencStr = venc.toISOString().split('T')[0]!;

      // Última parcela absorve arredondamento
      const valor =
        i === numeroParcelas - 1
          ? Math.round((valorTotal - valorParcela * (numeroParcelas - 1)) * 100) / 100
          : valorParcela;

      await (this.db as unknown as DatabaseQueryBuilder).insert(this.parcelas).values({
        id,
        honorarioId,
        numeroParcela: i + 1,
        valor,
        vencimento: vencStr,
        status: 'pendente' as const,
      });
      ids.push(id);
    }
    return ids;
  }

  async listarPorHonorario(honorarioId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.parcelas)
      .where(eq(this.parcelas.honorarioId, honorarioId));
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.parcelas)
      .where(eq(this.parcelas.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateParcelaInput>) {
    const fields: Record<string, unknown> = {};
    if (input.valor !== undefined) fields.valor = input.valor;
    if (input.vencimento !== undefined) fields.vencimento = input.vencimento;
    if (input.status !== undefined) fields.status = input.status;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.parcelas)
      .set(fields)
      .where(eq(this.parcelas.id, id));
  }

  async pagar(id: string, input: PagarParcelaInput) {
    const fields: Record<string, unknown> = {
      status: 'pago',
      dataPagamento: input.dataPagamento,
      valorPago: input.valorPago,
    };
    if (input.formaPagamento !== undefined) fields.formaPagamento = input.formaPagamento;
    if (input.comprovanteDocId !== undefined)
      fields.comprovanteDocId = input.comprovanteDocId ?? null;
    if (input.juros !== undefined) fields.juros = input.juros ?? null;
    if (input.multa !== undefined) fields.multa = input.multa ?? null;
    if (input.desconto !== undefined) fields.desconto = input.desconto ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.parcelas)
      .set(fields)
      .where(eq(this.parcelas.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.parcelas)
      .where(eq(this.parcelas.id, id));
  }
}
