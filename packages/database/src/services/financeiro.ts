import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateHonorarioInput {
  processoId?: string;
  clienteId?: string;
  tipo: 'fixo' | 'exito' | 'por_hora' | 'sucumbencia' | 'dativos' | 'misto';
  descricao?: string;
  valor: number;
  valorBaseExito?: number;
  percentualExito?: number;
  parcelamento?: boolean;
  numeroParcelas?: number;
  vencimento?: string;
  contratoDocumentoId?: string;
  indiceCorrecao?: string;
  observacoes?: string;
}

export class FinanceiroService {
  private honorarios;
  private processos;
  private clientes;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.honorarios = schema.honorarios;
    this.processos = schema.processos;
    this.clientes = schema.clientes;
  }

  async criar(input: CreateHonorarioInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.honorarios).values({
      id,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      tipo: input.tipo,
      descricao: input.descricao ?? null,
      valor: input.valor,
      valorBaseExito: input.valorBaseExito ?? null,
      percentualExito: input.percentualExito ?? null,
      parcelamento: input.parcelamento ?? false,
      numeroParcelas: input.numeroParcelas ?? null,
      vencimento: input.vencimento ?? null,
      contratoDocumentoId: input.contratoDocumentoId ?? null,
      indiceCorrecao: input.indiceCorrecao ?? null,
      observacoes: input.observacoes ?? null,
      status: 'pendente',
    });
    return id;
  }

  private listSelect() {
    return {
      id: this.honorarios.id,
      processoId: this.honorarios.processoId,
      numeroCnj: this.processos.numeroCnj,
      clienteId: this.honorarios.clienteId,
      clienteNome: this.clientes.nome,
      tipo: this.honorarios.tipo,
      descricao: this.honorarios.descricao,
      valor: this.honorarios.valor,
      valorBaseExito: this.honorarios.valorBaseExito,
      percentualExito: this.honorarios.percentualExito,
      parcelamento: this.honorarios.parcelamento,
      numeroParcelas: this.honorarios.numeroParcelas,
      status: this.honorarios.status,
      vencimento: this.honorarios.vencimento,
      indiceCorrecao: this.honorarios.indiceCorrecao,
      observacoes: this.honorarios.observacoes,
      createdAt: this.honorarios.createdAt,
    };
  }

  async listar(advogadoId?: string) {
    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select(this.listSelect())
      .from(this.honorarios)
      .leftJoin(this.processos, eq(this.honorarios.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.honorarios.clienteId, this.clientes.id));

    if (advogadoId) {
      return query.where(eq(this.processos.advogadoResponsavelId, advogadoId));
    }
    return query;
  }

  async listarPorProcesso(processoId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
      .select(this.listSelect())
      .from(this.honorarios)
      .leftJoin(this.processos, eq(this.honorarios.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.honorarios.clienteId, this.clientes.id))
      .where(eq(this.honorarios.processoId, processoId));
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select(this.listSelect())
      .from(this.honorarios)
      .leftJoin(this.processos, eq(this.honorarios.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.honorarios.clienteId, this.clientes.id))
      .where(eq(this.honorarios.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateHonorarioInput> & { status?: string }) {
    const fields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.descricao !== undefined) fields.descricao = input.descricao ?? null;
    if (input.valor !== undefined) fields.valor = input.valor;
    if (input.valorBaseExito !== undefined) fields.valorBaseExito = input.valorBaseExito ?? null;
    if (input.percentualExito !== undefined) fields.percentualExito = input.percentualExito ?? null;
    if (input.parcelamento !== undefined) fields.parcelamento = input.parcelamento;
    if (input.numeroParcelas !== undefined) fields.numeroParcelas = input.numeroParcelas ?? null;
    if (input.vencimento !== undefined) fields.vencimento = input.vencimento ?? null;
    if (input.contratoDocumentoId !== undefined)
      fields.contratoDocumentoId = input.contratoDocumentoId ?? null;
    if (input.indiceCorrecao !== undefined) fields.indiceCorrecao = input.indiceCorrecao ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;
    if (input.status !== undefined) fields.status = input.status;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.honorarios)
      .set(fields)
      .where(eq(this.honorarios.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.honorarios)
      .where(eq(this.honorarios.id, id));
  }
}
