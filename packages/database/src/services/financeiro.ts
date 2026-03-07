import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateHonorarioInput {
  processoId?: string;
  clienteId?: string;
  tipo: 'fixo' | 'exito' | 'por_hora';
  valor: number;
  percentualExito?: number;
  vencimento?: string;
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
      valor: input.valor,
      percentualExito: input.percentualExito ?? null,
      vencimento: input.vencimento ?? null,
      status: 'pendente',
    });
    return id;
  }

  async listar(advogadoId?: string) {
    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.honorarios.id,
        processoId: this.honorarios.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.honorarios.clienteId,
        clienteNome: this.clientes.nome,
        tipo: this.honorarios.tipo,
        valor: this.honorarios.valor,
        percentualExito: this.honorarios.percentualExito,
        status: this.honorarios.status,
        vencimento: this.honorarios.vencimento,
        createdAt: this.honorarios.createdAt,
      })
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
      .select({
        id: this.honorarios.id,
        processoId: this.honorarios.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.honorarios.clienteId,
        clienteNome: this.clientes.nome,
        tipo: this.honorarios.tipo,
        valor: this.honorarios.valor,
        percentualExito: this.honorarios.percentualExito,
        status: this.honorarios.status,
        vencimento: this.honorarios.vencimento,
        createdAt: this.honorarios.createdAt,
      })
      .from(this.honorarios)
      .leftJoin(this.processos, eq(this.honorarios.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.honorarios.clienteId, this.clientes.id))
      .where(eq(this.honorarios.processoId, processoId));
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.honorarios.id,
        processoId: this.honorarios.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.honorarios.clienteId,
        clienteNome: this.clientes.nome,
        tipo: this.honorarios.tipo,
        valor: this.honorarios.valor,
        percentualExito: this.honorarios.percentualExito,
        status: this.honorarios.status,
        vencimento: this.honorarios.vencimento,
        createdAt: this.honorarios.createdAt,
      })
      .from(this.honorarios)
      .leftJoin(this.processos, eq(this.honorarios.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.honorarios.clienteId, this.clientes.id))
      .where(eq(this.honorarios.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateHonorarioInput> & { status?: 'pendente' | 'recebido' | 'inadimplente' }) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.honorarios)
      .set({
        ...(input.processoId !== undefined ? { processoId: input.processoId ?? null } : {}),
        ...(input.clienteId !== undefined ? { clienteId: input.clienteId ?? null } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.valor !== undefined ? { valor: input.valor } : {}),
        ...(input.percentualExito !== undefined ? { percentualExito: input.percentualExito ?? null } : {}),
        ...(input.vencimento !== undefined ? { vencimento: input.vencimento ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .where(eq(this.honorarios.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.honorarios)
      .where(eq(this.honorarios.id, id));
  }
}
