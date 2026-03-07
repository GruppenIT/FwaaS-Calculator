import { v4 as uuid } from 'uuid';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client';
import type { CausaSchema } from '../schema-provider';

export interface CreateAgendaInput {
  titulo: string;
  tipo: 'audiencia' | 'diligencia' | 'reuniao' | 'prazo';
  dataHoraInicio: string;
  dataHoraFim?: string;
  processoId?: string;
  participantes?: string[];
  local?: string;
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
      tipo: input.tipo,
      dataHoraInicio: input.dataHoraInicio,
      dataHoraFim: input.dataHoraFim ?? null,
      processoId: input.processoId ?? null,
      participantes: input.participantes ?? null,
      local: input.local ?? null,
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
        tipo: this.agenda.tipo,
        dataHoraInicio: this.agenda.dataHoraInicio,
        dataHoraFim: this.agenda.dataHoraFim,
        processoId: this.agenda.processoId,
        numeroCnj: this.processos.numeroCnj,
        participantes: this.agenda.participantes,
        local: this.agenda.local,
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
        tipo: this.agenda.tipo,
        dataHoraInicio: this.agenda.dataHoraInicio,
        dataHoraFim: this.agenda.dataHoraFim,
        processoId: this.agenda.processoId,
        numeroCnj: this.processos.numeroCnj,
        participantes: this.agenda.participantes,
        local: this.agenda.local,
        createdAt: this.agenda.createdAt,
      })
      .from(this.agenda)
      .leftJoin(this.processos, eq(this.agenda.processoId, this.processos.id))
      .where(eq(this.agenda.id, id));
    return row ?? undefined;
  }

  async atualizar(id: string, input: Partial<CreateAgendaInput>) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.agenda)
      .set({
        ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.dataHoraInicio !== undefined ? { dataHoraInicio: input.dataHoraInicio } : {}),
        ...(input.dataHoraFim !== undefined ? { dataHoraFim: input.dataHoraFim ?? null } : {}),
        ...(input.processoId !== undefined ? { processoId: input.processoId ?? null } : {}),
        ...(input.participantes !== undefined
          ? { participantes: input.participantes ?? null }
          : {}),
        ...(input.local !== undefined ? { local: input.local ?? null } : {}),
      })
      .where(eq(this.agenda.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.agenda)
      .where(eq(this.agenda.id, id));
  }
}
