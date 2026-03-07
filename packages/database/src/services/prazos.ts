import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import type { CausaSchema } from '../schema-provider';

export interface CreatePrazoInput {
  processoId: string;
  movimentacaoId?: string;
  descricao: string;
  dataFatal: string;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'outros';
  responsavelId: string;
}

export class PrazoService {
  private prazos;
  private processos;
  private users;

  constructor(private db: CausaDatabase, schema: CausaSchema) {
    this.prazos = schema.prazos;
    this.processos = schema.processos;
    this.users = schema.users;
  }

  async criar(input: CreatePrazoInput): Promise<string> {
    const id = uuid();
    await (this.db as any)
      .insert(this.prazos)
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
      });
    return id;
  }

  async listar(filtros?: { status?: string; responsavelId?: string }) {
    const conditions = [];
    if (filtros?.status) {
      conditions.push(eq(this.prazos.status, filtros.status as 'pendente' | 'cumprido' | 'perdido'));
    }
    if (filtros?.responsavelId) {
      conditions.push(eq(this.prazos.responsavelId, filtros.responsavelId));
    }

    const query = (this.db as any)
      .select({
        id: this.prazos.id,
        processoId: this.prazos.processoId,
        numeroCnj: this.processos.numeroCnj,
        descricao: this.prazos.descricao,
        dataFatal: this.prazos.dataFatal,
        tipoPrazo: this.prazos.tipoPrazo,
        status: this.prazos.status,
        responsavelId: this.prazos.responsavelId,
        responsavelNome: this.users.nome,
        alertasEnviados: this.prazos.alertasEnviados,
      })
      .from(this.prazos)
      .leftJoin(this.processos, eq(this.prazos.processoId, this.processos.id))
      .leftJoin(this.users, eq(this.prazos.responsavelId, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as any)
      .select({
        id: this.prazos.id,
        processoId: this.prazos.processoId,
        numeroCnj: this.processos.numeroCnj,
        descricao: this.prazos.descricao,
        dataFatal: this.prazos.dataFatal,
        tipoPrazo: this.prazos.tipoPrazo,
        status: this.prazos.status,
        responsavelId: this.prazos.responsavelId,
        responsavelNome: this.users.nome,
        alertasEnviados: this.prazos.alertasEnviados,
      })
      .from(this.prazos)
      .leftJoin(this.processos, eq(this.prazos.processoId, this.processos.id))
      .leftJoin(this.users, eq(this.prazos.responsavelId, this.users.id))
      .where(eq(this.prazos.id, id));
    return row ?? undefined;
  }

  async atualizarStatus(id: string, status: 'pendente' | 'cumprido' | 'perdido') {
    await (this.db as any)
      .update(this.prazos)
      .set({ status })
      .where(eq(this.prazos.id, id));
  }

  async excluir(id: string) {
    await (this.db as any).delete(this.prazos).where(eq(this.prazos.id, id));
  }
}
