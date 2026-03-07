import { v4 as uuid } from 'uuid';
import { eq, like, or, and } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { processos, movimentacoes, prazos } from '../schema/processos';
import { clientes } from '../schema/clientes';
import { users } from '../schema/usuarios';
import type { CreateProcessoInput } from '@causa/shared';

export class ProcessoService {
  constructor(private db: CausaDatabase) {}

  criar(input: CreateProcessoInput): string {
    const id = uuid();
    this.db
      .insert(processos)
      .values({
        id,
        numeroCnj: input.numeroCnj,
        clienteId: input.clienteId,
        advogadoResponsavelId: input.advogadoResponsavelId,
        tribunalSigla: input.tribunalSigla,
        plataforma: input.plataforma,
        area: input.area,
        fase: input.fase,
        status: 'ativo',
        valorCausa: input.valorCausa ?? null,
        poloAtivo: input.poloAtivo ?? null,
        poloPassivo: input.poloPassivo ?? null,
      })
      .run();
    return id;
  }

  listar(filtros?: { advogadoId?: string; status?: string }) {
    const conditions = [];
    if (filtros?.advogadoId) {
      conditions.push(eq(processos.advogadoResponsavelId, filtros.advogadoId));
    }
    if (filtros?.status) {
      conditions.push(eq(processos.status, filtros.status as 'ativo' | 'arquivado' | 'encerrado'));
    }

    const query = this.db
      .select({
        id: processos.id,
        numeroCnj: processos.numeroCnj,
        clienteNome: clientes.nome,
        advogadoNome: users.nome,
        tribunalSigla: processos.tribunalSigla,
        plataforma: processos.plataforma,
        area: processos.area,
        fase: processos.fase,
        status: processos.status,
        valorCausa: processos.valorCausa,
        ultimoSyncAt: processos.ultimoSyncAt,
        createdAt: processos.createdAt,
      })
      .from(processos)
      .leftJoin(clientes, eq(processos.clienteId, clientes.id))
      .leftJoin(users, eq(processos.advogadoResponsavelId, users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all();
    }
    return query.all();
  }

  buscar(termo: string) {
    const pattern = `%${termo}%`;
    return this.db
      .select({
        id: processos.id,
        numeroCnj: processos.numeroCnj,
        clienteNome: clientes.nome,
        advogadoNome: users.nome,
        tribunalSigla: processos.tribunalSigla,
        plataforma: processos.plataforma,
        area: processos.area,
        fase: processos.fase,
        status: processos.status,
        valorCausa: processos.valorCausa,
        ultimoSyncAt: processos.ultimoSyncAt,
        createdAt: processos.createdAt,
      })
      .from(processos)
      .leftJoin(clientes, eq(processos.clienteId, clientes.id))
      .leftJoin(users, eq(processos.advogadoResponsavelId, users.id))
      .where(
        or(
          like(processos.numeroCnj, pattern),
          like(clientes.nome, pattern),
        ),
      )
      .all();
  }

  obterPorId(id: string) {
    return this.db
      .select()
      .from(processos)
      .where(eq(processos.id, id))
      .get();
  }

  listarMovimentacoes(processoId: string) {
    return this.db
      .select()
      .from(movimentacoes)
      .where(eq(movimentacoes.processoId, processoId))
      .all();
  }

  listarPrazos(processoId: string) {
    return this.db
      .select()
      .from(prazos)
      .where(eq(prazos.processoId, processoId))
      .all();
  }

  atualizar(id: string, input: Partial<CreateProcessoInput> & { status?: 'ativo' | 'arquivado' | 'encerrado' }) {
    this.db
      .update(processos)
      .set({
        ...(input.numeroCnj !== undefined ? { numeroCnj: input.numeroCnj } : {}),
        ...(input.clienteId !== undefined ? { clienteId: input.clienteId } : {}),
        ...(input.advogadoResponsavelId !== undefined ? { advogadoResponsavelId: input.advogadoResponsavelId } : {}),
        ...(input.tribunalSigla !== undefined ? { tribunalSigla: input.tribunalSigla } : {}),
        ...(input.plataforma !== undefined ? { plataforma: input.plataforma } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.fase !== undefined ? { fase: input.fase } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.valorCausa !== undefined ? { valorCausa: input.valorCausa ?? null } : {}),
        ...(input.poloAtivo !== undefined ? { poloAtivo: input.poloAtivo ?? null } : {}),
        ...(input.poloPassivo !== undefined ? { poloPassivo: input.poloPassivo ?? null } : {}),
      })
      .where(eq(processos.id, id))
      .run();
  }

  excluir(id: string) {
    this.db.delete(processos).where(eq(processos.id, id)).run();
  }
}
