import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { prazos, processos } from '../schema/processos';
import { users } from '../schema/usuarios';

export interface CreatePrazoInput {
  processoId: string;
  movimentacaoId?: string;
  descricao: string;
  dataFatal: string;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'outros';
  responsavelId: string;
}

export class PrazoService {
  constructor(private db: CausaDatabase) {}

  criar(input: CreatePrazoInput): string {
    const id = uuid();
    this.db
      .insert(prazos)
      .values({
        id,
        processoId: input.processoId,
        movimentacaoId: input.movimentacaoId ?? null,
        descricao: input.descricao,
        dataFatal: input.dataFatal,
        tipoPrazo: input.tipoPrazo,
        responsavelId: input.responsavelId,
        status: 'pendente',
        alertasEnviados: { dias: [7, 3, 1], enviados: [] },
      })
      .run();
    return id;
  }

  listar(filtros?: { status?: string; responsavelId?: string }) {
    const conditions = [];
    if (filtros?.status) {
      conditions.push(eq(prazos.status, filtros.status as 'pendente' | 'cumprido' | 'perdido'));
    }
    if (filtros?.responsavelId) {
      conditions.push(eq(prazos.responsavelId, filtros.responsavelId));
    }

    const query = this.db
      .select({
        id: prazos.id,
        processoId: prazos.processoId,
        numeroCnj: processos.numeroCnj,
        descricao: prazos.descricao,
        dataFatal: prazos.dataFatal,
        tipoPrazo: prazos.tipoPrazo,
        status: prazos.status,
        responsavelId: prazos.responsavelId,
        responsavelNome: users.nome,
        alertasEnviados: prazos.alertasEnviados,
      })
      .from(prazos)
      .leftJoin(processos, eq(prazos.processoId, processos.id))
      .leftJoin(users, eq(prazos.responsavelId, users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all();
    }
    return query.all();
  }

  obterPorId(id: string) {
    return this.db
      .select({
        id: prazos.id,
        processoId: prazos.processoId,
        numeroCnj: processos.numeroCnj,
        descricao: prazos.descricao,
        dataFatal: prazos.dataFatal,
        tipoPrazo: prazos.tipoPrazo,
        status: prazos.status,
        responsavelId: prazos.responsavelId,
        responsavelNome: users.nome,
        alertasEnviados: prazos.alertasEnviados,
      })
      .from(prazos)
      .leftJoin(processos, eq(prazos.processoId, processos.id))
      .leftJoin(users, eq(prazos.responsavelId, users.id))
      .where(eq(prazos.id, id))
      .get();
  }

  atualizarStatus(id: string, status: 'pendente' | 'cumprido' | 'perdido') {
    this.db
      .update(prazos)
      .set({ status })
      .where(eq(prazos.id, id))
      .run();
  }

  excluir(id: string) {
    this.db.delete(prazos).where(eq(prazos.id, id)).run();
  }
}
