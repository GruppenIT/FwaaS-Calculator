import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateDespesaInput {
  processoId?: string;
  clienteId?: string;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  antecipadoPor: string;
  reembolsavel?: boolean;
  comprovanteDocId?: string;
  responsavelId: string;
  status?: string;
}

export class DespesaService {
  private despesas;
  private processos;
  private clientes;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.despesas = schema.despesas;
    this.processos = schema.processos;
    this.clientes = schema.clientes;
    this.users = schema.users;
  }

  async criar(input: CreateDespesaInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.despesas).values({
      id,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      tipo: input.tipo as 'outra',
      descricao: input.descricao,
      valor: input.valor,
      data: input.data,
      antecipadoPor: input.antecipadoPor as 'escritorio',
      reembolsavel: input.reembolsavel ?? true,
      comprovanteDocId: input.comprovanteDocId ?? null,
      responsavelId: input.responsavelId,
      status: (input.status as 'pendente') ?? 'pendente',
    });
    return id;
  }

  async listar(filtros?: { processoId?: string; status?: string }) {
    const conditions = [];
    if (filtros?.processoId) {
      conditions.push(eq(this.despesas.processoId, filtros.processoId));
    }
    if (filtros?.status) {
      conditions.push(eq(this.despesas.status, filtros.status as 'pendente'));
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.despesas.id,
        processoId: this.despesas.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.despesas.clienteId,
        clienteNome: this.clientes.nome,
        tipo: this.despesas.tipo,
        descricao: this.despesas.descricao,
        valor: this.despesas.valor,
        data: this.despesas.data,
        antecipadoPor: this.despesas.antecipadoPor,
        reembolsavel: this.despesas.reembolsavel,
        reembolsado: this.despesas.reembolsado,
        dataReembolso: this.despesas.dataReembolso,
        responsavelId: this.despesas.responsavelId,
        responsavelNome: this.users.nome,
        status: this.despesas.status,
        createdAt: this.despesas.createdAt,
      })
      .from(this.despesas)
      .leftJoin(this.processos, eq(this.despesas.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.despesas.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.despesas.responsavelId, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.despesas.id,
        processoId: this.despesas.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.despesas.clienteId,
        clienteNome: this.clientes.nome,
        tipo: this.despesas.tipo,
        descricao: this.despesas.descricao,
        valor: this.despesas.valor,
        data: this.despesas.data,
        antecipadoPor: this.despesas.antecipadoPor,
        reembolsavel: this.despesas.reembolsavel,
        reembolsado: this.despesas.reembolsado,
        dataReembolso: this.despesas.dataReembolso,
        comprovanteDocId: this.despesas.comprovanteDocId,
        responsavelId: this.despesas.responsavelId,
        responsavelNome: this.users.nome,
        status: this.despesas.status,
        createdAt: this.despesas.createdAt,
      })
      .from(this.despesas)
      .leftJoin(this.processos, eq(this.despesas.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.despesas.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.despesas.responsavelId, this.users.id))
      .where(eq(this.despesas.id, id));
    return row ?? undefined;
  }

  async atualizar(
    id: string,
    input: Partial<CreateDespesaInput> & { reembolsado?: boolean; dataReembolso?: string },
  ) {
    const fields: Record<string, unknown> = {};
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.descricao !== undefined) fields.descricao = input.descricao;
    if (input.valor !== undefined) fields.valor = input.valor;
    if (input.data !== undefined) fields.data = input.data;
    if (input.antecipadoPor !== undefined) fields.antecipadoPor = input.antecipadoPor;
    if (input.reembolsavel !== undefined) fields.reembolsavel = input.reembolsavel;
    if (input.reembolsado !== undefined) fields.reembolsado = input.reembolsado;
    if (input.dataReembolso !== undefined) fields.dataReembolso = input.dataReembolso ?? null;
    if (input.comprovanteDocId !== undefined)
      fields.comprovanteDocId = input.comprovanteDocId ?? null;
    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.status !== undefined) fields.status = input.status;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.despesas)
      .set(fields)
      .where(eq(this.despesas.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.despesas)
      .where(eq(this.despesas.id, id));
  }
}
