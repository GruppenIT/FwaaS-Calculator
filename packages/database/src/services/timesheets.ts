import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateTimesheetInput {
  userId: string;
  processoId?: string;
  clienteId?: string;
  tarefaId?: string;
  data: string;
  duracaoMinutos: number;
  descricao: string;
  tipoAtividade: string;
  faturavel?: boolean;
  taxaHorariaAplicada?: number;
}

export class TimesheetService {
  private timesheets;
  private processos;
  private clientes;
  private tarefas;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.timesheets = schema.timesheets;
    this.processos = schema.processos;
    this.clientes = schema.clientes;
    this.tarefas = schema.tarefas;
    this.users = schema.users;
  }

  async criar(input: CreateTimesheetInput): Promise<string> {
    const id = uuid();
    const valorCalculado =
      input.taxaHorariaAplicada != null
        ? Math.round((input.duracaoMinutos / 60) * input.taxaHorariaAplicada * 100) / 100
        : null;

    await (this.db as unknown as DatabaseQueryBuilder).insert(this.timesheets).values({
      id,
      userId: input.userId,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      tarefaId: input.tarefaId ?? null,
      data: input.data,
      duracaoMinutos: input.duracaoMinutos,
      descricao: input.descricao,
      tipoAtividade: input.tipoAtividade as 'outro',
      faturavel: input.faturavel ?? true,
      taxaHorariaAplicada: input.taxaHorariaAplicada ?? null,
      valorCalculado,
    });
    return id;
  }

  async listar(filtros?: { userId?: string; processoId?: string; data?: string }) {
    const conditions = [];
    if (filtros?.userId) {
      conditions.push(eq(this.timesheets.userId, filtros.userId));
    }
    if (filtros?.processoId) {
      conditions.push(eq(this.timesheets.processoId, filtros.processoId));
    }
    if (filtros?.data) {
      conditions.push(eq(this.timesheets.data, filtros.data));
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.timesheets.id,
        userId: this.timesheets.userId,
        usuarioNome: this.users.nome,
        processoId: this.timesheets.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.timesheets.clienteId,
        clienteNome: this.clientes.nome,
        tarefaId: this.timesheets.tarefaId,
        tarefaTitulo: this.tarefas.titulo,
        data: this.timesheets.data,
        duracaoMinutos: this.timesheets.duracaoMinutos,
        descricao: this.timesheets.descricao,
        tipoAtividade: this.timesheets.tipoAtividade,
        faturavel: this.timesheets.faturavel,
        taxaHorariaAplicada: this.timesheets.taxaHorariaAplicada,
        valorCalculado: this.timesheets.valorCalculado,
        aprovado: this.timesheets.aprovado,
        aprovadoPor: this.timesheets.aprovadoPor,
        createdAt: this.timesheets.createdAt,
      })
      .from(this.timesheets)
      .leftJoin(this.users, eq(this.timesheets.userId, this.users.id))
      .leftJoin(this.processos, eq(this.timesheets.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.timesheets.clienteId, this.clientes.id))
      .leftJoin(this.tarefas, eq(this.timesheets.tarefaId, this.tarefas.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.timesheets.id,
        userId: this.timesheets.userId,
        usuarioNome: this.users.nome,
        processoId: this.timesheets.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.timesheets.clienteId,
        clienteNome: this.clientes.nome,
        tarefaId: this.timesheets.tarefaId,
        tarefaTitulo: this.tarefas.titulo,
        data: this.timesheets.data,
        duracaoMinutos: this.timesheets.duracaoMinutos,
        descricao: this.timesheets.descricao,
        tipoAtividade: this.timesheets.tipoAtividade,
        faturavel: this.timesheets.faturavel,
        taxaHorariaAplicada: this.timesheets.taxaHorariaAplicada,
        valorCalculado: this.timesheets.valorCalculado,
        aprovado: this.timesheets.aprovado,
        aprovadoPor: this.timesheets.aprovadoPor,
        createdAt: this.timesheets.createdAt,
      })
      .from(this.timesheets)
      .leftJoin(this.users, eq(this.timesheets.userId, this.users.id))
      .leftJoin(this.processos, eq(this.timesheets.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.timesheets.clienteId, this.clientes.id))
      .leftJoin(this.tarefas, eq(this.timesheets.tarefaId, this.tarefas.id))
      .where(eq(this.timesheets.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateTimesheetInput>) {
    const fields: Record<string, unknown> = {};
    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.tarefaId !== undefined) fields.tarefaId = input.tarefaId ?? null;
    if (input.data !== undefined) fields.data = input.data;
    if (input.duracaoMinutos !== undefined) fields.duracaoMinutos = input.duracaoMinutos;
    if (input.descricao !== undefined) fields.descricao = input.descricao;
    if (input.tipoAtividade !== undefined) fields.tipoAtividade = input.tipoAtividade;
    if (input.faturavel !== undefined) fields.faturavel = input.faturavel;
    if (input.taxaHorariaAplicada !== undefined)
      fields.taxaHorariaAplicada = input.taxaHorariaAplicada ?? null;

    // Recalculate valor if duration or rate changed
    if (input.duracaoMinutos !== undefined || input.taxaHorariaAplicada !== undefined) {
      const existing = await this.obterPorId(id);
      if (existing) {
        const duracao = input.duracaoMinutos ?? existing.duracaoMinutos;
        const taxa = input.taxaHorariaAplicada ?? existing.taxaHorariaAplicada;
        fields.valorCalculado = taxa != null ? Math.round((duracao / 60) * taxa * 100) / 100 : null;
      }
    }

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.timesheets)
      .set(fields)
      .where(eq(this.timesheets.id, id));
  }

  async aprovar(id: string, aprovadoPor: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.timesheets)
      .set({ aprovado: true, aprovadoPor })
      .where(eq(this.timesheets.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.timesheets)
      .where(eq(this.timesheets.id, id));
  }
}
