import { v4 as uuid } from 'uuid';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';
import type { RecorrenciaJson, LembreteJson } from '../schema/agenda.js';

export interface CreateAgendaInput {
  titulo: string;
  descricao?: string;
  tipo: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  diaInteiro?: boolean;
  processoId?: string;
  clienteId?: string;
  participantes?: string[];
  local?: string;
  linkVideoconferencia?: string;
  cor?: string;
  recorrencia?: RecorrenciaJson;
  lembretes?: LembreteJson[];
  statusAgenda?: string;
  resultado?: string;
  criadoPor?: string;
}

export class AgendaService {
  private agenda;
  private processos;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.agenda = schema.agenda;
    this.processos = schema.processos;
  }

  async criar(input: CreateAgendaInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.agenda).values({
      id,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      tipo: input.tipo as 'audiencia',
      dataHoraInicio: input.dataHoraInicio,
      dataHoraFim: input.dataHoraFim ?? null,
      diaInteiro: input.diaInteiro ?? false,
      processoId: input.processoId ?? null,
      clienteId: input.clienteId ?? null,
      participantes: input.participantes ?? null,
      local: input.local ?? null,
      linkVideoconferencia: input.linkVideoconferencia ?? null,
      cor: input.cor ?? null,
      recorrencia: input.recorrencia ?? null,
      lembretes: input.lembretes ?? null,
      statusAgenda: (input.statusAgenda as 'agendado') ?? 'agendado',
      resultado: input.resultado ?? null,
      criadoPor: input.criadoPor ?? null,
    });
    return id;
  }

  async listar(filtros?: { inicio?: string; fim?: string }) {
    const conditions = [];
    if (filtros?.inicio) {
      conditions.push(gte(this.agenda.dataHoraInicio, filtros.inicio));
    }
    if (filtros?.fim) {
      conditions.push(lte(this.agenda.dataHoraInicio, filtros.fim));
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.agenda.id,
        titulo: this.agenda.titulo,
        descricao: this.agenda.descricao,
        tipo: this.agenda.tipo,
        dataHoraInicio: this.agenda.dataHoraInicio,
        dataHoraFim: this.agenda.dataHoraFim,
        diaInteiro: this.agenda.diaInteiro,
        processoId: this.agenda.processoId,
        numeroCnj: this.processos.numeroCnj,
        participantes: this.agenda.participantes,
        local: this.agenda.local,
        linkVideoconferencia: this.agenda.linkVideoconferencia,
        cor: this.agenda.cor,
        statusAgenda: this.agenda.statusAgenda,
        resultado: this.agenda.resultado,
        createdAt: this.agenda.createdAt,
      })
      .from(this.agenda)
      .leftJoin(this.processos, eq(this.agenda.processoId, this.processos.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.agenda.id,
        titulo: this.agenda.titulo,
        descricao: this.agenda.descricao,
        tipo: this.agenda.tipo,
        dataHoraInicio: this.agenda.dataHoraInicio,
        dataHoraFim: this.agenda.dataHoraFim,
        diaInteiro: this.agenda.diaInteiro,
        processoId: this.agenda.processoId,
        numeroCnj: this.processos.numeroCnj,
        clienteId: this.agenda.clienteId,
        participantes: this.agenda.participantes,
        local: this.agenda.local,
        linkVideoconferencia: this.agenda.linkVideoconferencia,
        cor: this.agenda.cor,
        recorrencia: this.agenda.recorrencia,
        lembretes: this.agenda.lembretes,
        statusAgenda: this.agenda.statusAgenda,
        resultado: this.agenda.resultado,
        createdAt: this.agenda.createdAt,
      })
      .from(this.agenda)
      .leftJoin(this.processos, eq(this.agenda.processoId, this.processos.id))
      .where(eq(this.agenda.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateAgendaInput>) {
    const fields: Record<string, unknown> = {};
    if (input.titulo !== undefined) fields.titulo = input.titulo;
    if (input.descricao !== undefined) fields.descricao = input.descricao ?? null;
    if (input.tipo !== undefined) fields.tipo = input.tipo;
    if (input.dataHoraInicio !== undefined) fields.dataHoraInicio = input.dataHoraInicio;
    if (input.dataHoraFim !== undefined) fields.dataHoraFim = input.dataHoraFim ?? null;
    if (input.diaInteiro !== undefined) fields.diaInteiro = input.diaInteiro;
    if (input.processoId !== undefined) fields.processoId = input.processoId ?? null;
    if (input.clienteId !== undefined) fields.clienteId = input.clienteId ?? null;
    if (input.participantes !== undefined) fields.participantes = input.participantes ?? null;
    if (input.local !== undefined) fields.local = input.local ?? null;
    if (input.linkVideoconferencia !== undefined)
      fields.linkVideoconferencia = input.linkVideoconferencia ?? null;
    if (input.cor !== undefined) fields.cor = input.cor ?? null;
    if (input.recorrencia !== undefined) fields.recorrencia = input.recorrencia ?? null;
    if (input.lembretes !== undefined) fields.lembretes = input.lembretes ?? null;
    if (input.statusAgenda !== undefined) fields.statusAgenda = input.statusAgenda;
    if (input.resultado !== undefined) fields.resultado = input.resultado ?? null;

    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.agenda)
      .set(fields)
      .where(eq(this.agenda.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.agenda)
      .where(eq(this.agenda.id, id));
  }
}
