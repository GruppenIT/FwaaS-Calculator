import { v4 as uuid } from 'uuid';
import { eq, like, or } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { honorarios } from '../schema/financeiro';
import { processos } from '../schema/processos';
import { clientes } from '../schema/clientes';

export interface CreateHonorarioInput {
  processoId?: string;
  clienteId?: string;
  tipo: 'fixo' | 'exito' | 'por_hora';
  valor: number;
  percentualExito?: number;
  vencimento?: string;
}

export class FinanceiroService {
  constructor(private db: CausaDatabase) {}

  criar(input: CreateHonorarioInput): string {
    const id = uuid();
    this.db
      .insert(honorarios)
      .values({
        id,
        processoId: input.processoId ?? null,
        clienteId: input.clienteId ?? null,
        tipo: input.tipo,
        valor: input.valor,
        percentualExito: input.percentualExito ?? null,
        vencimento: input.vencimento ?? null,
        status: 'pendente',
      })
      .run();
    return id;
  }

  listar() {
    return this.db
      .select({
        id: honorarios.id,
        processoId: honorarios.processoId,
        numeroCnj: processos.numeroCnj,
        clienteId: honorarios.clienteId,
        clienteNome: clientes.nome,
        tipo: honorarios.tipo,
        valor: honorarios.valor,
        percentualExito: honorarios.percentualExito,
        status: honorarios.status,
        vencimento: honorarios.vencimento,
        createdAt: honorarios.createdAt,
      })
      .from(honorarios)
      .leftJoin(processos, eq(honorarios.processoId, processos.id))
      .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
      .all();
  }

  obterPorId(id: string) {
    return this.db
      .select({
        id: honorarios.id,
        processoId: honorarios.processoId,
        numeroCnj: processos.numeroCnj,
        clienteId: honorarios.clienteId,
        clienteNome: clientes.nome,
        tipo: honorarios.tipo,
        valor: honorarios.valor,
        percentualExito: honorarios.percentualExito,
        status: honorarios.status,
        vencimento: honorarios.vencimento,
        createdAt: honorarios.createdAt,
      })
      .from(honorarios)
      .leftJoin(processos, eq(honorarios.processoId, processos.id))
      .leftJoin(clientes, eq(honorarios.clienteId, clientes.id))
      .where(eq(honorarios.id, id))
      .get();
  }

  atualizarStatus(id: string, status: 'pendente' | 'recebido' | 'inadimplente') {
    this.db
      .update(honorarios)
      .set({ status })
      .where(eq(honorarios.id, id))
      .run();
  }

  excluir(id: string) {
    this.db.delete(honorarios).where(eq(honorarios.id, id)).run();
  }
}
