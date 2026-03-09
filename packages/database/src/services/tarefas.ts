import { v4 as uuid } from 'uuid';
import { eq, and, or } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

export interface CreateTarefaInput {
  titulo: string;
  descricao?: string;
  processoId?: string;
  clienteId?: string;
  criadoPor: string;
  responsavelId: string;
  prioridade?: string;
  status?: string;
  categoria?: string;
  dataLimite?: string;
  tempoEstimadoMin?: number;
  observacoes?: string;
}

export class TarefaService {
  private tarefas;
  private processos;
  private clientes;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.tarefas = schema.tarefas;
    this.processos = schema.processos;
    this.clientes = schema.clientes;
    this.users = schema.users;
  }

  async criar(input: CreateTarefaInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.tarefas).values({
      id,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      criadoPor: input.criadoPor,
      responsavelId: input.responsavelId,
      prioridade: (input.prioridade as 'normal') ?? 'normal',
      status: (input.status as 'pendente') ?? 'pendente',
      categoria: (input.categoria as 'outro') ?? null,
      dataLimite: input.dataLimite ?? null,
      tempoEstimadoMin: input.tempoEstimadoMin ?? null,
      observacoes: input.observacoes ?? null,
    });
    return id;
  }

  async listar(filtros?: {
    status?: string;
    prioridade?: string;
    responsavelId?: string;
    processoId?: string;
  }) {
    const conditions = [];
    if (filtros?.status) {
      conditions.push(eq(this.tarefas.status, filtros.status as 'pendente'));
    }
    if (filtros?.prioridade) {
      conditions.push(eq(this.tarefas.prioridade, filtros.prioridade as 'normal'));
    }
    if (filtros?.responsavelId) {
      conditions.push(
        or(
          eq(this.tarefas.responsavelId, filtros.responsavelId),
          eq(this.tarefas.criadoPor, filtros.responsavelId),
        ),
      );
    }
    if (filtros?.processoId) {
      conditions.push(eq(this.tarefas.processoId, filtros.processoId));
    }

    const responsavel = this.users;
    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.tarefas.id,
        titulo: this.tarefas.titulo,
        descricao: this.tarefas.descricao,
        processoId: this.tarefas.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.tarefas.clienteId,
        clienteNome: this.clientes.nome,
        criadoPor: this.tarefas.criadoPor,
        responsavelId: this.tarefas.responsavelId,
        responsavelNome: responsavel.nome,
        prioridade: this.tarefas.prioridade,
        status: this.tarefas.status,
        categoria: this.tarefas.categoria,
        dataLimite: this.tarefas.dataLimite,
        dataConclusao: this.tarefas.dataConclusao,
        tempoEstimadoMin: this.tarefas.tempoEstimadoMin,
        tempoGastoMin: this.tarefas.tempoGastoMin,
        observacoes: this.tarefas.observacoes,
        createdAt: this.tarefas.createdAt,
      })
      .from(this.tarefas)
      .leftJoin(this.processos, eq(this.tarefas.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.tarefas.clienteId, this.clientes.id))
      .leftJoin(responsavel, eq(this.tarefas.responsavelId, responsavel.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const responsavel = this.users;
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.tarefas.id,
        titulo: this.tarefas.titulo,
        descricao: this.tarefas.descricao,
        processoId: this.tarefas.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.tarefas.clienteId,
        clienteNome: this.clientes.nome,
        criadoPor: this.tarefas.criadoPor,
        responsavelId: this.tarefas.responsavelId,
        responsavelNome: responsavel.nome,
        prioridade: this.tarefas.prioridade,
        status: this.tarefas.status,
        categoria: this.tarefas.categoria,
        dataLimite: this.tarefas.dataLimite,
        dataConclusao: this.tarefas.dataConclusao,
        tempoEstimadoMin: this.tarefas.tempoEstimadoMin,
        tempoGastoMin: this.tarefas.tempoGastoMin,
        observacoes: this.tarefas.observacoes,
        createdAt: this.tarefas.createdAt,
        updatedAt: this.tarefas.updatedAt,
      })
      .from(this.tarefas)
      .leftJoin(this.processos, eq(this.tarefas.processoId, this.processos.id))
      .leftJoin(this.clientes, eq(this.tarefas.clienteId, this.clientes.id))
      .leftJoin(responsavel, eq(this.tarefas.responsavelId, responsavel.id))
      .where(eq(this.tarefas.id, id));
    return row ?? undefined;
  }

  async atualizar(
    id: string,
    input: Partial<CreateTarefaInput> & { dataConclusao?: string; tempoGastoMin?: number },
  ) {
    const fields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.titulo !== undefined) fields.titulo = input.titulo;
    if (input.descricao !== undefined) fields.descricao = input.descricao ?? null;
    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.responsavelId !== undefined) fields.responsavelId = input.responsavelId;
    if (input.prioridade !== undefined) fields.prioridade = input.prioridade;
    if (input.status !== undefined) fields.status = input.status;
    if (input.categoria !== undefined) fields.categoria = input.categoria ?? null;
    if (input.dataLimite !== undefined) fields.dataLimite = input.dataLimite ?? null;
    if (input.dataConclusao !== undefined) fields.dataConclusao = input.dataConclusao ?? null;
    if (input.tempoEstimadoMin !== undefined)
      fields.tempoEstimadoMin = input.tempoEstimadoMin ?? null;
    if (input.tempoGastoMin !== undefined) fields.tempoGastoMin = input.tempoGastoMin ?? null;
    if (input.observacoes !== undefined) fields.observacoes = input.observacoes ?? null;

    // Auto-preencher dataConclusao quando status muda para concluida
    if (input.status === 'concluida' && !input.dataConclusao) {
      fields.dataConclusao = new Date().toISOString();
    }

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.tarefas)
      .set(fields)
      .where(eq(this.tarefas.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.tarefas)
      .where(eq(this.tarefas.id, id));
  }
}
