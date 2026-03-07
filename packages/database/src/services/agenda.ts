import { v4 as uuid } from 'uuid';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { agenda } from '../schema/agenda';
import { processos } from '../schema/processos';

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
  constructor(private db: CausaDatabase) {}

  criar(input: CreateAgendaInput): string {
    const id = uuid();
    this.db
      .insert(agenda)
      .values({
        id,
        titulo: input.titulo,
        tipo: input.tipo,
        dataHoraInicio: input.dataHoraInicio,
        dataHoraFim: input.dataHoraFim ?? null,
        processoId: input.processoId ?? null,
        participantes: input.participantes ?? null,
        local: input.local ?? null,
      })
      .run();
    return id;
  }

  listar(filtros?: { inicio?: string; fim?: string }) {
    const conditions = [];
    if (filtros?.inicio) {
      conditions.push(gte(agenda.dataHoraInicio, filtros.inicio));
    }
    if (filtros?.fim) {
      conditions.push(lte(agenda.dataHoraInicio, filtros.fim));
    }

    const query = this.db
      .select({
        id: agenda.id,
        titulo: agenda.titulo,
        tipo: agenda.tipo,
        dataHoraInicio: agenda.dataHoraInicio,
        dataHoraFim: agenda.dataHoraFim,
        processoId: agenda.processoId,
        numeroCnj: processos.numeroCnj,
        participantes: agenda.participantes,
        local: agenda.local,
        createdAt: agenda.createdAt,
      })
      .from(agenda)
      .leftJoin(processos, eq(agenda.processoId, processos.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all();
    }
    return query.all();
  }

  obterPorId(id: string) {
    return this.db
      .select({
        id: agenda.id,
        titulo: agenda.titulo,
        tipo: agenda.tipo,
        dataHoraInicio: agenda.dataHoraInicio,
        dataHoraFim: agenda.dataHoraFim,
        processoId: agenda.processoId,
        numeroCnj: processos.numeroCnj,
        participantes: agenda.participantes,
        local: agenda.local,
        createdAt: agenda.createdAt,
      })
      .from(agenda)
      .leftJoin(processos, eq(agenda.processoId, processos.id))
      .where(eq(agenda.id, id))
      .get();
  }

  atualizar(id: string, input: Partial<CreateAgendaInput>) {
    this.db
      .update(agenda)
      .set({
        ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.dataHoraInicio !== undefined ? { dataHoraInicio: input.dataHoraInicio } : {}),
        ...(input.dataHoraFim !== undefined ? { dataHoraFim: input.dataHoraFim ?? null } : {}),
        ...(input.processoId !== undefined ? { processoId: input.processoId ?? null } : {}),
        ...(input.participantes !== undefined ? { participantes: input.participantes ?? null } : {}),
        ...(input.local !== undefined ? { local: input.local ?? null } : {}),
      })
      .where(eq(agenda.id, id))
      .run();
  }

  excluir(id: string) {
    this.db.delete(agenda).where(eq(agenda.id, id)).run();
  }
}
