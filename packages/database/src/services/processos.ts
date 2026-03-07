import { v4 as uuid } from 'uuid';
import { eq, like, or, and } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';
import type { CreateProcessoInput } from '@causa/shared';

export class ProcessoService {
  private processos;
  private movimentacoes;
  private prazos;
  private clientes;
  private users;

  constructor(
    private db: CausaDatabase,
    schema: CausaSchema,
  ) {
    this.processos = schema.processos;
    this.movimentacoes = schema.movimentacoes;
    this.prazos = schema.prazos;
    this.clientes = schema.clientes;
    this.users = schema.users;
  }

  async criar(input: CreateProcessoInput): Promise<string> {
    const id = uuid();
    await (this.db as unknown as DatabaseQueryBuilder).insert(this.processos).values({
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
    });
    return id;
  }

  async listar(filtros?: { advogadoId?: string; status?: string }) {
    const conditions = [];
    if (filtros?.advogadoId) {
      conditions.push(eq(this.processos.advogadoResponsavelId, filtros.advogadoId));
    }
    if (filtros?.status) {
      conditions.push(
        eq(this.processos.status, filtros.status as 'ativo' | 'arquivado' | 'encerrado'),
      );
    }

    const query = (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.processos.id,
        numeroCnj: this.processos.numeroCnj,
        clienteNome: this.clientes.nome,
        advogadoNome: this.users.nome,
        tribunalSigla: this.processos.tribunalSigla,
        plataforma: this.processos.plataforma,
        area: this.processos.area,
        fase: this.processos.fase,
        status: this.processos.status,
        valorCausa: this.processos.valorCausa,
        ultimoSyncAt: this.processos.ultimoSyncAt,
        createdAt: this.processos.createdAt,
      })
      .from(this.processos)
      .leftJoin(this.clientes, eq(this.processos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.processos.advogadoResponsavelId, this.users.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async buscar(termo: string, filtros?: { advogadoId?: string; status?: string }) {
    const pattern = `%${termo}%`;
    const conditions = [or(like(this.processos.numeroCnj, pattern), like(this.clientes.nome, pattern))];
    if (filtros?.advogadoId) {
      conditions.push(eq(this.processos.advogadoResponsavelId, filtros.advogadoId));
    }
    if (filtros?.status) {
      conditions.push(eq(this.processos.status, filtros.status as 'ativo' | 'arquivado' | 'encerrado'));
    }
    return (this.db as unknown as DatabaseQueryBuilder)
      .select({
        id: this.processos.id,
        numeroCnj: this.processos.numeroCnj,
        clienteNome: this.clientes.nome,
        advogadoNome: this.users.nome,
        tribunalSigla: this.processos.tribunalSigla,
        plataforma: this.processos.plataforma,
        area: this.processos.area,
        fase: this.processos.fase,
        status: this.processos.status,
        valorCausa: this.processos.valorCausa,
        ultimoSyncAt: this.processos.ultimoSyncAt,
        createdAt: this.processos.createdAt,
      })
      .from(this.processos)
      .leftJoin(this.clientes, eq(this.processos.clienteId, this.clientes.id))
      .leftJoin(this.users, eq(this.processos.advogadoResponsavelId, this.users.id))
      .where(and(...conditions));
  }

  async obterPorId(id: string) {
    const [row] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.processos)
      .where(eq(this.processos.id, id));
    return row ?? undefined;
  }

  async listarMovimentacoes(processoId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.movimentacoes)
      .where(eq(this.movimentacoes.processoId, processoId));
  }

  async listarPrazos(processoId: string) {
    return (this.db as unknown as DatabaseQueryBuilder)
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
      .where(eq(this.prazos.processoId, processoId));
  }

  async atualizar(
    id: string,
    input: Partial<CreateProcessoInput> & { status?: 'ativo' | 'arquivado' | 'encerrado' },
  ) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .update(this.processos)
      .set({
        ...(input.numeroCnj !== undefined ? { numeroCnj: input.numeroCnj } : {}),
        ...(input.clienteId !== undefined ? { clienteId: input.clienteId } : {}),
        ...(input.advogadoResponsavelId !== undefined
          ? { advogadoResponsavelId: input.advogadoResponsavelId }
          : {}),
        ...(input.tribunalSigla !== undefined ? { tribunalSigla: input.tribunalSigla } : {}),
        ...(input.plataforma !== undefined ? { plataforma: input.plataforma } : {}),
        ...(input.area !== undefined ? { area: input.area } : {}),
        ...(input.fase !== undefined ? { fase: input.fase } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.valorCausa !== undefined ? { valorCausa: input.valorCausa ?? null } : {}),
        ...(input.poloAtivo !== undefined ? { poloAtivo: input.poloAtivo ?? null } : {}),
        ...(input.poloPassivo !== undefined ? { poloPassivo: input.poloPassivo ?? null } : {}),
      })
      .where(eq(this.processos.id, id));
  }

  async excluir(id: string) {
    await (this.db as unknown as DatabaseQueryBuilder)
      .delete(this.processos)
      .where(eq(this.processos.id, id));
  }
}
